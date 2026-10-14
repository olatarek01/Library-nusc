import type { Tables } from "@/integrations/supabase/types";

export type Faculty = Pick<Tables<"faculties">, "id" | "name" | "sort_order" | "is_active">;

export type Book = Pick<
  Tables<"books">,
  "id" | "title" | "author" | "faculty_id" | "category" | "book_code" | "is_active" | "created_at"
>;

export type Student = Pick<
  Tables<"students">,
  "id" | "student_id" | "full_name" | "faculty_id" | "is_active" | "created_at" | "gender"
>;

export type VisitStatus = "active" | "completed";

export type Visit = Pick<
  Tables<"library_visits">,
  | "id"
  | "student_id"
  | "student_name"
  | "faculty_id"
  | "book_id"
  | "book_name_manual"
  | "interest_area"
  | "visit_date"
  | "visit_time"
  | "entry_at"
  | "exit_at"
  | "duration_minutes"
  | "status"
  | "rating"
  | "feedback"
  | "created_at"
>;

export type StudentLookup = Pick<Student, "full_name" | "faculty_id">;

/** Current library state of a person, derived from their open visit (if any). */
export type ScanStatus =
  | {
      state: "active";
      visitId: string;
      entryAt: string;
      name: string | null;
      facultyId: string | null;
      interestArea: string | null;
    }
  | { state: "none"; name: string | null; facultyId: string | null; lastExitAt: string | null };

export type CheckInResult =
  | { outcome: "checked_in"; visitId: string; entryAt: string }
  | { outcome: "active_exists" }
  | { outcome: "recent_completed"; lastExitAt: string | null };

export type CheckOutResult =
  | { outcome: "checked_out"; entryAt: string; exitAt: string; durationMinutes: number }
  | { outcome: "no_active" };
