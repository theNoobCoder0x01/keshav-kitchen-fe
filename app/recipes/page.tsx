"use client";

import { AddRecipeDialog } from "@/components/dialogs/add-recipe-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { RecipesTable } from "@/components/recipes/recipes-table";
import { Button } from "@/components/ui/button";
import { DateSelector } from "@/components/ui/date-selector";
import { PageHeader } from "@/components/ui/page-header";
import { StatsGrid } from "@/components/ui/stats-grid";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { toast } from "sonner";

export default function RecipesPage() {
  const [addRecipeDialog, setAddRecipeDialog] = useState(false);
  const [editRecipe, setEditRecipe] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statsData, setStatsData] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit handler
  const handleEditRecipe = (recipe: any) => {
    setEditRecipe(recipe);
    setAddRecipeDialog(true);
  };

  // Delete handler
  const handleDeleteRecipe = async (recipe: any) => {
    if (!window.confirm(`Delete recipe "${recipe.name}"?`)) return;
    setDeletingId(recipe.id);
    try {
      const { deleteRecipe } = await import("@/lib/api/recipes");
      const result = await deleteRecipe(recipe.id);
      if (!result.error) {
        setRecipes((prev: any[]) => prev.filter((r) => r.id !== recipe.id));
        toast.success("Recipe deleted!");
      } else {
        toast.error(result.error || "Failed to delete recipe.");
      }
    } catch (err) {
      toast.error("Failed to delete recipe.");
    } finally {
      setDeletingId(null);
    }
  };

  // Save handler (for both add and edit)
  const handleSaveRecipe = async (data: any) => {
    try {
      const payload = {
        name: data.recipeName,
        type: data.recipeType,
        ingredients: data.ingredients,
      };
      let result;
      if (editRecipe) {
        const { updateRecipe } = await import("@/lib/api/recipes");
        result = await updateRecipe(editRecipe.id, payload);
      } else {
        const { createRecipe } = await import("@/lib/api/recipes");
        result = await createRecipe(payload);
      }
      if (!result.error) {
        if (editRecipe) {
          setRecipes((prev: any[]) =>
            prev.map((r) => (r.id === editRecipe.id ? result : r))
          );
          toast.success("Recipe updated!");
        } else {
          setRecipes((prev: any[]) => [result, ...prev]);
          toast.success("Recipe added!");
        }
        setAddRecipeDialog(false);
        setEditRecipe(null);
      } else {
        toast.error(result.error || "Failed to save recipe.");
      }
    } catch (err) {
      toast.error("Failed to save recipe.");
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [recipesRes, statsRes] = await Promise.all([
          import("@/lib/api/recipes").then((m) => m.fetchRecipes()),
          import("@/lib/api/stats").then((m) => m.fetchStats()),
        ]);
        setRecipes(recipesRes);
        setStatsData(statsRes);
      } catch (err: any) {
        setError("Failed to load recipes or stats.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

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
            <DateSelector
              date={selectedDate}
              onDateChange={handleDateChange}
              className="h-full min-h-[120px]"
            />
          </div>
          <div className="xl:col-span-3">
            <StatsGrid stats={statsData} />
          </div>
        </div>
      </div>

      {/* Recipes Section */}
      <div className="space-y-6">
        <RecipesTable
          recipes={recipes}
          onEdit={(recipe) => {
            setEditRecipe(recipe);
            setAddRecipeDialog(true);
          }}
          onDelete={handleDeleteRecipe}
          deletingId={deletingId}
        />
      </div>

      {/* Dialog */}
      <AddRecipeDialog
        open={addRecipeDialog}
        onOpenChange={(open) => {
          setAddRecipeDialog(open);
          if (!open) setEditRecipe(null);
        }}
        initialRecipe={
          editRecipe
            ? {
                recipeName: editRecipe.name,
                recipeType: editRecipe.type,
                selectedRecipe: editRecipe.name,
                ingredients: editRecipe.ingredients || [
                  { name: "", quantity: "", unit: "Kg" },
                ],
              }
            : null
        }
        onSave={handleSaveRecipe}
      />
    </DashboardLayout>
  );
}
