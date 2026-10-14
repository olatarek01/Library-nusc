-- Enforce referential integrity with RESTRICT
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_faculty_id_fkey;
ALTER TABLE public.books
  ADD CONSTRAINT books_faculty_id_fkey FOREIGN KEY (faculty_id)
  REFERENCES public.faculties(id) ON DELETE RESTRICT;

ALTER TABLE public.library_visits DROP CONSTRAINT IF EXISTS library_visits_faculty_id_fkey;
ALTER TABLE public.library_visits
  ADD CONSTRAINT library_visits_faculty_id_fkey FOREIGN KEY (faculty_id)
  REFERENCES public.faculties(id) ON DELETE RESTRICT;

ALTER TABLE public.library_visits DROP CONSTRAINT IF EXISTS library_visits_book_id_fkey;
ALTER TABLE public.library_visits
  ADD CONSTRAINT library_visits_book_id_fkey FOREIGN KEY (book_id)
  REFERENCES public.books(id) ON DELETE RESTRICT;

-- Prevent duplicate book entries for the same faculty
CREATE UNIQUE INDEX IF NOT EXISTS books_unique_title_author_faculty
  ON public.books (faculty_id, title, COALESCE(author, ''));

-- Performance indexes
CREATE INDEX IF NOT EXISTS books_faculty_id_idx ON public.books (faculty_id);
CREATE INDEX IF NOT EXISTS library_visits_faculty_id_idx ON public.library_visits (faculty_id);
CREATE INDEX IF NOT EXISTS library_visits_book_id_idx ON public.library_visits (book_id);
CREATE INDEX IF NOT EXISTS library_visits_visit_date_idx ON public.library_visits (visit_date);