CREATE OR REPLACE FUNCTION public.student_check_in(p_student_id text, p_student_name text, p_faculty_id uuid, p_interest_area text, p_gender text, p_force boolean DEFAULT false)
 RETURNS TABLE(outcome text, visit_id uuid, entry_at timestamp with time zone)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r record;
BEGIN
  IF p_gender IS NULL OR p_gender NOT IN ('male','female') THEN
    RAISE EXCEPTION 'نوع غير صحيح';
  END IF;
  SELECT * INTO r FROM public.student_check_in(p_student_id, p_student_name, p_faculty_id, p_interest_area, p_force) LIMIT 1;
  IF r.outcome = 'checked_in' THEN
    UPDATE public.students SET gender = p_gender WHERE lower(btrim(student_id)) = lower(btrim(p_student_id));
  END IF;
  RETURN QUERY SELECT r.outcome, r.visit_id, r.entry_at;
END; $function$;
GRANT EXECUTE ON FUNCTION public.student_check_in(text, text, uuid, text, text, boolean) TO anon, authenticated;