"use client";

import { AddRecipeDialog } from "@/components/dialogs/add-recipe-dialog";
import { RecipePrintDialog } from "@/components/dialogs/recipe-print-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { RecipesTable } from "@/components/recipes/recipes-table";
import type { RecipeDetailData } from "@/components/recipes/recipe-detail-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { toast } from "sonner";

export default function RecipesPage() {
  // Define interfaces for type safety
  interface Recipe {
    id: string;
    name: string;
    category: string;
    subcategory: string;
    cost: number;
    ingredients?: Array<{
      name: string;
      quantity: number | string;
      unit: string;
      costPerUnit?: number | string;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }

  interface Stat {
    label: string;
    value: string;
    icon: any; // Temporary workaround for LucideIcon compatibility
    iconColor: string;
  }

  const { data: session } = useSession();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedRecipeForPrint, setSelectedRecipeForPrint] = useState<RecipeDetailData | null>(null);
  const [editRecipe, setEditRecipe] = useState<{
    recipeName: string;
    category: string;
    subcategory: string;
    selectedRecipe: string;
    ingredients: Array<{
      name: string;
      quantity: string;
      unit: string;
      costPerUnit: string;
    }>;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Filter recipes based on search and category filter
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" ||
      recipe.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Unique categories for filter dropdown
  const categories = [
    "all",
    ...new Set(recipes.map((recipe) => recipe.category)),
  ];

  // Print handler
  const handlePrintRecipe = async (recipe: Recipe) => {
    try {
      // Fetch detailed recipe data from API
      const response = await fetch(`/api/recipes/${recipe.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
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

      setSelectedRecipeForPrint(recipeData);
      setIsPrintDialogOpen(true);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      toast.error('Failed to load recipe details for printing');
    }
  };

  // Edit handler
  const handleEditRecipe = (recipe: Recipe) => {
    setEditRecipe({
      recipeName: recipe.name,
      category: recipe.category,
      subcategory: recipe.subcategory,
      selectedRecipe: recipe.name,
      ingredients: recipe.ingredients
        ? recipe.ingredients.map((ing) => ({
            name: ing.name,
            quantity: String(ing.quantity),
            unit: ing.unit,
            costPerUnit: ing.costPerUnit ? String(ing.costPerUnit) : "",
          }))
        : [],
    });
    setIsEditDialogOpen(true);
  };

  // Delete handler
  const handleDeleteRecipe = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      setRecipes((prevRecipes) => prevRecipes.filter((r) => r.id !== id));
      toast.success("Recipe deleted", {
        description: `${recipes.find((r) => r.id === id)?.name} has been deleted successfully.`,
      });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to delete recipe. Please try again.",
      });
      console.error("Failed to delete recipe:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // Save handler (for both add and edit)
  const handleSaveRecipe = async (data: any) => {
    // Validate required fields
    if (!data.name || data.name.trim() === "") {
      toast.error("Error", {
        description: "Recipe name is required.",
      });
      return;
    }

    if (!data.category || data.category.trim() === "") {
      toast.error("Error", {
        description: "Recipe category is required.",
      });
      return;
    }

    if (!data.subcategory || data.subcategory.trim() === "") {
      toast.error("Error", {
        description: "Recipe subcategory is required.",
      });
      return;
    }

    if (!data.subcategory || data.subcategory.trim() === "") {
      toast.error("Error", {
        description: "Subcategory is required for a recipe.",
      });
      return;
    }

    if (!data.ingredients || data.ingredients.length === 0) {
      toast.error("Error", {
        description: "At least one ingredient is required.",
      });
      return;
    }

    // Parse ingredients to ensure numeric values for quantity and costPerUnit
    const parsedIngredients = data.ingredients.map((ingredient: any) => ({
      name: ingredient.name,
      quantity: parseFloat(ingredient.quantity) || 0,
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit
        ? parseFloat(ingredient.costPerUnit) || 0
        : undefined,
    }));

    try {
      const userId = session?.user?.id;
      if (!userId) {
        toast.error("Error", {
          description: "User not authenticated.",
        });
        return;
      }
      const payload = {
        name: data.name,
        category: data.category,
        subcategory: data.subcategory,
        ingredients: parsedIngredients,
        user: { connect: { id: userId } },
      };
      let result;
      if (editRecipe) {
        const { updateRecipe } = await import("@/lib/api/recipes");
        result = await updateRecipe(editRecipe.selectedRecipe, payload);
      } else {
        const { createRecipe } = await import("@/lib/api/recipes");
        result = await createRecipe(payload);
      }
      if (!result.error) {
        if (editRecipe) {
          getRecipes();
          toast.success("Recipe updated!");
        } else {
          setRecipes((prev: Recipe[]) => [result, ...prev]);
          toast.success("Recipe added!");
        }
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditRecipe(null);
      } else {
        toast.error(result.error || "Failed to save recipe.");
      }
    } catch (err) {
      toast.error("Failed to save recipe.");
    }
  };

  const getRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recipesRes] = await Promise.all([
        import("@/lib/api/recipes").then((m) => m.fetchRecipes()),
      ]);
      setRecipes(recipesRes);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load recipes.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getRecipes();
  }, []);

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
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Recipe
            </Button>
          }
        />
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="relative w-[180px]">
          <Input
            placeholder="Filter by category"
            value={filterCategory === "all" ? "" : filterCategory}
            onChange={(e) => setFilterCategory(e.target.value || "all")}
            list="filter-categories"
            className="w-full"
          />
          <datalist id="filter-categories">
            {categories
              .filter((cat) => cat && cat !== "all" && cat.trim() !== "")
              .map((category) => (
                <option key={category} value={category} />
              ))}
          </datalist>
        </div>
      </div>

      {/* Recipes Section */}
      <div className="space-y-6">
        <RecipesTable
          recipes={filteredRecipes}
          onEdit={(recipe) => {
            setEditRecipe({
              recipeName: recipe.name,
              category: recipe.category,
              subcategory: recipe.subcategory,
              selectedRecipe: recipe.id,
              ingredients: (recipe.ingredients || []).map((ingredient) => ({
                name: ingredient.name,
                quantity: ingredient.quantity.toString(),
                unit: ingredient.unit,
                costPerUnit: (ingredient.costPerUnit || "").toString(),
              })),
            });
            setIsEditDialogOpen(true);
          }}
          onDelete={handleDeleteRecipe}
          onPrint={handlePrintRecipe}
          deletingId={deletingId}
          itemsPerPageOptions={[5, 10, 20]}
        />
      </div>

      {/* Dialogs */}
      <AddRecipeDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleSaveRecipe}
      />
      <AddRecipeDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveRecipe}
        initialRecipe={editRecipe || null}
      />
      <RecipePrintDialog
        isOpen={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        recipe={selectedRecipeForPrint}
      />
    </DashboardLayout>
  );
}
