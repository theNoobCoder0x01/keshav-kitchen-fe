"use client";

import { MealType } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MenuCard } from "./menu-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Utensils, Moon, Cookie, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuItem {
  id: string;
  name: string;
  weight: string;
  recipe?: {
    name: string;
    id: string;
  };
  servings?: number;
  ghanFactor?: number;
}

interface MenuGridProps {
  onAddMeal: (mealType: MealType) => void;
  onEditMeal: (mealType: MealType, meal: any) => void;
  onDeleteMeal: (mealId: string) => void;
  dailyMenus: any;
  selectedDate: Date;
}

const mealTypeConfig = {
  BREAKFAST: {
    icon: Coffee,
    title: "Breakfast",
    emoji: "🌅",
    color: "warning" as const,
    description: "Start your day right",
    timeRange: "6:00 AM - 10:00 AM",
  },
  LUNCH: {
    icon: Utensils,
    title: "Lunch", 
    emoji: "🌞",
    color: "success" as const,
    description: "Midday fuel",
    timeRange: "12:00 PM - 2:00 PM",
  },
  DINNER: {
    icon: Moon,
    title: "Dinner",
    emoji: "🌙", 
    color: "primary" as const,
    description: "Evening satisfaction",
    timeRange: "6:00 PM - 9:00 PM",
  },
  SNACK: {
    icon: Cookie,
    title: "Snacks & Extras",
    emoji: "🍪",
    color: "secondary" as const,
    description: "Light bites and treats",
    timeRange: "Anytime",
  },
} as const;

export function MenuGrid({
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  dailyMenus = {},
  selectedDate,
}: MenuGridProps) {
  const [menuData, setMenuData] = useState<Record<string, MenuItem[]>>({});
  const [loading, setLoading] = useState(false);

  // Transform dailyMenus to the format expected by MenuCard
  useEffect(() => {
    if (dailyMenus) {
      const transformedData: Record<string, MenuItem[]> = {
        breakfast: (dailyMenus.BREAKFAST || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} servings ${menu.ghanFactor ? `• ${menu.ghanFactor}x ghan` : ""}`,
          recipe: menu.recipe,
          servings: menu.servings,
          ghanFactor: menu.ghanFactor,
        })),
        lunch: (dailyMenus.LUNCH || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} servings ${menu.ghanFactor ? `• ${menu.ghanFactor}x ghan` : ""}`,
          recipe: menu.recipe,
          servings: menu.servings,
          ghanFactor: menu.ghanFactor,
        })),
        dinner: (dailyMenus.DINNER || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} servings ${menu.ghanFactor ? `• ${menu.ghanFactor}x ghan` : ""}`,
          recipe: menu.recipe,
          servings: menu.servings,
          ghanFactor: menu.ghanFactor,
        })),
        snack: (dailyMenus.SNACK || []).map((menu: any) => ({
          id: menu.id,
          name: menu.recipe?.name || "Unknown Recipe",
          weight: `${menu.servings} servings ${menu.ghanFactor ? `• ${menu.ghanFactor}x ghan` : ""}`,
          recipe: menu.recipe,
          servings: menu.servings,
          ghanFactor: menu.ghanFactor,
        })),
      };
      setMenuData(transformedData);
    }
  }, [dailyMenus]);

  const handleEditItem = useCallback(
    async (mealType: string, updatedItem: MenuItem) => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalMeals = () => {
    return Object.values(menuData).reduce((total, meals) => total + meals.length, 0);
  };

  return (
    <div className="space-y-8">
      {/* Menu Overview Header */}
      <Card variant="elevated" className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gradient">
                Daily Menu Planning
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {formatSelectedDate()} • {getTotalMeals()} meals planned
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Quick Actions</p>
                <p className="text-xs text-muted-foreground">Add meals to any time slot</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Meals Grid */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Main Meals
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MenuCard
              title={`${mealTypeConfig.BREAKFAST.emoji} ${mealTypeConfig.BREAKFAST.title}`}
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
              mealType="BREAKFAST"
              timeRange={mealTypeConfig.BREAKFAST.timeRange}
              description={mealTypeConfig.BREAKFAST.description}
              color={mealTypeConfig.BREAKFAST.color}
              loading={loading}
            />
            
            <MenuCard
              title={`${mealTypeConfig.LUNCH.emoji} ${mealTypeConfig.LUNCH.title}`}
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
              mealType="LUNCH"
              timeRange={mealTypeConfig.LUNCH.timeRange}
              description={mealTypeConfig.LUNCH.description}
              color={mealTypeConfig.LUNCH.color}
              loading={loading}
            />
            
            <MenuCard
              title={`${mealTypeConfig.DINNER.emoji} ${mealTypeConfig.DINNER.title}`}
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
              mealType="DINNER"
              timeRange={mealTypeConfig.DINNER.timeRange}
              description={mealTypeConfig.DINNER.description}
              color={mealTypeConfig.DINNER.color}
              loading={loading}
            />
          </div>
        </div>

        {/* Snacks Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Cookie className="w-5 h-5 text-secondary" />
            Additional Items
          </h2>
          <div className="grid grid-cols-1">
            <MenuCard
              title={`${mealTypeConfig.SNACK.emoji} ${mealTypeConfig.SNACK.title}`}
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
              mealType="SNACK"
              timeRange={mealTypeConfig.SNACK.timeRange}
              description={mealTypeConfig.SNACK.description}
              color={mealTypeConfig.SNACK.color}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      {getTotalMeals() === 0 && (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No meals planned yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start planning your menu by adding meals to different time slots. You can add recipes from your collection or create new ones.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => onAddMeal(MealType.BREAKFAST)}
                  leftIcon={<Coffee className="w-4 h-4" />}
                >
                  Add Breakfast
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onAddMeal(MealType.LUNCH)}
                  leftIcon={<Utensils className="w-4 h-4" />}
                >
                  Add Lunch
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onAddMeal(MealType.DINNER)}
                  leftIcon={<Moon className="w-4 h-4" />}
                >
                  Add Dinner
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}