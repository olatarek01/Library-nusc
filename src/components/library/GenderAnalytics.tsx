import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Percent, RotateCcw, User, UserRound, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FacultyOptions } from "@/components/library/FacultyOptions";
import { useFaculties } from "@/hooks/use-faculties";
import { supabase } from "@/integrations/supabase/client";

type Row = { id: string; gender: string | null; faculty_id: string; created_at: string };

async function fetchStudentGenders(): Promise<Row[]> {
  const { data, error } = await supabase
    .from("students")
    .select("id, gender, faculty_id, created_at");
  if (error) throw error;
  return data ?? [];
}

function normalizeGender(v: string | null): "male" | "female" | "unknown" {
  const s = (v ?? "").trim().toLowerCase();
  if (["male", "m", "ذكر", "طالب"].includes(s)) return "male";
  if (["female", "f", "أنثى", "انثى", "طالبة"].includes(s)) return "female";
  return "unknown";
}

const pct = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);
const fmt = (n: number) => n.toLocaleString("ar-EG");
const fmtPct = (n: number) => `${n.toLocaleString("ar-EG", { maximumFractionDigits: 1 })}٪`;

export function GenderAnalytics() {
  const query = useQuery({ queryKey: ["students", "gender"], queryFn: fetchStudentGenders });
  const { faculties } = useFaculties();
  const [faculty, setFaculty] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const stats = useMemo(() => {
    const seen = new Set<string>();
    let male = 0,
      female = 0,
      unknown = 0;
    for (const r of query.data ?? []) {
      if (seen.has(r.id)) continue;
      if (faculty !== "all" && r.faculty_id !== faculty) continue;
      const day = r.created_at.slice(0, 10);
      if (from && day < from) continue;
      if (to && day > to) continue;
      seen.add(r.id);
      const g = normalizeGender(r.gender);
      if (g === "male") male++;
      else if (g === "female") female++;
      else unknown++;
    }
    const total = male + female + unknown;
    return { male, female, unknown, total };
  }, [query.data, faculty, from, to]);

  const chartData = [
    { name: "طلاب", value: stats.male, color: "var(--chart-1)" },
    { name: "طالبات", value: stats.female, color: "var(--chart-2)" },
    ...(stats.unknown ? [{ name: "غير محدد", value: stats.unknown, color: "var(--chart-4)" }] : []),
  ];
  const filtered = faculty !== "all" || from || to;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">إحصائيات الطلاب والطالبات</CardTitle>
        <p className="text-sm text-muted-foreground">
          تحليل ومقارنة أعداد الطلاب المستفيدين من خدمات المكتبة
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:items-end xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="ga-faculty">الكلية</Label>
            <Select value={faculty} onValueChange={setFaculty}>
              <SelectTrigger id="ga-faculty" className="w-full">
                <SelectValue placeholder="كل الكليات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الكليات</SelectItem>
                <FacultyOptions faculties={faculties} />
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ga-from">من تاريخ التسجيل</Label>
            <Input
              id="ga-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ga-to">إلى</Label>
            <Input id="ga-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button
            variant="outline"
            disabled={!filtered}
            onClick={() => {
              setFaculty("all");
              setFrom("");
              setTo("");
            }}
          >
            <RotateCcw className="size-4" /> إعادة الضبط
          </Button>
        </div>

        {query.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : query.isError ? (
          <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            تعذر تحميل إحصائيات الطلاب، برجاء تحديث الصفحة.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Stat title="إجمالي الطلاب" value={fmt(stats.male)} icon={User} />
              <Stat title="إجمالي الطالبات" value={fmt(stats.female)} icon={UserRound} />
              <Stat title="إجمالي المستفيدين" value={fmt(stats.total)} icon={Users} />
              <Stat
                title="نسبة الطلاب"
                value={fmtPct(pct(stats.male, stats.total))}
                icon={Percent}
              />
              <Stat
                title="نسبة الطالبات"
                value={fmtPct(pct(stats.female, stats.total))}
                icon={Percent}
              />
            </div>

            {stats.total === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                لا توجد بيانات طلاب مطابقة للفلاتر الحالية.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  الفرق بين الطلاب والطالبات:{" "}
                  <span className="font-bold text-foreground">
                    {fmt(Math.abs(stats.male - stats.female))}
                  </span>
                  {stats.unknown ? ` — غير محدد النوع: ${fmt(stats.unknown)}` : null}
                </p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="h-64 min-w-0" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fill: "var(--foreground)", fontSize: 12 }} />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fill: "var(--foreground)", fontSize: 12 }}
                        />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Bar dataKey="value" name="العدد" radius={[6, 6, 0, 0]}>
                          {chartData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-64 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="55%"
                          outerRadius="80%"
                          paddingAngle={2}
                        >
                          {chartData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => `${fmt(v)} (${fmtPct(pct(v, stats.total))})`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ title, value, icon: Icon }: { title: string; value: string; icon: typeof User }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-icon-chip text-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="break-words text-xs text-muted-foreground">{title}</p>
        <p className="break-words text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
