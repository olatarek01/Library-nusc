import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS = ["ضعيف جدًا", "ضعيف", "جيد", "جيد جدًا", "ممتاز"];

export function RatingStars({
  value,
  onChange,
  disabled = false,
  id,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <div className="space-y-2">
      <div dir="ltr" className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            id={id ? `${id}-${star}` : undefined}
            onClick={() => onChange(star)}
            aria-label={`${star} من 5`}
            aria-pressed={value === star}
            className="rounded-full p-1 transition-transform disabled:opacity-60"
          >
            <Star
              className={cn(
                "size-9 transition-colors",
                star <= value ? "fill-olive text-olive" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {value > 0 ? LABELS[value - 1] : "اختر تقييمك للمكتبة"}
      </p>
    </div>
  );
}

/** Read-only compact stars for admin tables. */
export function RatingValue({ value }: { value: number | null }) {
  if (!value) return <span className="text-muted-foreground">-</span>;
  return (
    <span dir="ltr" className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "size-3.5",
            star <= value ? "fill-olive text-olive" : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}
