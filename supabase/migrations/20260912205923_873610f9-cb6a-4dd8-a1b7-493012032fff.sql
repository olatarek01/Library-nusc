CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  full_name text NOT NULL,
  faculty_id uuid NOT NULL REFERENCES public.faculties(id) ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX students_student_id_key ON public.students (lower(btrim(student_id)));
CREATE INDEX students_faculty_id_idx ON public.students (faculty_id);

GRANT SELECT ON public.students TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY students_public_read ON public.students FOR SELECT TO anon USING (is_active);
CREATE POLICY students_staff_read ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY students_staff_insert ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY students_staff_update ON public.students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY students_staff_delete ON public.students FOR DELETE TO authenticated USING (true);

CREATE TRIGGER students_set_updated_at BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();