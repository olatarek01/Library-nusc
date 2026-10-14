import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        dir="ltr"
        placeholder="dd/mm/yyyy"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
