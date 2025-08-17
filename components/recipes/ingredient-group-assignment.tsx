"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Package, 
  MoreVertical, 
  Move3D, 
  ChefHat,
  Users
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  groupIngredientsByGroup,
  getSortedGroupNames,
} from "@/lib/utils/recipe-utils";
import type { IngredientGroup, RecipeIngredientBase } from "@/types/recipes";

interface IngredientGroupAssignmentProps {
  recipeId: string;
  ingredients: RecipeIngredientBase[];
  ingredientGroups: IngredientGroup[];
  onIngredientsChange: (ingredients: RecipeIngredientBase[]) => void;
}

export function IngredientGroupAssignment({
  recipeId,
  ingredients,
  ingredientGroups,
  onIngredientsChange,
}: IngredientGroupAssignmentProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const groupedIngredients = groupIngredientsByGroup(ingredients, ingredientGroups);
  const sortedGroupNames = getSortedGroupNames(groupedIngredients);

  const handleIngredientSelection = (ingredientId: string, checked: boolean) => {
    const newSelected = new Set(selectedIngredients);
    if (checked) {
      newSelected.add(ingredientId);
    } else {
      newSelected.delete(ingredientId);
    }
    setSelectedIngredients(newSelected);
  };

  const handleSelectAllInGroup = (groupName: string, checked: boolean) => {
    const groupIngredients = groupedIngredients[groupName].ingredients;
    const newSelected = new Set(selectedIngredients);
    
    groupIngredients.forEach(ingredient => {
      if (ingredient.id) {
        if (checked) {
          newSelected.add(ingredient.id);
        } else {
          newSelected.delete(ingredient.id);
        }
      }
    });
    
    setSelectedIngredients(newSelected);
  };

  const handleAssignToGroup = async (targetGroupId: string | null) => {
    if (selectedIngredients.size === 0) {
      toast.error("Please select ingredients to assign");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/ingredients/assign-group", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientIds: Array.from(selectedIngredients),
          groupId: targetGroupId,
          recipeId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign ingredients");
      }

      const result = await response.json();
      
      // Update local state
      const updatedIngredients = ingredients.map(ingredient => {
        if (ingredient.id && selectedIngredients.has(ingredient.id)) {
          return { ...ingredient, groupId: targetGroupId };
        }
        return ingredient;
      });

      onIngredientsChange(updatedIngredients);
      setSelectedIngredients(new Set());
      toast.success(result.message);
    } catch (error) {
      console.error("Error assigning ingredients:", error);
      toast.error(error instanceof Error ? error.message : "Failed to assign ingredients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveIngredient = async (ingredientId: string, targetGroupId: string | null) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ingredients/assign-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientId,
          groupId: targetGroupId,
          recipeId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to move ingredient");
      }

      const result = await response.json();
      
      // Update local state
      const updatedIngredients = ingredients.map(ingredient => {
        if (ingredient.id === ingredientId) {
          return { ...ingredient, groupId: targetGroupId };
        }
        return ingredient;
      });

      onIngredientsChange(updatedIngredients);
      toast.success(result.message);
    } catch (error) {
      console.error("Error moving ingredient:", error);
      toast.error(error instanceof Error ? error.message : "Failed to move ingredient");
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupOptions = () => {
    const options = [
      { value: "", label: "Ungrouped" },
      ...ingredientGroups.map(group => ({
        value: group.id,
        label: group.name,
      })),
    ];
    return options;
  };

  const isGroupSelected = (groupName: string) => {
    const groupIngredients = groupedIngredients[groupName].ingredients;
    return groupIngredients.every(ingredient => 
      ingredient.id && selectedIngredients.has(ingredient.id)
    );
  };

  const isGroupPartiallySelected = (groupName: string) => {
    const groupIngredients = groupedIngredients[groupName].ingredients;
    return groupIngredients.some(ingredient => 
      ingredient.id && selectedIngredients.has(ingredient.id)
    ) && !isGroupSelected(groupName);
  };

  if (ingredients.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No ingredients to organize</p>
            <p className="text-sm">Add ingredients to your recipe first</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Assignment Controls */}
      {selectedIngredients.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {selectedIngredients.size} selected
              </Badge>
              
              <Select onValueChange={(value) => handleAssignToGroup(value || null)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Assign to group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ungrouped</SelectItem>
                  {ingredientGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => setSelectedIngredients(new Set())}
                disabled={isLoading}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped Ingredients */}
      <div className="space-y-4">
        {sortedGroupNames.map(groupName => {
          const group = groupedIngredients[groupName];
          const groupObj = ingredientGroups.find(g => g.id === group.groupId);
          
          return (
            <Card key={groupName}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <Checkbox
                    checked={isGroupSelected(groupName)}
                    onCheckedChange={(checked) => 
                      handleSelectAllInGroup(groupName, checked === true)
                    }
                    ref={(el) => {
                      if (el && isGroupPartiallySelected(groupName)) {
                        el.indeterminate = true;
                      }
                    }}
                  />
                  <Package className="w-5 h-5" />
                  <span>{groupName}</span>
                  <Badge variant="outline" className="ml-auto">
                    {group.ingredients.length} ingredients
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.ingredients.map((ingredient, index) => (
                    <div
                      key={ingredient.id || index}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <Checkbox
                        checked={ingredient.id ? selectedIngredients.has(ingredient.id) : false}
                        onCheckedChange={(checked) => {
                          if (ingredient.id) {
                            handleIngredientSelection(ingredient.id, checked === true);
                          }
                        }}
                        disabled={!ingredient.id}
                      />
                      
                      <div className="flex-1">
                        <div className="font-medium">{ingredient.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {ingredient.quantity} {ingredient.unit}
                          {ingredient.costPerUnit && (
                            <span className="ml-2">
                              • ₹{ingredient.costPerUnit.toFixed(2)} per {ingredient.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={!ingredient.id}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => ingredient.id && handleMoveIngredient(ingredient.id, null)}
                            disabled={!ingredient.id || group.groupId === null}
                          >
                            <Move3D className="w-4 h-4 mr-2" />
                            Move to Ungrouped
                          </DropdownMenuItem>
                          {ingredientGroups.map(targetGroup => (
                            <DropdownMenuItem
                              key={targetGroup.id}
                              onClick={() => ingredient.id && handleMoveIngredient(ingredient.id, targetGroup.id)}
                              disabled={!ingredient.id || group.groupId === targetGroup.id}
                            >
                              <Move3D className="w-4 h-4 mr-2" />
                              Move to {targetGroup.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sortedGroupNames.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No ingredient groups yet</p>
              <p className="text-sm">Create groups to organize your ingredients</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}