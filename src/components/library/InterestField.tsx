import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INTEREST_SUGGESTIONS = [
  "الذكاء الاصطناعي",
  "البرمجة",
  "إدارة الأعمال",
  "العلوم",
  "الطب البيطري",
  "الصيدلة",
  "الرياضة",
  "السياحة والفنادق",
  "اللغات",
  "البحث العلمي",
];

export function InterestField({
  id,
  label,
  icon,
  value,
  onChange,
  disabled = false,
  placeholder = "مثال: الذكاء الاصطناعي",
}: {
  id: string;
  label: string;
  icon?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const listId = `${id}-suggestions`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-sm">
        {icon}
        {label}
      </Label>
      <Input
        id={id}
        list={listId}
        value={value}
        maxLength={120}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-12 bg-card"
      />
      <datalist id={listId}>
        {INTEREST_SUGGESTIONS.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </div>
  );
}
