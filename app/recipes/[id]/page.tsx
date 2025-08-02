"use client";

import { RecipePrintDialog } from "@/components/dialogs/recipe-print-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { RecipeDetailView, type RecipeDetailData } from "@/components/recipes/recipe-detail-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Printer, Share2, BookOpen } from "lucide-react";
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
        const response = await fetch(`/api/recipes/${recipeId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recipe');
        }

        const detailedRecipe = await response.json();
        
        const recipeData: RecipeDetailData = {
          id: detailedRecipe.id,
          name: detailedRecipe.name,
          description: detailedRecipe.description,
          instructions: detailedRecipe.instructions,
          servings: detailedRecipe.servings,
          category: detailedRecipe.category,
          subcategory: detailedRecipe.subcategory,
          ingredients: detailedRecipe.ingredients?.map((ingredient: any) => ({
            id: ingredient.id,
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            costPerUnit: ingredient.costPerUnit,
          })) || [],
          createdAt: detailedRecipe.createdAt ? new Date(detailedRecipe.createdAt) : undefined,
          updatedAt: detailedRecipe.updatedAt ? new Date(detailedRecipe.updatedAt) : undefined,
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe?.name,
        text: recipe?.description || `Check out this recipe: ${recipe?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading recipe...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!recipe) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="glass border-0 shadow-modern p-8 text-center">
            <div className="w-16 h-16 bg-muted/50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="heading-3 mb-2">Recipe not found</h3>
            <p className="text-muted-foreground mb-6">
              The recipe you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={handleBack} variant="outline" className="btn-hover">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Recipes
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header with Breadcrumb */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="glass border-0 btn-hover"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Recipes
          </Button>
          <div className="flex items-center space-x-2 text-muted-foreground body-small">
            <span>Recipes</span>
            <span>/</span>
            <Badge variant="secondary">{recipe.category}</Badge>
            <span>/</span>
            <span className="text-foreground font-medium">{recipe.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleShare}
            className="glass border-0 btn-hover"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          <Button
            variant="outline"
            onClick={handleEdit}
            className="glass border-0 btn-hover"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Recipe
          </Button>
          
          <Button
            onClick={handlePrint}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg btn-hover"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Recipe
          </Button>
        </div>
      </div>

      {/* Recipe Detail View */}
      <Card className="glass border-0 shadow-modern">
        <RecipeDetailView recipe={recipe} />
      </Card>

      {/* Print Dialog */}
      <RecipePrintDialog
        isOpen={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        recipe={recipe}
      />
    </DashboardLayout>
  );
}