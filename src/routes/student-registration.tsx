import { createFileRoute } from "@tanstack/react-router";
import { StudentRegistration } from "@/components/library/StudentRegistration";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/student-registration")({
  head: () =>
    pageHead(
      "تسجيل طالب | مكتبة جامعة مدينة السادات الأهلية",
      "تسجيل زيارة طالب واختيار كتاب من كتب كليته.",
    ),
  component: StudentRegistration,
});
