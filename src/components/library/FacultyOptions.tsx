import { SelectItem } from "@/components/ui/select";
import type { Faculty } from "@/types/library";

export function FacultyOptions({ faculties }: { faculties: Faculty[] }) {
  return faculties.map((faculty) => (
    <SelectItem key={faculty.id} value={faculty.id}>
      {faculty.name}
    </SelectItem>
  ));
}
