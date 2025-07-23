"use client";

import { MenuCard } from "./menu-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

interface MenuItem {
  id: string;
  name: string;
  weight?: string;
  isAddItem?: boolean;
}

interface MenuGridProps {
  onAddMeal: (mealType: string) => void;
}

export function MenuGrid({ onAddMeal }: MenuGridProps) {
  const [menuData, setMenuData] = useState({
    breakfast: [
      { id: "b1", name: "Add Mistan", isAddItem: true },
      { id: "b2", name: "Add Farshan", isAddItem: true },
      { id: "b3", name: "Add Saak -01", isAddItem: true },
      { id: "b4", name: "Add Saak -02", isAddItem: true },
      { id: "b5", name: "Add Saak -02", isAddItem: true },
    ],
    lunch: [
      { id: "l1", name: "Idali Sambhar", weight: "25 Kg" },
      { id: "l2", name: "Idali Sambhar", weight: "25 Kg" },
      { id: "l3", name: "Idali Sambhar", weight: "25 Kg" },
      { id: "l4", name: "Idali Sambhar", weight: "25 Kg" },
      { id: "l5", name: "Idali Sambhar", weight: "25 Kg" },
      { id: "l6", name: "Idali Sambhar", weight: "25 Kg" },
    ],
    dinner: [
      { id: "d1", name: "Idali Sambhar", weight: "25 Kg" },
      { id: "d2", name: "Idali Sambhar", weight: "25 Kg" },
      { id: "d3", name: "Idali Sambhar", weight: "25 Kg" },
      { id: "d4", name: "Idali Sambhar", weight: "25 Kg" },
      { id: "d5", name: "Idali Sambhar", weight: "25 Kg" },
      { id: "d6", name: "Idali Sambhar", weight: "25 Kg" },
    ],
  });

  const [extraItems, setExtraItems] = useState([
    { id: "e1", name: "Save", weight: "1000 Kg" },
  ]);

  const handleEditItem = (
    mealType: keyof typeof menuData,
    updatedItem: MenuItem,
  ) => {
    setMenuData((prev) => ({
      ...prev,
      [mealType]: prev[mealType].map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    }));
  };

  const handleDeleteItem = (
    mealType: keyof typeof menuData,
    itemId: string,
  ) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setMenuData((prev) => ({
        ...prev,
        [mealType]: prev[mealType].filter((item) => item.id !== itemId),
      }));
    }
  };

  const handleEditExtraItem = (updatedItem: MenuItem) => {
    setExtraItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
  };

  const handleDeleteExtraItem = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setExtraItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

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
