import type { ReactNode } from "react";
import { UniversityLogo } from "@/components/UniversityLogo";

export function AuthShell({
  children,
  variant = "split",
}: {
  children: ReactNode;
  variant?: "split" | "center";
}) {
  if (variant === "center") {
    return (
      <div
        dir="rtl"
        className="library-public flex min-h-svh justify-center px-3 py-5 sm:px-6 sm:py-10"
      >
        <div className="public-auth-enter public-glass-card m-auto flex w-full min-w-0 max-w-xl flex-col items-center rounded-3xl border p-4 text-center sm:p-10">
          <UniversityLogo className="size-24 shrink-0 sm:size-28" />
          <div className="mt-6 w-full min-w-0 flex-1">{children}</div>
          <p className="pt-8 text-center text-xs text-primary/60">
            جامعة مدينة السادات الأهلية © 2026
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="library-public flex min-h-svh justify-center px-3 py-5 sm:px-6 sm:py-10"
    >
      <div className="public-auth-enter public-glass-card m-auto grid w-full min-w-0 max-w-md overflow-hidden rounded-3xl border lg:grid-cols-2 lg:max-w-4xl">
        <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <div>
            <UniversityLogo className="mb-8 size-24 rounded-full bg-primary-foreground p-1" />
            <h2 className="text-3xl font-extrabold leading-snug">
              مكتبة جامعة مدينة السادات الأهلية
            </h2>
            <p className="mt-3 text-lg font-semibold text-primary-foreground/90">
              بوابتك الرقمية للمعرفة والبحث العلمي
            </p>
            <p className="mt-4 max-w-sm leading-relaxed text-primary-foreground/75">
              سجّل الدخول للوصول إلى خدمات المكتبة الإلكترونية وإدارة مواردها.
            </p>
          </div>
          <div className="h-1 w-16 rounded-full bg-olive" aria-hidden="true" />
        </section>

        <section className="flex min-w-0 flex-col p-5 sm:p-10">
          <UniversityLogo className="mx-auto mb-4 size-20 lg:hidden" />
          <div className="mx-auto w-full min-w-0 max-w-xs flex-1 sm:max-w-sm">{children}</div>
          <p className="pt-8 text-center text-xs text-primary/60 lg:text-primary-foreground/60">
            جامعة مدينة السادات الأهلية © 2026
          </p>
        </section>
      </div>
    </div>
  );
}
