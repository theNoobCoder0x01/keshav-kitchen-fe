"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DailyMenuRow,
  type DailyMenuRowProps,
} from "@/components/menu/daily-menu-row";
import { useTranslations } from "@/hooks/use-translations";
import type { MealType } from "@/types/menus";

export type DailyMenuRowDescriptor = Pick<
  DailyMenuRowProps,
  "rowKey" | "categoryLabel" | "menuComponentId" | "menuComponent" | "initialMenu"
>;

interface DailyMenuSectionProps {
  mealType: MealType;
  title: string;
  rows: DailyMenuRowDescriptor[];
  onRowCreated: (rowKey: string, menuId: string) => void;
  onRowDeleted: (rowKey: string, menuId: string | null) => void;
  onAddAdHoc: () => void;
}

export function DailyMenuSection({
  mealType,
  title,
  rows,
  onRowCreated,
  onRowDeleted,
  onAddAdHoc,
}: DailyMenuSectionProps) {
  const { t } = useTranslations();
  const filledCount = rows.filter((row) => row.initialMenu).length;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card/40">
      {/* Meal-period band, like the PDF section header */}
      <div className="flex items-center justify-between gap-3 bg-muted/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
            {title}
          </h2>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {filledCount}/{rows.length}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddAdHoc}
          className="h-8"
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("dailyMenu.addItem")}
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          {t("dailyMenu.noRows")}
        </p>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <DailyMenuRow
              key={row.rowKey}
              {...row}
              mealType={mealType}
              onCreated={onRowCreated}
              onDeleted={onRowDeleted}
            />
          ))}
        </div>
      )}
    </section>
  );
}
