"use client";

import { AddRecipeDialog } from "@/components/dialogs/add-recipe-dialog";
import { RecipePrintDialog } from "@/components/dialogs/recipe-print-dialog";
import { ImportRecipesDialog } from "@/components/dialogs/import-recipes-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { RecipesTable } from "@/components/recipes/recipes-table";
import type { RecipeDetailData } from "@/components/recipes/recipe-detail-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileSpreadsheet, Search, Filter, ChefHat, Users, DollarSign } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RecipesPage() {
  const { data: session } = useSession();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedRecipeForPrint, setSelectedRecipeForPrint] = useState<RecipeDetailData | null>(null);
  const [editRecipe, setEditRecipe] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
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

  // Recipe stats
  const recipeStats = {
    total: recipes.length,
    categories: new Set(recipes.map(r => r.category)).size,
    avgCost: recipes.length > 0 
      ? recipes.reduce((sum, r) => sum + (r.cost || 0), 0) / recipes.length 
      : 0,
  };

  // Print handler
  const handlePrintRecipe = async (recipe: any) => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
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

      setSelectedRecipeForPrint(recipeData);
      setIsPrintDialogOpen(true);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      toast.error('Failed to load recipe details for printing');
    }
  };

  // Edit handler
  const handleEditRecipe = (recipe: any) => {
    setEditRecipe({
      recipeName: recipe.name,
      category: recipe.category,
      subcategory: recipe.subcategory,
      selectedRecipe: recipe.name,
      ingredients: recipe.ingredients
        ? recipe.ingredients.map((ing: any) => ({
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
      toast.success("Recipe deleted successfully");
    } catch (error) {
      toast.error("Failed to delete recipe. Please try again.");
      console.error("Failed to delete recipe:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // Save handler
  const handleSaveRecipe = async (data: any) => {
    if (!data.name || data.name.trim() === "") {
      toast.error("Recipe name is required");
      return;
    }

    if (!data.category || data.category.trim() === "") {
      toast.error("Recipe category is required");
      return;
    }

    if (!data.subcategory || data.subcategory.trim() === "") {
      toast.error("Recipe subcategory is required");
      return;
    }

    if (!data.ingredients || data.ingredients.length === 0) {
      toast.error("At least one ingredient is required");
      return;
    }

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
        toast.error("User not authenticated");
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
          toast.success("Recipe updated successfully!");
        } else {
          setRecipes((prev: any[]) => [result, ...prev]);
          toast.success("Recipe added successfully!");
        }
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditRecipe(null);
      } else {
        toast.error(result.error || "Failed to save recipe");
      }
    } catch (err) {
      toast.error("Failed to save recipe");
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
      toast.error("Failed to load recipes");
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
      <PageHeader
        title="Recipe Management"
        subtitle="Create, organize, and manage your kitchen recipes with ease"
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
              className="border-primary/20 text-primary hover:bg-primary/10 glass btn-hover"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Button
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg btn-hover"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Recipe
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="glass border-0 shadow-modern card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="body-small text-muted-foreground font-medium mb-2">
                  Total Recipes
                </p>
                <p className="text-3xl font-bold">{recipeStats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center border border-primary/10">
                <ChefHat className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-modern card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="body-small text-muted-foreground font-medium mb-2">
                  Categories
                </p>
                <p className="text-3xl font-bold">{recipeStats.categories}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl flex items-center justify-center border border-green-500/10">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-modern card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="body-small text-muted-foreground font-medium mb-2">
                  Avg Cost
                </p>
                <p className="text-3xl font-bold">₹{recipeStats.avgCost.toFixed(0)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl flex items-center justify-center border border-orange-500/10">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <Card className="glass border-0 shadow-modern mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 focus-ring"
              />
            </div>
            <div className="relative w-full sm:w-[200px]">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filter by category"
                value={filterCategory === "all" ? "" : filterCategory}
                onChange={(e) => setFilterCategory(e.target.value || "all")}
                list="filter-categories"
                className="pl-10 focus-ring"
              />
              <datalist id="filter-categories">
                {categories
                  .filter((cat) => cat && cat !== "all" && cat.trim() !== "")
                  .map((category) => (
                    <option key={category} value={category} />
                  ))}
              </datalist>
            </div>
            {(searchTerm || filterCategory !== "all") && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="animate-fade-in">
                  {filteredRecipes.length} results
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory("all");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recipes Table */}
      <Card className="glass border-0 shadow-modern">
        <RecipesTable
          recipes={filteredRecipes}
          onEdit={handleEditRecipe}
          onDelete={handleDeleteRecipe}
          onPrint={handlePrintRecipe}
          deletingId={deletingId}
          itemsPerPageOptions={[10, 25, 50]}
        />
      </Card>

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