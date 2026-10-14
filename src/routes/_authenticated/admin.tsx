import { createFileRoute, Link, Outlet, useNavigate, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  BookOpen,
  Building2,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Settings,
  Star,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UniversityLogo } from "@/components/UniversityLogo";
import { isCurrentUserAdmin, signOut } from "@/services/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    if (!(await isCurrentUserAdmin())) throw redirect({ to: "/admin/login" });
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/dashboard", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { to: "/admin/visits", label: "زيارات الطلاب", icon: Users, exact: false },
  { to: "/admin/students", label: "الطلاب", icon: GraduationCap, exact: false },
  { to: "/admin/books", label: "الكتب", icon: BookOpen, exact: false },
  { to: "/admin/faculties", label: "الكليات", icon: Building2, exact: false },
  { to: "/admin/reports", label: "الإحصائيات والتقارير", icon: FileBarChart, exact: false },
  { to: "/admin/feedback", label: "التقييمات والملاحظات", icon: Star, exact: false },
  { to: "/admin/Nusc_Library_Qr_code", label: "رمز الاستجابة", icon: QrCode, exact: false },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl lg:flex">
          <SidebarContent onNavigate={() => undefined} />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="فتح القائمة">
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-72 max-w-[calc(100vw-2rem)] bg-sidebar p-0 text-sidebar-foreground"
              >
                <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
                <SidebarContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">مكتبة جامعة مدينة السادات الأهلية</p>
              <p className="truncate text-xs text-muted-foreground">لوحة التحكم</p>
            </div>
          </header>

          <main className="page-enter mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await signOut();
      await navigate({ to: "/admin/login", replace: true });
    } catch {
      toast.error("تعذر تسجيل الخروج، برجاء المحاولة مرة أخرى.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <UniversityLogo variant="dark" className="size-13 shrink-0" />
        <div className="min-w-0">
          <p className="text-base font-bold">جامعة مدينة السادات الأهلية</p>
          <p className="mt-1 text-xs text-sidebar-foreground/70">
            نظام تسجيل ومتابعة استخدام المكتبة
          </p>
        </div>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-md border-r-2 border-transparent px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-[background-color,color,border-color,transform] duration-200 hover:border-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground motion-safe:hover:translate-x-0.5 data-[status=active]:border-sidebar-primary data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
          >
            <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          variant="ghost"
          className="flex h-auto w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-60"
        >
          <LogOut className="size-4.5 shrink-0" aria-hidden="true" />
          {signingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
        </Button>
      </div>
    </div>
  );
}
