"use client";

import { MenuCard } from "./menu-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from 'sonner';

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
  onAddMeal: (mealType: string) => void;
  dailyMenus?: any;
  selectedDate: any;
}

export function MenuGrid({
  onAddMeal,
  dailyMenus = {},
  selectedDate,
}: MenuGridProps) {
  const [menuData, setMenuData] = useState<Record<string, MenuItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenuData() {
      setLoading(true);
      setError(null);
      try {
        const { fetchMenus } = await import('@/lib/api/menus');
        const menus = await fetchMenus();
        setMenuData(menus);
      } catch (err: any) {
        setError('Failed to load menu data.');
      } finally {
        setLoading(false);
      }
    }
    fetchMenuData();
  }, []);

  const [extraItems, setExtraItems] = useState([
    { id: "e1", name: "Save", weight: "1000 Kg" },
  ]);

  const handleEditItem = useCallback(async (
    mealType: string,
    updatedItem: InputMenuItem,
  ) => {
    try {
      const { updateMenu } = await import('@/lib/api/menus');
      const itemWithWeight = { ...updatedItem, weight: updatedItem.weight || '' };
      const result = await updateMenu(updatedItem.id, itemWithWeight);
      if (result && !result.error) {
        setMenuData((prev: Record<string, MenuItem[]>) => ({
          ...prev,
          [mealType]: prev[mealType].map((item) =>
            item.id === updatedItem.id ? itemWithWeight : item,
          ),
        }));
        toast.success('Menu updated!');
      } else {
        toast.error(result.error || 'Failed to update menu.');
      }
    } catch (err) {
      toast.error('Failed to update menu.');
    }
  }, []);

  const handleDeleteItem = useCallback(async (
    mealType: string,
    itemId: string,
  ) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const { deleteMenu } = await import('@/lib/api/menus');
        const result = await deleteMenu(itemId);
        if (result && !result.error) {
          setMenuData((prev: Record<string, MenuItem[]>) => ({
            ...prev,
            [mealType]: prev[mealType].filter((item) => item.id !== itemId),
          }));
          toast.success('Menu deleted!');
        } else {
          toast.error(result.error || 'Failed to delete menu.');
        }
      } catch (err) {
        toast.error('Failed to delete menu.');
      }
    }
  }, []);

  const handleAddMenuItem = useCallback((mealType: string, item: InputMenuItem) => {
    const itemWithWeight = { ...item, weight: item.weight ?? '' };
    setMenuData((prev: Record<string, MenuItem[]>) => {
      const currentItems = prev[mealType] || [];
      return {
        ...prev,
        [mealType]: [...currentItems, itemWithWeight],
      };
    });
  }, []);

  const handleAddRecipe = useCallback((mealType: string, recipe: InputMenuItem) => {
    const recipeWithWeight = { ...recipe, weight: recipe.weight ?? '' };
    setMenuData((prev: Record<string, MenuItem[]>) => {
      const currentItems = prev[mealType] || [];
      return {
        ...prev,
        [mealType]: [...currentItems, recipeWithWeight],
      };
    });
  }, []);

  const handleEditExtraItem = useCallback((updatedItem: InputMenuItem) => {
    const itemWithWeight = { ...updatedItem, weight: updatedItem.weight ?? '' };
    setExtraItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? itemWithWeight : item)),
    );
  }, []);

  const handleDeleteExtraItem = useCallback((itemId: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setExtraItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <MenuCard
          title="Breakfast"
          items={menuData.breakfast}
          onAdd={() => onAddMeal("Breakfast")}
        />
        <MenuCard
          title="Lunch"
          items={menuData.lunch}
          onAdd={() => onAddMeal("Lunch")}
          onEdit={(item) => handleEditItem("lunch", item)}
          onDelete={(itemId) => handleDeleteItem("lunch", itemId)}
          showActions
        />
        <MenuCard
          title="Dinner"
          items={menuData.dinner}
          onAdd={() => onAddMeal("Dinner")}
          onEdit={(item) => handleEditItem("dinner", item)}
          onDelete={(itemId) => handleDeleteItem("dinner", itemId)}
          showActions
        />
      </div>

      {/* Extra Section */}
      <Card className="bg-white border-[#dbdade]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#4b465c]">Extra</h3>
            <Button
              size="sm"
              variant="outline"
              className="border-[#674af5] text-[#674af5] hover:bg-[#674af5]/10 bg-transparent"
              onClick={() => onAddMeal("Extra")}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {extraItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 hover:bg-[#f8f7fa] rounded-lg"
              >
                <div>
                  <p className="text-[#4b465c] font-medium">{item.name}</p>
                  <p className="text-sm text-[#4b465c]/70">{item.weight}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0 text-[#674af5] hover:bg-[#674af5]/10"
                    onClick={() => {
                      const newName = prompt("Edit item name:", item.name);
                      if (newName && newName.trim()) {
                        handleEditExtraItem({ ...item, name: newName.trim() });
                      }
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0 text-[#ea5455] hover:bg-[#ea5455]/10"
                    onClick={() => handleDeleteExtraItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
