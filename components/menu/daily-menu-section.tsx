"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, Plus } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
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
    <Accordion
      type="single"
      collapsible
      defaultValue="open"
      className="rounded-lg border border-border bg-card/40"
    >
      <AccordionItem value="open" className="border-b-0">
        {/* Sticky, clickable meal-period band that toggles the section */}
        <AccordionPrimitive.Header className="sticky top-0 z-20 flex rounded-t-lg border-b border-border bg-muted">
          <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between gap-3 px-3 py-1.5 text-left outline-none [&[data-state=open]>svg]:rotate-180">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">{title}</h2>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                {filledCount}/{rows.length}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>

        <AccordionContent className="pb-0 pt-0">
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
