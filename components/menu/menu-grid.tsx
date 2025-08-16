"use client";

import { cn } from "@/lib/utils";
import type { MealType } from "@/types/menus";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transform dailyMenus to the format expected by MenuCard
  useEffect(() => {
    if (dailyMenus) {
      const transformedData: Record<string, MenuItem[]> = {
        breakfast: (dailyMenus.BREAKFAST || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ""}`,
        })),
        lunch: (dailyMenus.LUNCH || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ""}`,
        })),
        dinner: (dailyMenus.DINNER || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ""}`,
        })),
        snack: (dailyMenus.SNACK || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ""}`,
        })),
      };
      setMenuData(transformedData);
    }
  }, [dailyMenus]);

  const handleEditItem = useCallback(
    async (mealType: string, updatedItem: InputMenuItem) => {
      try {
        const { updateMenu } = await import("@/lib/api/menus");
        const itemWithWeight = {
          ...updatedItem,
          weight: updatedItem.weight || "",
        };
        const result = await updateMenu(updatedItem.id, itemWithWeight);
        if (result && !result.error) {
          setMenuData((prev: Record<string, MenuItem[]>) => ({
            ...prev,
            [mealType]: prev[mealType].map((item) =>
              item.id === updatedItem.id ? itemWithWeight : item,
            ),
          }));
          toast.success("Menu updated!");
        } else {
          toast.error(result.error || "Failed to update menu.");
        }
      } catch (err) {
        toast.error("Failed to update menu.");
      }
    },
    [],
  );

  const handleDeleteItem = useCallback(
    async (mealType: string, itemId: string) => {
      if (window.confirm("Are you sure you want to delete this item?")) {
        try {
          const { deleteMenu } = await import("@/lib/api/menus");
          const result = await deleteMenu(itemId);
          if (result && !result.error) {
            setMenuData((prev: Record<string, MenuItem[]>) => ({
              ...prev,
              [mealType]: prev[mealType].filter((item) => item.id !== itemId),
            }));
            toast.success("Menu deleted!");
          } else {
            toast.error(result.error || "Failed to delete menu.");
          }
        } catch (err) {
          toast.error("Failed to delete menu.");
        }
      }
    },
    [],
  );

  const handleAddMenuItem = useCallback(
    (mealType: string, item: InputMenuItem) => {
      const itemWithWeight = { ...item, weight: item.weight ?? "" };
      setMenuData((prev: Record<string, MenuItem[]>) => {
        const currentItems = prev[mealType] || [];
        return {
          ...prev,
          [mealType]: [...currentItems, itemWithWeight],
        };
      });
    },
    [],
  );

  const handleAddRecipe = useCallback(
    (mealType: string, recipe: InputMenuItem) => {
      const recipeWithWeight = { ...recipe, weight: recipe.weight ?? "" };
      setMenuData((prev: Record<string, MenuItem[]>) => {
        const currentItems = prev[mealType] || [];
        return {
          ...prev,
          [mealType]: [...currentItems, recipeWithWeight],
        };
      });
    },
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-12 gap-2 md:gap-4">
        <MenuCard
          title="Breakfast"
          className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3"
          items={menuData.breakfast}
          onAdd={() => onAddMeal("BREAKFAST")}
          onEdit={(item) => {
            // Find the actual meal data from dailyMenus
            const meal = dailyMenus.BREAKFAST?.find(
              (m: any) => m.id === item.id,
            );
            if (meal) {
              onEditMeal("BREAKFAST", meal);
            }
          }}
          onDelete={(itemId) => onDeleteMeal(itemId)}
          showActions
        />
        <MenuCard
          title="Lunch"
          className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3"
          items={menuData.lunch}
          onAdd={() => onAddMeal("LUNCH")}
          onEdit={(item) => {
            // Find the actual meal data from dailyMenus
            const meal = dailyMenus.LUNCH?.find((m: any) => m.id === item.id);
            if (meal) {
              onEditMeal("LUNCH", meal);
            }
          }}
          onDelete={(itemId) => onDeleteMeal(itemId)}
          showActions
        />
        <MenuCard
          title="Dinner"
          className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3"
          items={menuData.dinner}
          onAdd={() => onAddMeal("DINNER")}
          onEdit={(item) => {
            // Find the actual meal data from dailyMenus
            const meal = dailyMenus.DINNER?.find((m: any) => m.id === item.id);
            if (meal) {
              onEditMeal("DINNER", meal);
            }
          }}
          onDelete={(itemId) => onDeleteMeal(itemId)}
          showActions
        />
        <MenuCard
          title="Extra"
          className="col-span-12 md:col-span-6 xl:col-span-4 2xl:col-span-3"
          items={menuData.snack || []}
          onAdd={() => onAddMeal("SNACK")}
          onEdit={(item) => {
            // Find the actual meal data from dailyMenus
            const meal = dailyMenus.SNACK?.find((m: any) => m.id === item.id);
            if (meal) {
              onEditMeal("SNACK", meal);
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
