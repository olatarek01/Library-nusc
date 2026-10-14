ALTER TABLE public.visitor_visits ADD COLUMN IF NOT EXISTS visitor_identifier text;
ALTER TABLE public.visitor_visits ADD CONSTRAINT visitor_visits_identifier_format
  CHECK (visitor_identifier IS NULL OR visitor_identifier ~ '^[0-9]{8,20}$');

UPDATE public.visitor_visits w SET visitor_identifier = v.identifier
  FROM public.visitors v WHERE w.visitor_account_id = v.id AND w.visitor_identifier IS NULL;

UPDATE public.visitor_visits w SET visitor_account_id = v.id, visitor_identifier = v.identifier
  FROM public.visitors v
 WHERE w.visitor_account_id IS NULL
   AND lower(btrim(w.full_name)) = lower(btrim(v.full_name))
   AND (SELECT count(*) FROM public.visitors x WHERE lower(btrim(x.full_name)) = lower(btrim(v.full_name))) = 1;

DROP INDEX IF EXISTS public.visitor_visits_one_active_idx;
CREATE UNIQUE INDEX visitor_visits_one_active_idx ON public.visitor_visits (visitor_identifier)
  WHERE status = 'active' AND visitor_identifier IS NOT NULL;
CREATE INDEX IF NOT EXISTS visitor_visits_identifier_idx ON public.visitor_visits (visitor_identifier);

DROP FUNCTION IF EXISTS public.visitor_scan_status(text);
DROP FUNCTION IF EXISTS public.visitor_check_in(text, text, boolean);
DROP FUNCTION IF EXISTS public.visitor_check_out(text, uuid, smallint, text);

CREATE FUNCTION public.visitor_scan_status(p_identifier text)
RETURNS TABLE(state text, visit_id uuid, entry_at timestamptz, full_name text, specialty text, last_exit_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE k text := btrim(p_identifier); acc public.visitors%ROWTYPE; a public.visitor_visits%ROWTYPE;
BEGIN
  IF k !~ '^[0-9]{8,20}$' THEN RETURN; END IF;
  SELECT * INTO acc FROM public.visitors WHERE identifier = k;
  SELECT * INTO a FROM public.visitor_visits w WHERE w.visitor_identifier = k AND w.status = 'active' LIMIT 1;
  IF FOUND THEN
    RETURN QUERY SELECT 'active'::text, a.id, a.entry_at, a.full_name, a.specialty, NULL::timestamptz;
    RETURN;
  END IF;
  RETURN QUERY SELECT 'none'::text, NULL::uuid, NULL::timestamptz,
    COALESCE(acc.full_name, (SELECT w.full_name FROM public.visitor_visits w WHERE w.visitor_identifier = k ORDER BY w.entry_at DESC LIMIT 1)),
    acc.purpose,
    (SELECT max(w.exit_at) FROM public.visitor_visits w WHERE w.visitor_identifier = k);
END; $$;

CREATE FUNCTION public.visitor_check_in(p_identifier text, p_full_name text, p_specialty text, p_force boolean DEFAULT false)
RETURNS TABLE(outcome text, visit_id uuid, entry_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k text := btrim(p_identifier); nm text := btrim(p_full_name); sp text := btrim(p_specialty);
        acc public.visitors%ROWTYPE; last_exit timestamptz; new_id uuid; new_entry timestamptz;
BEGIN
  IF k !~ '^[0-9]{8,20}$' THEN RAISE EXCEPTION 'معرّف غير صحيح'; END IF;
  SELECT * INTO acc FROM public.visitors WHERE identifier = k;
  IF FOUND THEN nm := acc.full_name; END IF;
  IF char_length(nm) NOT BETWEEN 3 AND 120 THEN RAISE EXCEPTION 'اسم غير صحيح'; END IF;
  IF char_length(sp) NOT BETWEEN 2 AND 160 THEN RAISE EXCEPTION 'مجال غير صحيح'; END IF;

  IF EXISTS (SELECT 1 FROM public.visitor_visits w WHERE w.visitor_identifier = k AND w.status = 'active') THEN
    RETURN QUERY SELECT 'active_exists'::text, NULL::uuid, NULL::timestamptz; RETURN;
  END IF;
  SELECT max(w.exit_at) INTO last_exit FROM public.visitor_visits w WHERE w.visitor_identifier = k;
  IF NOT p_force AND last_exit > now() - interval '90 minutes' THEN
    RETURN QUERY SELECT 'recent_completed'::text, NULL::uuid, last_exit; RETURN;
  END IF;

  INSERT INTO public.visitor_visits (full_name, specialty, status, entry_at, visit_date, visitor_identifier, visitor_account_id)
  VALUES (nm, sp, 'active', now(), (now() AT TIME ZONE 'Africa/Cairo')::date, k, acc.id)
  RETURNING id, visitor_visits.entry_at INTO new_id, new_entry;
  RETURN QUERY SELECT 'checked_in'::text, new_id, new_entry;
END; $$;

CREATE FUNCTION public.visitor_check_out(p_identifier text, p_book_id uuid, p_rating smallint, p_feedback text)
RETURNS TABLE(outcome text, entry_at timestamptz, exit_at timestamptz, duration_minutes integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k text := btrim(p_identifier); a public.visitor_visits%ROWTYPE; t timestamptz := now(); mins integer;
BEGIN
  IF p_rating NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'تقييم غير صحيح'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.books WHERE id = p_book_id) THEN RAISE EXCEPTION 'كتاب غير موجود'; END IF;
  SELECT * INTO a FROM public.visitor_visits w WHERE w.visitor_identifier = k AND w.status = 'active' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'no_active'::text, NULL::timestamptz, NULL::timestamptz, NULL::integer; RETURN;
  END IF;
  mins := GREATEST(0, floor(extract(epoch FROM t - a.entry_at) / 60))::integer;
  UPDATE public.visitor_visits SET status = 'completed', exit_at = t, duration_minutes = mins,
    book_id = p_book_id, rating = p_rating, feedback = NULLIF(left(btrim(COALESCE(p_feedback, '')), 500), '')
  WHERE id = a.id;
  RETURN QUERY SELECT 'checked_out'::text, a.entry_at, t, mins;
END; $$;

CREATE OR REPLACE FUNCTION public.link_visitor_visits() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.visitor_visits SET visitor_account_id = NEW.id
   WHERE visitor_identifier = NEW.identifier AND visitor_account_id IS NULL;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS visitors_link_visits ON public.visitors;
CREATE TRIGGER visitors_link_visits AFTER INSERT ON public.visitors
  FOR EACH ROW EXECUTE FUNCTION public.link_visitor_visits();

GRANT EXECUTE ON FUNCTION public.visitor_scan_status(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.visitor_check_in(text, text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.visitor_check_out(text, uuid, smallint, text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_visitor_visits() FROM anon, authenticated, public;