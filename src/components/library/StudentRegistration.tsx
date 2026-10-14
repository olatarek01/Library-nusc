import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  BookOpen,
  Clock,
  Compass,
  GraduationCap,
  IdCard,
  Loader2,
  LogIn,
  LogOut,
  MessageSquare,
  Star,
  User,
  Users,
} from "lucide-react";

import { BrandHeader } from "@/components/BrandHeader";
import { BookPicker } from "@/components/library/BookPicker";
import { FacultyOptions } from "@/components/library/FacultyOptions";
import { InterestField } from "@/components/library/InterestField";
import { RatingStars } from "@/components/library/RatingStars";
import { VisitResult } from "@/components/library/VisitResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration, formatEgyptTime } from "@/lib/datetime";
import { fetchBooks, fetchFaculties } from "@/services/library";
import { studentCheckIn, studentCheckOut, studentScanStatus } from "@/services/visits";
import type { CheckInResult, CheckOutResult } from "@/types/library";

type Done =
  | { kind: "in"; entryAt: string; name: string }
  | { kind: "out"; entryAt: string; exitAt: string; minutes: number };

const ID_PATTERN = /^[0-9]{4,20}$/;

export function StudentRegistration() {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [interestArea, setInterestArea] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [bookId, setBookId] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!done) return;
    toast.success(done.kind === "in" ? "تم تسجيل دخولك للمكتبة بنجاح" : "تم تسجيل خروجك بنجاح");
    void navigate({ to: "/student/login" });
  }, [done, navigate]);

  const idValid = ID_PATTERN.test(studentId.trim());

  const scanQuery = useQuery({
    queryKey: ["student-scan", studentId.trim()],
    queryFn: () => studentScanStatus(studentId),
    enabled: idValid && !done,
  });
  const scan = scanQuery.data ?? null;
  const isExit = scan?.state === "active";

  const facultiesQuery = useQuery({ queryKey: ["faculties"], queryFn: () => fetchFaculties(true) });
  const faculties = facultiesQuery.data ?? [];

  const activeFacultyId = isExit ? (scan.facultyId ?? "") : facultyId;
  const booksQuery = useQuery({
    queryKey: ["books", "public", activeFacultyId],
    queryFn: () => fetchBooks({ facultyId: activeFacultyId, activeOnly: true }),
    enabled: Boolean(activeFacultyId),
  });
  const books = booksQuery.data ?? [];
  const noBooks = Boolean(activeFacultyId) && booksQuery.isSuccess && books.length === 0;

  const prefilled = useRef<string | null>(null);
  useEffect(() => {
    if (!scan || done) return;
    const key = studentId.trim();
    if (prefilled.current === key) return;
    prefilled.current = key;
    if (scan.state === "none" && scan.facultyId) setFacultyId(scan.facultyId);
  }, [scan, studentId, done]);

  const checkIn = useMutation({
    mutationFn: (force: boolean) =>
      studentCheckIn({
        studentId,
        studentName,
        facultyId,
        interestArea,
        gender: gender as "male" | "female",
        force,
      }),
    onSuccess: (result: CheckInResult) => {
      if (result.outcome === "checked_in") {
        setDone({ kind: "in", entryAt: result.entryAt, name: studentName.trim() });
        setNeedsConfirm(false);
        return;
      }
      if (result.outcome === "active_exists") {
        setFormError("لديك زيارة مفتوحة بالفعل.");
        void scanQuery.refetch();
        return;
      }
      setNeedsConfirm(true);
    },
    onError: () => setFormError("تعذر تسجيل الدخول، برجاء المحاولة مرة أخرى."),
  });

  const checkOut = useMutation({
    mutationFn: () => studentCheckOut({ studentId, bookId, rating, feedback }),
    onSuccess: (result: CheckOutResult) => {
      if (result.outcome === "no_active") {
        setFormError("لا توجد زيارة مفتوحة مرتبطة بهذه البيانات.");
        void scanQuery.refetch();
        return;
      }
      setDone({
        kind: "out",
        entryAt: result.entryAt,
        exitAt: result.exitAt,
        minutes: result.durationMinutes,
      });
    },
    onError: () => setFormError("تعذر تسجيل الخروج، برجاء المحاولة مرة أخرى."),
  });

  const pending = checkIn.isPending || checkOut.isPending;

  function reset() {
    prefilled.current = null;
    setStudentId("");
    setStudentName("");
    setFacultyId("");
    setInterestArea("");
    setGender("");
    setBookId("");
    setRating(0);
    setFeedback("");
    setFormError(null);
    setNeedsConfirm(false);
    setDone(null);
    checkIn.reset();
    checkOut.reset();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    if (isExit) {
      if (!bookId) return setFormError("برجاء اختيار الكتاب الذي اطلعت عليه.");
      if (rating < 1) return setFormError("برجاء تقييم المكتبة من ١ إلى ٥ نجوم.");
      checkOut.mutate();
      return;
    }

    if (!idValid) return setFormError("برجاء إدخال رقم جامعي صحيح (أرقام فقط، من ٤ إلى ٢٠ رقمًا).");
    if (studentName.trim().length < 3) return setFormError("برجاء إدخال اسم الطالب الثلاثي.");
    if (!facultyId) return setFormError("برجاء اختيار الكلية.");
    if (interestArea.trim().length < 2) return setFormError("برجاء كتابة المجال المطلوب.");
    if (!gender) return setFormError("برجاء تحديد النوع (طالب أو طالبة).");
    checkIn.mutate(false);
  }

  if (done) {
    return (
      <Shell>
        {done.kind === "in" ? (
          <VisitResult
            title="تم تسجيل دخولك إلى المكتبة بنجاح"
            subtitle="امسح نفس الكود مرة أخرى عند الخروج لإنهاء الزيارة"
            rows={[
              { label: "الاسم", value: done.name },
              { label: "وقت الدخول", value: formatEgyptTime(done.entryAt) },
            ]}
            actionLabel="إنهاء"
            onAction={reset}
          />
        ) : (
          <VisitResult
            title="تم تسجيل خروجك بنجاح"
            subtitle="شكرًا لزيارتك مكتبة جامعة مدينة السادات الأهلية"
            rows={[
              { label: "وقت الدخول", value: formatEgyptTime(done.entryAt) },
              { label: "وقت الخروج", value: formatEgyptTime(done.exitAt) },
              { label: "مدة الزيارة", value: formatDuration(done.minutes) },
            ]}
            actionLabel="إنهاء"
            onAction={reset}
          />
        )}
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 text-lg font-bold text-foreground sm:text-2xl">
          <Link
            to="/library-visit"
            aria-label="العودة"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent"
          >
            {isExit ? <LogOut className="size-6" /> : <LogIn className="size-6" />}
          </Link>
          {isExit ? "تسجيل الخروج من المكتبة" : "تسجيل الدخول إلى المكتبة"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isExit
            ? "قبل مغادرتك، أخبرنا بالكتاب الذي اطلعت عليه وقيّم تجربتك."
            : "أدخل بياناتك لتسجيل دخولك إلى المكتبة."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6" noValidate>
        <div className="space-y-2">
          <Label htmlFor="student_id" className="flex items-center gap-1.5 text-sm">
            <IdCard className="size-4 text-olive-light" aria-hidden="true" />
            الرقم الجامعي / Student ID
          </Label>
          <Input
            id="student_id"
            inputMode="numeric"
            dir="ltr"
            value={studentId}
            onChange={(event) => {
              setStudentId(event.target.value.replace(/[^0-9]/g, ""));
              setFormError(null);
              setNeedsConfirm(false);
              setBookId("");
              setRating(0);
            }}
            placeholder=""
            disabled={pending}
            className="h-12 bg-card text-right"
          />
          {idValid && scanQuery.isLoading ? (
            <p className="text-xs text-muted-foreground">جارٍ التحقق من حالة زيارتك...</p>
          ) : null}
        </div>

        {idValid && scanQuery.isLoading ? <Skeleton className="h-28 w-full" /> : null}

        {isExit ? (
          <>
            <div className="flex items-center gap-2 rounded-xl border border-olive/40 bg-olive/10 p-4 text-sm">
              <Clock className="size-4 shrink-0 text-olive" aria-hidden="true" />
              <span>
                زيارتك مفتوحة منذ <strong>{formatEgyptTime(scan.entryAt)}</strong>
                {scan.name ? ` — ${scan.name}` : ""}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-book" className="flex items-center gap-1.5 text-sm">
                <BookOpen className="size-4 text-olive-light" aria-hidden="true" />
                الكتاب الذي اطلعت عليه
              </Label>
              {noBooks ? (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  لا توجد كتب مسجلة لكليتك حاليًا، برجاء إبلاغ أمين المكتبة.
                </p>
              ) : (
                <BookPicker
                  books={books}
                  value={bookId}
                  onChange={(id) => {
                    setBookId(id);
                    setFormError(null);
                  }}
                  loading={booksQuery.isLoading}
                  disabled={pending}
                  triggerId="student-book"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-rating-1" className="flex items-center gap-1.5 text-sm">
                <Star className="size-4 text-olive-light" aria-hidden="true" />
                تقييم المكتبة
              </Label>
              <RatingStars
                id="student-rating"
                value={rating}
                onChange={setRating}
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback" className="flex items-center gap-1.5 text-sm">
                <MessageSquare className="size-4 text-olive-light" aria-hidden="true" />
                ملاحظاتك (اختياري)
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                maxLength={500}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="شاركنا رأيك لتحسين خدمات المكتبة"
                disabled={pending}
                className="min-h-24 bg-card"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="student_name" className="flex items-center gap-1.5 text-sm">
                <User className="size-4 text-olive-light" aria-hidden="true" />
                اسم الطالب
              </Label>
              <Input
                id="student_name"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder=""
                autoComplete="off"
                disabled={pending}
                className="h-12 bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-faculty" className="flex items-center gap-1.5 text-sm">
                <GraduationCap className="size-4 text-olive-light" aria-hidden="true" />
                الكلية
              </Label>
              {facultiesQuery.isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : facultiesQuery.isError ? (
                <p className="text-sm text-destructive">
                  تعذر تحميل قائمة الكليات، برجاء إعادة المحاولة.
                </p>
              ) : (
                <Select
                  value={facultyId}
                  onValueChange={(value) => {
                    setFacultyId(value);
                    setFormError(null);
                  }}
                  disabled={pending}
                >
                  <SelectTrigger id="student-faculty" className="h-12 w-full bg-card">
                    <SelectValue placeholder="اختر الكلية" />
                  </SelectTrigger>
                  <SelectContent>
                    <FacultyOptions faculties={faculties} />
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-gender-reg" className="flex items-center gap-1.5 text-sm">
                <Users className="size-4 text-olive-light" aria-hidden="true" />
                النوع
              </Label>
              <select
                id="student-gender-reg"
                name="gender"
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value as "" | "male" | "female");
                  setFormError(null);
                }}
                disabled={pending}
                className="h-12 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">اختر</option>
                <option value="male">طالب</option>
                <option value="female">طالبة</option>
              </select>
            </div>

            <InterestField
              id="interest_area"
              label="المجال الذي ترغب في القراءة أو البحث فيه"
              icon={<Compass className="size-4 text-olive-light" aria-hidden="true" />}
              value={interestArea}
              onChange={setInterestArea}
              disabled={pending}
              placeholder=""
            />
          </>
        )}

        {needsConfirm ? (
          <div className="space-y-3 rounded-xl border border-olive/40 bg-olive/10 p-4 text-sm">
            <p>لديك زيارة مكتملة منذ وقت قصير، هل تريد تسجيل زيارة جديدة؟</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                className="h-11 flex-1"
                disabled={pending}
                onClick={() => checkIn.mutate(true)}
              >
                نعم، سجّل زيارة جديدة
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
                onClick={() => setNeedsConfirm(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        ) : null}

        {formError ? (
          <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        {!needsConfirm ? (
          <Button type="submit" className="h-12 w-full text-base" disabled={pending || noBooks}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                جارٍ الحفظ...
              </>
            ) : isExit ? (
              "تسجيل الخروج"
            ) : (
              "تسجيل الدخول"
            )}
          </Button>
        ) : null}
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="library-public flex min-h-svh flex-col bg-background">
      <BrandHeader />
      <main className="page-enter mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-3 py-5 sm:px-4 sm:py-6">
        <Card className="public-glass-card w-full overflow-hidden">
          <CardContent className="p-4 sm:p-8">{children}</CardContent>
        </Card>
      </main>
    </div>
  );
}
