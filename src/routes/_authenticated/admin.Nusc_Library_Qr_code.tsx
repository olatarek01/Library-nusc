import { pageHead } from "@/lib/page-head";
import { AdminHeading } from "@/components/library/AdminHeading";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UniversityLogo } from "@/components/UniversityLogo";

const FILE_NAME = "Nusc_Library_Qr_code";

export const Route = createFileRoute("/_authenticated/admin/Nusc_Library_Qr_code")({
  head: () =>
    pageHead(
      "رمز الاستجابة السريعة | مكتبة جامعة مدينة السادات الأهلية",
      "إنشاء وطباعة رمز الاستجابة السريعة لتسجيل زيارات المكتبة.",
      true,
    ),
  component: QrPage,
});

function QrPage() {
  const [url, setUrl] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const link = `${window.location.origin}/library-visit`;
    setUrl(link);
    QRCode.toDataURL(link, {
      width: 1200,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#0C2D57", light: "#ffffff" },
    })
      .then((value) => {
        if (active) setDataUrl(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("تعذر نسخ الرابط");
    }
  }

  function download() {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${FILE_NAME}.png`;
    link.click();
  }

  return (
    <div className="space-y-6">
      <AdminHeading
        title="رمز الاستجابة السريعة"
        description="اطبع الملصق وضعه عند مدخل المكتبة ليقوم الطلاب بتسجيل زياراتهم."
        className="no-print"
      />

      <Card className="no-print">
        <CardContent className="flex min-w-0 flex-col gap-3 p-4 xl:flex-row">
          <Input
            value={url}
            readOnly
            dir="ltr"
            aria-label="رابط صفحة تسجيل الزيارات"
            className="min-w-0 text-left"
          />
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" onClick={copyLink}>
              <Copy className="size-4" aria-hidden="true" />
              نسخ الرابط
            </Button>
            <Button variant="outline" onClick={download} disabled={!dataUrl}>
              <Download className="size-4" aria-hidden="true" />
              تحميل QR كصورة
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mx-auto w-full max-w-xl border-2 border-primary/20">
        <CardContent className="p-4 text-center sm:p-8">
          <UniversityLogo className="mx-auto mb-4 size-24" />
          <p className="text-xl font-extrabold text-foreground">جامعة مدينة السادات الأهلية</p>
          <p className="mt-1 text-base font-bold">مكتبة الجامعة</p>
          <p className="mt-1 text-sm text-muted-foreground">نظام تسجيل ومتابعة استخدام المكتبة</p>
          <div className="my-6 flex justify-center">
            {error ? (
              <p className="text-sm text-destructive">تعذر إنشاء رمز الاستجابة السريعة.</p>
            ) : dataUrl ? (
              <img
                src={dataUrl}
                alt="رمز الاستجابة السريعة لتسجيل زيارة المكتبة"
                className="aspect-square h-auto w-full max-w-64 rounded-xl border border-border sm:max-w-80"
              />
            ) : (
              <Skeleton className="aspect-square h-auto w-full max-w-64 sm:max-w-80" />
            )}
          </div>
          <p className="text-lg font-bold">امسح الكود لتسجيل زيارتك للمكتبة</p>
          <p className="mt-2 break-all text-xs text-muted-foreground" dir="ltr">
            {url}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
