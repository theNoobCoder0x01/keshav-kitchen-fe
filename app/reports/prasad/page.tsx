"use client";

import { useTithi } from "@/hooks/use-tithi";
import { fetchReportData } from "@/lib/api/reports";
import { formatDecimal } from "@/lib/utils";
import { epochToDate, formatEpochToDate } from "@/lib/utils/date";
import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useLayoutEffect, useMemo, useState } from "react";

// ─── Gujarati meal-type labels matching the PDF ──────────────────────────────
const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};


export default function PrasadReport() {
  const [data, setData] = useState<any[]>([]);
  const searchParams = useSearchParams();

  const epochMs = parseInt(searchParams.get("epochMs") ?? "");
  const date = useMemo(() => epochToDate(epochMs), [epochMs]);
  const currentEventInfo = useTithi(date);

  const loadData = useCallback(async () => {
    try {
      if (epochMs) {
        const reportData = await fetchReportData({ type: "prasad", epochMs });
        setData(reportData);
      }
    } catch (error) {
      console.error("Failed to load prasad report:", error);
    }
  }, [epochMs]);

  useLayoutEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="bg-white text-black font-sans">
      {data.map((kitchen: any, kitchenIndex: number) => (
        <Fragment key={kitchen.kitchenName}>
          {/* ── Page wrapper ── */}
          <div className={kitchenIndex > 0 ? "break-before-page" : ""}>

            {/* ── Header ── */}
            <div className="text-center py-3 px-4">
              <h1 className="text-2xl font-extrabold text-[#8B0000] leading-tight">
                {kitchen.kitchenName}
              </h1>
            </div>

            {/* ── Date / Weekday / Tithi bar ── */}
            <div className="border border-gray-500 mx-4 px-4 py-1.5 flex flex-wrap items-center gap-x-8 gap-y-1 text-sm font-bold mb-3">
              <span>
                <span className="font-normal text-gray-600">તારીખ :-</span>{" "}
                {formatEpochToDate(epochMs, "dd-MMM-yyyy")}
              </span>
              <span>
                <span className="font-normal text-gray-600">વાર :-</span>{" "}
                {formatEpochToDate(epochMs, "EEEE")}
              </span>
              {currentEventInfo?.eventSummary &&
                currentEventInfo.eventSummary.length > 0 && (
                  <span>
                    <span className="font-normal text-gray-600">તિથિ :-</span>{" "}
                    {currentEventInfo.eventSummary.join("  ")}
                  </span>
                )}
            </div>

            {/* ── Meal type sections ── */}
            {kitchen.mealTypes.map((mealType: any) => (
              <div key={mealType.mealType} className="mb-4 mx-4">

                {/* Meal header — gray bar */}
                <div className="bg-gray-300 border border-gray-500 px-4 py-1 font-bold text-sm mb-0">
                  {MEAL_LABELS[mealType.mealType] ?? mealType.mealType} :-
                </div>

                {/* Items */}
                <div className="border border-t-0 border-gray-500">
                  {mealType.items.map((item: any, idx: number) => (
                    <div
                      key={item.menuId}
                      className={`flex items-start px-4 py-1.5 text-sm break-inside-avoid ${
                        idx < mealType.items.length - 1
                          ? "border-b border-dashed border-gray-400"
                          : ""
                      }`}
                    >
                      {/* Left — component label */}
                      <div className="w-36 shrink-0 font-bold text-[#8B0000] pr-3 leading-snug">
                        {item.menuComponentLabel} :-
                      </div>

                      {/* Right — recipe name + ingredient groups */}
                      <div className="flex-1 leading-snug">
                        {/* Recipe / custom name */}
                        {item.recipeName && (
                          <div className="font-semibold mb-1">
                            {item.recipeName}
                          </div>
                        )}

                        {/* Ingredient groups */}
                        <div className="flex flex-col gap-2">
                          {item.ingredientGroups.map((group: any) => {
                            if (group.ingredients.length === 0) return null;
                            const isUngrouped = group.name === "Ungrouped";

                            return (
                              <div
                                key={group.id ?? group.name}
                                className="flex items-start gap-3"
                              >
                                {/* Group name on the left — only for named groups */}
                                {!isUngrouped && (
                                  <div className="w-24 shrink-0 font-semibold text-gray-700 text-xs leading-tight pt-0.5">
                                    {group.name}:
                                  </div>
                                )}

                                {/* Ingredient grid */}
                                <div className="flex-1 grid grid-cols-3 gap-x-12 gap-y-2 text-sm">
                                  {group.ingredients.map((ing: any) => (
                                    <div
                                      key={`${ing.name}-${ing.unit}`}
                                      className="flex items-center justify-between pb-0.5 border-b border-dashed border-gray-400"
                                    >
                                      <span>{ing.name}</span>
                                      <span className="font-medium ml-3 whitespace-nowrap">
                                        {formatDecimal(ing.quantity)}{" "}
                                        {ing.unit}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Fallback — no ingredients and no recipe name */}
                        {item.ingredientGroups.every(
                          (g: any) => g.ingredients.length === 0,
                        ) && !item.recipeName && (
                          <span className="italic text-gray-400">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
