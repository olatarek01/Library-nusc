ALTER TABLE public.library_visits ALTER COLUMN book_id DROP NOT NULL;
ALTER TABLE public.library_visits ADD COLUMN IF NOT EXISTS book_name_manual text;

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

  IF NEW.book_id IS NULL AND NEW.book_name_manual IS NULL THEN
    RAISE EXCEPTION 'يجب اختيار كتاب مسجّل أو كتابة اسم الكتاب يدويًا';
  END IF;

  IF NEW.book_id IS NOT NULL THEN
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

    NEW.book_name_manual := NULL;
  END IF;

  RETURN NEW;
END;
$function$;