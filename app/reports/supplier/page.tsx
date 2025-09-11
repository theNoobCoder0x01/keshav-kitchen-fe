"use client";

import BreakfastIcon from "@/components/icons/breakfast-icon";
import DinnerIcon from "@/components/icons/dinner-icon";
import LunchIcon from "@/components/icons/lunch-icon";
import { useTithi } from "@/hooks/use-tithi";
import { fetchReportData } from "@/lib/api/reports";
import { cn } from "@/lib/utils";
import { epochToDate, formatEpochToDate } from "@/lib/utils/date";
import { MealTypeEnum as MealType } from "@/types";
import { Calendar } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

export default function SupplierReport() {
  const [data, setData] = useState<any[]>([]);
  const searchParams = useSearchParams();

  const epochMs = parseInt(searchParams.get("epochMs") ?? "");
  const date = useMemo(() => epochToDate(epochMs), [epochMs]);
  const currentEventInfo = useTithi(date);

  const mealTypeIconMap = {
    [MealType.BREAKFAST]: BreakfastIcon,
    [MealType.LUNCH]: LunchIcon,
    [MealType.DINNER]: DinnerIcon,
    [MealType.SNACK]: BreakfastIcon,
  };

  const loadData = useCallback(async () => {
    try {
      if (epochMs) {
        const kitchensData = await fetchReportData({
          type: "supplier",
          epochMs,
        });
        setData(kitchensData);
      } else {
        console.error("Timestamp is required.");
      }
    } catch (error) {
      console.error("Failed to load kitchens:", error);
    }
  }, [epochMs]);

  useLayoutEffect(() => {
    loadData();
  }, [loadData, setData]);

  const structuredData = useMemo(() => {
    let modifiedData: any = {};
    data.forEach((d) => {
      if (!Object.hasOwn(modifiedData, d.kitchenId)) {
        modifiedData[d.kitchenId] = {
          kitchenId: d.kitchenId,
          kitchenName: d.kitchenName,
          mealTypes: [],
        };
      }

      modifiedData[d.kitchenId].mealTypes.push(d);
    });

    modifiedData = Object.values(modifiedData).map((kitchen: any) => {
      let modifiedKitchen: any = {};

      kitchen.mealTypes.forEach((d: any) => {
        if (!Object.hasOwn(modifiedKitchen, d.mealType)) {
          modifiedKitchen[d.mealType] = {
            mealType: d.mealType,
            recipes: [],
          };
        }

        modifiedKitchen[d.mealType].recipes.push({
          recipeId: d.recipeId,
          recipeName: d.recipeName,
          ghanFactor: d.ghanFactor,
          totalQuantity: d.totalQuantity,
        });
      });

      return { ...kitchen, mealTypes: Object.values(modifiedKitchen) };
    });

    return modifiedData;
  }, [data]);

  return (
    <div className="bg-transparent">
      <div className="bg-transparent flex flex-col w-full overflow-x-hidden min-h-full">
        {structuredData.map((kitchen: any, index: number) => (
          <Fragment key={kitchen.kitchenId}>
            <div
              className={cn(
                "px-4 py-2 print:pt-0 flex items-center justify-between border-b border-accent-foreground",
                index && "break-before-page",
              )}
            >
              <div className="flex items-center space-x-1 h-15">
                <Image
                  src="/dev/logo.svg"
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
            <div className={cn("px-2 flex flex-col")}>
              <h1 className="text-center text-2xl font-extrabold my-3">
                {kitchen.kitchenName}
              </h1>
              {kitchen.mealTypes.map((mealType: any) => {
                const MealTypeIcon =
                  mealTypeIconMap[mealType.mealType as MealType];
                return (
                  <div
                    key={mealType.mealType}
                    className="bg-secondary rounded p-3 flex flex-col gap-3 break-inside-avoid"
                  >
                    <h2 className="capitalize flex gap-2 font-extrabold border-b-2 border-muted-foreground pb-2">
                      <MealTypeIcon />
                      {mealType.mealType.toLowerCase()}
                    </h2>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm text-muted-foreground font-bold">
                      {mealType.recipes.map((recipe: any) => (
                        <div
                          key={recipe.recipeId}
                          className="flex items-center justify-between pb-1 border-b border-dashed border-muted-foreground break-inside-avoid"
                        >
                          <div>{recipe.recipeName}</div>
                          <div>{recipe.totalQuantity} Kg</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
