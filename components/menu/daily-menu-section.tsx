"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Accordion } from "@/components/ui/accordion";
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
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const seenRef = useRef<Set<string>>(new Set());

  // Auto-expand freshly added ad-hoc rows (rows that appear with no saved menu).
  useEffect(() => {
    const freshKeys: string[] = [];
    rows.forEach((row) => {
      if (!seenRef.current.has(row.rowKey)) {
        seenRef.current.add(row.rowKey);
        if (!row.initialMenu) freshKeys.push(row.rowKey);
      }
    });
    if (freshKeys.length > 0) {
      setOpenKeys((prev) => [...prev, ...freshKeys]);
    }
  }, [rows]);

  const filledCount = rows.filter((row) => row.initialMenu).length;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card/40">
      <div className="flex items-center justify-between gap-3 bg-muted/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold uppercase tracking-wide text-foreground">
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

      <div className="p-3">
        {rows.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {t("dailyMenu.noRows")}
          </p>
        ) : (
          <Accordion
            type="multiple"
            value={openKeys}
            onValueChange={setOpenKeys}
            className="space-y-2"
          >
            {rows.map((row) => (
              <DailyMenuRow
                key={row.rowKey}
                {...row}
                mealType={mealType}
                onCreated={onRowCreated}
                onDeleted={onRowDeleted}
              />
            ))}
          </Accordion>
        )}
      </div>
    </section>
  );
}
