import { format } from "date-fns";

const YEN_FORMATTER = new Intl.NumberFormat("ja-jp", {
  currency: "JPY",
  style: "currency",
  maximumFractionDigits: 0,
});

export function formatYen(amount: number) {
  return YEN_FORMATTER.format(amount);
}

const NUMBER_FORMATTER = new Intl.NumberFormat("ja-jp");

export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number);
}

export function capitalize(string: string) {
  if (string && string.length > 0 && string != undefined) {
    return string[0]!.toUpperCase() + string.slice(1);
  } else {
    return "Error";
  }
}

export function dateDisplayFormat(date: Date | null | undefined): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "Invalid date";
  }
  return format(date, "yyyy-MM-dd");
}