-- allow book-less rows while a visit is still open (must exist before the backfill UPDATE)
CREATE OR REPLACE FUNCTION public.validate_visit_book_faculty()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  book_faculty uuid;
  book_active boolean;
BEGIN
  IF NEW.book_name_manual IS NOT NULL THEN
    NEW.book_name_manual := NULLIF(btrim(NEW.book_name_manual), '');
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.book_id IS NOT DISTINCT FROM OLD.book_id
     AND NEW.faculty_id IS NOT DISTINCT FROM OLD.faculty_id THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.status, 'completed') = 'completed'
     AND NEW.book_id IS NULL AND NEW.book_name_manual IS NULL THEN
    RAISE EXCEPTION 'يجب اختيار كتاب مسجّل أو كتابة اسم الكتاب يدويًا';
  END IF;

  IF NEW.book_id IS NOT NULL THEN
    SELECT faculty_id, is_active INTO book_faculty, book_active
    FROM public.books WHERE id = NEW.book_id;

    IF book_faculty IS NULL THEN
      RAISE EXCEPTION 'الكتاب غير مسجل بالمكتبة';
    END IF;
    IF book_faculty <> NEW.faculty_id THEN
      RAISE EXCEPTION 'الكتاب المحدد لا ينتمي إلى الكلية المختارة';
    END IF;
    IF NOT book_active THEN
      RAISE EXCEPTION 'الكتاب المحدد غير متاح حاليًا';
    END IF;

    NEW.book_name_manual := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

-- ===== library_visits =====
ALTER TABLE public.library_visits
  ADD COLUMN IF NOT EXISTS interest_area text,
  ADD COLUMN IF NOT EXISTS entry_at timestamptz,
  ADD COLUMN IF NOT EXISTS exit_at timestamptz,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS rating smallint,
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.library_visits
SET entry_at = ((visit_date + visit_time) AT TIME ZONE 'Africa/Cairo')
WHERE entry_at IS NULL;

ALTER TABLE public.library_visits
  ALTER COLUMN entry_at SET DEFAULT now(),
  ALTER COLUMN entry_at SET NOT NULL;

ALTER TABLE public.library_visits DROP CONSTRAINT IF EXISTS library_visits_status_chk;
ALTER TABLE public.library_visits ADD CONSTRAINT library_visits_status_chk
  CHECK (status IN ('active','completed'));
ALTER TABLE public.library_visits DROP CONSTRAINT IF EXISTS library_visits_rating_chk;
ALTER TABLE public.library_visits ADD CONSTRAINT library_visits_rating_chk
  CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5));
ALTER TABLE public.library_visits DROP CONSTRAINT IF EXISTS library_visits_exit_chk;
ALTER TABLE public.library_visits ADD CONSTRAINT library_visits_exit_chk
  CHECK (exit_at IS NULL OR exit_at >= entry_at);

CREATE UNIQUE INDEX IF NOT EXISTS library_visits_one_active_idx
  ON public.library_visits (lower(btrim(student_id))) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS library_visits_status_idx ON public.library_visits (status);
CREATE INDEX IF NOT EXISTS library_visits_entry_at_idx ON public.library_visits (entry_at DESC);

DROP TRIGGER IF EXISTS library_visits_set_updated_at ON public.library_visits;
CREATE TRIGGER library_visits_set_updated_at BEFORE UPDATE ON public.library_visits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== visitor_visits =====
ALTER TABLE public.visitor_visits
  ADD COLUMN IF NOT EXISTS book_id uuid REFERENCES public.books(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS entry_at timestamptz,
  ADD COLUMN IF NOT EXISTS exit_at timestamptz,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS rating smallint,
  ADD COLUMN IF NOT EXISTS feedback text;

UPDATE public.visitor_visits SET entry_at = created_at WHERE entry_at IS NULL;

ALTER TABLE public.visitor_visits
  ALTER COLUMN entry_at SET DEFAULT now(),
  ALTER COLUMN entry_at SET NOT NULL;

ALTER TABLE public.visitor_visits DROP CONSTRAINT IF EXISTS visitor_visits_status_chk;
ALTER TABLE public.visitor_visits ADD CONSTRAINT visitor_visits_status_chk
  CHECK (status IN ('active','completed'));
ALTER TABLE public.visitor_visits DROP CONSTRAINT IF EXISTS visitor_visits_rating_chk;
ALTER TABLE public.visitor_visits ADD CONSTRAINT visitor_visits_rating_chk
  CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5));
ALTER TABLE public.visitor_visits DROP CONSTRAINT IF EXISTS visitor_visits_exit_chk;
ALTER TABLE public.visitor_visits ADD CONSTRAINT visitor_visits_exit_chk
  CHECK (exit_at IS NULL OR exit_at >= entry_at);

CREATE UNIQUE INDEX IF NOT EXISTS visitor_visits_one_active_idx
  ON public.visitor_visits (lower(btrim(full_name))) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS visitor_visits_status_idx ON public.visitor_visits (status);
CREATE INDEX IF NOT EXISTS visitor_visits_entry_at_idx ON public.visitor_visits (entry_at DESC);

-- ===== public scan operations =====
CREATE OR REPLACE FUNCTION public.student_scan_status(p_student_id text)
RETURNS TABLE(
  state text, visit_id uuid, student_name text, faculty_id uuid,
  interest_area text, entry_at timestamptz, last_exit_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  key text := lower(btrim(p_student_id));
  v public.library_visits%ROWTYPE;
  s public.students%ROWTYPE;
  last_exit timestamptz;
BEGIN
  IF key !~ '^[0-9]{4,20}$' THEN
    RETURN;
  END IF;

  SELECT * INTO v FROM public.library_visits
   WHERE lower(btrim(student_id)) = key AND status = 'active'
   ORDER BY entry_at DESC LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 'active'::text, v.id, v.student_name, v.faculty_id,
                        v.interest_area, v.entry_at, NULL::timestamptz;
    RETURN;
  END IF;

  SELECT max(exit_at) INTO last_exit FROM public.library_visits
   WHERE lower(btrim(student_id)) = key AND status = 'completed';

  SELECT * INTO s FROM public.students
   WHERE lower(btrim(student_id)) = key AND is_active LIMIT 1;

  RETURN QUERY SELECT 'none'::text, NULL::uuid, s.full_name, s.faculty_id,
                      NULL::text, NULL::timestamptz, last_exit;
END;
$$;

CREATE OR REPLACE FUNCTION public.student_check_in(
  p_student_id text, p_student_name text, p_faculty_id uuid,
  p_interest_area text, p_force boolean DEFAULT false
)
RETURNS TABLE(outcome text, visit_id uuid, entry_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  key text := lower(btrim(p_student_id));
  nm text := btrim(p_student_name);
  area text := NULLIF(btrim(p_interest_area), '');
  last_exit timestamptz;
  new_id uuid;
  new_entry timestamptz;
BEGIN
  IF key !~ '^[0-9]{4,20}$' THEN
    RAISE EXCEPTION 'رقم جامعي غير صحيح';
  END IF;
  IF char_length(nm) < 3 OR char_length(nm) > 120 THEN
    RAISE EXCEPTION 'اسم غير صحيح';
  END IF;
  IF area IS NULL OR char_length(area) < 2 OR char_length(area) > 120 THEN
    RAISE EXCEPTION 'مجال غير صحيح';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.faculties f WHERE f.id = p_faculty_id AND f.is_active) THEN
    RAISE EXCEPTION 'كلية غير صحيحة';
  END IF;

  IF EXISTS (SELECT 1 FROM public.library_visits
              WHERE lower(btrim(student_id)) = key AND status = 'active') THEN
    RETURN QUERY SELECT 'active_exists'::text, NULL::uuid, NULL::timestamptz;
    RETURN;
  END IF;

  SELECT max(exit_at) INTO last_exit FROM public.library_visits
   WHERE lower(btrim(student_id)) = key AND status = 'completed';

  IF NOT p_force AND last_exit IS NOT NULL AND last_exit > now() - interval '90 minutes' THEN
    RETURN QUERY SELECT 'recent_completed'::text, NULL::uuid, last_exit;
    RETURN;
  END IF;

  INSERT INTO public.students (student_id, full_name, faculty_id)
  VALUES (btrim(p_student_id), nm, p_faculty_id)
  ON CONFLICT (lower(btrim(student_id))) DO UPDATE
    SET full_name = EXCLUDED.full_name, faculty_id = EXCLUDED.faculty_id;

  INSERT INTO public.library_visits
    (student_id, student_name, faculty_id, interest_area, status, entry_at,
     visit_date, visit_time)
  VALUES (btrim(p_student_id), nm, p_faculty_id, area, 'active', now(),
          (now() AT TIME ZONE 'Africa/Cairo')::date,
          (now() AT TIME ZONE 'Africa/Cairo')::time)
  RETURNING id, library_visits.entry_at INTO new_id, new_entry;

  RETURN QUERY SELECT 'checked_in'::text, new_id, new_entry;
END;
$$;

CREATE OR REPLACE FUNCTION public.student_check_out(
  p_student_id text, p_book_id uuid, p_rating smallint, p_feedback text
)
RETURNS TABLE(outcome text, visit_id uuid, entry_at timestamptz, exit_at timestamptz, duration_minutes integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  key text := lower(btrim(p_student_id));
  v public.library_visits%ROWTYPE;
  now_ts timestamptz := now();
  mins integer;
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'تقييم غير صحيح';
  END IF;

  SELECT * INTO v FROM public.library_visits
   WHERE lower(btrim(student_id)) = key AND status = 'active'
   ORDER BY entry_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'no_active'::text, NULL::uuid, NULL::timestamptz, NULL::timestamptz, NULL::integer;
    RETURN;
  END IF;

  mins := GREATEST(0, (EXTRACT(EPOCH FROM (now_ts - v.entry_at)) / 60)::integer);

  UPDATE public.library_visits
     SET book_id = p_book_id,
         status = 'completed',
         exit_at = now_ts,
         duration_minutes = mins,
         rating = p_rating,
         feedback = NULLIF(btrim(p_feedback), '')
   WHERE id = v.id;

  RETURN QUERY SELECT 'checked_out'::text, v.id, v.entry_at, now_ts, mins;
END;
$$;

CREATE OR REPLACE FUNCTION public.visitor_scan_status(p_full_name text)
RETURNS TABLE(state text, visit_id uuid, specialty text, entry_at timestamptz, last_exit_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  key text := lower(btrim(p_full_name));
  v public.visitor_visits%ROWTYPE;
  last_exit timestamptz;
BEGIN
  IF char_length(key) < 3 THEN RETURN; END IF;

  SELECT * INTO v FROM public.visitor_visits
   WHERE lower(btrim(full_name)) = key AND status = 'active'
   ORDER BY entry_at DESC LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 'active'::text, v.id, v.specialty, v.entry_at, NULL::timestamptz;
    RETURN;
  END IF;

  SELECT max(exit_at) INTO last_exit FROM public.visitor_visits
   WHERE lower(btrim(full_name)) = key AND status = 'completed';

  RETURN QUERY SELECT 'none'::text, NULL::uuid, NULL::text, NULL::timestamptz, last_exit;
END;
$$;

CREATE OR REPLACE FUNCTION public.visitor_check_in(
  p_full_name text, p_specialty text, p_force boolean DEFAULT false
)
RETURNS TABLE(outcome text, visit_id uuid, entry_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  key text := lower(btrim(p_full_name));
  nm text := btrim(p_full_name);
  sp text := btrim(p_specialty);
  last_exit timestamptz;
  new_id uuid;
  new_entry timestamptz;
BEGIN
  IF char_length(nm) < 3 OR char_length(nm) > 120 THEN
    RAISE EXCEPTION 'اسم غير صحيح';
  END IF;
  IF char_length(sp) < 2 OR char_length(sp) > 160 THEN
    RAISE EXCEPTION 'مجال غير صحيح';
  END IF;

  IF EXISTS (SELECT 1 FROM public.visitor_visits
              WHERE lower(btrim(full_name)) = key AND status = 'active') THEN
    RETURN QUERY SELECT 'active_exists'::text, NULL::uuid, NULL::timestamptz;
    RETURN;
  END IF;

  SELECT max(exit_at) INTO last_exit FROM public.visitor_visits
   WHERE lower(btrim(full_name)) = key AND status = 'completed';

  IF NOT p_force AND last_exit IS NOT NULL AND last_exit > now() - interval '90 minutes' THEN
    RETURN QUERY SELECT 'recent_completed'::text, NULL::uuid, last_exit;
    RETURN;
  END IF;

  INSERT INTO public.visitor_visits (full_name, specialty, status, entry_at, visit_date)
  VALUES (nm, sp, 'active', now(), (now() AT TIME ZONE 'Africa/Cairo')::date)
  RETURNING id, visitor_visits.entry_at INTO new_id, new_entry;

  RETURN QUERY SELECT 'checked_in'::text, new_id, new_entry;
END;
$$;

CREATE OR REPLACE FUNCTION public.visitor_check_out(
  p_full_name text, p_book_id uuid, p_rating smallint, p_feedback text
)
RETURNS TABLE(outcome text, visit_id uuid, entry_at timestamptz, exit_at timestamptz, duration_minutes integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  key text := lower(btrim(p_full_name));
  v public.visitor_visits%ROWTYPE;
  now_ts timestamptz := now();
  mins integer;
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'تقييم غير صحيح';
  END IF;
  IF p_book_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.books b WHERE b.id = p_book_id AND b.is_active) THEN
    RAISE EXCEPTION 'الكتاب غير مسجل بالمكتبة';
  END IF;

  SELECT * INTO v FROM public.visitor_visits
   WHERE lower(btrim(full_name)) = key AND status = 'active'
   ORDER BY entry_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'no_active'::text, NULL::uuid, NULL::timestamptz, NULL::timestamptz, NULL::integer;
    RETURN;
  END IF;

  mins := GREATEST(0, (EXTRACT(EPOCH FROM (now_ts - v.entry_at)) / 60)::integer);

  UPDATE public.visitor_visits
     SET book_id = p_book_id, status = 'completed', exit_at = now_ts,
         duration_minutes = mins, rating = p_rating,
         feedback = NULLIF(btrim(p_feedback), '')
   WHERE id = v.id;

  RETURN QUERY SELECT 'checked_out'::text, v.id, v.entry_at, now_ts, mins;
END;
$$;

GRANT EXECUTE ON FUNCTION public.student_scan_status(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.student_check_in(text, text, uuid, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.student_check_out(text, uuid, smallint, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.visitor_scan_status(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.visitor_check_in(text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.visitor_check_out(text, uuid, smallint, text) TO anon, authenticated;