import { pageHead } from "@/lib/page-head";
import { AdminHeading } from "@/components/library/AdminHeading";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toggleActive } from "@/services/library-mutations";
import { fetchBooks, fetchFaculties, fetchVisits } from "@/lib/library-data";

export const Route = createFileRoute("/_authenticated/admin/faculties")({
  head: () =>
    pageHead(
      "الكليات | مكتبة جامعة مدينة السادات الأهلية",
      "قائمة كليات الجامعة وعدد الكتب والزيارات لكل كلية.",
      true,
    ),
  component: FacultiesPage,
});

function FacultiesPage() {
  const queryClient = useQueryClient();
  const facultiesQuery = useQuery({
    queryKey: ["faculties", "all"],
    queryFn: () => fetchFaculties(false),
  });
  const booksQuery = useQuery({ queryKey: ["books", "all"], queryFn: () => fetchBooks() });
  const visitsQuery = useQuery({ queryKey: ["visits"], queryFn: fetchVisits });

  const toggleMutation = useMutation({
    mutationFn: (faculty: { id: string; is_active: boolean }) => toggleActive("faculties", faculty),
    onSuccess: (_data, faculty) => {
      toast.success(faculty.is_active ? "تم تعطيل الكلية" : "تم تفعيل الكلية");
      queryClient.invalidateQueries({ queryKey: ["faculties"] });
    },
    onError: () => toast.error("تعذر تنفيذ العملية، برجاء المحاولة مرة أخرى."),
  });

  const loading = facultiesQuery.isLoading || booksQuery.isLoading || visitsQuery.isLoading;

  if (loading) return <Skeleton className="h-80 w-full" />;
  if (facultiesQuery.isError) {
    return (
      <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
        تعذر تحميل بيانات الكليات.
      </p>
    );
  }

  const faculties = facultiesQuery.data ?? [];
  const books = booksQuery.data ?? [];
  const visits = visitsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <AdminHeading
          title="الكليات"
          description="الكليات المسجلة في النظام ونشاطها بالمكتبة."
          className="min-w-0"
          truncate
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border md:hidden">
            {faculties.map((faculty) => {
              const facultyBooks = books.filter((book) => book.faculty_id === faculty.id);
              return (
                <div key={faculty.id} className="space-y-3 p-4">
                  <p className="break-words text-sm font-semibold">{faculty.name}</p>
                  <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 text-xs">
                    <dt className="text-muted-foreground">عدد الكتب</dt>
                    <dd>{facultyBooks.length}</dd>
                    <dt className="text-muted-foreground">الكتب المفعّلة</dt>
                    <dd>{facultyBooks.filter((book) => book.is_active).length}</dd>
                    <dt className="text-muted-foreground">عدد الزيارات</dt>
                    <dd>{visits.filter((visit) => visit.faculty_id === faculty.id).length}</dd>
                  </dl>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={faculty.is_active}
                      disabled={toggleMutation.isPending}
                      onCheckedChange={() => toggleMutation.mutate(faculty)}
                      aria-label={`${faculty.is_active ? "تعطيل" : "تفعيل"} ${faculty.name}`}
                    />
                    {faculty.is_active ? (
                      <Badge className="bg-primary text-primary-foreground">مفعّلة</Badge>
                    ) : (
                      <Badge variant="secondary">معطّلة</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[560px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-right">الكلية</TableHead>
                    <TableHead className="whitespace-nowrap text-right">عدد الكتب</TableHead>
                    <TableHead className="whitespace-nowrap text-right">الكتب المفعّلة</TableHead>
                    <TableHead className="whitespace-nowrap text-right">عدد الزيارات</TableHead>
                    <TableHead className="whitespace-nowrap text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculties.map((faculty) => {
                    const facultyBooks = books.filter((b) => b.faculty_id === faculty.id);
                    return (
                      <TableRow key={faculty.id}>
                        <TableCell className="max-w-[12rem] truncate font-medium">
                          {faculty.name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{facultyBooks.length}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {facultyBooks.filter((b) => b.is_active).length}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {visits.filter((v) => v.faculty_id === faculty.id).length}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={faculty.is_active}
                              disabled={toggleMutation.isPending}
                              onCheckedChange={() => toggleMutation.mutate(faculty)}
                              aria-label={faculty.is_active ? "تعطيل الكلية" : "تفعيل الكلية"}
                            />
                            {faculty.is_active ? (
                              <Badge className="bg-primary text-primary-foreground">مفعّلة</Badge>
                            ) : (
                              <Badge variant="secondary">معطّلة</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
