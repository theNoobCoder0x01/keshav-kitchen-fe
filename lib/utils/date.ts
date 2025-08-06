import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Extend Day.js with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Function to convert epoch timestamp to human-readable date
export const formatEpochToDate = (
  epoch: number,
  format: string = "DD MMM YYYY",
  tz?: string,
): string => {
  // Check if epoch is in seconds (10 digits) or milliseconds (13 digits)
  const timestamp = epoch.toString().length === 10 ? epoch * 1000 : epoch;

  // Use the specified timezone, or default to the user's local timezone
  const date = tz ? dayjs(timestamp).tz(tz) : dayjs(timestamp);
  return date.format(format);
};

// Function to convert epoch timestamp to human-readable date
export const formatEpochToTime = (
  epoch: number,
  format: string = "HH:mm:ss",
  excludeSeconds: boolean = false,
  tz?: string,
): string => {
  if (excludeSeconds) {
    format = format.replace(/:ss/, "");
  }

  // Check if epoch is in seconds (10 digits) or milliseconds (13 digits)
  const timestamp = epoch.toString().length === 10 ? epoch * 1000 : epoch;

  // Use the specified timezone, or default to the user's local timezone
  const date = tz ? dayjs(timestamp).tz(tz) : dayjs(timestamp);
  return date.format(format);
};

// Function to convert date string to epoch timestamp
export const dateToEpoch = (
  date: string | Date | dayjs.Dayjs,
  tz?: string,
): number => {
  const parsedDate = tz ? dayjs(date).tz(tz) : dayjs(date);
  return parsedDate.valueOf(); // Returns epoch in milliseconds
};

// Function to get the user's local timezone
export const getLocalTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Function to get the current epoch timestamp
export const getCurrentEpoch = (tz?: string): number => {
  return dateToEpoch(dayjs(), tz);
};

// Function to format date with timezone
export const formatDateWithTimezone = (
  epoch: number,
  format: string = "DD MMM YYYY HH:mm:ss z",
  tz?: string,
): string => {
  const timestamp = epoch.toString().length === 10 ? epoch * 1000 : epoch;
  const date = tz ? dayjs(timestamp).tz(tz) : dayjs(timestamp);
  return date.format(format);
};

export const getNextDay = (date: Date | string | dayjs.Dayjs): Date => {
  return dayjs(date).add(1, "day").toDate();
};

export const getPreviousDay = (date: Date | string | dayjs.Dayjs): Date => {
  return dayjs(date).subtract(1, "day").toDate();
};
