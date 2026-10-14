import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Book } from "@/types/library";

export function BookPicker({
  books,
  value,
  onChange,
  loading = false,
  disabled = false,
  placeholder = "ابحث عن الكتاب واختره",
  triggerId,
}: {
  books: Book[];
  value: string;
  onChange: (bookId: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  triggerId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = books.find((book) => book.id === value) ?? null;

  const filtered = useMemo(() => {
    const term = search.trim();
    if (!term) return books;
    return books.filter(
      (book) =>
        book.title.includes(term) ||
        (book.author ?? "").includes(term) ||
        (book.book_code ?? "").includes(term),
    );
  }, [books, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          id={triggerId}
          disabled={disabled}
          className="h-12 w-full justify-between bg-card font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.title : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث بالاسم أو المؤلف أو الكود"
            aria-label="ابحث بالاسم أو المؤلف أو الكود"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {loading ? (
            <p className="p-3 text-center text-sm text-muted-foreground">جارٍ تحميل الكتب...</p>
          ) : filtered.length === 0 ? (
            <p className="p-3 text-center text-sm text-muted-foreground">
              الكتاب غير مسجل بالمكتبة
            </p>
          ) : (
            filtered.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => {
                  onChange(book.id);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 rounded-md px-3 py-2.5 text-right text-sm hover:bg-accent"
              >
                <Check
                  className={cn(
                    "mt-0.5 size-4 shrink-0 text-foreground",
                    value === book.id ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block font-medium">{book.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[book.author, book.book_code].filter(Boolean).join(" — ") ||
                      "بدون بيانات إضافية"}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
