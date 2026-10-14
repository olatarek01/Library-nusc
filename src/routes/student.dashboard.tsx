import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BookOpen, CalendarClock, Clock, Library, LogOut, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UniversityLogo } from "@/components/UniversityLogo";
import { RecordsTable, type RecordColumn } from "@/components/library/RecordsTable";
import { pageHead } from "@/lib/page-head";
import { formatDuration, formatEgyptDate, formatEgyptTime } from "@/lib/datetime";
import { getCurrentUser, signOut } from "@/services/auth";
import { fetchMyProfile, fetchMyVisits, type MyVisit } from "@/services/student-portal";

export const Route = createFileRoute("/student/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await getCurrentUser().catch(() => ({ data: { user: null } }));
    if (!data.user) throw redirect({ to: "/student/login" });
  },
  head: () =>
    pageHead(
      "لوحتي | مكتبة جامعة مدينة السادات الأهلية",
      "سجل زياراتك الشخصي لمكتبة الجامعة.",
      true,
    ),
  component: StudentDashboard,
});

const PAGE = 10;
type Range = "all" | "month" | "week";

function StudentDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: fetchMyProfile });
  const visits = useQuery({ queryKey: ["my-visits"], queryFn: fetchMyVisits });
  const [q, setQ] = useState("");
  const [range, setRange] = useState<Range>("all");
  const [page, setPage] = useState(1);

  const all = useMemo(() => visits.data ?? [], [visits.data]);
  const filtered = useMemo(() => {
    const now = Date.now();
    const term = q.trim().toLowerCase();
    return all.filter((v) => {
      const t = new Date(v.entry_at).getTime();
      if (range === "week" && now - t > 7 * 864e5) return false;
      if (range === "month") {
        const d = new Date(v.entry_at),
          n = new Date();
        if (d.getMonth() !== n.getMonth() || d.getFullYear() !== n.getFullYear()) return false;
      }
      if (!term) return true;
      return [v.interest_area, v.books?.title, v.feedback].some((s) =>
        s?.toLowerCase().includes(term),
      );
    });
  }, [all, q, range]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE);
  const booksCount = all.filter((v) => v.books).length;
  const last = all[0]?.entry_at ?? null;

  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await signOut().catch(() => undefined);
    await navigate({ to: "/student/login", replace: true });
  }

  const columns: RecordColumn<MyVisit>[] = [
    {
      key: "date",
      header: "التاريخ",
      primary: true,
      cell: (v) => `${formatEgyptDate(v.entry_at)} — ${formatEgyptTime(v.entry_at)}`,
    },
    { key: "purpose", header: "المجال / الغرض", cell: (v) => v.interest_area ?? "زيارة عامة" },
    { key: "book", header: "الكتاب", cell: (v) => v.books?.title ?? "—" },
    {
      key: "exit",
      header: "وقت الخروج",
      cell: (v) => (v.exit_at ? formatEgyptTime(v.exit_at) : "—"),
    },
    {
      key: "dur",
      header: "المدة",
      cell: (v) => (v.duration_minutes != null ? formatDuration(v.duration_minutes) : "—"),
    },
    {
      key: "status",
      header: "الحالة",
      cell: (v) => (
        <Badge variant={v.status === "active" ? "default" : "secondary"}>
          {v.status === "active" ? "داخل المكتبة" : "مكتملة"}
        </Badge>
      ),
    },
  ];

  const stats = [
    { label: "إجمالي الزيارات", value: all.length, icon: Library },
    { label: "كتب اطّلعت عليها", value: booksCount, icon: BookOpen },
    { label: "آخر زيارة", value: last ? formatEgyptDate(last) : "—", icon: CalendarClock },
  ];

  return (
    <div dir="rtl" className="min-h-svh bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-6 sm:py-8">
          <div className="flex min-w-0 items-center gap-3">
            {profile.data?.photoUrl ? (
              <img
                src={profile.data.photoUrl}
                alt={`صورة ${profile.data.full_name}`}
                className="size-14 shrink-0 rounded-full object-cover ring-2 ring-primary-foreground/60 sm:size-16"
              />
            ) : (
              <UniversityLogo className="size-14 shrink-0 rounded-full bg-primary-foreground p-1 sm:size-16" />
            )}
            <div className="min-w-0">
              <p className="break-words text-lg font-extrabold sm:text-2xl">
                {profile.data?.full_name ?? "لوحة الطالب"}
              </p>
              <p className="break-words text-xs text-primary-foreground/75 sm:text-sm">
                {profile.data
                  ? `${profile.data.student_id} — ${profile.data.faculties?.name ?? ""}`
                  : "مكتبة جامعة مدينة السادات الأهلية"}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="shrink-0" onClick={logout}>
            <LogOut className="size-4" /> خروج
          </Button>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-6xl space-y-5 px-4 pb-10">
        {profile.isSuccess && !profile.data ? (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            هذا الحساب غير مرتبط بسجل طالب.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-2 break-words text-2xl font-extrabold">
                    {visits.isLoading ? "…" : s.value}
                  </p>
                </div>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-icon-chip text-olive ring-1 ring-border">
                  <s.icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="space-y-0 p-0">
            <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
              <div className="relative min-w-0 md:w-72">
                <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="بحث في الزيارات"
                  name="search"
                  placeholder="ابحث بالمجال أو الكتاب"
                  className="pr-9"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "الكل"],
                    ["month", "هذا الشهر"],
                    ["week", "آخر 7 أيام"],
                  ] as const
                ).map(([k, l]) => (
                  <Button
                    key={k}
                    size="sm"
                    variant={range === k ? "default" : "outline"}
                    onClick={() => {
                      setRange(k);
                      setPage(1);
                    }}
                  >
                    {l}
                  </Button>
                ))}
              </div>
            </div>
            <RecordsTable
              columns={columns}
              rows={rows}
              rowKey={(v) => v.id}
              minWidth={760}
              isLoading={visits.isLoading}
              isError={visits.isError}
              emptyState={
                <span className="flex flex-col items-center gap-2">
                  <Clock className="size-6" />
                  لا توجد زيارات مسجلة بعد.
                </span>
              }
            />
            {pages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-3 text-sm">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  السابق
                </Button>
                <span className="text-muted-foreground">
                  صفحة {page} من {pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === pages}
                  onClick={() => setPage(page + 1)}
                >
                  التالي
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
