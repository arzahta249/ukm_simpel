import { REFERENCE_DATE } from "./data";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  return new Date(date).toLocaleDateString("id-ID", opts);
}

export function formatShortDate(date: string) {
  return formatDate(date, { day: "numeric", month: "short", year: "numeric" });
}

/** Sisa hari terhadap tanggal acuan (deterministik untuk mode demo). */
export function daysLeft(deadline: string, from: string = REFERENCE_DATE) {
  const diff = new Date(deadline).getTime() - new Date(from).getTime();
  return Math.ceil(diff / 86_400_000);
}

export function initials(name: string) {
  return name
    .replace(/^(Dr\.|Ir\.|Prof\.)\s*/i, "")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

