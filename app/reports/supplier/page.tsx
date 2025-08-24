"use client";

import BreakfastIcon from "@/components/icons/breakfast-icon";
import DinnerIcon from "@/components/icons/dinner-icon";
import LunchIcon from "@/components/icons/lunch-icon";
import { getSupplierReport } from "@/lib/actions/reports";
import { formatEpochToDate } from "@/lib/utils/date";
import { MealType } from "@prisma/client";
import { Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

export default function SupplierReport() {
  const [data, setData] = useState<any[]>([]);
  const [currentEventInfo, setCurrentEventInfo] = useState<{
    tithi?: string;
    eventSummary?: string;
  }>({});

  const searchParams = useSearchParams();

  const epochMs = parseInt(searchParams.get("epochMs") ?? "");

  const mealTypeIconMap = {
    [MealType.BREAKFAST]: BreakfastIcon,
    [MealType.LUNCH]: LunchIcon,
    [MealType.DINNER]: DinnerIcon,
    [MealType.SNACK]: BreakfastIcon,
  };

  const loadData = useCallback(async () => {
    try {
      if (epochMs) {
        const kitchensData = await getSupplierReport(epochMs);

        setData(kitchensData);
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

        const response = await fetch(`/api/calendar/tithi?${params}`);
        const data = await response.json();

        if (response.ok && data.success) {
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
      <div className="bg-transparent p-6 flex flex-col gap-5 w-full overflow-x-hidden min-h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 h-15">
            <img src="/logo.svg" className="h-full" />
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

        {structuredData.map((kitchen: any) => (
          <div className="flex flex-col gap-5">
            <h1 className="text-center text-2xl font-extrabold">
              {kitchen.kitchenName}
            </h1>
            {kitchen.mealTypes.map((mealType: any) => {
              const MealTypeIcon =
                mealTypeIconMap[mealType.mealType as MealType];
              return (
                <div className="bg-secondary rounded p-3 flex flex-col gap-3">
                  <h2 className="capitalize flex gap-2 font-extrabold border-b-2 border-muted-foreground pb-2">
                    <MealTypeIcon />
                    {mealType.mealType.toLowerCase()}
                  </h2>

                  <div className="grid grid-cols-2 gap-18 text-sm text-muted-foreground font-bold">
                    {mealType.recipes.map((recipe: any) => (
                      <div className="flex items-center justify-between pb-1 border-b border-dashed border-muted-foreground">
                        <div>{recipe.recipeName}</div>
                        <div>{recipe.totalQuantity} Kg</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
