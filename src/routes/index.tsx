import { pageHead } from "@/lib/page-head";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "مكتبة جامعة مدينة السادات الأهلية",
      "تسجيل زيارات مكتبة جامعة مدينة السادات الأهلية.",
    ),
  beforeLoad: () => {
    throw redirect({ to: "/library-visit" });
  },
});
