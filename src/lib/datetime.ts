export const CAIRO_TZ = "Africa/Cairo";

/** Current date/time in Egypt (Africa/Cairo) as ISO-ish parts. */
export function egyptNow(): { date: string; time: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}:${get("second")}`,
  };
}

export function formatArabicDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

export function formatArabicTime(time: string): string {
  const [hStr, min] = time.split(":");
  const h = Number(hStr);
  const period = h < 12 ? "صباحًا" : "مساءً";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${min} ${period}`;
}

/** Splits an absolute timestamp into Egypt-local `YYYY-MM-DD` / `HH:mm` parts. */
export function egyptParts(timestamp: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(timestamp));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

export function formatEgyptTime(timestamp: string | null): string {
  if (!timestamp) return "-";
  return formatArabicTime(egyptParts(timestamp).time);
}

/** Egypt-local date of an absolute timestamp, formatted dd/mm/yyyy. */
export function formatEgyptDate(timestamp: string | null): string {
  if (!timestamp) return "-";
  return formatArabicDate(egyptParts(timestamp).date);
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes < 0) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} دقيقة`;
  if (mins === 0) return `${hours} ساعة`;
  return `${hours} ساعة و${mins} دقيقة`;
}
