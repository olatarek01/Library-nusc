import { FacultyOptions } from "@/components/library/FacultyOptions";
import { pageHead } from "@/lib/page-head";
import { AdminHeading } from "@/components/library/AdminHeading";
import { useFaculties } from "@/hooks/use-faculties";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, PowerOff, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Switch } from "@/components/ui/switch";
import { RecordsTable } from "@/components/library/RecordsTable";
import { saveBook, toggleActive } from "@/services/library-mutations";
import { fetchBooks, fetchVisits, type Book } from "@/lib/library-data";

export const Route = createFileRoute("/_authenticated/admin/books")({
  head: () =>
    pageHead(
      "الكتب | مكتبة جامعة مدينة السادات الأهلية",
      "إدارة كتب المكتبة: إضافة وتعديل وتعطيل الكتب.",
      true,
    ),
  component: BooksPage,
});

type FormState = {
  title: string;
  author: string;
  faculty_id: string;
  category: string;
  book_code: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  author: "",
  faculty_id: "",
  category: "",
  book_code: "",
  is_active: true,
};

function BooksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [toToggle, setToToggle] = useState<Book | null>(null);

  const booksQuery = useQuery({ queryKey: ["books", "all"], queryFn: () => fetchBooks() });
  const visitsQuery = useQuery({ queryKey: ["visits"], queryFn: fetchVisits });
  const { faculties, facultyName } = useFaculties();

  const readCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const visit of visitsQuery.data ?? []) {
      if (!visit.book_id) continue;
      map.set(visit.book_id, (map.get(visit.book_id) ?? 0) + 1);
    }
    return map;
  }, [visitsQuery.data]);

  const books = useMemo(() => {
    const term = search.trim();
    return (booksQuery.data ?? []).filter((book) => {
      const matchesFaculty = facultyFilter === "all" || book.faculty_id === facultyFilter;
      const matchesTerm =
        !term ||
        book.title.includes(term) ||
        (book.author ?? "").includes(term) ||
        (book.book_code ?? "").includes(term) ||
        (book.category ?? "").includes(term);
      return matchesFaculty && matchesTerm;
    });
  }, [booksQuery.data, facultyFilter, search]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormState) => {
      const payload = {
        title: values.title.trim(),
        author: values.author.trim() || null,
        faculty_id: values.faculty_id,
        category: values.category.trim() || null,
        book_code: values.book_code.trim() || null,
        is_active: values.is_active,
      };
      await saveBook(payload, editing?.id);
    },
    onSuccess: () => {
      toast.success(editing ? "تم تحديث بيانات الكتاب" : "تمت إضافة الكتاب بنجاح");
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("تعذر حفظ بيانات الكتاب، برجاء المحاولة مرة أخرى."),
  });

  const toggleMutation = useMutation({
    mutationFn: (book: Book) => toggleActive("books", book),
    onSuccess: (_data, book) => {
      toast.success(book.is_active ? "تم تعطيل الكتاب" : "تم تفعيل الكتاب");
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setToToggle(null);
    },
    onError: () => toast.error("تعذر تنفيذ العملية، برجاء المحاولة مرة أخرى."),
  });

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(book: Book) {
    setEditing(book);
    setForm({
      title: book.title,
      author: book.author ?? "",
      faculty_id: book.faculty_id,
      category: book.category ?? "",
      book_code: book.book_code ?? "",
      is_active: book.is_active,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function submitForm(event: FormEvent) {
    event.preventDefault();
    if (saveMutation.isPending) return;
    if (form.title.trim().length < 2) {
      setFormError("برجاء إدخال عنوان الكتاب");
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
          title="الكتب"
          description="إدارة كتب المكتبة المتاحة للطلاب"
          className="min-w-0"
          truncate
        />
        <Button onClick={openAdd}>
          <Plus className="size-4" aria-hidden="true" />
          إضافة كتاب
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
              placeholder="ابحث بالعنوان أو المؤلف أو الكود"
              aria-label="ابحث بالعنوان أو المؤلف أو الكود"
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
            rows={books}
            rowKey={(book) => book.id}
            minWidth={760}
            isLoading={booksQuery.isLoading}
            isError={booksQuery.isError}
            errorMessage="تعذر تحميل قائمة الكتب."
            emptyState="لا توجد كتب مطابقة. ابدأ بإضافة كتاب جديد."
            columns={[
              {
                key: "title",
                header: "العنوان",
                primary: true,
                cellClassName: "max-w-[10rem] truncate font-medium",
                cell: (book) => book.title,
              },
              {
                key: "author",
                header: "المؤلف",
                cellClassName: "max-w-[8rem] truncate",
                cell: (book) => book.author ?? "-",
              },
              {
                key: "faculty",
                header: "الكلية",
                cellClassName: "max-w-[10rem] truncate",
                cell: (book) => facultyName.get(book.faculty_id) ?? "-",
              },
              {
                key: "category",
                header: "التصنيف",
                cellClassName: "max-w-[8rem] truncate",
                cell: (book) => book.category ?? "-",
              },
              {
                key: "code",
                header: "الكود",
                cellClassName: "whitespace-nowrap",
                cell: (book) => book.book_code ?? "-",
              },
              {
                key: "reads",
                header: "مرات القراءة",
                cellClassName: "whitespace-nowrap font-semibold",
                cell: (book) => readCounts.get(book.id) ?? 0,
              },
              {
                key: "status",
                header: "الحالة",
                cellClassName: "whitespace-nowrap",
                cell: (book) =>
                  book.is_active ? (
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
                cell: (book) => (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="تعديل"
                      onClick={() => openEdit(book)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={book.is_active ? "تعطيل" : "تفعيل"}
                      onClick={() => setToToggle(book)}
                    >
                      {book.is_active ? (
                        <PowerOff className="size-4 text-destructive" aria-hidden="true" />
                      ) : (
                        <RotateCcw className="size-4 text-olive" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                ),
              },
            ]}
            cardFooter={(book) => (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openEdit(book)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  تعديل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setToToggle(book)}
                >
                  {book.is_active ? (
                    <PowerOff className="size-4 text-destructive" aria-hidden="true" />
                  ) : (
                    <RotateCcw className="size-4 text-olive" aria-hidden="true" />
                  )}
                  {book.is_active ? "تعطيل" : "تفعيل"}
                </Button>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل بيانات الكتاب" : "إضافة كتاب جديد"}</DialogTitle>
            <DialogDescription>
              أدخل بيانات الكتاب ليظهر للطلاب عند تسجيل زيارتهم.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitForm} noValidate>
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الكتاب</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">المؤلف</Label>
              <Input
                id="author"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-faculty">الكلية</Label>
              <Select
                value={form.faculty_id}
                onValueChange={(value) => setForm({ ...form, faculty_id: value })}
              >
                <SelectTrigger id="book-faculty" className="w-full">
                  <SelectValue placeholder="اختر الكلية" />
                </SelectTrigger>
                <SelectContent>
                  <FacultyOptions faculties={faculties} />
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">التصنيف</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book_code">كود الكتاب</Label>
                <Input
                  id="book_code"
                  value={form.book_code}
                  onChange={(e) => setForm({ ...form, book_code: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">حالة الكتاب</p>
                <p className="text-xs text-muted-foreground">
                  الكتب المعطّلة لا تظهر للطلاب في صفحة التسجيل.
                </p>
              </div>
              <Switch
                id="book-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                aria-label="حالة الكتاب"
              />
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saveMutation.isPending}
              >
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

      <AlertDialog open={Boolean(toToggle)} onOpenChange={(open) => !open && setToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toToggle?.is_active ? "تعطيل الكتاب" : "إعادة تفعيل الكتاب"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toToggle?.is_active
                ? `هل أنت متأكد من تعطيل الكتاب "${toToggle?.title}"؟ لن يظهر للطلاب بعد ذلك، وستظل الزيارات السابقة محفوظة.`
                : `سيتم إعادة تفعيل الكتاب "${toToggle?.title}" وإتاحته للطلاب مرة أخرى.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (toToggle) toggleMutation.mutate(toToggle);
              }}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending ? "جارٍ التنفيذ..." : "تأكيد"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
