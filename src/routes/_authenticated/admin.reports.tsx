import { FacultyOptions } from "@/components/library/FacultyOptions";
import { downloadVisitsCsv } from "@/lib/export-visits";
import { pageHead } from "@/lib/page-head";
import { AdminHeading } from "@/components/library/AdminHeading";
import { useFaculties } from "@/hooks/use-faculties";
import { DateField } from "@/components/library/DateField";
import { useDateRange } from "@/hooks/use-date-range";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  egyptNow,
  fetchBooks,
  fetchVisits,
  formatArabicDate,
  formatArabicTime,
  visitBookKey,
  visitBookLabel,
} from "@/lib/library-data";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () =>
    pageHead(
      "التقارير | مكتبة جامعة مدينة السادات الأهلية",
      "تقارير استخدام المكتبة مع إمكانية التصدير.",
      true,
    ),
  component: ReportsPage,
});

function shiftDays(days: number): string {
  const base = new Date(`${egyptNow().date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() - days);
  return base.toISOString().slice(0, 10);
}

const QUICK_RANGES: { label: string; compute: () => { from: string; to: string } }[] = [
  { label: "اليوم", compute: () => ({ from: egyptNow().date, to: egyptNow().date }) },
  { label: "آخر 7 أيام", compute: () => ({ from: shiftDays(6), to: egyptNow().date }) },
  { label: "آخر 30 يومًا", compute: () => ({ from: shiftDays(29), to: egyptNow().date }) },
  { label: "كل الفترات", compute: () => ({ from: "", to: "" }) },
];

function ReportsPage() {
  const { from, to, fromDisplay, toDisplay, dateError, updateDate, setRange } = useDateRange();
  const [facultyFilter, setFacultyFilter] = useState("all");

  const visitsQuery = useQuery({ queryKey: ["visits"], queryFn: fetchVisits });
  const booksQuery = useQuery({ queryKey: ["books", "all"], queryFn: () => fetchBooks() });
  const { faculties, facultyName } = useFaculties();

  const bookById = useMemo(
    () => new Map((booksQuery.data ?? []).map((b) => [b.id, b])),
    [booksQuery.data],
  );
  const bookTitles = useMemo(
    () => new Map((booksQuery.data ?? []).map((b) => [b.id, b.title])),
    [booksQuery.data],
  );

  const rows = useMemo(() => {
    return (visitsQuery.data ?? []).filter((visit) => {
      if (facultyFilter !== "all" && visit.faculty_id !== facultyFilter) return false;
      if (from && visit.visit_date < from) return false;
      if (to && visit.visit_date > to) return false;
      return true;
    });
  }, [visitsQuery.data, facultyFilter, from, to]);

  const summary = useMemo(() => {
    const byBook = new Map<string, { label: string; count: number }>();
    const byFaculty = new Map<string, number>();
    for (const visit of rows) {
      const key = visitBookKey(visit);
      const entry = byBook.get(key);
      if (entry) entry.count += 1;
      else byBook.set(key, { label: visitBookLabel(visit, bookTitles), count: 1 });
      byFaculty.set(visit.faculty_id, (byFaculty.get(visit.faculty_id) ?? 0) + 1);
    }
    const topBook = [...byBook.values()].sort((a, b) => b.count - a.count)[0];
    const topFaculty = [...byFaculty.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      total: rows.length,
      students: new Set(rows.map((r) => r.student_id)).size,
      booksUsed: byBook.size,
      topBook: topBook ? topBook.label : "-",
      topFaculty: topFaculty ? (facultyName.get(topFaculty[0]) ?? "-") : "-",
    };
  }, [rows, bookTitles, facultyName]);

  function exportCsv() {
    if (rows.length === 0) {
      toast.error("لا توجد بيانات للتصدير ضمن الفلاتر المحددة.");
      return;
    }
    downloadVisitsCsv(
      rows,
      facultyName,
      bookById,
      bookTitles,
      `تقرير-زيارات-المكتبة-${from || "الكل"}-${to || "الكل"}.csv`,
    );
    toast.success("تم تصدير التقرير بنجاح");
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <AdminHeading
          title="التقارير"
          description="تقارير مفصلة عن استخدام المكتبة"
          className="min-w-0"
          truncate
        />
        <Button onClick={exportCsv}>
          <Download className="size-4" aria-hidden="true" />
          تصدير CSV
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_RANGES.map((range) => (
              <Button
                key={range.label}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setRange(range.compute());
                }}
              >
                {range.label}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <DateField
              id="from"
              label="من تاريخ"
              value={fromDisplay}
              onChange={(value) => updateDate("from", value)}
            />
            <DateField
              id="to"
              label="إلى تاريخ"
              value={toDisplay}
              onChange={(value) => updateDate("to", value)}
            />
            <div className="space-y-1">
              <Label htmlFor="report-faculty" className="text-xs text-muted-foreground">
                الكلية
              </Label>
              <Select value={facultyFilter} onValueChange={setFacultyFilter}>
                <SelectTrigger id="report-faculty" className="w-full">
                  <SelectValue placeholder="كل الكليات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الكليات</SelectItem>
                  <FacultyOptions faculties={faculties} />
                </SelectContent>
              </Select>
            </div>
          </div>
          {dateError ? <p className="text-xs text-destructive">{dateError}</p> : null}
        </CardContent>
      </Card>

      {visitsQuery.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : visitsQuery.isError ? (
        <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          تعذر تحميل بيانات التقرير.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Metric title="عدد الزيارات" value={String(summary.total)} />
            <Metric title="عدد الطلاب" value={String(summary.students)} />
            <Metric title="الكتب المستخدمة" value={String(summary.booksUsed)} />
            <Metric title="الكتاب الأكثر قراءة" value={summary.topBook} />
            <Metric title="الكلية الأكثر نشاطًا" value={summary.topFaculty} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">تفاصيل الزيارات ({rows.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rows.length === 0 ? (
                <p className="p-10 text-center text-sm text-muted-foreground">
                  لا توجد بيانات ضمن الفترة المحددة.
                </p>
              ) : (
                <div className="max-h-[28rem] overflow-y-auto divide-y divide-border sm:hidden">
                  {rows.slice(0, 300).map((visit) => (
                    <div key={visit.id} className="space-y-2 p-4 text-sm">
                      <p className="break-words font-semibold">{visit.student_name}</p>
                      <dl className="grid grid-cols-1 gap-y-1 text-xs [&>dd]:mb-2">
                        <dt className="text-muted-foreground">ID الطالب</dt>
                        <dd dir="ltr" className="min-w-0 break-all text-right">
                          {visit.student_id}
                        </dd>
                        <dt className="text-muted-foreground">الكلية</dt>
                        <dd className="min-w-0 break-words">
                          {facultyName.get(visit.faculty_id) ?? "-"}
                        </dd>
                        <dt className="text-muted-foreground">الكتاب</dt>
                        <dd className="min-w-0 break-words">
                          {visitBookLabel(visit, bookTitles)}
                          {!visit.book_id ? " (مُدخل يدويًا)" : null}
                        </dd>
                        <dt className="text-muted-foreground">التاريخ</dt>
                        <dd>{formatArabicDate(visit.visit_date)}</dd>
                        <dt className="text-muted-foreground">الوقت</dt>
                        <dd>{formatArabicTime(visit.visit_time)}</dd>
                      </dl>
                    </div>
                  ))}
                </div>
              )}
              {rows.length > 0 ? (
                <div className="hidden max-h-[28rem] overflow-auto sm:block">
                  <div className="min-w-[640px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap text-right">اسم الطالب</TableHead>
                          <TableHead className="whitespace-nowrap text-right">ID الطالب</TableHead>
                          <TableHead className="whitespace-nowrap text-right">الكلية</TableHead>
                          <TableHead className="whitespace-nowrap text-right">الكتاب</TableHead>
                          <TableHead className="whitespace-nowrap text-right">التاريخ</TableHead>
                          <TableHead className="whitespace-nowrap text-right">الوقت</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.slice(0, 300).map((visit) => (
                          <TableRow key={visit.id}>
                            <TableCell className="font-medium">{visit.student_name}</TableCell>
                            <TableCell dir="ltr" className="whitespace-nowrap text-right">
                              {visit.student_id}
                            </TableCell>
                            <TableCell className="max-w-[10rem] truncate">
                              {facultyName.get(visit.faculty_id) ?? "-"}
                            </TableCell>
                            <TableCell className="max-w-[12rem] truncate">
                              {visitBookLabel(visit, bookTitles)}
                              {!visit.book_id ? (
                                <span className="mr-2 text-xs text-muted-foreground">
                                  (مُدخل يدويًا)
                                </span>
                              ) : null}
                            </TableCell>

                            <TableCell className="whitespace-nowrap">
                              {formatArabicDate(visit.visit_date)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatArabicTime(visit.visit_time)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="mt-1 break-words text-lg font-bold leading-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
