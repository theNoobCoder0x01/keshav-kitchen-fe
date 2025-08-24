"use client";

import { cn } from "@/lib/utils";
import { MealType } from "@prisma/client";
import { useEffect, useState } from "react";
import { MenuCard, MenuCardSkeleton } from "./menu-card";

interface MenuItem {
  id: string;
  name: string;
  weight: string;
}

interface InputMenuItem {
  id: string;
  name: string;
  weight?: string;
}

interface MenuGridProps {
  onAddMeal: (mealType: MealType) => void;
  onEditMeal: (mealType: MealType, meal: any) => void;
  onDeleteMeal: (mealId: string) => void;
  dailyMenus: any;
  selectedDate: Date;
}

export function MenuGrid({
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  dailyMenus = {},
  selectedDate,
}: MenuGridProps) {
  const [menuData, setMenuData] = useState<Record<string, MenuItem[]>>({});

  // Transform dailyMenus to the format expected by MenuCard
  useEffect(() => {
    if (dailyMenus) {
      const transformedData: Record<string, MenuItem[]> = {
        breakfast: (dailyMenus.BREAKFAST || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ""}`,
          ingredients: menu.ingredients || [],
          ingredientGroups: menu.ingredientGroups || [],
        })),
        lunch: (dailyMenus.LUNCH || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ""}`,
          ingredients: menu.ingredients || [],
          ingredientGroups: menu.ingredientGroups || [],
        })),
        dinner: (dailyMenus.DINNER || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ""}`,
          ingredients: menu.ingredients || [],
          ingredientGroups: menu.ingredientGroups || [],
        })),
        snack: (dailyMenus.SNACK || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ""}`,
          ingredients: menu.ingredients || [],
          ingredientGroups: menu.ingredientGroups || [],
        })),
      };
      setMenuData(transformedData);
    }
  }, [dailyMenus]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-12 gap-2 md:gap-4">
        <MenuCard
          id={MealType.BREAKFAST}
          title="Breakfast"
          className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3"
          items={menuData.breakfast}
          onAdd={() => onAddMeal(MealType.BREAKFAST)}
          onEdit={(item) => {
            // Find the actual meal data from dailyMenus
            const meal = dailyMenus.BREAKFAST?.find(
              (m: any) => m.id === item.id,
            );
            if (meal) {
              onEditMeal(MealType.BREAKFAST, meal);
            }
          }}
          onDelete={(itemId) => onDeleteMeal(itemId)}
          showActions
        />
        <MenuCard
          id={MealType.LUNCH}
          title="Lunch"
          className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3"
          items={menuData.lunch}
          onAdd={() => onAddMeal(MealType.LUNCH)}
          onEdit={(item) => {
            // Find the actual meal data from dailyMenus
            const meal = dailyMenus.LUNCH?.find((m: any) => m.id === item.id);
            if (meal) {
              onEditMeal(MealType.LUNCH, meal);
            }
          }}
          onDelete={(itemId) => onDeleteMeal(itemId)}
          showActions
        />
        <MenuCard
          id={MealType.DINNER}
          title="Dinner"
          className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3"
          items={menuData.dinner}
          onAdd={() => onAddMeal(MealType.DINNER)}
          onEdit={(item) => {
            // Find the actual meal data from dailyMenus
            const meal = dailyMenus.DINNER?.find((m: any) => m.id === item.id);
            if (meal) {
              onEditMeal(MealType.DINNER, meal);
            }
          }}
          onDelete={(itemId) => onDeleteMeal(itemId)}
          showActions
        />
        <MenuCard
          id={MealType.SNACK}
          title="Extra"
          className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3"
          items={menuData.snack || []}
          onAdd={() => onAddMeal(MealType.SNACK)}
          onEdit={(item) => {
            // Find the actual meal data from dailyMenus
            const meal = dailyMenus.SNACK?.find((m: any) => m.id === item.id);
            if (meal) {
              onEditMeal(MealType.SNACK, meal);
            }
          }}
          onDelete={(itemId) => onDeleteMeal(itemId)}
          showActions
        />
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
