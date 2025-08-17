"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MenuIngredientGroup, MenuIngredient } from "@/types/menus";
import { GripVertical, Plus, Trash2, Edit, X } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface MenuIngredientGroupManagerProps {
  menuId: string;
  ingredientGroups: MenuIngredientGroup[];
  ingredients: MenuIngredient[];
  onGroupsChange: (groups: MenuIngredientGroup[]) => void;
  onIngredientsChange: (ingredients: MenuIngredient[]) => void;
}

export function MenuIngredientGroupManager({
  menuId,
  ingredientGroups,
  ingredients,
  onGroupsChange,
  onIngredientsChange,
}: MenuIngredientGroupManagerProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGroup = useCallback(async () => {
    if (!newGroupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (ingredientGroups.some(g => g.name.toLowerCase() === newGroupName.trim().toLowerCase())) {
      toast.error("Group name already exists");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`/api/menus/${menuId}/ingredient-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
        }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        onGroupsChange([...ingredientGroups, newGroup]);
        setNewGroupName("");
        toast.success("Ingredient group created successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create ingredient group");
      }
    } catch (error) {
      console.error("Error creating ingredient group:", error);
      toast.error("Failed to create ingredient group");
    } finally {
      setIsCreating(false);
    }
  }, [newGroupName, ingredientGroups, menuId, onGroupsChange]);

  const handleUpdateGroup = useCallback(async (groupId: string, newName: string) => {
    if (!newName.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (ingredientGroups.some(g => g.id !== groupId && g.name.toLowerCase() === newName.trim().toLowerCase())) {
      toast.error("Group name already exists");
      return;
    }

    try {
      const response = await fetch(`/api/menus/${menuId}/ingredient-groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
        }),
      });

      if (response.ok) {
        const updatedGroup = await response.json();
        onGroupsChange(
          ingredientGroups.map(g => g.id === groupId ? updatedGroup : g)
        );
        setEditingGroup(null);
        setEditValue("");
        toast.success("Ingredient group updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update ingredient group");
      }
    } catch (error) {
      console.error("Error updating ingredient group:", error);
      toast.error("Failed to update ingredient group");
    }
  }, [ingredientGroups, menuId, onGroupsChange]);

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    if (!window.confirm("Are you sure you want to delete this group? All ingredients will be moved to 'Ungrouped'.")) {
      return;
    }

    try {
      const response = await fetch(`/api/menus/${menuId}/ingredient-groups/${groupId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Move ingredients to ungrouped
        const updatedIngredients = ingredients.map(ing => 
          ing.groupId === groupId ? { ...ing, groupId: null, group: null } : ing
        );
        onIngredientsChange(updatedIngredients);
        
        // Remove group from list
        onGroupsChange(ingredientGroups.filter(g => g.id !== groupId));
        toast.success("Ingredient group deleted successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete ingredient group");
      }
    } catch (error) {
      console.error("Error deleting ingredient group:", error);
      toast.error("Failed to delete ingredient group");
    }
  }, [ingredientGroups, ingredients, menuId, onGroupsChange, onIngredientsChange]);

  const handleReorderGroups = useCallback(async (groupId: string, direction: "up" | "down") => {
    const currentIndex = ingredientGroups.findIndex(g => g.id === groupId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= ingredientGroups.length) return;

    const newGroups = [...ingredientGroups];
    const [movedGroup] = newGroups.splice(currentIndex, 1);
    newGroups.splice(newIndex, 0, movedGroup);

    // Update sort orders
    const updatedGroups = newGroups.map((group, index) => ({
      ...group,
      sortOrder: index,
    }));

    onGroupsChange(updatedGroups);

    // Update sort orders in database
    try {
      await Promise.all(
        updatedGroups.map(group =>
          fetch(`/api/menus/${menuId}/ingredient-groups/${group.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: group.name,
              sortOrder: group.sortOrder,
            }),
          })
        )
      );
    } catch (error) {
      console.error("Error updating sort orders:", error);
      toast.error("Failed to update group order");
    }
  }, [ingredientGroups, menuId, onGroupsChange]);

  const startEditing = useCallback((group: MenuIngredientGroup) => {
    setEditingGroup(group.id);
    setEditValue(group.name);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingGroup(null);
    setEditValue("");
  }, []);

  const getGroupStats = useCallback((groupId: string) => {
    const groupIngredients = ingredients.filter(ing => ing.groupId === groupId);
    const totalQuantity = groupIngredients.reduce((sum, ing) => sum + ing.quantity, 0);
    const totalCost = groupIngredients.reduce((sum, ing) => sum + (ing.costPerUnit * ing.quantity), 0);
    
    return {
      count: groupIngredients.length,
      totalQuantity,
      totalCost,
    };
  }, [ingredients]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GripVertical className="w-5 h-5" />
          Manage Ingredient Groups
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new group */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="new-group-name" className="sr-only">
              New group name
            </Label>
            <Input
              id="new-group-name"
              placeholder="Enter group name (e.g., Main Course, Side Dish)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGroup();
              }}
            />
          </div>
          <Button
            onClick={handleCreateGroup}
            disabled={isCreating || !newGroupName.trim()}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create
          </Button>
        </div>

        {/* Existing groups */}
        <div className="space-y-3">
          {ingredientGroups
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((group) => {
              const stats = getGroupStats(group.id);
              const isEditing = editingGroup === group.id;

              return (
                <Card key={group.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleUpdateGroup(group.id, editValue);
                                if (e.key === "Escape") cancelEditing();
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdateGroup(group.id, editValue)}
                              className="h-8 px-2"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                              className="h-8 px-2"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <h4 className="font-medium">{group.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {stats.count} ingredients • {stats.totalQuantity.toFixed(1)} total • ${stats.totalCost.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReorderGroups(group.id, "up")}
                            disabled={group.sortOrder === 0}
                            className="h-8 w-8 p-0"
                          >
                            ↑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReorderGroups(group.id, "down")}
                            disabled={group.sortOrder === ingredientGroups.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            ↓
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(group)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteGroup(group.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {ingredientGroups.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No ingredient groups created yet.</p>
            <p className="text-sm">Create groups to organize your menu ingredients.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}