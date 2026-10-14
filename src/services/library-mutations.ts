import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export async function saveBook(payload: TablesInsert<"books">, id?: string) {
  const { error } = await (id
    ? supabase.from("books").update(payload).eq("id", id)
    : supabase.from("books").insert(payload));
  if (error) throw error;
}

export async function saveStudent(payload: TablesInsert<"students">, id?: string) {
  const { error } = await (id
    ? supabase.from("students").update(payload).eq("id", id)
    : supabase.from("students").insert(payload));
  if (error) throw error;
}

export async function toggleActive(
  table: "books" | "students" | "faculties",
  record: { id: string; is_active: boolean },
) {
  const { error } = await supabase
    .from(table)
    .update({ is_active: !record.is_active })
    .eq("id", record.id);
  if (error) throw error;
}
