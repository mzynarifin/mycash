import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value).replace(/\s+/g, "");
}

export function formatDateFull(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "d MMMM yyyy", { locale: idLocale });
}

export function formatDateMedium(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "d MMM yyyy", { locale: idLocale });
}

export function formatDateShort(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "d MMM", { locale: idLocale });
}

export function formatDateTimeMedium(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "d MMM yyyy, HH:mm", { locale: idLocale });
}

export function formatDateMonth(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "MMMM yyyy", { locale: idLocale });
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function parseAmount(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}
