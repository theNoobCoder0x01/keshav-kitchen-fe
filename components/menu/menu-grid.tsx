"use client";

import { cn } from "@/lib/utils";
import { MealType } from "@prisma/client";
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
  selectedDate: Date;
}

export function MenuGrid({
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  menus = {},
  selectedDate,
}: MenuGridProps) {
  const [menuData, setMenuData] = useState<Record<string, MenuItem[]>>({});

  // Transform dailyMenus to the format expected by MenuCard
  useEffect(() => {
    if (menus) {
      const transformedData: Record<string, MenuItem[]> = {
        breakfast: (menus.BREAKFAST || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ""}`,
          ingredients: menu.ingredients || [],
          ingredientGroups: menu.ingredientGroups || [],
          menuComponent: menu.menuComponent || null,
        })),
        lunch: (menus.LUNCH || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ""}`,
          ingredients: menu.ingredients || [],
          ingredientGroups: menu.ingredientGroups || [],
          menuComponent: menu.menuComponent || null,
        })),
        dinner: (menus.DINNER || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ""}`,
          ingredients: menu.ingredients || [],
          ingredientGroups: menu.ingredientGroups || [],
          menuComponent: menu.menuComponent || null,
        })),
        snack: (menus.SNACK || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ""}`,
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
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-12 gap-2 md:gap-4">
        {mealTypes.map(({ type, title, key }) => (
          <MenuCard
            key={type}
            id={type}
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
