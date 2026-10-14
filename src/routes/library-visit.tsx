import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { AuthShell } from "@/components/library/AuthShell";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/library-visit")({
  head: () =>
    pageHead(
      "مرحبًا بك | مكتبة جامعة مدينة السادات الأهلية",
      "تسجيل زيارات الطلاب لمكتبة جامعة مدينة السادات الأهلية.",
    ),
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <AuthShell variant="center">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-extrabold leading-snug text-foreground sm:text-2xl">
          مرحبًا بك في مكتبة جامعة مدينة السادات الأهلية
        </h1>
        <p className="mt-2 text-base text-muted-foreground">سجّل زيارتك للمكتبة بسهولة وسرعة</p>
      </div>

      <Button
        asChild
        className="group grid h-auto w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-3 whitespace-normal rounded-2xl bg-primary p-4 text-right shadow-lg ring-1 ring-olive/35 transition-[background-color,box-shadow] duration-200 hover:bg-primary-dark hover:shadow-xl sm:gap-4 sm:p-6 [&_svg]:size-6"
      >
        <Link to="/student-registration" className="w-full min-w-0 items-center">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-olive/15 text-olive ring-1 ring-olive/40 transition-colors duration-200 group-hover:bg-olive group-hover:text-primary sm:size-14">
            <GraduationCap aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold sm:text-xl">تسجيل الدخول</span>
            <span className="mt-1 block text-sm font-normal leading-relaxed break-words text-primary-foreground/70">
              خطوتك الأولى نحو المعرفة
            </span>
          </span>
          <ArrowLeft
            aria-hidden="true"
            className="shrink-0 text-olive transition-transform duration-200 group-hover:-translate-x-1"
          />
        </Link>
      </Button>
    </AuthShell>
  );
}
