import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";

import { AdminHeading } from "@/components/library/AdminHeading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { pageHead } from "@/lib/page-head";
import { getCurrentUser } from "@/services/auth";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () =>
    pageHead(
      "الإعدادات | مكتبة جامعة مدينة السادات الأهلية",
      "إعدادات حساب الإدارة ورابط تسجيل الزيارات.",
      true,
    ),
  component: SettingsPage,
});

function SettingsPage() {
  const userQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => (await getCurrentUser()).data.user,
  });

  const visitUrl = typeof window === "undefined" ? "" : `${window.location.origin}/library-visit`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(visitUrl);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeading title="الإعدادات" description="بيانات الحساب ورابط تسجيل الزيارات" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">حساب الإدارة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {userQuery.isLoading ? (
            <Skeleton className="h-5 w-56" />
          ) : (
            <p dir="ltr" className="text-right font-medium">
              {userQuery.data?.email ?? "-"}
            </p>
          )}
          <p className="text-muted-foreground">
            الدخول إلى لوحة التحكم متاح لحسابات الإدارة المصرّح لها فقط.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">رابط تسجيل الزيارات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            نفس الرابط يُستخدم للدخول والخروج: إذا كانت هناك زيارة مفتوحة يُسجَّل الخروج، وإلا
            يُسجَّل دخول جديد.
          </p>
          <p dir="ltr" className="break-all rounded-md bg-secondary/50 p-3 text-right text-xs">
            {visitUrl}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyLink}>
              <Copy className="size-4" />
              نسخ الرابط
            </Button>
            <Button asChild>
              <Link to="/admin/Nusc_Library_Qr_code">
                <QrCode className="size-4" />
                رمز الاستجابة
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قواعد تسجيل الزيارات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• لا يمكن فتح زيارتين في نفس الوقت لنفس الطالب أو نفس الزائر.</p>
          <p>• لا يوجد حد أقصى لمدة الزيارة، والمدة تُحسب تلقائيًا من وقت الدخول والخروج.</p>
          <p>
            • خلال ٩٠ دقيقة من انتهاء زيارة سابقة يُطلب تأكيد قبل بدء زيارة جديدة، لمنع التسجيل
            المكرر.
          </p>
          <p>• التقييم من ١ إلى ٥ نجوم، ويُحتسب ضمن متوسط تقييم المكتبة.</p>
        </CardContent>
      </Card>
    </div>
  );
}
