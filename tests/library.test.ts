import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDateDisplay, parseDisplayDate } from "../src/lib/date-input";
import { egyptNow, formatArabicDate, formatArabicTime } from "../src/lib/datetime";
import { visitBookKey, visitBookLabel } from "../src/lib/visit-books";
import { csvCell } from "../src/lib/export-visits";
import { pageHead } from "../src/lib/page-head";

afterEach(() => vi.useRealTimers());

describe("existing date input contract", () => {
  it.each([
    ["", ""],
    ["13/09/2026", "2026-09-13"],
    [" 1/2/2026 ", "2026-02-01"],
    ["2026-09-13", null],
    ["13/13/2026", null],
    ["0/9/2026", null],
    ["1/1/1899", null],
  ])("parses %s", (input, expected) => {
    expect(parseDisplayDate(input)).toBe(expected);
  });

  it("keeps display dates and empty input unchanged", () => {
    expect(formatDateDisplay("2026-09-13")).toBe("13/09/2026");
    expect(formatDateDisplay("")).toBe("");
    expect(formatDateDisplay("2026")).toBe("");
    expect(formatArabicDate("2026-09-13")).toBe("13/09/2026");
  });

  it("uses Cairo dates across UTC day boundaries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-13T22:30:00Z"));
    expect(egyptNow()).toEqual({ date: "2026-09-14", time: "01:30:00" });
  });

  it.each([
    ["00:05", "12:05 صباحًا"],
    ["12:30", "12:30 مساءً"],
    ["23:59", "11:59 مساءً"],
  ])("formats %s", (input, expected) => {
    expect(formatArabicTime(input)).toBe(expected);
  });
});

describe("visit grouping and export", () => {
  it("prefers registered book IDs and titles", () => {
    const visit = { book_id: "book-1", book_name_manual: "ignored" };
    expect(visitBookKey(visit)).toBe("id:book-1");
    expect(visitBookLabel(visit, new Map([["book-1", "عنوان"]]))).toBe("عنوان");
    expect(visitBookLabel(visit, new Map())).toBe("كتاب محذوف");
  });

  it("preserves historical manual entries", () => {
    const visit = { book_id: null, book_name_manual: "  عنوان  " };
    expect(visitBookKey(visit)).toBe("manual:عنوان");
    expect(visitBookLabel(visit, new Map())).toBe("عنوان");
    expect(visitBookLabel({ book_id: null, book_name_manual: null }, new Map())).toBe("-");
  });

  it("quotes CSV cells without changing Arabic or embedded delimiters", () => {
    expect(csvCell('عنوان "كتاب", جديد')).toBe('"عنوان ""كتاب"", جديد"');
    expect(csvCell("سطر\nثانٍ")).toBe('"سطر\nثانٍ"');
  });

  it("preserves private-page indexing metadata", () => {
    expect(pageHead("عنوان", "وصف", true).meta).toContainEqual({
      name: "robots",
      content: "noindex",
    });
    expect(pageHead("عنوان", "وصف").meta).toContainEqual({
      property: "og:title",
      content: "عنوان",
    });
  });
});
