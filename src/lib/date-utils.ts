import {
  format,
  isToday as isTodayFns,
  isTomorrow as isTomorrowFns,
  isAfter,
  isBefore,
  startOfDay,
  addDays,
  parseISO,
} from "date-fns";

export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
};

export const getToday = (): string => {
  return formatDate(new Date());
};

export const getTomorrow = (): string => {
  return formatDate(addDays(new Date(), 1));
};

export const isToday = (date: string): boolean => {
  return isTodayFns(parseISO(date));
};

export const isTomorrow = (date: string): boolean => {
  return isTomorrowFns(parseISO(date));
};

export const isFuture = (date: string): boolean => {
  const d = parseISO(date);
  const tomorrow = addDays(startOfDay(new Date()), 1);
  return isAfter(d, tomorrow);
};

export const isPast = (date: string): boolean => {
  const d = parseISO(date);
  const today = startOfDay(new Date());
  return isBefore(d, today);
};

export type DateCategory = "today" | "tomorrow" | "future";

export const getDateCategory = (date: string): DateCategory => {
  if (isToday(date) || isPast(date)) return "today";
  if (isTomorrow(date)) return "tomorrow";
  return "future";
};

export const formatDisplayDate = (date: string): string => {
  const d = parseISO(date);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(d, "MMM d");
};

