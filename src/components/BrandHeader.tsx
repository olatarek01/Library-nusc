import { UniversityLogo } from "@/components/UniversityLogo";

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="brand-gradient border-b border-olive/50 text-sidebar-foreground shadow-sm">
      <div
        className={`mx-auto grid max-w-4xl grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 sm:gap-4 sm:px-5 ${compact ? "py-3 sm:py-4" : "py-4 sm:py-6"}`}
      >
        <UniversityLogo variant="dark" className="size-14 shrink-0 sm:size-16" />
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold sm:text-xl">جامعة مدينة السادات الأهلية</h1>
          <p className="truncate text-[11px] text-sidebar-foreground/75 sm:text-sm">
            نظام تسجيل ومتابعة استخدام المكتبة
          </p>
        </div>
      </div>
    </header>
  );
}
