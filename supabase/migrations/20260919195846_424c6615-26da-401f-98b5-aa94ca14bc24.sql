drop index if exists public.books_faculty_idx;
drop index if exists public.library_visits_book_idx;
drop index if exists public.library_visits_faculty_idx;
drop index if exists public.library_visits_visit_date_idx;

alter table public.library_visits
  drop constraint if exists library_visits_active_state_chk,
  add constraint library_visits_active_state_chk
    check (status <> 'active' or (exit_at is null and rating is null and duration_minutes is null)),
  drop constraint if exists library_visits_exit_status_chk,
  add constraint library_visits_exit_status_chk
    check (exit_at is null or status = 'completed'),
  drop constraint if exists library_visits_duration_chk,
  add constraint library_visits_duration_chk
    check (duration_minutes is null or duration_minutes >= 0);

alter table public.visitor_visits
  drop constraint if exists visitor_visits_active_state_chk,
  add constraint visitor_visits_active_state_chk
    check (status <> 'active' or (exit_at is null and rating is null and duration_minutes is null)),
  drop constraint if exists visitor_visits_exit_status_chk,
  add constraint visitor_visits_exit_status_chk
    check (exit_at is null or status = 'completed'),
  drop constraint if exists visitor_visits_duration_chk,
  add constraint visitor_visits_duration_chk
    check (duration_minutes is null or duration_minutes >= 0);
