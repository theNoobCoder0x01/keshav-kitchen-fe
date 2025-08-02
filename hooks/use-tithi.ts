import { useEffect, useState } from 'react';

interface TithiInfo {
  tithi?: string;
  eventSummary?: string;
  eventsCount: number;
  isLoading: boolean;
  error?: string;
}

export function useTithi(date?: Date, kitchenId?: string): TithiInfo {
  const [tithiInfo, setTithiInfo] = useState<TithiInfo>({
    eventsCount: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchTithi = async () => {
      setTithiInfo(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      try {
        const targetDate = date || new Date();
        const dateStr = targetDate.toISOString().split('T')[0];
        
        const params = new URLSearchParams({
          date: dateStr,
          ...(kitchenId && { kitchenId }),
        });

        const response = await fetch(`/api/calendar/tithi?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tithi information');
        }

        const data = await response.json();
        
        if (data.success) {
          setTithiInfo({
            tithi: data.tithi,
            eventSummary: data.eventSummary,
            eventsCount: data.eventsCount || 0,
            isLoading: false,
          });
        } else {
          setTithiInfo({
            eventsCount: 0,
            isLoading: false,
            error: 'No tithi information available',
          });
        }
      } catch (error) {
        console.error('Error fetching tithi:', error);
        setTithiInfo({
          eventsCount: 0,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    fetchTithi();
  }, [date, kitchenId]);

  return tithiInfo;
}

export function useTodayTithi(kitchenId?: string): TithiInfo {
  return useTithi(new Date(), kitchenId);
}