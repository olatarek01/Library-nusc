import type { Book, Visit } from "@/types/library";
import { visitBookLabel } from "./visit-books";

export function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function downloadVisitsCsv(
  rows: Visit[],
  facultyName: Map<string, string>,
  bookById: Map<string, Book>,
  bookTitles: Map<string, string>,
  fileName: string,
) {
  const header = [
    "اسم الطالب",
    "ID الطالب",
    "الكلية",
    "الكتاب",
    "نوع الكتاب",
    "المؤلف",
    "كود الكتاب",
    "تاريخ الزيارة",
    "وقت الزيارة",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const visit of rows) {
    const book = visit.book_id ? bookById.get(visit.book_id) : null;
    lines.push(
      [
        visit.student_name,
        visit.student_id,
        facultyName.get(visit.faculty_id) ?? "",
        visitBookLabel(visit, bookTitles),
        visit.book_id ? "كتاب مسجّل" : "كتاب مُدخل يدويًا",
        book?.author ?? "",
        book?.book_code ?? "",
        visit.visit_date,
        visit.visit_time,
      ]
        .map((value) => csvCell(String(value)))
        .join(","),
    );
  }

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
