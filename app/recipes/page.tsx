"use client";

import { AddRecipeDialog } from "@/components/dialogs/add-recipe-dialog";
import { ImportRecipesDialog } from "@/components/dialogs/import-recipes-dialog";
import { RecipePrintDialog } from "@/components/dialogs/recipe-print-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import type { RecipeDetailData } from "@/components/recipes/recipe-detail-view";
import { RecipesTable } from "@/components/recipes/recipes-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { EnhancedStatsGrid, createMenuStats } from "@/components/ui/enhanced-stats-grid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  ChefHat, 
  Clock, 
  TrendingUp,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";
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

  interface RecipeStats {
    total: number;
    byCategory: Record<string, number>;
    bySubcategory: Record<string, number>;
    averageCost: number;
    recentlyAdded: number;
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Calculate recipe statistics
  const calculateRecipeStats = (): RecipeStats => {
    const total = recipes.length;
    const byCategory: Record<string, number> = {};
    const bySubcategory: Record<string, number> = {};
    let totalCost = 0;
    let costCount = 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    let recentlyAdded = 0;

    recipes.forEach((recipe) => {
      // Category stats
      byCategory[recipe.category] = (byCategory[recipe.category] || 0) + 1;
      
      // Subcategory stats
      bySubcategory[recipe.subcategory] = (bySubcategory[recipe.subcategory] || 0) + 1;
      
      // Cost stats
      if (recipe.cost) {
        totalCost += recipe.cost;
        costCount++;
      }
      
      // Recently added stats
      if (new Date(recipe.createdAt) > oneWeekAgo) {
        recentlyAdded++;
      }
    });

    return {
      total,
      byCategory,
      bySubcategory,
      averageCost: costCount > 0 ? totalCost / costCount : 0,
      recentlyAdded,
    };
  };

  const recipeStats = calculateRecipeStats();

  // Get unique categories and subcategories for filters
  const categories = ["all", ...new Set(recipes.map((recipe) => recipe.category))];
  const subcategories = ["all", ...new Set(recipes.map((recipe) => recipe.subcategory))];

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

  // Create stats for the enhanced stats grid
  const getRecipeStatsForDisplay = () => {
    const topCategory = Object.entries(recipeStats.byCategory)
      .sort(([,a], [,b]) => b - a)[0];
    
    return [
      {
        label: "Total Recipes",
        value: recipeStats.total,
        icon: BookOpen,
        subtitle: "All recipes in database",
        color: 'primary' as const,
      },
      {
        label: "Top Category",
        value: topCategory ? topCategory[0] : "N/A",
        icon: ChefHat,
        subtitle: `${topCategory ? topCategory[1] : 0} recipes`,
        color: 'success' as const,
      },
      {
        label: "Avg Cost",
        value: `$${recipeStats.averageCost.toFixed(2)}`,
        icon: TrendingUp,
        subtitle: "Per recipe",
        color: 'warning' as const,
      },
      {
        label: "Recently Added",
        value: recipeStats.recentlyAdded,
        icon: Clock,
        subtitle: "Last 7 days",
        color: 'info' as const,
      },
    ];
  };

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

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterSubcategory("all");
  };

  useEffect(() => {
    getRecipes();
  }, []);

  if (loading) {
    return (
      <DashboardLayout activeMenuItem="recipe">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading recipes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenuItem="recipe">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
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
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Recipe
              </Button>
            </div>
          }
        />
      </div>

      {/* Statistics Dashboard */}
      <div className="mb-6 sm:mb-8">
        <EnhancedStatsGrid stats={getRecipeStatsForDisplay()} />
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Search & Filter
          </CardTitle>
          <CardDescription>
            Find and filter recipes by name, category, and subcategory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Search */}
          <div className="flex flex-col sm:flex-row gap-4">
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
            {(searchTerm || filterCategory !== "all" || filterSubcategory !== "all") && (
              <Button
                variant="ghost"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
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
                      {subcategory === "all" ? "All Subcategories" : subcategory}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(searchTerm || filterCategory !== "all" || filterSubcategory !== "all") && (
            <div className="flex flex-wrap gap-2 pt-2">
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{searchTerm}"
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
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Recipes</h3>
          <Badge variant="outline">
            {filteredRecipes.length} of {recipes.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing filtered results</span>
        </div>
      </div>

      {/* Recipes Table */}
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
          itemsPerPageOptions={[5, 10, 20, 50]}
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
      <ImportRecipesDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={getRecipes}
      />
    </DashboardLayout>
  );
}
