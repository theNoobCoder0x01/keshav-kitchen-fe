"use client";

import { AddRecipeDialog } from "@/components/dialogs/add-recipe-dialog";
import { RecipePrintDialog } from "@/components/dialogs/recipe-print-dialog";
import {
  RecipesTable,
  RecipesTableSkeleton,
} from "@/components/recipes/recipes-table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/hooks/use-translations";
import api from "@/lib/api/axios";
import { createRecipe, updateRecipe } from "@/lib/api/recipes";
import type { RecipeDetailData } from "@/types";
import { Filter, Plus, RefreshCw, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RecipesPage() {
  // Define interfaces for type safety
  type Recipe = import("@/types/recipes").RecipeListItem;

  const { t } = useTranslations();
  const { data: session } = useSession();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
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
    instructions?: string | null;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSubcategory, setFilterSubcategory] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true); // Filters open by default
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Get unique categories for filters
  const categories = ["all", ...availableCategories];
  const subcategories = ["all", ...availableSubcategories];

  // Print handler
  const handlePrintRecipe = async (recipe: Recipe) => {
    try {
      // Fetch detailed recipe data from API
      const response = await api.get(`/recipes/${recipe.id}/`);
      if (
        !response.status ||
        (response.status !== 200 && response.status !== 201)
      ) {
        throw new Error("Failed to fetch recipe details");
      }

      const detailedRecipe = await response.data;

      // Transform the data to match RecipeDetailData interface
      const recipeData: RecipeDetailData = {
        id: detailedRecipe.id,
        name: detailedRecipe.name,
        description: detailedRecipe.description,
        instructions: detailedRecipe.instructions,
        preparedQuantity: detailedRecipe.preparedQuantity,
        preparedQuantityUnit: detailedRecipe.preparedQuantityUnit,
        servingQuantity: detailedRecipe.servingQuantity,
        servingQuantityUnit: detailedRecipe.servingQuantityUnit,
        quantityPerPiece: detailedRecipe.quantityPerPiece,
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
      toast.error(t("messages.loadRecipeDetailsError"));
    }
  };

  // Delete handler
  const handleDeleteRecipe = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await api.delete(`/recipes/${id}/`);

      if (
        !response.status ||
        (response.status !== 200 &&
          response.status !== 204 &&
          response.status !== 201)
      ) {
        throw new Error(`Error: ${response.status}`);
      }

      setRecipes((prevRecipes) => prevRecipes.filter((r) => r.id !== id));
      toast.success(t("messages.recipeDeleted"), {
        description: t("messages.recipeDeletedDescription", {
          name: recipes.find((r) => r.id === id)?.name,
        }),
      });
    } catch (error) {
      toast.error(t("common.error"), {
        description: t("messages.recipeDeleteError"),
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
      toast.error(t("common.error"), {
        description: t("recipes.nameRequired"),
      });
      return;
    }

    if (!data.category || data.category.trim() === "") {
      toast.error(t("common.error"), {
        description: t("recipes.categoryRequired"),
      });
      return;
    }

    if (!data.subcategory || data.subcategory.trim() === "") {
      toast.error(t("common.error"), {
        description: t("recipes.subcategoryRequired"),
      });
      return;
    }

    if (!data.subcategory || data.subcategory.trim() === "") {
      toast.error(t("common.error"), {
        description: t("recipes.subcategoryRequired"),
      });
      return;
    }

    if (!data.ingredients || data.ingredients.length === 0) {
      toast.error(t("common.error"), {
        description: t("recipes.ingredientsRequired"),
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
      groupId: ingredient.groupId || null,
    }));

    try {
      const userId = session?.user?.id;
      if (!userId) {
        toast.error(t("common.error"), {
          description: t("messages.userNotAuthenticated"),
        });
        return;
      }
      const payload = {
        name: data.name,
        category: data.category,
        subcategory: data.subcategory,
        preparedQuantity: data.preparedQuantity
          ? parseFloat(data.preparedQuantity) || undefined
          : undefined,
        preparedQuantityUnit: data.preparedQuantityUnit || undefined,
        servingQuantity: data.servingQuantity
          ? parseFloat(data.servingQuantity) || undefined
          : undefined,
        servingQuantityUnit: data.servingQuantityUnit || undefined,
        quantityPerPiece: data.quantityPerPiece
          ? parseFloat(data.quantityPerPiece) || undefined
          : undefined,
        ingredients: parsedIngredients,
        ingredientGroups: data.ingredientGroups || [],
        instructions: data.instructions ?? undefined,
        user: { connect: { id: userId } },
      };
      let result;
      try {
        if (editRecipe) {
          result = await updateRecipe(editRecipe.selectedRecipe, payload);
        } else {
          result = await createRecipe(payload);
        }

        if (editRecipe) {
          getRecipes();
          toast.success(t("messages.recipeUpdated"));
        } else {
          // Transform the result to match the local Recipe interface
          const transformedRecipe: Recipe = {
            id: result!.id,
            name: result!.name,
            category: result!.category,
            subcategory: result!.subcategory || "",
            cost: 0,
            instructions: result!.instructions ?? null,
            createdAt: result!.createdAt,
            updatedAt: result!.updatedAt,
          };
          setRecipes((prev: Recipe[]) => [transformedRecipe, ...prev]);
          toast.success(t("messages.recipeAdded"));
        }
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditRecipe(null);
      } catch (err: any) {
        toast.error(err.message || t("messages.failedToSaveRecipe"));
      }
    } catch (err) {
      toast.error(t("messages.failedToSaveRecipe"));
    }
  };

  const getRecipes = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    subcategory?: string;
  }) => {
    // Cancel previous request if it exists
    if (abortController) {
      abortController.abort();
    }

    // Create new abort controller for this request
    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    setLoading(true);
    setError(null);
    try {
      const { fetchRecipes } = await import("@/lib/api/recipes");
      const response = await fetchRecipes(params, newAbortController.signal);

      // Transform the API recipes to match local Recipe interface
      const transformedRecipes: Recipe[] = response.recipes.map((recipe: any) => ({
        id: recipe.id,
        name: recipe.name,
        category: recipe.category,
        subcategory: recipe.subcategory || "",
        cost: 0,
        instructions: recipe.instructions ?? null,
        createdAt: new Date(recipe.createdAt || Date.now()),
        updatedAt: new Date(recipe.updatedAt || Date.now()),
      }));

      setRecipes(transformedRecipes);
      setTotalCount(response.pagination.totalCount);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
      setItemsPerPage(response.pagination.limit);
    } catch (err: any) {
      // Don't show error for aborted requests
      if (err.name === 'AbortError') {
        console.log('Recipes fetch request was cancelled');
        return;
      }
      console.error("Error fetching data:", err);
      toast.error(t("messages.failedToLoadRecipes"));
    } finally {
      setLoading(false);
      // Clear abort controller if this is the current one
      if (abortController === newAbortController) {
        setAbortController(null);
      }
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterSubcategory("all");
  };

  // Fetch filter options on component mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const { fetchRecipeFilters } = await import("@/lib/api/recipes");
        const filters = await fetchRecipeFilters();
        setAvailableCategories(filters.categories);
        setAvailableSubcategories(filters.subcategories);
      } catch (error: any) {
        // Don't show error for aborted requests
        if (error.name === 'AbortError') {
          console.log('Filter loading request was cancelled');
          return;
        }
        console.error("Error loading filters:", error);
        // Fallback to default values if API fails
        setAvailableCategories(["Breakfast", "Lunch", "Dinner", "Snacks"]);
        setAvailableSubcategories(["Veg", "Non-Veg", "Sweet", "Savory"]);
      }
    };

    loadFilters();
  }, []);

  useEffect(() => {
    getRecipes({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
      category: filterCategory,
      subcategory: filterSubcategory,
    });
  }, [currentPage, itemsPerPage, searchTerm, filterCategory, filterSubcategory]);

  // Cleanup effect to cancel any pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  return (
    <div className="w-full flex flex-col gap-2 md:gap-4">
      {/* Header Section */}
      <div>
        <PageHeader
          title={t("recipes.management")}
          subtitle={t("recipes.managementSubtitle")}
          actions={
            <div className="flex items-center gap-3">
              <Button
                className="bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t("recipes.addRecipe")}
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
            {t("recipes.searchAndFilter")}
          </CardTitle>
          <CardDescription>
            {t("recipes.searchAndFilterDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Basic Search */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("recipes.searchPlaceholder")}
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
              {t("recipes.filters")}
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
                {t("recipes.clear")}
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 pt-2 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("recipes.category")}
                </label>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("recipes.category")} />
                  </SelectTrigger>
                  <SelectContent searchable>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all"
                          ? t("recipes.allCategories")
                          : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("recipes.subcategory")}
                </label>
                <Select
                  value={filterSubcategory}
                  onValueChange={setFilterSubcategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("recipes.subcategory")} />
                  </SelectTrigger>
                  <SelectContent searchable>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory === "all"
                          ? t("recipes.allSubcategories")
                          : subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  {t("recipes.search")}: &quot;{searchTerm}&quot;
                </Badge>
              )}
              {filterCategory !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("recipes.category")}: {filterCategory}
                </Badge>
              )}
              {filterSubcategory !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("recipes.subcategory")}: {filterSubcategory}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{t("recipes.title")}</h3>
          <Badge variant="outline" className="bg-card">
            {recipes.length} {t("common.of")} {totalCount}
          </Badge>
        </div>
      </div>

      {/* Recipes Table */}
      <div>
        {loading ? (
          <RecipesTableSkeleton />
        ) : (
          <RecipesTable
            recipes={recipes}
            onEdit={(recipe) => {
              setEditRecipe({
                recipeName: recipe.name,
                category: recipe.category,
                subcategory: recipe.subcategory || "",
                selectedRecipe: recipe.id,
                ingredients: [], // This will be overridden by fetched data
                instructions: recipe.instructions ?? null,
              });
              setIsEditDialogOpen(true);
            }}
            onDelete={handleDeleteRecipe}
            onPrint={handlePrintRecipe}
            deletingId={deletingId}
            itemsPerPageOptions={[10, 20, 50]}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              getRecipes({
                page,
                limit: itemsPerPage,
                search: searchTerm,
                category: filterCategory,
                subcategory: filterSubcategory,
              });
            }}
            onItemsPerPageChange={(limit) => {
              setItemsPerPage(limit);
              setCurrentPage(1);
              getRecipes({
                page: 1,
                limit,
                search: searchTerm,
                category: filterCategory,
                subcategory: filterSubcategory,
              });
            }}
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
        isEditMode={true}
        recipeId={editRecipe?.selectedRecipe}
      />
      <RecipePrintDialog
        isOpen={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        recipe={selectedRecipeForPrint}
      />
    </div>
  );
}
