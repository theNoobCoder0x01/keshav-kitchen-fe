import {
  format,
  parseISO,
  addDays,
  subDays,
  addHours,
  addMinutes,
  addSeconds,
  addMilliseconds,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  isBefore,
  isAfter,
  isSameDay,
  startOfDay,
  endOfDay,
  isValid,
} from "date-fns";
import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

/**
 * Default timezone configuration
 * In a real app, this would come from user settings or system configuration
 */
export const DEFAULT_TIMEZONE = "UTC";

/**
 * Get the user's local timezone using Intl API
 * This is used for display purposes only
 */
export const getLocalTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Get current date/time in UTC (for storage)
 * Use this instead of new Date() for consistency
 */
export const getCurrentDateUTC = (): Date => {
  return new Date();
};

/**
 * Get current epoch timestamp in milliseconds
 * Use this instead of Date.now() when you need epoch values
 */
export const getCurrentEpoch = (): number => {
  return Date.now();
};

/**
 * Convert epoch timestamp to Date object
 * Handles both seconds (10 digits) and milliseconds (13 digits)
 */
export const epochToDate = (epoch: number): Date => {
  // Check if epoch is in seconds (10 digits) or milliseconds (13 digits)
  const timestamp = epoch.toString().length === 10 ? epoch * 1000 : epoch;
  return new Date(timestamp);
};

/**
 * Convert Date object to epoch timestamp in milliseconds
 * Use this for consistent epoch conversion
 */
export const dateToEpoch = (date: Date | string): number => {
  if (typeof date === "string") {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) {
      throw new Error(`Invalid date string: ${date}`);
    }
    return parsedDate.getTime();
  }
  return date.getTime();
};

/**
 * Format epoch timestamp to human-readable date string
 * Always formats in the specified timezone (defaults to user's local timezone)
 */
export const formatEpochToDate = (
  epoch: number,
  formatStr: string = "dd MMM yyyy",
  timezone?: string,
): string => {
  const date = epochToDate(epoch);
  const tz = timezone || getLocalTimezone();
  return formatInTimeZone(date, tz, formatStr);
};

/**
 * Format epoch timestamp to time string
 * Always formats in the specified timezone (defaults to user's local timezone)
 */
export const formatEpochToTime = (
  epoch: number,
  formatStr: string = "HH:mm:ss",
  excludeSeconds: boolean = false,
  timezone?: string,
): string => {
  if (excludeSeconds) {
    formatStr = formatStr.replace(/:ss/, "");
  }

  const date = epochToDate(epoch);
  const tz = timezone || getLocalTimezone();
  return formatInTimeZone(date, tz, formatStr);
};

/**
 * Format date with timezone information
 * Use this for user-facing date displays that need timezone context
 */
export const formatDateWithTimezone = (
  epoch: number,
  formatStr: string = "dd MMM yyyy HH:mm:ss zzz",
  timezone?: string,
): string => {
  const date = epochToDate(epoch);
  const tz = timezone || getLocalTimezone();
  return formatInTimeZone(date, tz, formatStr);
};

/**
 * Get the next day from a given date
 * Returns a new Date object (UTC for storage)
 */
export const getNextDay = (date: Date | string): Date => {
  const baseDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(baseDate)) {
    throw new Error(`Invalid date: ${date}`);
  }
  return addDays(baseDate, 1);
};

/**
 * Get the previous day from a given date
 * Returns a new Date object (UTC for storage)
 */
export const getPreviousDay = (date: Date | string): Date => {
  const baseDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(baseDate)) {
    throw new Error(`Invalid date: ${date}`);
  }
  return subDays(baseDate, 1);
};

/**
 * Format time ago string using date-fns
 * Use this instead of manual time calculations
 */
export function formatTimeAgo(date: Date): string {
  const now = getCurrentDateUTC();
  const diffInSeconds = differenceInSeconds(now, date);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }

  const diffInMinutes = differenceInMinutes(now, date);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = differenceInHours(now, date);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = differenceInDays(now, date);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const diffInWeeks = differenceInWeeks(now, date);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  }

  const diffInMonths = differenceInMonths(now, date);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  }

  const diffInYears = differenceInYears(now, date);
  return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
}

/**
 * Create start of day in UTC for database queries
 * Use this for consistent day boundary handling in UTC
 */
export const createStartOfDayUTC = (date: Date | string): Date => {
  const baseDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(baseDate)) {
    throw new Error(`Invalid date: ${date}`);
  }
  return startOfDay(baseDate);
};

/**
 * Create end of day in UTC for database queries
 * Use this for consistent day boundary handling in UTC
 */
export const createEndOfDayUTC = (date: Date | string): Date => {
  const baseDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(baseDate)) {
    throw new Error(`Invalid date: ${date}`);
  }
  return endOfDay(baseDate);
};

/**
 * Convert user timezone date to UTC for storage
 * Use this when receiving dates from user input that are in their timezone
 */
export const userDateToUTC = (date: Date, userTimezone: string): Date => {
  return zonedTimeToUtc(date, userTimezone);
};

/**
 * Convert UTC date to user timezone for display
 * Use this when displaying dates to users in their timezone
 */
export const utcToUserDate = (date: Date, userTimezone: string): Date => {
  return utcToZonedTime(date, userTimezone);
};

/**
 * Parse ISO string to Date object
 * Use this instead of new Date(string) for consistent parsing
 */
export const parseISOString = (dateString: string): Date => {
  const date = parseISO(dateString);
  if (!isValid(date)) {
    throw new Error(`Invalid ISO date string: ${dateString}`);
  }
  return date;
};

/**
 * Format date for API/database storage (always UTC ISO string)
 * Use this for consistent date serialization
 */
export const formatForStorage = (date: Date): string => {
  return date.toISOString();
};

/**
 * Format date for user display in their timezone
 * Use this instead of toLocaleString() for consistent formatting
 */
export const formatForDisplay = (
  date: Date,
  formatStr: string = "PPP",
  timezone?: string,
): string => {
  const tz = timezone || getLocalTimezone();
  return formatInTimeZone(date, tz, formatStr);
};

/**
 * Check if two dates are the same day (ignoring time)
 * Use this for day-based comparisons
 */
export const isSameDate = (date1: Date, date2: Date): boolean => {
  return isSameDay(date1, date2);
};

/**
 * Compare dates (useful for sorting)
 * Returns negative if date1 < date2, positive if date1 > date2, 0 if equal
 */
export const compareDates = (date1: Date, date2: Date): number => {
  if (isBefore(date1, date2)) return -1;
  if (isAfter(date1, date2)) return 1;
  return 0;
};

/**
 * Add time to a date
 * Use these instead of manual millisecond arithmetic
 */
export const addTime = {
  days: (date: Date, amount: number): Date => addDays(date, amount),
  hours: (date: Date, amount: number): Date => addHours(date, amount),
  minutes: (date: Date, amount: number): Date => addMinutes(date, amount),
  seconds: (date: Date, amount: number): Date => addSeconds(date, amount),
  milliseconds: (date: Date, amount: number): Date => addMilliseconds(date, amount),
};

/**
 * Subtract time from a date
 * Use these instead of manual millisecond arithmetic
 */
export const subtractTime = {
  days: (date: Date, amount: number): Date => subDays(date, amount),
  hours: (date: Date, amount: number): Date => addHours(date, -amount),
  minutes: (date: Date, amount: number): Date => addMinutes(date, -amount),
  seconds: (date: Date, amount: number): Date => addSeconds(date, -amount),
  milliseconds: (date: Date, amount: number): Date => addMilliseconds(date, -amount),
};

/**
 * Calculate differences between dates
 * Use these instead of manual time calculations
 */
export const dateDifference = {
  inSeconds: (laterDate: Date, earlierDate: Date): number => 
    differenceInSeconds(laterDate, earlierDate),
  inMinutes: (laterDate: Date, earlierDate: Date): number => 
    differenceInMinutes(laterDate, earlierDate),
  inHours: (laterDate: Date, earlierDate: Date): number => 
    differenceInHours(laterDate, earlierDate),
  inDays: (laterDate: Date, earlierDate: Date): number => 
    differenceInDays(laterDate, earlierDate),
  inWeeks: (laterDate: Date, earlierDate: Date): number => 
    differenceInWeeks(laterDate, earlierDate),
  inMonths: (laterDate: Date, earlierDate: Date): number => 
    differenceInMonths(laterDate, earlierDate),
  inYears: (laterDate: Date, earlierDate: Date): number => 
    differenceInYears(laterDate, earlierDate),
};