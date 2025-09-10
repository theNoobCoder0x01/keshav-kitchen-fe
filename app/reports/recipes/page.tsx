"use client";

import RecipeIcon from "@/components/icons/recipe-icon";
import { useTithi } from "@/hooks/use-tithi";
import { fetchReportData } from "@/lib/api/reports";
import { epochToDate, formatEpochToDate } from "@/lib/utils/date";
import { Calendar } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";

export default function RecipesReport() {
  const [data, setData] = useState<any[]>([]);

  const searchParams = useSearchParams();

  const epochMs = parseInt(searchParams.get("epochMs") ?? "");
  const date = useMemo(() => epochToDate(epochMs), [epochMs]);
  const currentEventInfo = useTithi(date);

  const loadData = useCallback(async () => {
    try {
      if (epochMs) {
        const recipesData = await fetchReportData({
          type: "recipes",
          epochMs,
        });
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

  return (
    <div className="bg-transparent">
      <div className="bg-transparent flex flex-col w-full overflow-x-hidden min-h-full">
        <div className="px-4 py-2 print:pt-0 flex items-center justify-between border-b border-accent-foreground">
          <div className="flex items-center space-x-1 h-15">
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logo.svg`}
              alt="Keshav Kitchen"
              width="20"
              height="10"
              className="w-auto h-4/5"
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
                <div className="flex flex-col max-w-[400px] gap-1 font-bold text-xs text-muted-foreground">
                  {currentEventInfo?.eventSummary?.map((summary, index) => (
                    <span key={index}>{summary}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-2 flex flex-col mt-[77px] gap-3">
          {data.map((recipe) => (
            <div className="bg-secondary rounded p-3 flex flex-col gap-3 break-inside-avoid">
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

              <div className="flex flex-col gap-3">
                {recipe.ingredientGroups.map((group: any) => (
                  <div key={group.name}>
                    <h3 className="font-bold text-sm text-primary mb-2">
                      {group.name}
                    </h3>
                    <div className="grid grid-cols-3 gap-x-10 gap-y-1 text-sm text-muted-foreground font-bold">
                      {group.ingredients.map((ingredient: any) => (
                        <div
                          key={`${ingredient.name}-${ingredient.unit}`}
                          className="flex items-center justify-between pb-1 border-b border-dashed border-muted-foreground break-inside-avoid"
                        >
                          <div>{ingredient.name}</div>
                          <div>
                            {ingredient.quantity} {ingredient.unit}
                          </div>
                        </div>
                      ))}
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
