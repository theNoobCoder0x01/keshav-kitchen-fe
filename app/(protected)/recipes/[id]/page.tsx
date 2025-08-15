"use client";

import { RecipePrintDialog } from "@/components/dialogs/recipe-print-dialog";
import {
  RecipeDetailView,
  type RecipeDetailData,
} from "@/components/recipes/recipe-detail-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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
        const response = await fetch(`/api/recipes/${recipeId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch recipe");
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
          ingredients:
            detailedRecipe.ingredients?.map((ingredient: any) => ({
              id: ingredient.id,
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              costPerUnit: ingredient.costPerUnit,
            })) || [],
          createdAt: detailedRecipe.createdAt
            ? new Date(detailedRecipe.createdAt)
            : undefined,
          updatedAt: detailedRecipe.updatedAt
            ? new Date(detailedRecipe.updatedAt)
            : undefined,
        };

        setRecipe(recipeData);
      } catch (error) {
        console.error("Error fetching recipe:", error);
        toast.error("Failed to load recipe details");
        router.push("/recipes");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId, router]);

  const handlePrint = () => {
    setIsPrintDialogOpen(true);
  };

  const handleBack = () => {
    router.push("/recipes");
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading recipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Recipe not found</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Recipes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
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
            onClick={handlePrint}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Recipe
          </Button>
        </div>
      </div>

      {/* Recipe Detail View */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <RecipeDetailView recipe={recipe} />
      </div>

      {/* Print Dialog */}
      <RecipePrintDialog
        isOpen={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        recipe={recipe}
      />
    </div>
  );
}
