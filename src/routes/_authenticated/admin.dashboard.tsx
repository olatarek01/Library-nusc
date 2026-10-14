import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen, CalendarDays, DoorOpen, Star, TrendingUp, TriangleAlert } from "lucide-react";

import { GenderAnalytics } from "@/components/library/GenderAnalytics";
import { AdminHeading } from "@/components/library/AdminHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFaculties } from "@/hooks/use-faculties";
import { egyptNow, egyptParts, formatArabicTime, formatDuration } from "@/lib/datetime";
import { pageHead } from "@/lib/page-head";
import { visitBookKey, visitBookLabel } from "@/lib/visit-books";
import { fetchBooks, fetchVisits } from "@/services/library";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () =>
    pageHead(
      "لوحة التحكم | مكتبة جامعة مدينة السادات الأهلية",
      "مؤشرات وإحصائيات استخدام مكتبة الجامعة.",
      true,
    ),
  component: DashboardPage,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function DashboardPage() {
  const visitsQuery = useQuery({ queryKey: ["visits"], queryFn: fetchVisits });
  const booksQuery = useQuery({ queryKey: ["books", "all"], queryFn: () => fetchBooks() });
  const { facultiesQuery, faculties } = useFaculties();

  const visits = useMemo(() => visitsQuery.data ?? [], [visitsQuery.data]);
  const books = useMemo(() => booksQuery.data ?? [], [booksQuery.data]);

  const loading = visitsQuery.isLoading || booksQuery.isLoading || facultiesQuery.isLoading;
  const failed = visitsQuery.isError || booksQuery.isError || facultiesQuery.isError;

  const stats = useMemo(() => {
    const today = egyptNow().date;
    const facultyName = new Map(faculties.map((faculty) => [faculty.id, faculty.name]));
    const bookTitle = new Map(books.map((book) => [book.id, book.title]));

    const byDayStudents = new Map<string, number>();
    const byFaculty = new Map<string, number>();
    const byBook = new Map<string, { label: string; value: number }>();
    const byHour = new Map<number, number>();
    const byInterest = new Map<string, number>();

    let durationSum = 0;
    let durationCount = 0;
    let ratingSum = 0;
    let ratingCount = 0;

    for (const visit of visits) {
      byDayStudents.set(visit.visit_date, (byDayStudents.get(visit.visit_date) ?? 0) + 1);
      byFaculty.set(visit.faculty_id, (byFaculty.get(visit.faculty_id) ?? 0) + 1);
      if (visit.book_id || visit.book_name_manual) {
        const key = visitBookKey(visit);
        const entry = byBook.get(key);
        if (entry) entry.value += 1;
        else byBook.set(key, { label: visitBookLabel(visit, bookTitle), value: 1 });
      }
      const hour = Number(egyptParts(visit.entry_at).time.slice(0, 2));
      byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
      const interest = visit.interest_area?.trim();
      if (interest) byInterest.set(interest, (byInterest.get(interest) ?? 0) + 1);
      if (visit.duration_minutes !== null) {
        durationSum += visit.duration_minutes;
        durationCount += 1;
      }
      if (visit.rating) {
        ratingSum += visit.rating;
        ratingCount += 1;
      }
    }

    const lastDays: { label: string; students: number }[] = [];
    for (let i = 13; i >= 0; i -= 1) {
      const day = new Date(`${today}T12:00:00Z`);
      day.setUTCDate(day.getUTCDate() - i);
      const key = day.toISOString().slice(0, 10);
      lastDays.push({
        label: key.slice(5).replace("-", "/"),
        students: byDayStudents.get(key) ?? 0,
      });
    }

    const topInterests = [...byInterest.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const peakHour = [...byHour.entries()].sort((a, b) => b[1] - a[1])[0];
    const topBooks = [...byBook.values()].sort((a, b) => b.value - a.value).slice(0, 5);
    const unusedBooks = books.filter((book) => book.is_active && !byBook.has(`id:${book.id}`));

    return {
      totalStudents: visits.length,
      todayStudents: visits.filter((visit) => visit.visit_date === today).length,
      activeNow: visits.filter((visit) => visit.status === "active").length,
      booksCount: books.length,
      avgRating: ratingCount ? ratingSum / ratingCount : 0,
      avgDuration: durationCount ? Math.round(durationSum / durationCount) : null,
      lastDays,
      facultyChart: faculties.map((faculty) => ({
        label: faculty.name,
        value: byFaculty.get(faculty.id) ?? 0,
      })),
      topBooks,
      topInterests,
      peakHour: peakHour
        ? `${formatArabicTime(`${String(peakHour[0]).padStart(2, "0")}:00`)} (${peakHour[1]} زيارة)`
        : null,
      topFaculties: [...byFaculty.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id, value]) => `${facultyName.get(id) ?? "-"} (${value})`),
      unusedBooks: unusedBooks.slice(0, 5).map((book) => book.title),
      unusedCount: unusedBooks.length,
      emptyFaculties: faculties
        .filter(
          (faculty) =>
            faculty.is_active &&
            !books.some((book) => book.faculty_id === faculty.id && book.is_active),
        )
        .map((faculty) => faculty.name),
    };
  }, [visits, books, faculties]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (failed) {
    return (
      <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
        تعذر تحميل بيانات لوحة التحكم، برجاء تحديث الصفحة.
      </p>
    );
  }

  const hasData = visits.length > 0;

  return (
    <div className="space-y-6">
      <AdminHeading title="الرئيسية" description="نظرة عامة على استخدام المكتبة" />

      <GenderAnalytics />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi title="إجمالي زيارات الطلاب" value={String(stats.totalStudents)} icon={TrendingUp} />
        <Kpi title="زيارات الطلاب اليوم" value={String(stats.todayStudents)} icon={CalendarDays} />
        <Kpi title="الموجودون الآن" value={String(stats.activeNow)} icon={DoorOpen} />
        <Kpi title="إجمالي الكتب" value={String(stats.booksCount)} icon={BookOpen} />
        <Kpi
          title="متوسط تقييم المكتبة"
          value={stats.avgRating ? `${stats.avgRating.toFixed(1)} / 5` : "-"}
          icon={Star}
        />
      </div>

      {stats.emptyFaculties.length > 0 ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-semibold text-destructive">كليات بدون كتب مسجلة</p>
              <p className="mt-1 text-muted-foreground">
                لن يتمكن طلاب هذه الكليات من اختيار كتاب عند الخروج:{" "}
                {stats.emptyFaculties.join("، ")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!hasData ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            لا توجد زيارات مسجلة حتى الآن. ستظهر الرسوم البيانية بمجرد تسجيل أول زيارة.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">الزيارات خلال آخر ١٤ يومًا</CardTitle>
            </CardHeader>
            <CardContent className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.lastDays}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    reversed
                    interval="preserveStartEnd"
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} orientation="right" />
                  <Tooltip
                    contentStyle={{ direction: "rtl", fontFamily: "Cairo" }}
                    formatter={(value: number) => [`${value} زيارة`, "الطلاب"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="students"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="الزيارات حسب الكلية" data={stats.facultyChart} colored />
            <ChartCard title="أكثر المجالات طلبًا" data={stats.topInterests} />
            <ChartCard title="الكتب الأكثر استخدامًا" data={stats.topBooks} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">قراءات تحليلية</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <Insight title="ساعة الذروة" body={stats.peakHour ?? "لا توجد بيانات"} />
              <Insight
                title="متوسط مدة زيارة الطالب"
                body={
                  stats.avgDuration === null
                    ? "لا توجد زيارات مكتملة بعد"
                    : formatDuration(stats.avgDuration)
                }
              />
              <Insight
                title="الكليات الأكثر نشاطًا"
                body={stats.topFaculties.length ? stats.topFaculties.join("، ") : "لا توجد بيانات"}
              />
              <Insight
                title="كتب منخفضة الاستخدام"
                body={
                  stats.unusedCount === 0
                    ? "كل الكتب المفعّلة تم استخدامها"
                    : `${stats.unusedCount} كتاب دون أي استخدام: ${stats.unusedBooks.join("، ")}`
                }
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ChartCard({
  title,
  data,
  colored = false,
}: {
  title: string;
  data: { label: string; value: number }[];
  colored?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72 sm:h-80">
        {data.length === 0 ? (
          <p className="pt-10 text-center text-sm text-muted-foreground">لا توجد بيانات كافية</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="label"
                width={110}
                tick={{ fontSize: 10 }}
                orientation="right"
              />
              <Tooltip
                contentStyle={{ direction: "rtl", fontFamily: "Cairo" }}
                formatter={(value: number) => [`${value} زيارة`, ""]}
              />
              <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 6, 6, 0]}>
                {colored
                  ? data.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))
                  : null}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function Kpi({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-foreground">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold sm:text-2xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Insight({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <p className="mb-1 font-semibold text-foreground">{title}</p>
      <p className="break-words text-muted-foreground">{body}</p>
    </div>
  );
}
