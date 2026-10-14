import { supabase } from "@/integrations/supabase/client";
import type { Faculty, Book, Student, Visit, StudentLookup } from "@/types/library";

export async function fetchFaculties(activeOnly = true): Promise<Faculty[]> {
  let query = supabase.from("faculties").select("*").order("sort_order");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchBooks(options?: {
  facultyId?: string | null;
  activeOnly?: boolean;
}): Promise<Book[]> {
  let query = supabase.from("books").select("*").order("title");
  if (options?.facultyId) query = query.eq("faculty_id", options.facultyId);
  if (options?.activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchVisits(): Promise<Visit[]> {
  const { data, error } = await supabase
    .from("library_visits")
    .select("*")
    .order("entry_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return data ?? [];
}

export async function fetchStudents(activeOnly = false): Promise<Student[]> {
  let query = supabase.from("students").select("*").order("full_name");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Use a scoped lookup RPC rather than exposing the student directory on public pages. */
export async function lookupStudentByUniversityId(code: string): Promise<StudentLookup | null> {
  const term = code.trim();
  if (!/^[0-9]{4,20}$/.test(term)) return null;
  const { data, error } = await supabase.rpc("lookup_student", { p_student_id: term });
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}
