"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DateSelector } from "@/components/ui/date-selector"
import { StatsGrid } from "@/components/ui/stats-grid"
import { PageHeader } from "@/components/ui/page-header"
import { RecipesTable } from "@/components/recipes/recipes-table"
import { AddRecipeDialog } from "@/components/dialogs/add-recipe-dialog"
import { Button } from "@/components/ui/button"
import { Users, ShoppingCart, DollarSign, Plus } from "lucide-react"
import { useState } from "react"

export default function RecipesPage() {
  const [addRecipeDialog, setAddRecipeDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const statsData = [
    { label: "Total Recipes", value: "156", icon: Users, iconColor: "#00cfe8", trend: { value: 12, isPositive: true } },
    {
      label: "Active Recipes",
      value: "89",
      icon: ShoppingCart,
      iconColor: "#ea5455",
      trend: { value: 5, isPositive: true },
    },
    {
      label: "Avg Cost",
      value: "$12.50",
      icon: DollarSign,
      iconColor: "#28c76f",
      trend: { value: 3, isPositive: false },
    },
  ]

  const recipes = Array(6).fill({
    name: "Idali Sambhar",
    type: "Breakfast",
    issuedDate: "09 May 2022",
  })

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    console.log(`Recipes date changed to: ${date.toDateString()}`)
  }

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <PageHeader
          title="Recipe Management"
          subtitle="Create and manage your kitchen recipes"
          actions={
            <Button
              className="bg-gradient-to-r from-[#674af5] to-[#856ef7] hover:from-[#674af5]/90 hover:to-[#856ef7]/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => setAddRecipeDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Recipe
            </Button>
          }
        />
      </div>

      {/* Date and Stats Section */}
      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 mb-6">
          <div className="xl:col-span-2">
            <DateSelector date={selectedDate} onDateChange={handleDateChange} className="h-full min-h-[120px]" />
          </div>
          <div className="xl:col-span-3">
            <StatsGrid stats={statsData} />
          </div>
        </div>
      </div>

      {/* Recipes Section */}
      <div className="space-y-6">
        <RecipesTable recipes={recipes} />
      </div>

      {/* Dialog */}
      <AddRecipeDialog open={addRecipeDialog} onOpenChange={setAddRecipeDialog} />
    </DashboardLayout>
  )
}
