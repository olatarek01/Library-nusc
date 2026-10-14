ALTER TABLE public.students ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.students ADD CONSTRAINT students_gender_check CHECK (gender IS NULL OR gender IN ('male','female'));
CREATE INDEX IF NOT EXISTS students_gender_idx ON public.students (gender);