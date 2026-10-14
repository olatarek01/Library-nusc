ALTER TABLE public.students ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

CREATE OR REPLACE FUNCTION public.my_student_id()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT student_id FROM public.students WHERE auth_user_id = auth.uid() AND is_active LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.my_student_id() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.my_student_id() TO authenticated;

CREATE POLICY students_self_read ON public.students FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY visits_student_self_read ON public.library_visits FOR SELECT TO authenticated
  USING (lower(btrim(student_id)) = lower(btrim(public.my_student_id())));

GRANT SELECT ON public.students, public.library_visits TO authenticated;