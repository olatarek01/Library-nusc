CREATE TABLE public.faculties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  faculty_id uuid NOT NULL REFERENCES public.faculties(id) ON DELETE RESTRICT,
  category text,
  book_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX books_faculty_idx ON public.books(faculty_id);

CREATE TABLE public.library_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  student_name text NOT NULL,
  faculty_id uuid NOT NULL REFERENCES public.faculties(id) ON DELETE RESTRICT,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE RESTRICT,
  visit_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'Africa/Cairo')::date),
  visit_time time NOT NULL DEFAULT ((now() AT TIME ZONE 'Africa/Cairo')::time),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX library_visits_date_idx ON public.library_visits(visit_date);
CREATE INDEX library_visits_faculty_idx ON public.library_visits(faculty_id);
CREATE INDEX library_visits_book_idx ON public.library_visits(book_id);

GRANT SELECT ON public.faculties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculties TO authenticated;
GRANT ALL ON public.faculties TO service_role;

GRANT SELECT ON public.books TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

GRANT INSERT ON public.library_visits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_visits TO authenticated;
GRANT ALL ON public.library_visits TO service_role;

ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faculties_public_read" ON public.faculties FOR SELECT TO anon USING (is_active);
CREATE POLICY "faculties_staff_read" ON public.faculties FOR SELECT TO authenticated USING (true);
CREATE POLICY "faculties_staff_insert" ON public.faculties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "faculties_staff_update" ON public.faculties FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "faculties_staff_delete" ON public.faculties FOR DELETE TO authenticated USING (true);

CREATE POLICY "books_public_read" ON public.books FOR SELECT TO anon USING (is_active);
CREATE POLICY "books_staff_read" ON public.books FOR SELECT TO authenticated USING (true);
CREATE POLICY "books_staff_insert" ON public.books FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "books_staff_update" ON public.books FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "books_staff_delete" ON public.books FOR DELETE TO authenticated USING (true);

CREATE POLICY "visits_public_insert" ON public.library_visits FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "visits_staff_all" ON public.library_visits FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER faculties_set_updated_at BEFORE UPDATE ON public.faculties
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER books_set_updated_at BEFORE UPDATE ON public.books
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_visit_book_faculty()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  book_faculty uuid;
  book_active boolean;
BEGIN
  SELECT faculty_id, is_active INTO book_faculty, book_active
  FROM public.books WHERE id = NEW.book_id;

  IF book_faculty IS NULL THEN
    RAISE EXCEPTION 'الكتاب المحدد غير موجود';
  END IF;
  IF book_faculty <> NEW.faculty_id THEN
    RAISE EXCEPTION 'الكتاب المحدد لا ينتمي إلى الكلية المختارة';
  END IF;
  IF NOT book_active THEN
    RAISE EXCEPTION 'الكتاب المحدد غير متاح حاليًا';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER library_visits_validate_book
BEFORE INSERT OR UPDATE ON public.library_visits
FOR EACH ROW EXECUTE FUNCTION public.validate_visit_book_faculty();

INSERT INTO public.faculties (name, sort_order) VALUES
  ('كلية الصيدلة', 1),
  ('كلية الحاسبات والمعلومات والذكاء الاصطناعي', 2),
  ('كلية الطب البيطري', 3),
  ('كلية العلوم', 4),
  ('كلية الأعمال', 5),
  ('كلية السياحة والفنادق', 6),
  ('علوم الرياضة', 7);