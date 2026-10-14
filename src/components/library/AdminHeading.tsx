import { cn } from "@/lib/utils";

export function AdminHeading({
  title,
  description,
  className,
  truncate = false,
}: {
  title: string;
  description: string;
  className?: string;
  truncate?: boolean;
}) {
  return (
    <div className={cn("border-r-2 border-olive pr-3", className)}>
      <h2 className="break-words text-xl font-bold leading-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      <p className={cn("mt-1 text-sm text-muted-foreground", truncate && "sm:truncate")}>
        {description}
      </p>
    </div>
  );
}
