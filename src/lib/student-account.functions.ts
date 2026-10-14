import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const STUDENT_EMAIL_DOMAIN = "students.nusclibrary.local";
export const studentEmail = (id: string) => `${id.trim()}@${STUDENT_EMAIL_DOMAIN}`;

const normalizeName = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export const activateStudentAccount = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        studentId: z
          .string()
          .trim()
          .regex(/^[0-9]{4,20}$/),
        fullName: z.string().trim().min(3).max(120),
        password: z.string().min(8).max(72),
        gender: z.enum(["male", "female"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id, full_name, auth_user_id, is_active, gender")
      .eq("student_id", data.studentId)
      .maybeSingle();

    if (
      !student ||
      !student.is_active ||
      normalizeName(student.full_name) !== normalizeName(data.fullName)
    ) {
      return {
        ok: false as const,
        error: "البيانات غير مطابقة لسجلات المكتبة. سجّل زيارة أولًا أو تأكد من الاسم.",
      };
    }
    if (student.auth_user_id) {
      return { ok: false as const, error: "هذا الرقم الجامعي مفعّل بالفعل. سجّل الدخول مباشرة." };
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail(data.studentId),
      password: data.password,
      email_confirm: true,
      user_metadata: { role: "student" },
    });
    if (error || !created.user) {
      return { ok: false as const, error: "تعذر تفعيل الحساب، حاول مرة أخرى." };
    }

    const { error: linkError } = await supabaseAdmin
      .from("students")
      .update({
        auth_user_id: created.user.id,
        ...(data.gender && !student.gender ? { gender: data.gender } : {}),
      })
      .eq("id", student.id)
      .is("auth_user_id", null);
    if (linkError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return { ok: false as const, error: "تعذر تفعيل الحساب، حاول مرة أخرى." };
    }
    return { ok: true as const };
  });
