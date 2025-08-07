"use client";

import { AddRecipeDialog } from "@/components/dialogs/add-recipe-dialog";
import { ImportRecipesDialog } from "@/components/dialogs/import-recipes-dialog";
import { RecipePrintDialog } from "@/components/dialogs/recipe-print-dialog";
import type { RecipeDetailData } from "@/components/recipes/recipe-detail-view";
import { RecipesTable, RecipesTableSkeleton } from "@/components/recipes/recipes-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Filter, Plus, RefreshCw, Search, Upload } from "lucide-react";
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

  const { data: session } = useSession();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedRecipeForPrint, setSelectedRecipeForPrint] =
    useState<RecipeDetailData | null>(null);
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
  const [filterSubcategory, setFilterSubcategory] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true); // Filters open by default

  // Get unique categories and subcategories for filters
  const categories = [
    "all",
    ...new Set(recipes.map((recipe) => recipe.category)),
  ];
  const subcategories = [
    "all",
    ...new Set(recipes.map((recipe) => recipe.subcategory)),
  ];

  // Filter recipes based on search and filters
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" ||
      recipe.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesSubcategory =
      filterSubcategory === "all" ||
      recipe.subcategory.toLowerCase() === filterSubcategory.toLowerCase();

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Print handler
  const handlePrintRecipe = async (recipe: Recipe) => {
    try {
      // Fetch detailed recipe data from API
      const response = await fetch(`/api/recipes/${recipe.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch recipe details");
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

      setSelectedRecipeForPrint(recipeData);
      setIsPrintDialogOpen(true);
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      toast.error("Failed to load recipe details for printing");
    }
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
      try {
        if (editRecipe) {
          const { updateRecipe } = await import("@/lib/actions/recipes");
          result = await updateRecipe(editRecipe.selectedRecipe, payload);
        } else {
          const { createRecipe } = await import("@/lib/actions/recipes");
          result = await createRecipe(payload);
        }

        if (editRecipe) {
          getRecipes();
          toast.success("Recipe updated!");
        } else {
          // Transform the result to match the local Recipe interface
          const transformedRecipe: Recipe = {
            id: result.id,
            name: result.name,
            category: result.category,
            subcategory: result.subcategory || "",
            cost: 0, // Calculate cost from ingredients if needed
            ingredients:
              result.ingredients?.map((ing: any) => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                costPerUnit: ing.costPerUnit,
              })) || [],
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          };
          setRecipes((prev: Recipe[]) => [transformedRecipe, ...prev]);
          toast.success("Recipe added!");
        }
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditRecipe(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to save recipe.");
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
      // Transform the API recipes to match local Recipe interface
      const transformedRecipes: Recipe[] = recipesRes.map((recipe: any) => ({
        id: recipe.id,
        name: recipe.name,
        category: recipe.category,
        subcategory: recipe.subcategory || "",
        cost: 0, // Calculate from ingredients if needed
        ingredients:
          recipe.ingredients?.map((ing: any) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            costPerUnit: ing.costPerUnit,
          })) || [],
        createdAt: new Date(recipe.createdAt || Date.now()),
        updatedAt: new Date(recipe.updatedAt || Date.now()),
      }));
      setRecipes(transformedRecipes);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load recipes.");
    } finally {
      setLoading(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterSubcategory("all");
  };

  useEffect(() => {
    getRecipes();
  }, []);

  return (
    <div className="w-full flex flex-col gap-2 md:gap-4">
      {/* Header Section */}
      <div>
        <PageHeader
          title="Recipe Management"
          subtitle="Create, manage, and organize your kitchen recipes"
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Button
                className="bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Recipe
              </Button>
            </div>
          }
        />
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Search & Filter
          </CardTitle>
          <CardDescription>
            Find and filter recipes by name, category, and subcategory
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Basic Search */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            {(searchTerm ||
              filterCategory !== "all" ||
              filterSubcategory !== "all") && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 pt-2 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subcategory</label>
                <select
                  value={filterSubcategory}
                  onChange={(e) => setFilterSubcategory(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {subcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory === "all"
                        ? "All Subcategories"
                        : subcategory}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(searchTerm ||
            filterCategory !== "all" ||
            filterSubcategory !== "all") && (
            <div className="flex flex-wrap gap-2 pt-2">
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: &quot;{searchTerm}&quot;
                </Badge>
              )}
              {filterCategory !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Category: {filterCategory}
                </Badge>
              )}
              {filterSubcategory !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Subcategory: {filterSubcategory}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Recipes</h3>
          <Badge variant="outline" className="bg-card">
            {filteredRecipes.length} of {recipes.length}
          </Badge>
        </div>
      </div>

      {/* Recipes Table */}
      <div>
        {loading ? (
          <RecipesTableSkeleton />
        ) : (
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
            itemsPerPageOptions={[5, 10, 20, 50]}
          />
        )}
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
      <ImportRecipesDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={getRecipes}
      />
    </div>
  );
}
