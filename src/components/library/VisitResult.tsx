import { CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VisitResult({
  title,
  subtitle,
  rows,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  rows: { label: string; value: string }[];
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <section role="status" className="space-y-6 py-6 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-olive/15 text-olive">
        <CircleCheckBig className="size-9" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <dl className="divide-y divide-border rounded-xl border border-border bg-card text-right">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>
      <Button className="h-12 w-full" onClick={onAction}>
        {actionLabel}
      </Button>
    </section>
  );
}
