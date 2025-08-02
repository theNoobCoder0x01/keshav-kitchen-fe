"use client";

import { MealType } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MenuCard } from "./menu-card";

interface MenuItem {
  id: string;
  name: string;
  weight: string;
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
          weight: `${menu.servings} servings ${menu.ghanFactor ? `• ${menu.ghanFactor}x ghan` : ""}`,
        })),
        lunch: (dailyMenus.LUNCH || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} servings ${menu.ghanFactor ? `• ${menu.ghanFactor}x ghan` : ""}`,
        })),
        dinner: (dailyMenus.DINNER || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} servings ${menu.ghanFactor ? `• ${menu.ghanFactor}x ghan` : ""}`,
        })),
        snack: (dailyMenus.SNACK || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} servings ${menu.ghanFactor ? `• ${menu.ghanFactor}x ghan` : ""}`,
        })),
      };
      setMenuData(transformedData);
    }
  }, [dailyMenus]);

  const handleEditItem = useCallback(
    async (mealType: string, updatedItem: MenuItem) => {
      try {
        const { updateMenu } = await import("@/lib/api/menus");
        const result = await updateMenu(updatedItem.id, { name: updatedItem.name });
        if (result && !result.error) {
          setMenuData((prev: Record<string, MenuItem[]>) => ({
            ...prev,
            [mealType]: prev[mealType].map((item) =>
              item.id === updatedItem.id ? updatedItem : item,
            ),
          }));
          toast.success("Menu updated successfully!");
        } else {
          toast.error(result.error || "Failed to update menu");
        }
      } catch (err) {
        toast.error("Failed to update menu");
      }
    },
    [],
  );

  return (
    <div className="space-y-8">
      {/* Main Meals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MenuCard
          title="🌅 Breakfast"
          items={menuData.breakfast || []}
          onAdd={() => onAddMeal(MealType.BREAKFAST)}
          onEdit={(item) => {
            const meal = dailyMenus.BREAKFAST?.find((m: any) => m.id === item.id);
            if (meal) {
              onEditMeal(MealType.BREAKFAST, meal);
            }
          }}
          onDelete={(itemId) => onDeleteMeal(itemId)}
          showActions
        />
        
        <MenuCard
          title="🌞 Lunch"
          items={menuData.lunch || []}
          onAdd={() => onAddMeal(MealType.LUNCH)}
          onEdit={(item) => {
            const meal = dailyMenus.LUNCH?.find((m: any) => m.id === item.id);
            if (meal) {
              onEditMeal(MealType.LUNCH, meal);
            }
          }}
          onDelete={(itemId) => onDeleteMeal(itemId)}
          showActions
        />
        
        <MenuCard
          title="🌙 Dinner"
          items={menuData.dinner || []}
          onAdd={() => onAddMeal(MealType.DINNER)}
          onEdit={(item) => {
            const meal = dailyMenus.DINNER?.find((m: any) => m.id === item.id);
            if (meal) {
              onEditMeal(MealType.DINNER, meal);
            }
          }}
          onDelete={(itemId) => onDeleteMeal(itemId)}
          showActions
        />
      </div>

      {/* Extra/Snacks Section */}
      <div className="grid grid-cols-1">
        <MenuCard
          title="🍪 Snacks & Extras"
          items={menuData.snack || []}
          onAdd={() => onAddMeal(MealType.SNACK)}
          onEdit={(item) => {
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