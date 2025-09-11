import api from "@/lib/api/axios";
import { getCurrentDateUTC } from "@/lib/utils/date";
import { endOfDay, startOfDay } from "date-fns";
import { useEffect, useState } from "react";

interface TithiInfo {
  tithi?: string;
  eventSummary?: string[];
  eventsCount: number;
  isLoading: boolean;
  error?: string;
}

export function useTithi(date?: Date): TithiInfo {
  const [tithiInfo, setTithiInfo] = useState<TithiInfo>({
    eventsCount: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchTithi = async () => {
      setTithiInfo((prev) => ({ ...prev, isLoading: true, error: undefined }));

      try {
        const targetDate = date || getCurrentDateUTC(); // Use UTC for consistency
        const startEpochMs = startOfDay(targetDate).getTime();
        const endEpochMs = endOfDay(targetDate).getTime();
        const params = new URLSearchParams({
          startEpochMs: startEpochMs.toString(),
          endEpochMs: endEpochMs.toString(),
        });

        const response = await api.get(`/calendar/tithi/?${params}`);
        const data = await response.data;

        if (!response.status.toString().startsWith("2") || !data.success) {
          throw new Error(data.message || "Failed to fetch tithi information");
        }

        setTithiInfo({
          tithi: data.data.tithi,
          eventSummary: data.data.eventSummary,
          eventsCount: data.data.eventsCount || 0,
          isLoading: false,
        });

        if (!data.success) {
          setTithiInfo({
            eventsCount: 0,
            isLoading: false,
            error: "No tithi information available",
          });
        }
      } catch (error) {
        console.error("Error fetching tithi:", error);
        setTithiInfo({
          eventsCount: 0,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    fetchTithi();
  }, [date]);

  return tithiInfo;
}

export function useTodayTithi(): TithiInfo {
  return useTithi(getCurrentDateUTC()); // Use UTC current date
}
