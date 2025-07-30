"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MealType } from "@prisma/client";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MenuCard } from "./menu-card";

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
          name: menu.recipe?.name || 'Unknown Recipe',
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ''}`,
        })),
        lunch: (dailyMenus.LUNCH || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || 'Unknown Recipe',
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ''}`,
        })),
        dinner: (dailyMenus.DINNER || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || 'Unknown Recipe',
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ''}`,
        })),
        snack: (dailyMenus.SNACK || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || 'Unknown Recipe',
          weight: `${menu.servings} ${menu.ghanFactor ? `(${menu.ghanFactor} ghan)` : ''}`,
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
              item.id === updatedItem.id ? itemWithWeight : item
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
    []
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
    []
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
    []
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
    []
  );


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <MenuCard
          title="Breakfast"
          items={menuData.breakfast}
          onAdd={() => onAddMeal(MealType.BREAKFAST)}
          onEdit={(item) => {
            // Find the actual meal data from dailyMenus
            const meal = dailyMenus.BREAKFAST?.find((m: any) => m.id === item.id);
            if (meal) {
              onEditMeal(MealType.BREAKFAST, meal);
            }
          }}
          onDelete={(itemId) => onDeleteMeal(itemId)}
          showActions
        />
        <MenuCard
          title="Lunch"
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
          title="Dinner"
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
      </div>

      {/* Extra Section - Now using MenuCard like other meal types */}
      <div className="grid grid-cols-1">
        <MenuCard
          title="Extra"
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
