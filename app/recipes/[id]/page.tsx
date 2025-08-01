"use client";

import { RecipePrintDialog } from "@/components/dialogs/recipe-print-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { RecipeDetailView, type RecipeDetailData } from "@/components/recipes/recipe-detail-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Printer } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RecipeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;

  const [recipe, setRecipe] = useState<RecipeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/recipes?id=${recipeId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recipe');
        }

        const detailedRecipe = await response.json();
        
        // Transform the data to match RecipeDetailData interface
        const recipeData: RecipeDetailData = {
          id: detailedRecipe.id,
          name: detailedRecipe.name,
          description: detailedRecipe.description,
          instructions: detailedRecipe.instructions,
          servings: detailedRecipe.servings,
          category: detailedRecipe.category,
          subcategory: detailedRecipe.subcategory,
          cost: detailedRecipe.cost,
          ingredients: detailedRecipe.ingredients?.map((ri: any) => ({
            id: ri.ingredient?.id || ri.id,
            name: ri.ingredient?.name || ri.name,
            quantity: ri.quantity,
            unit: ri.ingredient?.unit || ri.unit,
            costPerUnit: ri.ingredient?.costPerUnit || ri.costPerUnit,
          })) || [],
          createdAt: detailedRecipe.createdAt,
          updatedAt: detailedRecipe.updatedAt,
        };

        setRecipe(recipeData);
      } catch (error) {
        console.error('Error fetching recipe:', error);
        toast.error('Failed to load recipe details');
        router.push('/recipes');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId, router]);

  const handleEdit = () => {
    router.push(`/recipes?edit=${recipeId}`);
  };

  const handlePrint = () => {
    setIsPrintDialogOpen(true);
  };

  const handleBack = () => {
    router.push('/recipes');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#674af5] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recipe...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!recipe) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Recipe not found</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Recipes
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header with actions */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Recipes
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Recipe
          </Button>
          
          <Button
            onClick={handlePrint}
            className="bg-gradient-to-r from-[#674af5] to-[#856ef7] hover:from-[#674af5]/90 hover:to-[#856ef7]/90 text-white flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Recipe
          </Button>
        </div>
      </div>

      {/* Recipe Detail View */}
      <div className="bg-white rounded-lg shadow-sm border">
        <RecipeDetailView recipe={recipe} />
      </div>

      {/* Print Dialog */}
      <RecipePrintDialog
        isOpen={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        recipe={recipe}
      />
    </DashboardLayout>
  );
}