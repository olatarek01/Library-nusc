import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Star } from "lucide-react";

import { AdminHeading } from "@/components/library/AdminHeading";
import { RatingValue } from "@/components/library/RatingStars";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEgyptDate } from "@/lib/datetime";
import { pageHead } from "@/lib/page-head";
import { fetchVisits } from "@/services/library";

export const Route = createFileRoute("/_authenticated/admin/feedback")({
  head: () =>
    pageHead(
      "التقييمات والملاحظات | مكتبة جامعة مدينة السادات الأهلية",
      "تقييمات وملاحظات رواد المكتبة من الطلاب والزوار.",
      true,
    ),
  component: FeedbackPage,
});

type Entry = {
  id: string;
  name: string;
  type: "student";
  date: string | null;
  rating: number;
  feedback: string | null;
};

function FeedbackPage() {
  const [filter, setFilter] = useState("all");

  const studentsQuery = useQuery({ queryKey: ["visits"], queryFn: fetchVisits });

  const loading = studentsQuery.isLoading;
  const failed = studentsQuery.isError;

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [];
    for (const visit of studentsQuery.data ?? []) {
      if (!visit.rating) continue;
      list.push({
        id: visit.id,
        name: visit.student_name,
        type: "student",
        date: visit.exit_at,
        rating: visit.rating,
        feedback: visit.feedback,
      });
    }
    return list.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }, [studentsQuery.data]);

  const rows = entries.filter((entry) => filter === "all" || entry.type === filter);
  const average = entries.length
    ? entries.reduce((sum, entry) => sum + entry.rating, 0) / entries.length
    : 0;

  return (
    <div className="space-y-6">
      <AdminHeading
        title="التقييمات والملاحظات"
        description="آراء الطلاب والزوار في خدمات المكتبة"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex size-11 items-center justify-center rounded-xl bg-olive/15 text-olive">
              <Star className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">متوسط تقييم المكتبة</p>
              <p className="text-2xl font-bold">{average ? average.toFixed(1) : "-"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">عدد التقييمات</p>
            <p className="text-2xl font-bold">{entries.length.toLocaleString("ar-EG")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1.5 p-4">
            <p className="text-xs text-muted-foreground">نوع المستخدم</p>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الجميع</SelectItem>
                <SelectItem value="student">الطلاب</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : failed ? (
        <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          تعذر تحميل التقييمات، برجاء تحديث الصفحة.
        </p>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            لا توجد تقييمات مسجلة حتى الآن.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{entry.name}</span>
                    <Badge variant={entry.type === "student" ? "default" : "secondary"}>
                      {entry.type === "student" ? "طالب" : "زائر"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <RatingValue value={entry.rating} />
                    <span className="text-xs text-muted-foreground">
                      {formatEgyptDate(entry.date)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {entry.feedback?.trim() || "بدون تعليق"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
