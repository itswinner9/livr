export function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function daysUntil(value: string, from = new Date()) {
  const target = parseDateOnly(value);
  if (!target) return null;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export function currentYearMonth(from = new Date()) {
  return { year: from.getFullYear(), month: from.getMonth() + 1 };
}

export function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

export function todayLabel(from = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(from);
}
