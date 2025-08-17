"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MenuIngredientGroup, MenuIngredient } from "@/types/menus";
import { Check, Move, Users } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";

interface MenuIngredientGroupAssignmentProps {
  menuId: string;
  ingredientGroups: MenuIngredientGroup[];
  ingredients: MenuIngredient[];
  onIngredientsChange: (ingredients: MenuIngredient[]) => void;
}

export function MenuIngredientGroupAssignment({
  menuId,
  ingredientGroups,
  ingredients,
  onIngredientsChange,
}: MenuIngredientGroupAssignmentProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Group ingredients by their current group
  const groupedIngredients = useMemo(() => {
    const grouped: { [key: string]: MenuIngredient[] } = {};
    
    // Add custom groups
    ingredientGroups.forEach(group => {
      grouped[group.name] = ingredients.filter(ing => ing.groupId === group.id);
    });
    
    // Add ungrouped ingredients
    const ungrouped = ingredients.filter(ing => !ing.groupId);
    if (ungrouped.length > 0) {
      grouped["Ungrouped"] = ungrouped;
    }
    
    return grouped;
  }, [ingredients, ingredientGroups]);

  const handleIngredientSelect = useCallback((ingredientId: string, checked: boolean) => {
    const newSelected = new Set(selectedIngredients);
    if (checked) {
      newSelected.add(ingredientId);
    } else {
      newSelected.delete(ingredientId);
    }
    setSelectedIngredients(newSelected);
  }, [selectedIngredients]);

  const handleSelectAllInGroup = useCallback((groupName: string, checked: boolean) => {
    const groupIngredients = groupedIngredients[groupName] || [];
    const newSelected = new Set(selectedIngredients);
    
    if (checked) {
      groupIngredients.forEach(ing => newSelected.add(ing.id!));
    } else {
      groupIngredients.forEach(ing => newSelected.delete(ing.id!));
    }
    
    setSelectedIngredients(newSelected);
  }, [groupedIngredients, selectedIngredients]);

  const handleAssignToGroup = useCallback(async () => {
    if (selectedIngredients.size === 0) {
      toast.error("Please select ingredients to assign");
      return;
    }

    if (!targetGroupId) {
      toast.error("Please select a target group");
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch("/api/menu-ingredients/assign-group", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientIds: Array.from(selectedIngredients),
          groupId: targetGroupId,
          menuId,
        }),
      });

      if (response.ok) {
        // Update local state
        const updatedIngredients = ingredients.map(ing => {
          if (selectedIngredients.has(ing.id!)) {
            const targetGroup = ingredientGroups.find(g => g.id === targetGroupId);
            return {
              ...ing,
              groupId: targetGroupId,
              group: targetGroup || null,
            };
          }
          return ing;
        });

        onIngredientsChange(updatedIngredients);
        setSelectedIngredients(new Set());
        setTargetGroupId(null);
        toast.success(`Assigned ${selectedIngredients.size} ingredients to group`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to assign ingredients to group");
      }
    } catch (error) {
      console.error("Error assigning ingredients to group:", error);
      toast.error("Failed to assign ingredients to group");
    } finally {
      setIsAssigning(false);
    }
  }, [selectedIngredients, targetGroupId, menuId, ingredients, ingredientGroups, onIngredientsChange]);

  const handleMoveToUngrouped = useCallback(async () => {
    if (selectedIngredients.size === 0) {
      toast.error("Please select ingredients to move");
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch("/api/menu-ingredients/assign-group", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientIds: Array.from(selectedIngredients),
          groupId: null,
          menuId,
        }),
      });

      if (response.ok) {
        // Update local state
        const updatedIngredients = ingredients.map(ing => {
          if (selectedIngredients.has(ing.id!)) {
            return {
              ...ing,
              groupId: null,
              group: null,
            };
          }
          return ing;
        });

        onIngredientsChange(updatedIngredients);
        setSelectedIngredients(new Set());
        toast.success(`Moved ${selectedIngredients.size} ingredients to ungrouped`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to move ingredients");
      }
    } catch (error) {
      console.error("Error moving ingredients:", error);
      toast.error("Failed to move ingredients");
    } finally {
      setIsAssigning(false);
    }
  }, [selectedIngredients, menuId, ingredients, onIngredientsChange]);

  const getGroupStats = useCallback((groupName: string) => {
    const groupIngredients = groupedIngredients[groupName] || [];
    const totalQuantity = groupIngredients.reduce((sum, ing) => sum + ing.quantity, 0);
    const totalCost = groupIngredients.reduce((sum, ing) => sum + (ing.costPerUnit * ing.quantity), 0);
    
    return {
      count: groupIngredients.length,
      totalQuantity,
      totalCost,
    };
  }, [groupedIngredients]);

  const sortedGroupNames = useMemo(() => {
    const names = Object.keys(groupedIngredients);
    return names.sort((a, b) => {
      if (a === "Ungrouped") return 1;
      if (b === "Ungrouped") return -1;
      return a.localeCompare(b);
    });
  }, [groupedIngredients]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Assign Ingredients to Groups
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assignment controls */}
        <div className="flex flex-wrap gap-3 items-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Assign to:</span>
            <select
              value={targetGroupId || ""}
              onChange={(e) => setTargetGroupId(e.target.value || null)}
              className="px-3 py-1 text-sm border rounded-md"
            >
              <option value="">Select a group</option>
              {ingredientGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleAssignToGroup}
            disabled={isAssigning || selectedIngredients.size === 0 || !targetGroupId}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Move className="w-4 h-4 mr-1" />
            Assign ({selectedIngredients.size})
          </Button>

          <Button
            onClick={handleMoveToUngrouped}
            disabled={isAssigning || selectedIngredients.size === 0}
            size="sm"
            variant="outline"
          >
            <Move className="w-4 h-4 mr-1" />
            Move to Ungrouped ({selectedIngredients.size})
          </Button>

          {selectedIngredients.size > 0 && (
            <Button
              onClick={() => setSelectedIngredients(new Set())}
              size="sm"
              variant="ghost"
            >
              Clear Selection
            </Button>
          )}
        </div>

        {/* Ingredient groups */}
        <div className="space-y-4">
          {sortedGroupNames.map(groupName => {
            const groupIngredients = groupedIngredients[groupName] || [];
            const stats = getGroupStats(groupName);
            const isUngrouped = groupName === "Ungrouped";
            
            // Check if all ingredients in this group are selected
            const allSelected = groupIngredients.length > 0 && 
              groupIngredients.every(ing => selectedIngredients.has(ing.id!));
            
            // Check if some ingredients in this group are selected
            const someSelected = groupIngredients.some(ing => selectedIngredients.has(ing.id!));

            return (
              <Card key={groupName} className={isUngrouped ? "border-dashed" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allSelected}
                        ref={(ref) => {
                          if (ref) ref.indeterminate = someSelected && !allSelected;
                        }}
                        onCheckedChange={(checked) => 
                          handleSelectAllInGroup(groupName, checked as boolean)
                        }
                      />
                      <h4 className="font-medium">
                        {groupName}
                        {isUngrouped && <span className="text-muted-foreground ml-2">(Default)</span>}
                      </h4>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats.count} ingredients • {stats.totalQuantity.toFixed(1)} total • ${stats.totalCost.toFixed(2)}
                    </div>
                  </div>

                  {groupIngredients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {groupIngredients.map(ingredient => (
                        <div
                          key={ingredient.id}
                          className={`flex items-center gap-2 p-2 rounded border ${
                            selectedIngredients.has(ingredient.id!)
                              ? "bg-primary/10 border-primary"
                              : "bg-background"
                          }`}
                        >
                          <Checkbox
                            checked={selectedIngredients.has(ingredient.id!)}
                            onCheckedChange={(checked) => 
                              handleIngredientSelect(ingredient.id!, checked as boolean)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {ingredient.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ingredient.quantity} {ingredient.unit} • ${(ingredient.costPerUnit * ingredient.quantity).toFixed(2)}
                            </p>
                          </div>
                          {selectedIngredients.has(ingredient.id!) && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No ingredients in this group</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {ingredients.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No ingredients available for assignment.</p>
            <p className="text-sm">Add ingredients to your menu first.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}