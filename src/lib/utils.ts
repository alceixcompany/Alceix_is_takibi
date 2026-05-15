import { clsx, type ClassValue } from "clsx";
import { format, isValid, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Belirtilmedi";
  }

  const date = parseISO(value);
  if (!isValid(date)) {
    return value;
  }

  return format(date, "d MMM yyyy", { locale: tr });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Belirtilmedi";
  }

  const date = parseISO(value);
  if (!isValid(date)) {
    return value;
  }

  return format(date, "d MMM yyyy HH:mm", { locale: tr });
}

export function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

export function isTruthy(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export function toNumber(value: string | number | null | undefined, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = Number(value.replace(",", "."));
    return Number.isFinite(normalized) ? normalized : fallback;
  }

  return fallback;
}
