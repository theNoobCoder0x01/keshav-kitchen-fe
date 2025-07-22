"use client"

import { MenuCard } from "./menu-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  weight?: string
  isAddItem?: boolean
}

interface MenuGridProps {
  onAddMeal: (mealType: string) => void
  dailyMenus?: any
  selectedDate: Date
}

export function MenuGrid({ onAddMeal, dailyMenus = {}, selectedDate }: MenuGridProps) {
  // Convert daily menus to the format expected by MenuCard
  const convertMenusToItems = (menus: any[] = []) => {
    return menus.map((menu) => ({
      id: menu.id,
      name: menu.recipe.name,
      weight: `${menu.plannedServings} servings`,
      actualServings: menu.actualServings,
      status: menu.status,
    }))
  }

  const breakfastItems = convertMenusToItems(dailyMenus.BREAKFAST)
  const lunchItems = convertMenusToItems(dailyMenus.LUNCH)
  const dinnerItems = convertMenusToItems(dailyMenus.DINNER)

  const handleEditItem = (mealType: string, updatedItem: MenuItem) => {
    // TODO: Implement edit functionality
    console.log("Edit item:", mealType, updatedItem)
  }

  const handleDeleteItem = (mealType: string, itemId: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      // TODO: Implement delete functionality
      console.log("Delete item:", mealType, itemId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MenuCard
          title="Breakfast"
          items={breakfastItems}
          onAdd={() => onAddMeal("Breakfast")}
          onEdit={(item) => handleEditItem("breakfast", item)}
          onDelete={(itemId) => handleDeleteItem("breakfast", itemId)}
          showActions={breakfastItems.length > 0}
        />
        <MenuCard
          title="Lunch"
          items={lunchItems}
          onAdd={() => onAddMeal("Lunch")}
          onEdit={(item) => handleEditItem("lunch", item)}
          onDelete={(itemId) => handleDeleteItem("lunch", itemId)}
          showActions={lunchItems.length > 0}
        />
        <MenuCard
          title="Dinner"
          items={dinnerItems}
          onAdd={() => onAddMeal("Dinner")}
          onEdit={(item) => handleEditItem("dinner", item)}
          onDelete={(itemId) => handleDeleteItem("dinner", itemId)}
          showActions={dinnerItems.length > 0}
        />
      </div>

      {/* Extra Section - if needed */}
      <Card className="bg-white border-[#dbdade]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#4b465c]">Extra Items</h3>
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
          <div className="mt-4">
            <p className="text-sm text-[#4b465c]/60">No extra items for {selectedDate.toDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
