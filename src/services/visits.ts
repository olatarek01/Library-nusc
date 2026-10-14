import { supabase } from "@/integrations/supabase/client";
import type { CheckInResult, CheckOutResult, ScanStatus } from "@/types/library";

const GENERIC_ERROR = "تعذر إتمام العملية، برجاء المحاولة مرة أخرى.";

function fail(): never {
  throw new Error(GENERIC_ERROR);
}

export async function studentScanStatus(studentId: string): Promise<ScanStatus | null> {
  const key = studentId.trim();
  if (!/^[0-9]{4,20}$/.test(key)) return null;
  const { data, error } = await supabase.rpc("student_scan_status", { p_student_id: key });
  if (error) fail();
  const row = data?.[0];
  if (!row) return { state: "none", name: null, facultyId: null, lastExitAt: null };
  if (row.state === "active") {
    return {
      state: "active",
      visitId: row.visit_id,
      entryAt: row.entry_at,
      name: row.student_name,
      facultyId: row.faculty_id,
      interestArea: row.interest_area,
    };
  }
  return {
    state: "none",
    name: row.student_name,
    facultyId: row.faculty_id,
    lastExitAt: row.last_exit_at,
  };
}

export async function studentCheckIn(input: {
  studentId: string;
  studentName: string;
  facultyId: string;
  interestArea: string;
  gender: "male" | "female";
  force?: boolean;
}): Promise<CheckInResult> {
  const { data, error } = await supabase.rpc("student_check_in", {
    p_student_id: input.studentId.trim(),
    p_student_name: input.studentName.trim(),
    p_faculty_id: input.facultyId,
    p_interest_area: input.interestArea.trim(),
    p_gender: input.gender,
    p_force: input.force ?? false,
  });
  if (error) fail();
  const row = data?.[0];
  if (!row) fail();
  if (row.outcome === "checked_in")
    return { outcome: "checked_in", visitId: row.visit_id, entryAt: row.entry_at };
  if (row.outcome === "active_exists") return { outcome: "active_exists" };
  return { outcome: "recent_completed", lastExitAt: row.entry_at };
}

export async function studentCheckOut(input: {
  studentId: string;
  bookId: string;
  rating: number;
  feedback: string;
}): Promise<CheckOutResult> {
  const { data, error } = await supabase.rpc("student_check_out", {
    p_student_id: input.studentId.trim(),
    p_book_id: input.bookId,
    p_rating: input.rating,
    p_feedback: input.feedback.trim(),
  });
  if (error) fail();
  const row = data?.[0];
  if (!row) fail();
  if (row.outcome !== "checked_out") return { outcome: "no_active" };
  return {
    outcome: "checked_out",
    entryAt: row.entry_at,
    exitAt: row.exit_at,
    durationMinutes: row.duration_minutes,
  };
}
