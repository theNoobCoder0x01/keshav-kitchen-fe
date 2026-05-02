"use client";

import { cn, formatDecimal } from "@/lib/utils";
import type { KitchenPersonType } from "@/types/kitchens";
import type { MenuComponentApiItem } from "@/types/menu-components";
import { MealTypeEnum as MealType } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { MenuCard, MenuCardSkeleton } from "./menu-card";

interface MenuItem {
  id: string;
  name: string;
  weight: string;
}

interface MenuGridProps {
  onAddMeal: (mealType: MealType, menuComponentId?: string) => void;
  onEditMeal: (mealType: MealType, meal: any) => void;
  onDeleteMeal: (mealId: string) => void;
  menus: any;
  kitchenId: string;
  selectedDate: Date;
  personTypes?: KitchenPersonType[];
  personCountsByMealType?: Record<string, Record<string, number>>;
  onPersonCountChange?: (
    mealType: MealType,
    personTypeId: string,
    count: number,
  ) => void;
  onAddPersonType?: () => void;
  onEditMenuComponent?: (menuComponent: MenuComponentApiItem) => void;
  menuComponentsRefreshKey?: number;
}

export function MenuGrid({
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  menus = {},
  kitchenId,
  personTypes = [],
  personCountsByMealType = {},
  onPersonCountChange,
  onAddPersonType,
  onEditMenuComponent,
  menuComponentsRefreshKey = 0,
}: MenuGridProps) {
  const [menuData, setMenuData] = useState<Record<string, MenuItem[]>>({});

  // Transform dailyMenus to the format expected by MenuCard
  useEffect(() => {
    if (menus) {
      const transformedData: Record<string, MenuItem[]> = {
        breakfast: (menus.BREAKFAST || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || menu.menuComponent?.label || "Custom menu item",
          weight: `${menu.servingQuantity != null ? formatDecimal(menu.servingQuantity) : ""} ${menu.preparedQuantity ? `(${formatDecimal(menu.preparedQuantity)} ${menu.preparedQuantityUnit ?? "kg"})` : ""}`,
          ingredients: menu.ingredients || [],
          ingredientGroups: menu.ingredientGroups || [],
          menuComponent: menu.menuComponent || null,
        })),
        lunch: (menus.LUNCH || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || menu.menuComponent?.label || "Custom menu item",
          weight: `${menu.servingQuantity != null ? formatDecimal(menu.servingQuantity) : ""} ${menu.preparedQuantity ? `(${formatDecimal(menu.preparedQuantity)} ${menu.preparedQuantityUnit ?? "kg"})` : ""}`,
          ingredients: menu.ingredients || [],
          ingredientGroups: menu.ingredientGroups || [],
          menuComponent: menu.menuComponent || null,
        })),
        dinner: (menus.DINNER || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || menu.menuComponent?.label || "Custom menu item",
          weight: `${menu.servingQuantity != null ? formatDecimal(menu.servingQuantity) : ""} ${menu.preparedQuantity ? `(${formatDecimal(menu.preparedQuantity)} ${menu.preparedQuantityUnit ?? "kg"})` : ""}`,
          ingredients: menu.ingredients || [],
          ingredientGroups: menu.ingredientGroups || [],
          menuComponent: menu.menuComponent || null,
        })),
        snack: (menus.SNACK || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || menu.menuComponent?.label || "Custom menu item",
          weight: `${menu.servingQuantity != null ? formatDecimal(menu.servingQuantity) : ""} ${menu.preparedQuantity ? `(${formatDecimal(menu.preparedQuantity)} ${menu.preparedQuantityUnit ?? "kg"})` : ""}`,
          ingredients: menu.ingredients || [],
          ingredientGroups: menu.ingredientGroups || [],
          menuComponent: menu.menuComponent || null,
        })),
      };
      setMenuData(transformedData);
    }
  }, [menus]);

  const mealTypes = useMemo(
    () => [
      { type: MealType.BREAKFAST, title: "Breakfast", key: "breakfast" },
      { type: MealType.LUNCH, title: "Lunch", key: "lunch" },
      { type: MealType.DINNER, title: "Dinner", key: "dinner" },
      { type: MealType.SNACK, title: "Snack", key: "snack" },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-12 gap-2 md:gap-4">
        {mealTypes.map(({ type, title, key }) => (
          <MenuCard
            key={type}
            id={type}
            kitchenId={kitchenId}
            title={title}
            className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3"
            items={menuData[key] || []}
            onAdd={(menuComponentId?: string) =>
              onAddMeal(type, menuComponentId)
            }
            onEdit={(item) => {
              const meal = menus[type]?.find((m: any) => m.id === item.id);
              if (meal) {
                onEditMeal(type, meal);
              }
            }}
            onDelete={(itemId) => onDeleteMeal(itemId)}
            showActions
            personTypes={personTypes}
            personCounts={personCountsByMealType[type] || {}}
            onPersonCountChange={(personTypeId, count) =>
              onPersonCountChange?.(type, personTypeId, count)
            }
            onAddPersonType={onAddPersonType}
            onEditMenuComponent={onEditMenuComponent}
            menuComponentsRefreshKey={menuComponentsRefreshKey}
          />
        ))}
      </div>
    </div>
  );
}

// Skeleton loader for MenuGrid
export function MenuGridSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid grid-cols-12 gap-2 md:gap-4">
        <MenuCardSkeleton className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3" />
        <MenuCardSkeleton className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3" />
        <MenuCardSkeleton className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3" />
        <MenuCardSkeleton className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3" />
      </div>
    </div>
  );
}
