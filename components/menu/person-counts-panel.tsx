"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";
import type { MealType } from "@/types/menus";
import type { PremisePersonType } from "@/types/premises";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

interface PersonCountsPanelProps {
  personTypes: PremisePersonType[];
  personCountsByMealType: Record<string, Record<string, number>>;
  onPersonCountChange: (mealType: MealType, personTypeId: string, count: number) => void;
  onAddPersonType?: () => void;
}

const MEAL_TABS: Array<{ value: MealType; label: string }> = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
  { value: "SNACK", label: "Snack" },
];

export function PersonCountsPanel({
  personTypes,
  personCountsByMealType,
  onPersonCountChange,
  onAddPersonType,
}: PersonCountsPanelProps) {
  const { t } = useTranslations();
  const [sameForAll, setSameForAll] = useState(false);
  const [activeTab, setActiveTab] = useState<MealType>("BREAKFAST");

  const handleCountChange = (mealType: MealType, personTypeId: string, count: number) => {
    if (sameForAll) {
      MEAL_TABS.forEach((tab) => {
        onPersonCountChange(tab.value, personTypeId, count);
      });
    } else {
      onPersonCountChange(mealType, personTypeId, count);
    }
  };

  const activeTotal = useMemo(() => {
    const counts = personCountsByMealType[activeTab] || {};
    return Object.values(counts).reduce((sum, count) => sum + (count || 0), 0);
  }, [activeTab, personCountsByMealType]);

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t("menus.personCounts")}
          </h3>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs text-muted-foreground">
              {t("menus.sameForAllMeals")}
            </span>
            <Switch
              checked={sameForAll}
              onCheckedChange={setSameForAll}
            />
          </label>
        </div>

        {personTypes.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            <span>{t("menus.noPersonTypesConfigured")}</span>{" "}
            {onAddPersonType && (
              <button
                type="button"
                onClick={onAddPersonType}
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <Plus className="h-3 w-3" />
                {t("menus.addPersonType")}
              </button>
            )}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MealType)}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <TabsList className="h-8">
                {MEAL_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="px-3 py-1 text-xs"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <span className={cn("text-xs font-medium", activeTotal > 0 ? "text-primary" : "text-muted-foreground")}>
                {t("menus.totalPeople")}: {activeTotal}
              </span>
            </div>

            {MEAL_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {personTypes.map((personType) => {
                    const counts = sameForAll
                      ? personCountsByMealType["BREAKFAST"] || {}
                      : personCountsByMealType[tab.value] || {};
                    const currentCount = counts[personType.id] || 0;

                    return (
                      <div
                        key={personType.id}
                        className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
                      >
                        <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                          {personType.name}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          value={currentCount}
                          onChange={(e) => {
                            const nextValue = Number(e.target.value || 0);
                            handleCountChange(
                              tab.value,
                              personType.id,
                              Number.isFinite(nextValue) && nextValue >= 0
                                ? nextValue
                                : 0,
                            );
                          }}
                          className="h-7 w-20 text-right shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
