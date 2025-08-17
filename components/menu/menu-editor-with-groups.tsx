"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuIngredientGroup, MenuIngredient } from "@/types/menus";
import { groupMenuIngredientsByGroup, getSortedMenuGroupNames, hasCustomMenuGroups } from "@/lib/utils/menu-utils";
import { BookOpen, GripVertical, Users, Info, HelpCircle } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { MenuIngredientGroupManager } from "./menu-ingredient-group-manager";
import { MenuIngredientGroupAssignment } from "./menu-ingredient-group-assignment";

interface MenuEditorWithGroupsProps {
  menu: {
    id: string;
    date: Date;
    mealType: string;
    servings: number;
    ghanFactor: number;
    status: string;
    actualCount?: number;
    notes?: string;
    kitchen: {
      id: string;
      name: string;
    };
    recipe: {
      id: string;
      name: string;
      description?: string;
      category: string;
    };
    ingredients: MenuIngredient[];
    ingredientGroups?: MenuIngredientGroup[];
  };
  onMenuChange: (menu: any) => void;
  onSave: () => void;
  isEditing?: boolean;
}

export function MenuEditorWithGroups({
  menu,
  onMenuChange,
  onSave,
  isEditing = false,
}: MenuEditorWithGroupsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [ingredientGroups, setIngredientGroups] = useState<MenuIngredientGroup[]>(
    menu.ingredientGroups || []
  );
  const [ingredients, setIngredients] = useState<MenuIngredient[]>(
    menu.ingredients || []
  );

  // Group ingredients for display
  const groupedIngredients = useMemo(() => {
    return groupMenuIngredientsByGroup(ingredients, ingredientGroups);
  }, [ingredients, ingredientGroups]);

  const sortedGroupNames = useMemo(() => {
    return getSortedMenuGroupNames(groupedIngredients);
  }, [groupedIngredients]);

  const hasGroups = useMemo(() => {
    return hasCustomMenuGroups(ingredientGroups);
  }, [ingredientGroups]);

  const handleGroupsChange = useCallback((groups: MenuIngredientGroup[]) => {
    setIngredientGroups(groups);
    onMenuChange({
      ...menu,
      ingredientGroups: groups,
    });
  }, [menu, onMenuChange]);

  const handleIngredientsChange = useCallback((ingredients: MenuIngredient[]) => {
    setIngredients(ingredients);
    onMenuChange({
      ...menu,
      ingredients,
    });
  }, [menu, onMenuChange]);

  const calculateTotalCost = useCallback(() => {
    return ingredients.reduce((sum, ing) => sum + (ing.costPerUnit * ing.quantity), 0);
  }, [ingredients]);

  const calculateTotalQuantity = useCallback(() => {
    return ingredients.reduce((sum, ing) => sum + ing.quantity, 0);
  }, [ingredients]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{menu.recipe.name}</h2>
          <p className="text-muted-foreground">
            {menu.mealType} • {menu.kitchen.name} • {menu.date.toLocaleDateString()}
          </p>
        </div>
        {isEditing && (
          <Button onClick={onSave} className="bg-primary hover:bg-primary/90">
            Save Changes
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <GripVertical className="w-4 h-4" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="assignment" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Assignment
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Help
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ingredients.length}</div>
                <p className="text-xs text-muted-foreground">
                  {calculateTotalQuantity().toFixed(1)} total quantity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${calculateTotalCost().toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  ${(calculateTotalCost() / menu.servings).toFixed(2)} per serving
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ingredient Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ingredientGroups.length}</div>
                <p className="text-xs text-muted-foreground">
                  {hasGroups ? "Custom organization" : "Default grouping"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Grouped Ingredients Display */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients by Group</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedGroupNames.map(groupName => {
                const group = groupedIngredients[groupName];
                const totalQuantity = group.ingredients.reduce((sum, ing) => sum + ing.quantity, 0);
                const totalCost = group.ingredients.reduce((sum, ing) => sum + (ing.costPerUnit * ing.quantity), 0);

                return (
                  <div key={groupName} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-lg">
                        {groupName}
                        {groupName === "Ungrouped" && (
                          <span className="text-muted-foreground ml-2 text-sm">(Default)</span>
                        )}
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        {group.ingredients.length} ingredients • {totalQuantity.toFixed(1)} total • ${totalCost.toFixed(2)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.ingredients.map(ingredient => (
                        <div
                          key={ingredient.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{ingredient.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {ingredient.quantity} {ingredient.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(ingredient.costPerUnit * ingredient.quantity).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              ${ingredient.costPerUnit}/unit
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {ingredients.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No ingredients available.</p>
                  <p className="text-sm">Add ingredients to your menu first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <MenuIngredientGroupManager
            menuId={menu.id}
            ingredientGroups={ingredientGroups}
            ingredients={ingredients}
            onGroupsChange={handleGroupsChange}
            onIngredientsChange={handleIngredientsChange}
          />
        </TabsContent>

        {/* Assignment Tab */}
        <TabsContent value="assignment" className="space-y-4">
          <MenuIngredientGroupAssignment
            menuId={menu.id}
            ingredientGroups={ingredientGroups}
            ingredients={ingredients}
            onIngredientsChange={handleIngredientsChange}
          />
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                How to Use Ingredient Groups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <h4>What are Ingredient Groups?</h4>
                <p>
                  Ingredient groups help you organize your menu ingredients into logical categories 
                  like "Main Course", "Side Dish", "Dessert", etc. This makes it easier to:
                </p>
                <ul>
                  <li>Plan your meal preparation workflow</li>
                  <li>Calculate costs by category</li>
                  <li>Organize ingredients for shopping lists</li>
                  <li>Create more professional menu presentations</li>
                </ul>

                <h4>How to Get Started</h4>
                <ol>
                  <li>
                    <strong>Create Groups:</strong> Go to the "Groups" tab and create new ingredient groups 
                    with descriptive names like "Protein", "Vegetables", "Grains", etc.
                  </li>
                  <li>
                    <strong>Assign Ingredients:</strong> Use the "Assignment" tab to select ingredients 
                    and assign them to the appropriate groups.
                  </li>
                  <li>
                    <strong>Reorder Groups:</strong> Use the up/down arrows to arrange groups in the 
                    order you prefer for display.
                  </li>
                  <li>
                    <strong>View Results:</strong> Check the "Overview" tab to see your organized 
                    ingredients with costs and quantities per group.
                  </li>
                </ol>

                <h4>Tips for Effective Grouping</h4>
                <ul>
                  <li>Use consistent naming conventions across your menus</li>
                  <li>Group by preparation method (e.g., "Raw", "Cooked", "Prepared")</li>
                  <li>Consider grouping by dietary restrictions (e.g., "Vegan", "Gluten-Free")</li>
                  <li>Keep group names short and descriptive</li>
                </ul>

                <h4>Managing Groups</h4>
                <ul>
                  <li>You can edit group names at any time</li>
                  <li>Deleting a group moves all ingredients to "Ungrouped"</li>
                  <li>Groups are automatically sorted by the order you set</li>
                  <li>All changes are saved automatically</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}