# Tithi Integration Guide

## Overview

This guide documents the implementation of tithi (Gujarati lunar calendar) information display throughout the application. The system automatically extracts and displays tithi information from calendar events below the date in date selectors.

## Features Implemented

### 1. Tithi API Endpoint
**Endpoint**: `GET /api/calendar/tithi`

**Parameters**:
- `date` (optional): Date in YYYY-MM-DD format. Defaults to today if not provided.
- `kitchenId` (optional): Kitchen ID for filtering events. Uses user's kitchen if not provided.

**Response**:
```json
{
  "success": true,
  "date": "2024-12-01",
  "tithi": "sud panam",
  "eventSummary": "Pagan Sud Panam",
  "eventsCount": 1,
  "events": [...] 
}
```

**Features**:
- Extracts tithi from event summaries and descriptions
- Fallback to event summary if no tithi pattern found
- Supports multiple events on same date
- Returns full event details for additional context

### 2. DateSelector Integration
The DateSelector component now automatically displays tithi information below the selected date.

**Location**: `components/ui/date-selector.tsx`

**Features**:
- Real-time tithi fetching when date changes
- Automatic fallback to default subtitle if no tithi available
- Kitchen-specific tithi information
- Loading states during API calls

**Display Logic**:
1. If tithi found → Display tithi
2. Else if event summary exists → Display event summary  
3. Else → Display fallback subtitle

### 3. Custom Hook - useTithi
**Location**: `hooks/use-tithi.ts`

**Usage**:
```typescript
import { useTithi, useTodayTithi } from '@/hooks/use-tithi';

// For specific date
const { tithi, eventSummary, isLoading, error } = useTithi(date, kitchenId);

// For today
const todayTithi = useTodayTithi(kitchenId);
```

**Returns**:
```typescript
interface TithiInfo {
  tithi?: string;
  eventSummary?: string;
  eventsCount: number;
  isLoading: boolean;
  error?: string;
}
```

### 4. Reusable TithiDisplay Component
**Location**: `components/ui/tithi-display.tsx`

**Usage**:
```tsx
import { TithiDisplay, TodayTithi } from '@/components/ui/tithi-display';

// For specific date
<TithiDisplay 
  date={selectedDate} 
  kitchenId={kitchenId}
  showIcon={true}
  size="md" 
/>

// For today
<TodayTithi kitchenId={kitchenId} />
```

**Props**:
- `date?: Date` - Date to fetch tithi for
- `kitchenId?: string` - Kitchen ID for filtering
- `className?: string` - Additional CSS classes
- `showIcon?: boolean` - Show calendar icon (default: false)
- `size?: "sm" | "md" | "lg"` - Text size

## Tithi Extraction Logic

The system recognizes various Gujarati tithi patterns:

### Primary Patterns
- Sud/Shukla (Waxing moon) patterns: `sud panam`, `shukla paksha`
- Vad/Krishna (Waning moon) patterns: `vad panam`, `krishna paksha`  
- Special days: `purnima`, `amavasya`, `ekadashi`

### Tithi Names Recognized
- `pratipada`, `dwitiya`, `tritiya`, `chaturthi`, `panchami`
- `shashthi`, `saptami`, `ashtami`, `navami`, `dashami`
- `ekadashi`, `dwadashi`, `trayodashi`, `chaturdashi`
- `purnima` (full moon), `amavasya` (new moon)

### Fallback Logic
If no specific tithi pattern is found but the event summary contains Gujarati keywords, the entire summary is used as the tithi.

## Integration Points

### 1. Main Dashboard
**File**: `app/page.tsx`
- DateSelector displays tithi below the selected date
- Updates automatically when changing dates or kitchen tabs

### 2. Reports Dialog  
**File**: `components/dialogs/reports-generation-dialog.tsx`
- DateSelector shows tithi for report date selection
- Helps users correlate reports with lunar calendar events

### 3. Settings Dialog
**File**: `components/dialogs/settings-dialog.tsx`
- Shows information about tithi functionality
- Explains how calendar upload affects tithi display

## Database Requirements

### Calendar Events Table
Events must be stored with these fields for tithi extraction:
```sql
CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY,
  uid TEXT UNIQUE,
  summary TEXT NOT NULL,
  description TEXT,
  start_date DATETIME NOT NULL,
  end_date DATETIME,
  location TEXT,
  user_id TEXT NOT NULL,
  kitchen_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Required Indexes
```sql
CREATE INDEX idx_calendar_events_kitchen_date ON calendar_events(kitchen_id, start_date);
CREATE INDEX idx_calendar_events_user ON calendar_events(user_id);
```

## Sample Calendar Data

For testing, the system works with events like:

```ics
BEGIN:VEVENT
UID:20241201-001@kitchen.com
DTSTART:20241201T000000Z
DTEND:20241201T235959Z
SUMMARY:Pagan Sud Panam
DESCRIPTION:Gujarati tithi - Pagan Sud Panam (Waxing Moon)
LOCATION:Kitchen
END:VEVENT
```

## Error Handling

### API Level
- Authentication validation
- Kitchen association checks  
- Date parameter validation
- Database error handling
- Graceful fallbacks

### Component Level
- Loading states during API calls
- Error messages for failed requests
- Fallback to default text when no tithi available
- Network error recovery

## Performance Considerations

### Optimizations Implemented
1. **Caching**: React hooks automatically cache results
2. **Debouncing**: Date changes are handled efficiently  
3. **Minimal API Calls**: Only fetch when date/kitchen changes
4. **Database Indexing**: Optimized queries for date ranges

### Monitoring Points
- API response times for tithi endpoint
- Database query performance for date-based lookups
- Component re-render frequency

## Testing Strategy

### Unit Tests
- Tithi extraction patterns
- Date handling logic
- Error scenarios
- Fallback behavior

### Integration Tests  
- API endpoint functionality
- Component integration with hooks
- DateSelector tithi display
- Multi-kitchen scenarios

### Manual Testing
1. Upload calendar with tithi events
2. Navigate between dates
3. Switch between kitchens
4. Test with no events
5. Test with non-tithi events

## Future Enhancements

### Planned Features
- Lunar calendar visualization
- Tithi-based event filtering
- Multiple language support for tithi names
- Advanced tithi calculations
- Recurring tithi event generation

### API Extensions
- Bulk tithi queries for date ranges
- Tithi calendar export functionality  
- Historical tithi data analysis
- Tithi-based notifications

## Troubleshooting

### Common Issues

**Tithi not displaying**:
1. Check if calendar events exist for the date
2. Verify event summaries contain recognizable patterns
3. Ensure user has proper kitchen association
4. Check API authentication

**Incorrect tithi extraction**:
1. Review event summary format
2. Check tithi pattern matching logic
3. Verify description field content
4. Test with known good data

**Performance issues**:
1. Check database indexes
2. Monitor API response times  
3. Verify efficient date queries
4. Review component re-render patterns

### Debug Tools
- Browser network tab for API calls
- Console logs for extraction logic
- Database query analysis
- Component state inspection

## Migration Guide

### From Previous Implementation
1. Update DateSelector imports
2. Replace event fetching with tithi API
3. Update prop interfaces if needed
4. Test all date selection flows

### Database Migration
```sql
-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_calendar_events_kitchen_date 
ON calendar_events(kitchen_id, start_date);

-- Update any existing data format issues
UPDATE calendar_events 
SET summary = TRIM(summary)
WHERE summary != TRIM(summary);
```

This implementation provides a robust foundation for displaying Gujarati tithi information throughout the application while maintaining good performance and user experience.