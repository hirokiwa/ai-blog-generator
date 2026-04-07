import { MovieStudioError } from "./errors";

export const formatDateInTimeZone = (
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    ...options,
  }).format(date);
};

export const getDayKeyInTimeZone = (date: Date, timeZone: string): string => {
  return formatDateInTimeZone(date, timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replaceAll("-", "");
};

export const getIsoStringWithoutMilliseconds = (date: Date): string => {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
};

export const assertPublishedOnCurrentDay = (
  publishedAt: Date,
  currentDate: Date,
  timeZone: string,
): void => {
  const publishedDayKey = getDayKeyInTimeZone(publishedAt, timeZone);
  const currentDayKey = getDayKeyInTimeZone(currentDate, timeZone);

  if (publishedDayKey !== currentDayKey) {
    throw new MovieStudioError(
      `Latest blog publishedAt is not today. publishedAt=${getIsoStringWithoutMilliseconds(publishedAt)} currentDate=${getIsoStringWithoutMilliseconds(currentDate)} timeZone=${timeZone}`,
    );
  }
};
