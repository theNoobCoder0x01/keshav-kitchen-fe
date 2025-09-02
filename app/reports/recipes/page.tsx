"use client";

import RecipeIcon from "@/components/icons/recipe-icon";
import api from "@/lib/api/axios";
import { formatEpochToDate } from "@/lib/utils/date";
import { Calendar } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export default function RecipesReport() {
  const [data, setData] = useState<any[]>([]);
  const [currentEventInfo, setCurrentEventInfo] = useState<{
    tithi?: string;
    eventSummary?: string;
  }>({});

  const searchParams = useSearchParams();

  const epochMs = parseInt(searchParams.get("epochMs") ?? "");

  const loadData = useCallback(async () => {
    try {
      if (epochMs) {
        const recipesData = [] as any;
        setData(recipesData);
      } else {
        console.error("Timestamp is required.");
      }
    } catch (error) {
      console.error("Failed to load kitchens:", error);
    }
  }, []);

  useLayoutEffect(() => {
    loadData();
  }, []);

  // Fetch tithi information for the selected date
  useEffect(() => {
    const fetchTithiInfo = async () => {
      try {
        const params = new URLSearchParams({
          epochMs: epochMs.toString(),
        });

        const response = await api.get(`/calendar/tithi?${params}`);
        const data = await response.data;

        if (
          (response.status === 200 || response.status === 201) &&
          data.success
        ) {
          setCurrentEventInfo({
            tithi: data.data.tithi,
            eventSummary: data.data.eventSummary,
          });
        } else {
          setCurrentEventInfo({});
        }
      } catch (error) {
        console.error("Error fetching tithi information:", error);
        setCurrentEventInfo({});
      }
    };

    fetchTithiInfo();
  }, [epochMs]);

  return (
    <div className="bg-transparent">
      <div className="bg-transparent p-6 flex flex-col gap-5 w-full overflow-x-hidden min-h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 h-15">
            <Image
              src="/prod/logo.svg"
              alt="Keshav Kitchen"
              width="20"
              height="10"
              className="w-auto h-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="bg-secondary rounded-full flex items-center justify-center p-2">
                <Calendar className="size-6 text-primary" />
              </div>
              <div className="p-1">
                <div className="font-extrabold text-sm">
                  {formatEpochToDate(epochMs, "EEEE, d, LLL yyyy")}
                </div>
                <div className="font-bold text-xs text-muted-foreground">
                  {currentEventInfo?.eventSummary ?? "Fagan Sud Punam"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {data.map((recipe) => (
            <div className="bg-secondary rounded p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b-2 border-muted-foreground pb-2">
                <h2 className="flex gap-2 font-extrabold">
                  <RecipeIcon />
                  {recipe.recipeName}
                </h2>
                <div className="font-medium text-xs text-accent-foreground">
                  Total Ghan:{" "}
                  <span className="font-bold text-sm">{recipe.ghanFactor}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-x-10 gap-y-1 text-sm text-muted-foreground font-bold">
                {recipe.ingredients.map((ingredient: any) => (
                  <div className="flex items-center justify-between pb-1 border-b border-dashed border-muted-foreground">
                    <div>{ingredient.name}</div>
                    <div>
                      {ingredient.quantity * recipe.ghanFactor}{" "}
                      {ingredient.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
