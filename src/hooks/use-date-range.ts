import { useState } from "react";
import { formatDateDisplay, parseDisplayDate } from "@/lib/date-input";

export function useDateRange(onChange?: () => void) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromDisplay, setFromDisplay] = useState("");
  const [toDisplay, setToDisplay] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  function updateDate(field: "from" | "to", raw: string) {
    (field === "from" ? setFromDisplay : setToDisplay)(raw);
    const parsed = parseDisplayDate(raw);
    if (parsed === null) setDateError("برجاء إدخال التاريخ بالصيغة dd/mm/yyyy");
    else {
      (field === "from" ? setFrom : setTo)(parsed);
      setDateError(null);
    }
    onChange?.();
  }

  function setRange(range: { from: string; to: string }) {
    setFrom(range.from);
    setTo(range.to);
    setFromDisplay(formatDateDisplay(range.from));
    setToDisplay(formatDateDisplay(range.to));
    setDateError(null);
    onChange?.();
  }

  return { from, to, fromDisplay, toDisplay, dateError, updateDate, setRange };
}
