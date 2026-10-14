CREATE TABLE public.visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  identifier text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  purpose text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT visitors_identifier_format CHECK (identifier ~ '^[0-9]{8,20}$'),
  CONSTRAINT visitors_name_len CHECK (char_length(btrim(full_name)) BETWEEN 3 AND 120),
  CONSTRAINT visitors_purpose_len CHECK (char_length(btrim(purpose)) BETWEEN 2 AND 160)
);
CREATE UNIQUE INDEX visitors_identifier_key ON public.visitors (identifier);
GRANT SELECT ON public.visitors TO authenticated;
GRANT ALL ON public.visitors TO service_role;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY visitors_self_read ON public.visitors FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
CREATE POLICY visitors_staff_read ON public.visitors FOR SELECT TO authenticated USING (public.is_admin());

ALTER TABLE public.visitor_visits ADD COLUMN visitor_account_id uuid REFERENCES public.visitors(id) ON DELETE RESTRICT;
CREATE INDEX visitor_visits_account_idx ON public.visitor_visits (visitor_account_id);
CREATE POLICY visitor_visits_self_read ON public.visitor_visits FOR SELECT TO authenticated
  USING (visitor_account_id IN (SELECT id FROM public.visitors WHERE auth_user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.my_visitor_check_in()
RETURNS TABLE(outcome text, visit_id uuid, entry_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.visitors%ROWTYPE; new_id uuid; new_entry timestamptz;
BEGIN
  SELECT * INTO v FROM public.visitors WHERE auth_user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'حساب الزائر غير موجود'; END IF;
  IF EXISTS (SELECT 1 FROM public.visitor_visits WHERE visitor_account_id = v.id AND status = 'active') THEN
    RETURN QUERY SELECT 'active_exists'::text, NULL::uuid, NULL::timestamptz; RETURN;
  END IF;
  INSERT INTO public.visitor_visits (full_name, specialty, status, entry_at, visit_date, visitor_account_id)
  VALUES (v.full_name, v.purpose, 'active', now(), (now() AT TIME ZONE 'Africa/Cairo')::date, v.id)
  RETURNING id, visitor_visits.entry_at INTO new_id, new_entry;
  RETURN QUERY SELECT 'checked_in'::text, new_id, new_entry;
END; $$;

CREATE OR REPLACE FUNCTION public.my_visitor_check_out(p_rating smallint, p_feedback text)
RETURNS TABLE(outcome text, duration_minutes integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE vid uuid; vis public.visitor_visits%ROWTYPE; mins integer;
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN RAISE EXCEPTION 'تقييم غير صحيح'; END IF;
  SELECT id INTO vid FROM public.visitors WHERE auth_user_id = auth.uid();
  IF vid IS NULL THEN RAISE EXCEPTION 'حساب الزائر غير موجود'; END IF;
  SELECT * INTO vis FROM public.visitor_visits WHERE visitor_account_id = vid AND status = 'active' ORDER BY entry_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN QUERY SELECT 'no_active'::text, NULL::integer; RETURN; END IF;
  mins := GREATEST(0, (EXTRACT(EPOCH FROM (now() - vis.entry_at)) / 60)::integer);
  UPDATE public.visitor_visits SET status='completed', exit_at=now(), duration_minutes=mins,
    rating=p_rating, feedback=NULLIF(btrim(p_feedback), '') WHERE id = vis.id;
  RETURN QUERY SELECT 'checked_out'::text, mins;
END; $$;

REVOKE EXECUTE ON FUNCTION public.my_visitor_check_in() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.my_visitor_check_out(smallint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_visitor_check_in() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_visitor_check_out(smallint, text) TO authenticated;