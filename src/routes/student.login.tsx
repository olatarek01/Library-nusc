import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { ArrowRight, Camera, IdCard, Loader2, Lock, User, Users } from "lucide-react";

import { PasswordInput } from "@/components/library/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/library/AuthShell";
import { pageHead } from "@/lib/page-head";
import { activateStudentAccount } from "@/lib/student-account.functions";
import { signInStudent, uploadStudentPhoto } from "@/services/student-portal";

export const Route = createFileRoute("/student/login")({
  head: () =>
    pageHead(
      "دخول الطالب | مكتبة جامعة مدينة السادات الأهلية",
      "دخول الطلاب إلى لوحتهم الشخصية لمتابعة سجل زيارات المكتبة.",
      true,
    ),
  component: StudentLoginPage,
});

function StudentLoginPage() {
  const navigate = useNavigate();
  const activate = useServerFn(activateStudentAccount);
  const [mode, setMode] = useState<"login" | "activate">("login");
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    const id = studentId.trim();
    if (!/^[0-9]{4,20}$/.test(id)) return setError("برجاء إدخال رقم جامعي صحيح.");
    if (password.length < 8) return setError("كلمة المرور يجب ألا تقل عن 8 أحرف.");
    if (mode === "activate" && fullName.trim().length < 3)
      return setError("برجاء إدخال الاسم كما سجّلته بالمكتبة.");
    if (
      mode === "activate" &&
      photo &&
      (!["image/jpeg", "image/png", "image/webp"].includes(photo.type) ||
        photo.size > 2 * 1024 * 1024)
    ) {
      return setError("اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز ٢ ميجابايت.");
    }

    setLoading(true);
    try {
      if (mode === "activate") {
        const res = await activate({
          data: { studentId: id, fullName, password, gender: gender || undefined },
        });
        if (!res.ok) return setError(res.error);
      }
      const { error: err } = await signInStudent(id, password);
      if (err) return setError("الرقم الجامعي أو كلمة المرور غير صحيحة.");
      if (mode === "activate" && photo) {
        try {
          await uploadStudentPhoto(photo);
        } catch {
          setMode("login");
          setError("تم تفعيل حسابك، لكن تعذر حفظ الصورة. يمكنك تسجيل الدخول بدونها.");
          return;
        }
      }
      await navigate({ to: "/student/dashboard", replace: true });
    } catch {
      setError("حدث خطأ، برجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-6 text-center lg:text-right">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground lg:justify-start">
          <Link to="/library-visit" aria-label="رجوع">
            <ArrowRight className="size-5" />
          </Link>
          {mode === "login" ? "تسجيل الدخول" : "تفعيل حساب الطالب"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "أهلاً بك في المكتبة الجامعية"
            : "أدخل رقمك الجامعي واسمك كما سجّلتهما بالمكتبة واختر كلمة مرور"}
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="sid" className="flex items-center gap-1.5">
            <IdCard className="size-4 text-olive-light" aria-hidden="true" /> الرقم الجامعي
          </Label>
          <Input
            id="sid"
            name="studentId"
            inputMode="numeric"
            dir="ltr"
            className="h-11 text-left"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            autoComplete="username"
            disabled={loading}
          />
        </div>
        {mode === "activate" ? (
          <div className="space-y-2">
            <Label htmlFor="sname" className="flex items-center gap-1.5">
              <User className="size-4 text-olive-light" aria-hidden="true" /> الاسم بالكامل
            </Label>
            <Input
              id="sname"
              name="fullName"
              className="h-11"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="spass" className="flex items-center gap-1.5">
            <Lock className="size-4 text-olive-light" aria-hidden="true" /> كلمة المرور
          </Label>
          <PasswordInput
            id="spass"
            name="password"
            dir="ltr"
            className="h-11 text-left"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            disabled={loading}
          />
        </div>
        {mode === "activate" ? (
          <div className="space-y-2">
            <Label htmlFor="student-gender" className="flex items-center gap-1.5">
              <Users className="size-4 text-olive-light" aria-hidden="true" /> النوع
            </Label>
            <select
              id="student-gender"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as "" | "male" | "female")}
              disabled={loading}
              className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">اختر</option>
              <option value="male">طالب</option>
              <option value="female">طالبة</option>
            </select>
          </div>
        ) : null}
        {mode === "activate" ? (
          <div className="space-y-2">
            <Label htmlFor="student-photo" className="flex items-center gap-1.5">
              <Camera className="size-4 text-olive-light" aria-hidden="true" /> صورتك الشخصية
              (اختياري)
            </Label>
            <Input
              id="student-photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="h-11 cursor-pointer pt-2 text-sm"
              disabled={loading}
              onChange={(e) => {
                setPhoto(e.target.files?.[0] ?? null);
                setError(null);
              }}
            />
          </div>
        ) : null}
        {error ? (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        ) : null}
        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {mode === "login" ? "تسجيل الدخول" : "تفعيل الحساب والدخول"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={loading}
          onClick={() => {
            setMode(mode === "login" ? "activate" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "أول مرة؟ فعّل حسابك" : "لديك حساب؟ سجّل الدخول"}
        </Button>
        {mode === "login" ? (
          <p className="pt-3 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link
              to="/student-registration"
              className="font-semibold text-primary underline decoration-olive decoration-2 underline-offset-4 hover:decoration-primary"
            >
              سجّل بياناتك أولاً
            </Link>
          </p>
        ) : null}
      </form>
    </AuthShell>
  );
}
