import { pageHead } from "@/lib/page-head";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Lock, Mail } from "lucide-react";

import { PasswordInput } from "@/components/library/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/library/AuthShell";
import { getCurrentUser, isCurrentUserAdmin, signIn, signOut } from "@/services/auth";

export const Route = createFileRoute("/admin/login")({
  head: () =>
    pageHead(
      "تسجيل دخول المسؤول | مكتبة جامعة مدينة السادات الأهلية",
      "دخول مسؤولي مكتبة جامعة مدينة السادات الأهلية.",
      true,
    ),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [existingEmail, setExistingEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getCurrentUser()
      .then(({ data }) => {
        if (!cancelled && data.user) setExistingEmail(data.user.email ?? "حساب مسجّل");
      })
      .catch(() => {
        if (!cancelled) setError("تعذر التحقق من الحساب، برجاء المحاولة مرة أخرى.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSwitchAccount() {
    try {
      await signOut();
      setExistingEmail(null);
    } catch {
      setError("تعذر تسجيل الخروج، برجاء المحاولة مرة أخرى.");
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError(null);

    if (!email.trim() || !password) {
      setError("برجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await signIn(email.trim(), password);
      if (signInError) {
        setError("بيانات الدخول غير صحيحة، برجاء المحاولة مرة أخرى.");
        return;
      }
      if (!(await isCurrentUserAdmin())) {
        await signOut();
        setExistingEmail(null);
        setError("هذا الحساب غير مصرح له بالدخول إلى الإدارة.");
        return;
      }
      await navigate({ to: "/admin/dashboard", replace: true });
    } catch {
      setError("تعذر تسجيل الدخول، برجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-6 text-center lg:text-right">
        <h1 className="text-2xl font-extrabold text-foreground">دخول الإدارة</h1>
        <p className="mt-1 text-sm text-muted-foreground">لوحة تحكم المكتبة — للمسؤولين فقط</p>
      </div>

      {existingEmail ? (
        <div className="mb-4 space-y-3 rounded-lg border border-border bg-secondary/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            يوجد حساب مسجّل حاليًا:{" "}
            <span dir="ltr" className="break-all font-medium">
              {existingEmail}
            </span>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate({ to: "/admin/dashboard" })}
            >
              متابعة للوحة التحكم
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={onSwitchAccount}
            >
              دخول بحساب آخر
            </Button>
          </div>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-1.5 text-sm">
            <Mail className="size-4 text-olive-light" aria-hidden="true" />
            البريد الإلكتروني
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            dir="ltr"
            className="h-11 text-left"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-1.5 text-sm">
            <Lock className="size-4 text-olive-light" aria-hidden="true" />
            كلمة المرور
          </Label>
          <PasswordInput
            id="password"
            name="password"
            dir="ltr"
            className="h-11 text-left"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
          />
        </div>

        {error ? (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        ) : null}

        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              جارٍ تسجيل الدخول...
            </>
          ) : (
            "تسجيل الدخول"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
