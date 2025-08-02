export interface CalendarEvent {
  summary: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  uid?: string;
}

export interface ParsedICSData {
  events: CalendarEvent[];
  tithi?: string;
}

/**
 * Parse ICS file content and extract events for a specific date
 */
export function parseICSFile(icsContent: string, targetDate: Date): ParsedICSData {
  const events: CalendarEvent[] = [];
  let tithi: string | undefined;

  // Split the ICS content into individual events
  const eventBlocks = icsContent.split('BEGIN:VEVENT');
  
  for (const block of eventBlocks) {
    if (!block.trim()) continue;
    
    const event = parseEventBlock(block);
    if (event && isEventOnDate(event, targetDate)) {
      events.push(event);
      
      // Look for tithi information in the event summary or description
      if (!tithi) {
        tithi = extractTithi(event.summary, event.description);
      }
    }
  }

  return { events, tithi };
}

/**
 * Parse a single VEVENT block from ICS content
 */
function parseEventBlock(block: string): CalendarEvent | null {
  const lines = block.split('\n');
  let summary = '';
  let description = '';
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let location = '';
  let uid = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('SUMMARY:')) {
      summary = trimmedLine.substring(8);
    } else if (trimmedLine.startsWith('DESCRIPTION:')) {
      description = trimmedLine.substring(12);
    } else if (trimmedLine.startsWith('UID:')) {
      uid = trimmedLine.substring(4);
    } else if (trimmedLine.startsWith('DTSTART')) {
      const dateStr = extractDateFromLine(trimmedLine);
      startDate = parseICSDate(dateStr);
    } else if (trimmedLine.startsWith('DTEND')) {
      const dateStr = extractDateFromLine(trimmedLine);
      endDate = parseICSDate(dateStr);
    } else if (trimmedLine.startsWith('LOCATION:')) {
      location = trimmedLine.substring(9);
    }
  }

  if (!startDate) return null;

  return {
    summary,
    description,
    startDate,
    endDate: endDate || undefined,
    location,
    uid,
  };
}

/**
 * Extract date string from DTSTART or DTEND line
 */
function extractDateFromLine(line: string): string {
  // Handle formats like:
  // DTSTART;VALUE=DATE:20250101
  // DTSTART:20250101T000000Z
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return '';
  
  return line.substring(colonIndex + 1);
}

/**
 * Parse ICS date format (YYYYMMDDTHHMMSSZ or YYYYMMDD)
 */
function parseICSDate(dateStr: string): Date | null {
  try {
    // Handle different ICS date formats
    if (dateStr.includes('T')) {
      // Format: YYYYMMDDTHHMMSSZ
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
      const day = parseInt(dateStr.substring(6, 8));
      const hour = parseInt(dateStr.substring(9, 11));
      const minute = parseInt(dateStr.substring(11, 13));
      const second = parseInt(dateStr.substring(13, 15));
      
      return new Date(year, month, day, hour, minute, second);
    } else {
      // Format: YYYYMMDD
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      
      return new Date(year, month, day);
    }
  } catch (error) {
    console.error('Error parsing ICS date:', dateStr, error);
    return null;
  }
}

/**
 * Check if an event occurs on the target date
 */
function isEventOnDate(event: CalendarEvent, targetDate: Date): boolean {
  const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const targetEnd = new Date(targetStart.getTime() + 24 * 60 * 60 * 1000);
  
  const eventStart = new Date(event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate());
  const eventEnd = event.endDate 
    ? new Date(event.endDate.getFullYear(), event.endDate.getMonth(), event.endDate.getDate())
    : eventStart;

  return eventStart < targetEnd && eventEnd >= targetStart;
}

/**
 * Extract tithi information from event summary or description
 */
function extractTithi(summary: string, description?: string): string | undefined {
  const text = `${summary} ${description || ''}`.toLowerCase();
  
  // Common Gujarati tithi patterns
  const tithiPatterns = [
    /(sud|shukla|waxing)\s+(panam|paksha|fortnight)/i,
    /(vad|krishna|waning)\s+(panam|paksha|fortnight)/i,
    /(purnima|full moon)/i,
    /(amavasya|new moon)/i,
    /(ekadashi|ekadasi)/i,
    /(chaturdashi|chaturdasi)/i,
    /(ashtami|ashtmi)/i,
    /(navami|navmi)/i,
    /(dashami|dashmi)/i,
    /(trayodashi|trayodasi)/i,
    /(dwadashi|dwadasi)/i,
    /(saptami|saptmi)/i,
    /(shashthi|shashthi)/i,
    /(panchami|panchmi)/i,
    /(chaturthi|chaturthi)/i,
    /(tritiya|tritya)/i,
    /(dwitiya|dwitya)/i,
    /(pratipada|pratipad)/i,
    /(bij|trij|choth|panchmi|chhath|saptami|ashtami|navami|dashami|gyaras|baras|teras|chaudas|purnima)/i,
  ];

  for (const pattern of tithiPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
}

/**
 * Get a formatted summary of events for a specific date
 */
export function getEventSummary(events: CalendarEvent[]): string {
  if (events.length === 0) return '';
  
  if (events.length === 1) {
    return events[0].summary;
  }
  
  // For multiple events, create a summary
  const summaries = events.map(event => event.summary);
  return summaries.join(', ');
}