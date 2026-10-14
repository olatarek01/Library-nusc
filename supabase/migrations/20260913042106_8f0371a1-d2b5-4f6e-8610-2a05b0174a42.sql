-- 1) Restrict students table to authenticated staff only
DROP POLICY IF EXISTS students_public_read ON public.students;
REVOKE SELECT ON public.students FROM anon;

-- 2) Safe single-student lookup for the public visit form (no bulk listing)
CREATE OR REPLACE FUNCTION public.lookup_student(p_student_id text)
RETURNS TABLE (full_name text, faculty_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.full_name, s.faculty_id
  FROM public.students s
  WHERE btrim(p_student_id) ~ '^[0-9]{4,20}$'
    AND s.student_id = btrim(p_student_id)
    AND s.is_active
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_student(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_student(text) TO anon, authenticated;

-- 3) Validate anonymous visit inserts instead of accepting arbitrary rows
DROP POLICY IF EXISTS visits_public_insert ON public.library_visits;
CREATE POLICY visits_public_insert ON public.library_visits
FOR INSERT TO anon
WITH CHECK (
  student_id ~ '^[0-9]{4,20}$'
  AND char_length(btrim(student_name)) >= 3
  AND char_length(btrim(student_name)) <= 120
  AND EXISTS (
    SELECT 1 FROM public.faculties f
    WHERE f.id = faculty_id AND f.is_active
  )
);