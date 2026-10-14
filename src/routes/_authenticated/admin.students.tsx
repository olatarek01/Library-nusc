import { FacultyOptions } from "@/components/library/FacultyOptions";
import { pageHead } from "@/lib/page-head";
import { AdminHeading } from "@/components/library/AdminHeading";
import { useFaculties } from "@/hooks/use-faculties";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, PowerOff, RotateCcw, Search, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { saveStudent, toggleActive } from "@/services/library-mutations";
import { fetchStudents, fetchVisits, type Student } from "@/lib/library-data";

export const Route = createFileRoute("/_authenticated/admin/students")({
  head: () =>
    pageHead(
      "الطلاب | مكتبة جامعة مدينة السادات الأهلية",
      "إدارة بيانات الطلاب المسجلين: الاسم والرقم الجامعي والكلية.",
      true,
    ),
  component: StudentsPage,
});

type FormState = {
  full_name: string;
  student_id: string;
  faculty_id: string;
  gender: "" | "male" | "female";
};

const EMPTY_FORM: FormState = { full_name: "", student_id: "", faculty_id: "", gender: "" };

function StudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const studentsQuery = useQuery({ queryKey: ["students"], queryFn: () => fetchStudents(false) });
  const { faculties, facultyName } = useFaculties();
  const visitsQuery = useQuery({ queryKey: ["visits"], queryFn: fetchVisits });

  const visitCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const visit of visitsQuery.data ?? []) {
      const key = visit.student_id.trim();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [visitsQuery.data]);

  const students = useMemo(() => {
    const term = search.trim();
    return (studentsQuery.data ?? []).filter((student) => {
      const matchesFaculty = facultyFilter === "all" || student.faculty_id === facultyFilter;
      const matchesTerm =
        !term || student.full_name.includes(term) || student.student_id.includes(term);
      return matchesFaculty && matchesTerm;
    });
  }, [studentsQuery.data, facultyFilter, search]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormState) => {
      const payload = {
        full_name: values.full_name.trim(),
        student_id: values.student_id.trim(),
        faculty_id: values.faculty_id,
        gender: values.gender || null,
      };
      await saveStudent(payload, editing?.id);
    },
    onSuccess: () => {
      toast.success(editing ? "تم تحديث بيانات الطالب" : "تمت إضافة الطالب بنجاح");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setDialogOpen(false);
    },
    onError: (error: { code?: string } | null) => {
      if (error?.code === "23505") {
        setFormError("هذا الرقم الجامعي مسجّل بالفعل لطالب آخر");
        toast.error("الرقم الجامعي مكرر");
        return;
      }
      toast.error("تعذر حفظ بيانات الطالب، برجاء المحاولة مرة أخرى.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (student: Student) => toggleActive("students", student),
    onSuccess: (_data, student) => {
      toast.success(student.is_active ? "تم تعطيل الطالب" : "تم تفعيل الطالب");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: () => toast.error("تعذر تنفيذ العملية، برجاء المحاولة مرة أخرى."),
  });

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(student: Student) {
    setEditing(student);
    setForm({
      full_name: student.full_name,
      student_id: student.student_id,
      faculty_id: student.faculty_id,
      gender: student.gender === "male" || student.gender === "female" ? student.gender : "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function submitForm(event: FormEvent) {
    event.preventDefault();
    if (saveMutation.isPending) return;
    if (form.full_name.trim().length < 3) {
      setFormError("برجاء إدخال اسم الطالب الثلاثي");
      return;
    }
    if (!/^[0-9]{4,20}$/.test(form.student_id.trim())) {
      setFormError("برجاء إدخال رقم جامعي صحيح (أرقام فقط، من 4 إلى 20 رقمًا)");
      return;
    }
    if (!form.faculty_id) {
      setFormError("برجاء اختيار الكلية");
      return;
    }
    setFormError(null);
    saveMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <AdminHeading
          title="الطلاب"
          description="قائمة الطلاب المسجلين في النظام"
          className="min-w-0"
          truncate
        />
        <Button onClick={openAdd}>
          <Plus className="size-4" aria-hidden="true" />
          إضافة طالب
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم الجامعي"
              aria-label="ابحث بالاسم أو الرقم الجامعي"
              className="pr-9"
            />
          </div>
          <Select value={facultyFilter} onValueChange={setFacultyFilter}>
            <SelectTrigger className="w-full md:w-64 md:shrink-0">
              <SelectValue placeholder="كل الكليات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الكليات</SelectItem>
              <FacultyOptions faculties={faculties} />
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <RecordsTable
            rows={students}
            rowKey={(student) => student.id}
            minWidth={640}
            isLoading={studentsQuery.isLoading}
            isError={studentsQuery.isError}
            errorMessage="تعذر تحميل قائمة الطلاب."
            emptyState={
              <span className="flex flex-col items-center gap-3">
                <UsersRound className="size-8 text-muted-foreground" aria-hidden="true" />
                لا يوجد طلاب مطابقون. ابدأ بإضافة طالب جديد.
              </span>
            }
            columns={[
              {
                key: "name",
                header: "اسم الطالب",
                primary: true,
                cellClassName: "max-w-[10rem] truncate font-medium",
                cell: (student) => student.full_name,
              },
              {
                key: "student_id",
                header: "الرقم الجامعي",
                cellClassName: "whitespace-nowrap text-right",
                cell: (student) => <span dir="ltr">{student.student_id}</span>,
              },
              {
                key: "faculty",
                header: "الكلية",
                cellClassName: "max-w-[10rem] truncate",
                cell: (student) => facultyName.get(student.faculty_id) ?? "-",
              },
              {
                key: "visits",
                header: "عدد الزيارات",
                cellClassName: "whitespace-nowrap font-semibold",
                cell: (student) => visitCounts.get(student.student_id.trim()) ?? 0,
              },
              {
                key: "status",
                header: "الحالة",
                cellClassName: "whitespace-nowrap",
                cell: (student) =>
                  student.is_active ? (
                    <Badge className="bg-primary text-primary-foreground">مفعّل</Badge>
                  ) : (
                    <Badge variant="secondary">معطّل</Badge>
                  ),
              },
              {
                key: "actions",
                header: "إجراءات",
                cellClassName: "whitespace-nowrap",
                hideOnCard: true,
                cell: (student) => (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="تعديل"
                      onClick={() => openEdit(student)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={student.is_active ? "تعطيل" : "تفعيل"}
                      disabled={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate(student)}
                    >
                      {student.is_active ? (
                        <PowerOff className="size-4 text-destructive" aria-hidden="true" />
                      ) : (
                        <RotateCcw className="size-4 text-olive" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                ),
              },
            ]}
            cardFooter={(student) => (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openEdit(student)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  تعديل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={toggleMutation.isPending}
                  onClick={() => toggleMutation.mutate(student)}
                >
                  {student.is_active ? (
                    <PowerOff className="size-4 text-destructive" aria-hidden="true" />
                  ) : (
                    <RotateCcw className="size-4 text-olive" aria-hidden="true" />
                  )}
                  {student.is_active ? "تعطيل" : "تفعيل"}
                </Button>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}</DialogTitle>
            <DialogDescription>
              أدخل بيانات الطالب ليتم التعرف عليه تلقائيًا عند تسجيل الزيارة.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitForm} noValidate>
            <div className="space-y-2">
              <Label htmlFor="full_name">اسم الطالب</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="الاسم الثلاثي"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student_code">الرقم الجامعي</Label>
              <Input
                id="student_code"
                inputMode="numeric"
                value={form.student_id}
                onChange={(e) =>
                  setForm({ ...form, student_id: e.target.value.replace(/[^0-9]/g, "") })
                }
                placeholder="مثال: 202312345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-faculty-dialog">الكلية</Label>
              <Select
                value={form.faculty_id}
                onValueChange={(value) => setForm({ ...form, faculty_id: value })}
              >
                <SelectTrigger id="student-faculty-dialog" className="w-full">
                  <SelectValue placeholder="اختر الكلية" />
                </SelectTrigger>
                <SelectContent>
                  <FacultyOptions faculties={faculties} />
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-gender-dialog">النوع</Label>
              <Select
                value={form.gender || "unset"}
                onValueChange={(v) =>
                  setForm({ ...form, gender: v === "unset" ? "" : (v as "male" | "female") })
                }
              >
                <SelectTrigger id="student-gender-dialog" className="w-full">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">غير محدد</SelectItem>
                  <SelectItem value="male">طالب</SelectItem>
                  <SelectItem value="female">طالبة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    جارٍ الحفظ...
                  </>
                ) : (
                  "حفظ"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
