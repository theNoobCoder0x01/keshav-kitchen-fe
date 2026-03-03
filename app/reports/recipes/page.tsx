"use client";

import RecipeIcon from "@/components/icons/recipe-icon";
import { useTithi } from "@/hooks/use-tithi";
import { fetchReportData } from "@/lib/api/reports";
import { formatDecimal } from "@/lib/utils";
import { epochToDate, formatEpochToDate } from "@/lib/utils/date";
import { Calendar } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";

export default function RecipesReport() {
  const [data, setData] = useState<any[]>([]);

  const searchParams = useSearchParams();

  const epochMs = parseInt(searchParams.get("epochMs") ?? "");
  const compact = searchParams.get("compact") === "true";
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
  }, [epochMs]);

  useLayoutEffect(() => {
    loadData();
  }, [loadData]);

  const header = (
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
  );

  if (compact) {
    return (
      <div className="bg-transparent">
        <div className="bg-transparent flex flex-col w-full overflow-x-hidden min-h-full text-xs">
          {header}
          <div className="px-2 pt-2 flex flex-col gap-3">
            {data.map((kitchen) => (
              <div key={kitchen.kitchenName} className="flex flex-col gap-1">
                <h1 className="text-sm font-extrabold text-primary border-b border-primary pb-0.5">
                  {kitchen.kitchenName}
                </h1>
                {kitchen.mealTypes.map((mealType: any) => (
                  <div key={mealType.mealType} className="flex flex-col gap-1">
                    <h2 className="text-xs font-bold text-secondary-foreground pl-1 border-l-2 border-secondary">
                      {mealType.mealType}
                    </h2>
                    {mealType.recipes.map((recipe: any) => (
                      <div
                        key={recipe.recipeId}
                        className="border border-muted-foreground/30 rounded px-2 py-1 flex flex-col gap-1 break-inside-avoid"
                      >
                        <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/50 pb-0.5">
                          <span className="font-bold flex gap-1 items-center">
                            {recipe.menuComponents.length > 0 && (
                              <span className="text-primary">
                                [{recipe.menuComponents.join(", ")}]
                              </span>
                            )}
                            {recipe.recipeName}
                          </span>
                          <span className="flex gap-2 text-muted-foreground font-medium">
                            <span>
                              Ghan:{" "}
                              <span className="font-bold text-foreground">
                                {formatDecimal(recipe.ghanFactor)}
                              </span>
                            </span>
                            {recipe.preparedQuantity > 0 && (
                              <span>
                                Qty:{" "}
                                <span className="font-bold text-foreground">
                                  {formatDecimal(recipe.preparedQuantity)}{" "}
                                  {recipe.preparedQuantityUnit}
                                </span>
                              </span>
                            )}
                          </span>
                        </div>
                        {recipe.ingredientGroups.map((group: any) => (
                          <div key={group.name}>
                            {group.name !== "Ungrouped" && (
                              <span className="font-semibold text-primary">
                                {group.name}:{" "}
                              </span>
                            )}
                            <div className="grid grid-cols-4 gap-x-4 gap-y-0.5 text-muted-foreground">
                              {group.ingredients.map((ingredient: any) => (
                                <div
                                  key={`${ingredient.name}-${ingredient.unit}`}
                                  className="flex items-center justify-between border-b border-dotted border-muted-foreground/40"
                                >
                                  <span>{ingredient.name}</span>
                                  <span className="font-medium">
                                    {formatDecimal(ingredient.quantity)}{" "}
                                    {ingredient.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      <div className="bg-transparent flex flex-col w-full overflow-x-hidden min-h-full">
        {header}

        <div className="px-2 pt-3 flex flex-col gap-6">
          {data.map((kitchen) => (
            <div
              key={kitchen.kitchenName}
              className="flex flex-col gap-4 break-inside-avoid"
            >
              <h1 className="text-xl font-extrabold text-primary border-b-2 border-primary pb-1">
                {kitchen.kitchenName}
              </h1>
              {kitchen.mealTypes.map((mealType: any) => (
                <div key={mealType.mealType} className="flex flex-col gap-3">
                  <h2 className="text-lg font-bold text-secondary-foreground pl-2 border-l-4 border-secondary">
                    {mealType.mealType}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {mealType.recipes.map((recipe: any) => (
                      <div
                        key={recipe.recipeId}
                        className="bg-secondary rounded p-3 flex flex-col gap-3 break-inside-avoid"
                      >
                        <div className="flex items-center justify-between border-b-2 border-muted-foreground pb-2">
                          <h2 className="flex gap-2 font-extrabold">
                            <RecipeIcon />
                            <span>
                              {recipe.menuComponents.length > 0 && (
                                <span className="text-primary mr-1">
                                  [{recipe.menuComponents.join(", ")}]
                                </span>
                              )}
                              {recipe.recipeName}
                            </span>
                          </h2>
                          <div className="flex gap-4 font-medium text-xs text-accent-foreground">
                            <div>
                              Total Ghan:{" "}
                              <span className="font-bold text-sm">
                                {formatDecimal(recipe.ghanFactor)}
                              </span>
                            </div>
                            {recipe.preparedQuantity > 0 && (
                              <div>
                                Prepared Qty:{" "}
                                <span className="font-bold text-sm">
                                  {formatDecimal(recipe.preparedQuantity)}{" "}
                                  {recipe.preparedQuantityUnit}
                                </span>
                              </div>
                            )}
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
                                      {formatDecimal(ingredient.quantity)}{" "}
                                      {ingredient.unit}
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
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
