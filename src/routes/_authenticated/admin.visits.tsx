import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowDownUp, Search } from "lucide-react";

import { AdminHeading } from "@/components/library/AdminHeading";
import { DateField } from "@/components/library/DateField";
import { FacultyOptions } from "@/components/library/FacultyOptions";
import { RatingValue } from "@/components/library/RatingStars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecordsTable } from "@/components/library/RecordsTable";
import { useDateRange } from "@/hooks/use-date-range";
import { useFaculties } from "@/hooks/use-faculties";
import { formatDuration, formatEgyptTime } from "@/lib/datetime";
import { pageHead } from "@/lib/page-head";
import { visitBookLabel } from "@/lib/visit-books";
import { fetchBooks, fetchVisits } from "@/services/library";

export const Route = createFileRoute("/_authenticated/admin/visits")({
  head: () =>
    pageHead(
      "زيارات الطلاب | مكتبة جامعة مدينة السادات الأهلية",
      "سجل زيارات الطلاب للمكتبة مع البحث والتصفية.",
      true,
    ),
  component: VisitsPage,
});

const PAGE_SIZE = 15;

function VisitsPage() {
  const [search, setSearch] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { from, to, fromDisplay, toDisplay, dateError, updateDate } = useDateRange(() =>
    setPage(1),
  );
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const visitsQuery = useQuery({ queryKey: ["visits"], queryFn: fetchVisits });
  const booksQuery = useQuery({ queryKey: ["books", "all"], queryFn: () => fetchBooks() });
  const { faculties, facultyName } = useFaculties();

  const bookTitle = useMemo(
    () => new Map((booksQuery.data ?? []).map((book) => [book.id, book.title])),
    [booksQuery.data],
  );

  const filtered = useMemo(() => {
    const term = search.trim();
    const rows = (visitsQuery.data ?? []).filter((visit) => {
      if (facultyFilter !== "all" && visit.faculty_id !== facultyFilter) return false;
      if (statusFilter !== "all" && visit.status !== statusFilter) return false;
      if (from && visit.visit_date < from) return false;
      if (to && visit.visit_date > to) return false;
      if (term && !visit.student_name.includes(term) && !visit.student_id.includes(term))
        return false;
      return true;
    });
    return rows.sort((a, b) =>
      sortAsc ? a.entry_at.localeCompare(b.entry_at) : b.entry_at.localeCompare(a.entry_at),
    );
  }, [visitsQuery.data, search, facultyFilter, statusFilter, from, to, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminHeading title="زيارات الطلاب" description="سجل كامل لزيارات الطلاب للمكتبة" />

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="visit-search" className="text-xs font-medium text-muted-foreground">
              البحث
            </Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="visit-search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="اسم الطالب أو الرقم الجامعي"
                className="pl-9"
              />
            </div>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="visit-faculty" className="text-xs font-medium text-muted-foreground">
              الكلية
            </Label>
            <Select
              value={facultyFilter}
              onValueChange={(value) => {
                setFacultyFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="visit-faculty" className="w-full">
                <SelectValue placeholder="كل الكليات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الكليات</SelectItem>
                <FacultyOptions faculties={faculties} />
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="visit-status" className="text-xs font-medium text-muted-foreground">
              حالة الزيارة
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="visit-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">مفتوحة</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        </CardContent>
        {dateError ? <p className="px-4 pb-4 text-xs text-destructive">{dateError}</p> : null}
      </Card>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSortAsc((value) => !value)}
        >
          <ArrowDownUp className="size-3.5" aria-hidden="true" />
          {sortAsc ? "الأقدم أولًا" : "الأحدث أولًا"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <RecordsTable
            rows={rows}
            rowKey={(visit) => visit.id}
            minWidth={1040}
            isLoading={visitsQuery.isLoading}
            isError={visitsQuery.isError}
            errorMessage="تعذر تحميل سجل الزيارات."
            emptyState="لا توجد زيارات مطابقة لعوامل التصفية الحالية."
            columns={[
              {
                key: "name",
                header: "اسم الطالب",
                primary: true,
                cellClassName: "max-w-[10rem] truncate font-medium",
                cell: (visit) => visit.student_name,
              },
              {
                key: "student_id",
                header: "ID الطالب",
                cellClassName: "whitespace-nowrap text-right",
                cell: (visit) => <span dir="ltr">{visit.student_id}</span>,
              },
              {
                key: "faculty",
                header: "الكلية",
                cellClassName: "max-w-[10rem] truncate",
                cell: (visit) => facultyName.get(visit.faculty_id) ?? "-",
              },
              {
                key: "interest",
                header: "المجال",
                cellClassName: "max-w-[9rem] truncate",
                cell: (visit) => visit.interest_area ?? "-",
              },
              {
                key: "book",
                header: "الكتاب",
                cellClassName: "max-w-[11rem] truncate",
                cell: (visit) =>
                  visit.book_id || visit.book_name_manual ? visitBookLabel(visit, bookTitle) : "-",
              },
              {
                key: "entry",
                header: "الدخول",
                cellClassName: "whitespace-nowrap",
                cell: (visit) => formatEgyptTime(visit.entry_at),
              },
              {
                key: "exit",
                header: "الخروج",
                cellClassName: "whitespace-nowrap",
                cell: (visit) => formatEgyptTime(visit.exit_at),
              },
              {
                key: "duration",
                header: "المدة",
                cellClassName: "whitespace-nowrap",
                cell: (visit) => formatDuration(visit.duration_minutes),
              },
              {
                key: "rating",
                header: "التقييم",
                cell: (visit) => <RatingValue value={visit.rating} />,
              },
              {
                key: "feedback",
                header: "الملاحظة",
                cellClassName: "max-w-[12rem] truncate",
                cell: (visit) => visit.feedback ?? "-",
              },
              {
                key: "status",
                header: "الحالة",
                cell: (visit) =>
                  visit.status === "active" ? (
                    <Badge className="bg-primary text-primary-foreground">مفتوحة</Badge>
                  ) : (
                    <Badge variant="secondary">مكتملة</Badge>
                  ),
              },
            ]}
          />
        </CardContent>
      </Card>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            إجمالي {filtered.length} زيارة — صفحة {currentPage} من {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              التالي
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
