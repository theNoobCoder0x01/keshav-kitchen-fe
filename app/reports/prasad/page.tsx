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

// Format a single ingredient: "name - qty unit"
function formatIngredient(ing: { name: string; quantity: number; unit: string }) {
  return `${ing.name} - ${formatDecimal(ing.quantity)} ${ing.unit}`;
}

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
                        {/* Recipe / custom name (if present) */}
                        {item.recipeName && (
                          <span className="font-semibold">
                            {item.recipeName}
                          </span>
                        )}

                        {/* Ingredient groups */}
                        {item.ingredientGroups.map(
                          (group: any, gi: number) => {
                            if (group.ingredients.length === 0) return null;

                            const ingLine = group.ingredients
                              .map(formatIngredient)
                              .join(", ");

                            const isUngrouped = group.name === "Ungrouped";

                            return (
                              <div
                                key={group.id ?? group.name}
                                className={gi === 0 && item.recipeName ? "mt-0" : ""}
                              >
                                {/* For the first ungrouped group when there's a recipe name,
                                    show on the same conceptual line with a separator */}
                                {isUngrouped ? (
                                  <span>
                                    {item.recipeName ? (
                                      <span className="text-gray-500"> - </span>
                                    ) : null}
                                    {ingLine}
                                  </span>
                                ) : (
                                  <div className="mt-0.5">
                                    <span className="font-semibold text-gray-700">
                                      {group.name}:{" "}
                                    </span>
                                    {ingLine}
                                  </div>
                                )}
                              </div>
                            );
                          },
                        )}

                        {/* Fallback when no ingredients at all */}
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
