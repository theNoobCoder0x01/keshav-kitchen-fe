export interface CalendarEventBase {
  id?: string;
  uid?: string;
  summary: string;
  description?: string | null;
  startDate: Date | string;
  endDate?: Date | string;
  location?: string | null;
  url?: string | null;
}

export interface ParsedICSData {
  events: CalendarEventBase[];
  tithi?: string;
}
