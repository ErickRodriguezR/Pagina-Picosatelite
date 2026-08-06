const numberFormatterCache = new Map<number, Intl.NumberFormat>();

function numberFormatter(digits: number): Intl.NumberFormat {
  const existing = numberFormatterCache.get(digits);
  if (existing) return existing;

  const formatter = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  numberFormatterCache.set(digits, formatter);
  return formatter;
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  return typeof value === "number" && Number.isFinite(value)
    ? numberFormatter(digits).format(value)
    : "—";
}

export function formatUtc(iso: string | null | undefined, withDate = true): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const pad = (value: number) => String(value).padStart(2, "0");
  const time = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
  if (!withDate) return time;

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${time}`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return "—";
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  return `${minutes}m ${String(rounded % 60).padStart(2, "0")}s`;
}

export function formatCoordinate(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(5) : "—";
}

export function formatDistance(meters: number | null | undefined): string {
  if (typeof meters !== "number" || !Number.isFinite(meters)) return "—";
  return meters >= 1000
    ? `${formatNumber(meters / 1000, 2)} km`
    : `${formatNumber(meters, 0)} m`;
}
