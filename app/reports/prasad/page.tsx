"use client";

import { useTithi } from "@/hooks/use-tithi";
import { fetchReportData } from "@/lib/api/reports";
import { formatDecimal } from "@/lib/utils";
import { epochToDate, formatEpochToDate } from "@/lib/utils/date";
import { useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

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
                <span className="font-normal text-gray-600">તારીખ -</span>{" "}
                {formatEpochToDate(epochMs, "dd-MMM-yyyy")}
              </span>
              <span>
                <span className="font-normal text-gray-600">વાર -</span>{" "}
                {formatEpochToDate(epochMs, "EEEE")}
              </span>
              {currentEventInfo?.eventSummary &&
                currentEventInfo.eventSummary.length > 0 && (
                  <span>
                    <span className="font-normal text-gray-600">તિથિ -</span>{" "}
                    {currentEventInfo.eventSummary.join("  ")}
                  </span>
                )}
            </div>

            {/* ── Meal type sections ── */}
            {kitchen.mealTypes.map((mealType: any) => (
              <div key={mealType.mealType} className="mb-4 mx-4">
                {/* Meal header — gray bar */}
                <div className="bg-gray-300 border border-gray-500 px-4 py-1 font-bold text-lg mb-0">
                  {mealType.mealType.charAt(0).toUpperCase() +
                    mealType.mealType.toLowerCase().slice(1)}
                </div>

                {/* Items */}
                <div className="border border-t-0 border-gray-500">
                  {(() => {
                    // Max character count among all component labels in this meal section
                    // (including "અન્ય") so every row's label column aligns uniformly.
                    const maxComponentLabelChars = mealType.items.reduce(
                      (max: number, item: any) =>
                        Math.max(
                          max,
                          String(item.menuComponentLabel).length,
                        ),
                      0,
                    );
                    const componentLabelWidth =
                      maxComponentLabelChars > 0
                        ? `${maxComponentLabelChars}ch`
                        : undefined;

                    return mealType.items.map((item: any, idx: number) => {
                      // Max character count among named groups for this item —
                      // used to size the group-name column consistently within the item.
                      const maxGroupNameChars = item.ingredientGroups
                        .filter(
                          (g: any) =>
                            g.name !== "Ungrouped" && g.ingredients.length > 0,
                        )
                        .reduce(
                          (max: number, g: any) =>
                            Math.max(max, String(g.name).length),
                          0,
                        );
                      const groupLabelWidth =
                        maxGroupNameChars > 0
                          ? `${maxGroupNameChars}ch`
                          : undefined;

                      const hasIngredients = item.ingredientGroups.some(
                        (g: any) => g.ingredients.length > 0,
                      );
                      const showGhan =
                        item.followRecipe && item.ghanFactor !== 1;

                      return (
                        <div
                          key={item.menuId}
                          className={`text-sm break-inside-avoid ${idx !== 0 ? "border-t border-gray-500" : ""}`}
                        >
                          {/* ── Header row: label | recipe name + ghan/qty ── */}
                          <div className="flex items-baseline gap-0 px-4 py-1.5 bg-gray-200 border-b border-gray-500 border-dashed">
                            {/* Component label */}
                            <div
                              className="shrink-0 font-bold text-[#8B0000] pr-3 leading-snug"
                              style={{
                                width: componentLabelWidth,
                                minWidth: componentLabelWidth,
                              }}
                            >
                              {item.menuComponentLabel}
                            </div>

                            {/* Recipe name */}
                            <div className="flex flex-1 items-baseline justify-between gap-4">
                              {item.recipeName ? (
                                <span className="font-semibold text-[#8B0000]">
                                  {item.recipeName}
                                </span>
                              ) : (
                                <span />
                              )}

                              {/* Ghan + prepared qty — right-aligned */}
                              <span className="flex items-center gap-3 text-xs text-gray-600 whitespace-nowrap shrink-0">
                                {item.followRecipe && (
                                  <span>
                                    <span className="font-medium text-gray-500">
                                      Ghan:
                                    </span>{" "}
                                    <span className="font-bold text-black">
                                      {formatDecimal(item.ghanFactor)}
                                    </span>
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* ── Ingredient body: spacer (= label width) + groups ── */}
                          {(hasIngredients ||
                            (!item.recipeName && !hasIngredients)) && (
                            <div className="flex gap-0 px-4 py-1.5">
                              {/* Spacer matching component label width so grid aligns under recipe name */}
                              <div
                                className="shrink-0 pr-3 font-bold"
                                style={{
                                  width: componentLabelWidth,
                                  minWidth: componentLabelWidth,
                                }}
                              />

                              <div className="flex-1 flex flex-col gap-2">
                                {hasIngredients ? (
                                  item.ingredientGroups.map((group: any) => {
                                    if (group.ingredients.length === 0)
                                      return null;
                                    const isUngrouped =
                                      group.name === "Ungrouped";

                                    return (
                                      <div
                                        key={group.id ?? group.name}
                                        className="flex items-start gap-3"
                                      >
                                        {/* Group name — only for named groups */}
                                        {!isUngrouped && (
                                          <div
                                            className="shrink-0 font-semibold text-sm leading-tight pt-0.5"
                                            style={{
                                              width: groupLabelWidth,
                                              minWidth: groupLabelWidth,
                                            }}
                                          >
                                            {group.name}:
                                          </div>
                                        )}

                                        {/* Ingredient grid */}
                                        <div className="flex-1 grid grid-cols-3 gap-x-12 gap-y-2 text-xs">
                                          {group.ingredients.map((ing: any) => {
                                            const actualQty = showGhan
                                              ? ing.quantity * item.ghanFactor
                                              : ing.quantity;
                                            return (
                                              <div
                                                key={`${ing.name}-${ing.unit}`}
                                                className="flex items-center justify-between pb-0.5 border-b border-dashed border-gray-400"
                                              >
                                                <span>{ing.name}</span>
                                                <span className="font-medium ml-3 whitespace-nowrap">
                                                  {formatDecimal(actualQty)}{" "}
                                                  {ing.unit}
                                                  {showGhan && (
                                                    <span className="text-gray-600 font-normal ml-1">
                                                      (
                                                      {formatDecimal(
                                                        ing.quantity,
                                                      )}
                                                      )
                                                    </span>
                                                  )}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <span className="italic text-gray-400">
                                    —
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
