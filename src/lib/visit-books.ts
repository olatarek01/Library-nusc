/** Key used to group visits in analytics: registered book id, or manual name. */
export function visitBookKey(visit: {
  book_id: string | null;
  book_name_manual: string | null;
}): string {
  return visit.book_id ? `id:${visit.book_id}` : `manual:${(visit.book_name_manual ?? "").trim()}`;
}

/** Human label for the book of a visit. */
export function visitBookLabel(
  visit: { book_id: string | null; book_name_manual: string | null },
  bookTitles: Map<string, string>,
): string {
  if (visit.book_id) return bookTitles.get(visit.book_id) ?? "كتاب محذوف";
  return (visit.book_name_manual ?? "").trim() || "-";
}
