import { supabase } from "@/integrations/supabase/client";
import { studentEmail } from "@/lib/student-account.functions";

export type MyVisit = {
  id: string;
  entry_at: string;
  exit_at: string | null;
  duration_minutes: number | null;
  status: string;
  interest_area: string | null;
  rating: number | null;
  feedback: string | null;
  books: { title: string } | null;
};

export function signInStudent(studentId: string, password: string) {
  return supabase.auth.signInWithPassword({ email: studentEmail(studentId), password });
}

export async function uploadStudentPhoto(file: File) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("سجّل الدخول أولًا لرفع صورتك.");
  const { error } = await supabase.storage
    .from("student-photos")
    .upload(`${user.id}/avatar`, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "0",
    });
  if (error) throw error;
}

export async function fetchMyProfile() {
  const { data, error } = await supabase
    .from("students")
    .select("student_id, full_name, faculties(name)")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: photo } = user
    ? await supabase.storage.from("student-photos").createSignedUrl(`${user.id}/avatar`, 3600)
    : { data: null };
  return { ...data, photoUrl: photo?.signedUrl ?? null };
}

export async function fetchMyVisits(): Promise<MyVisit[]> {
  const { data, error } = await supabase
    .from("library_visits")
    .select(
      "id, entry_at, exit_at, duration_minutes, status, interest_area, rating, feedback, books(title)",
    )
    .order("entry_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as MyVisit[];
}
