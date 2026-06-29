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
    <section className="rounded-lg border border-border bg-card/40">
      {/* Sticky meal-period band */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 rounded-t-lg border-b border-border bg-muted px-3 py-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
            {filledCount}/{rows.length}
          </span>
        </div>
      </div>

      {rows.length > 0 && (
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

      {/* Add control at the bottom (new rows append here) */}
      <div className="border-t border-border px-3 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddAdHoc}
          className="h-7 text-primary hover:bg-primary/10"
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("dailyMenu.addItem")}
        </Button>
      </div>
    </section>
  );
}
