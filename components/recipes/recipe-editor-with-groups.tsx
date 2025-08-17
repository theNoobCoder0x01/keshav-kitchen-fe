"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ChefHat, 
  Package, 
  Settings, 
  Save,
  Eye,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { IngredientGroupManager } from "./ingredient-group-manager";
import { IngredientGroupAssignment } from "./ingredient-group-assignment";
import { RecipeDetailView } from "./recipe-detail-view";
import type { 
  RecipeDetailData, 
  IngredientGroup, 
  RecipeIngredientBase 
} from "@/types/recipes";

interface RecipeEditorWithGroupsProps {
  recipe: RecipeDetailData;
  onRecipeChange?: (recipe: RecipeDetailData) => void;
  onSave?: () => void;
  isEditing?: boolean;
  showPreview?: boolean;
}

export function RecipeEditorWithGroups({
  recipe: initialRecipe,
  onRecipeChange,
  onSave,
  isEditing = false,
  showPreview = false,
}: RecipeEditorWithGroupsProps) {
  const [recipe, setRecipe] = useState<RecipeDetailData>(initialRecipe);
  const [ingredientGroups, setIngredientGroups] = useState<IngredientGroup[]>(
    initialRecipe.ingredientGroups || []
  );
  const [ingredients, setIngredients] = useState<RecipeIngredientBase[]>(
    initialRecipe.ingredients || []
  );
  const [activeTab, setActiveTab] = useState(showPreview ? "preview" : "groups");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch ingredient groups when recipe ID changes
  useEffect(() => {
    if (recipe.id) {
      fetchIngredientGroups();
    }
  }, [recipe.id]);

  // Update parent component when recipe changes
  useEffect(() => {
    const updatedRecipe = {
      ...recipe,
      ingredients,
      ingredientGroups,
    };
    onRecipeChange?.(updatedRecipe);
  }, [recipe, ingredients, ingredientGroups, onRecipeChange]);

  const fetchIngredientGroups = async () => {
    if (!recipe.id) return;

    try {
      const response = await fetch(`/api/recipes/${recipe.id}/ingredient-groups`);
      if (!response.ok) throw new Error("Failed to fetch ingredient groups");

      const { ingredientGroups: groups } = await response.json();
      setIngredientGroups(groups);
    } catch (error) {
      console.error("Error fetching ingredient groups:", error);
      toast.error("Failed to load ingredient groups");
    }
  };

  const handleGroupsChange = (newGroups: IngredientGroup[]) => {
    setIngredientGroups(newGroups);
    setHasUnsavedChanges(true);
  };

  const handleIngredientsChange = (newIngredients: RecipeIngredientBase[]) => {
    setIngredients(newIngredients);
    setRecipe(prev => ({ ...prev, ingredients: newIngredients }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      toast.info("No changes to save");
      return;
    }

    setIsLoading(true);
    try {
      // Here you would typically save the recipe
      // This is a placeholder - implement according to your existing save logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setHasUnsavedChanges(false);
      onSave?.();
      toast.success("Recipe saved successfully");
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast.error("Failed to save recipe");
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupStats = () => {
    const totalGroups = ingredientGroups.length;
    const totalIngredients = ingredients.length;
    const groupedIngredients = ingredients.filter(ing => ing.groupId).length;
    const ungroupedIngredients = totalIngredients - groupedIngredients;

    return {
      totalGroups,
      totalIngredients,
      groupedIngredients,
      ungroupedIngredients,
    };
  };

  const stats = getGroupStats();

  if (!recipe.id) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <p>Recipe must be saved before managing ingredient groups</p>
            <p className="text-sm">Save your recipe first to enable grouping features</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Ingredient Groups Manager
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="ml-2">
                  Unsaved Changes
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {isEditing && (
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading || !hasUnsavedChanges}
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalGroups}</div>
              <div className="text-sm text-muted-foreground">Total Groups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalIngredients}</div>
              <div className="text-sm text-muted-foreground">Total Ingredients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.groupedIngredients}</div>
              <div className="text-sm text-muted-foreground">Grouped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.ungroupedIngredients}</div>
              <div className="text-sm text-muted-foreground">Ungrouped</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Manage Groups
          </TabsTrigger>
          <TabsTrigger value="assign" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Assign Ingredients
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create, edit, and organize ingredient groups for your recipe.
                Groups help organize ingredients by purpose (e.g., "Dough", "Filling", "Sauce").
              </p>
            </CardHeader>
            <CardContent>
              <IngredientGroupManager
                recipeId={recipe.id}
                ingredientGroups={ingredientGroups}
                ingredients={ingredients}
                onGroupsChange={handleGroupsChange}
                onIngredientsChange={handleIngredientsChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ingredient Assignment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Assign ingredients to groups or move them between groups. 
                Select multiple ingredients for bulk operations.
              </p>
            </CardHeader>
            <CardContent>
              <IngredientGroupAssignment
                recipeId={recipe.id}
                ingredients={ingredients}
                ingredientGroups={ingredientGroups}
                onIngredientsChange={handleIngredientsChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Preview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Preview how your recipe will look with ingredient groups.
                This shows the same view users will see on the recipe detail page.
              </p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/10">
                <RecipeDetailView
                  recipe={{
                    ...recipe,
                    ingredients,
                    ingredientGroups,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">How to Use Ingredient Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Create Groups</h4>
              <p className="text-muted-foreground">
                Start by creating logical groups like "Dough", "Filling", "Topping", etc. 
                Set sort orders to control display order.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Assign Ingredients</h4>
              <p className="text-muted-foreground">
                Move ingredients into appropriate groups using the assignment tab. 
                You can select multiple ingredients for bulk operations.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Preview Results</h4>
              <p className="text-muted-foreground">
                Use the preview tab to see how your recipe will look with grouped ingredients. 
                Groups are displayed in order with clear headers.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">4. Ungrouped Items</h4>
              <p className="text-muted-foreground">
                Ingredients without a group appear in an "Ungrouped" section. 
                This ensures backward compatibility with existing recipes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}