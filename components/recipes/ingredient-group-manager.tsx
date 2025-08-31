"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api/axios";
import type { IngredientGroup, RecipeIngredientBase } from "@/types/recipes";
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  GripVertical,
  MoreVertical,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface IngredientGroupManagerProps {
  recipeId: string;
  ingredientGroups: IngredientGroup[];
  ingredients: RecipeIngredientBase[];
  onGroupsChange: (groups: IngredientGroup[]) => void;
  onIngredientsChange: (ingredients: RecipeIngredientBase[]) => void;
}

interface GroupFormData {
  name: string;
  sortOrder: number;
}

export function IngredientGroupManager({
  recipeId,
  ingredientGroups,
  ingredients,
  onGroupsChange,
  onIngredientsChange,
}: IngredientGroupManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<IngredientGroup | null>(
    null
  );
  const [deletingGroup, setDeletingGroup] = useState<IngredientGroup | null>(
    null
  );
  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    sortOrder: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const sortedGroups = [...ingredientGroups].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post(
        `/recipes/${recipeId}/ingredient-groups`,
        {
          name: formData.name.trim(),
          sortOrder: formData.sortOrder,
        }
      );

      if (!response.status.toString().startsWith("2")) {
        const error = await response.data;
        throw new Error(error.error || "Failed to create ingredient group");
      }

      const { ingredientGroup } = await response.data;
      onGroupsChange([...ingredientGroups, ingredientGroup]);
      setFormData({ name: "", sortOrder: 0 });
      setIsCreateDialogOpen(false);
      toast.success("Ingredient group created successfully");
    } catch (error) {
      console.error("Error creating ingredient group:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create ingredient group"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !formData.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.put(
        `/recipes/${recipeId}/ingredient-groups/${editingGroup.id}`,
        {
          name: formData.name.trim(),
          sortOrder: formData.sortOrder,
        }
      );

      if (!response.status.toString().startsWith("2")) {
        const error = await response.data;
        throw new Error(error.error || "Failed to update ingredient group");
      }

      const { ingredientGroup } = await response.data;
      onGroupsChange(
        ingredientGroups.map((g) =>
          g.id === editingGroup.id ? ingredientGroup : g
        )
      );
      setEditingGroup(null);
      toast.success("Ingredient group updated successfully");
    } catch (error) {
      console.error("Error updating ingredient group:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update ingredient group"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;

    setIsLoading(true);
    try {
      const response = await api.delete(
        `/recipes/${recipeId}/ingredient-groups/${deletingGroup.id}`
      );

      if (!response.status.toString().startsWith("2")) {
        const error = await response.data;
        throw new Error(error.error || "Failed to delete ingredient group");
      }

      const result = await response.data;
      onGroupsChange(ingredientGroups.filter((g) => g.id !== deletingGroup.id));

      // If ingredients were moved to ungrouped, we might need to refresh ingredients
      if (result.movedToUngrouped) {
        toast.success(
          "Ingredient group deleted. Ingredients moved to Ungrouped section."
        );
      } else {
        toast.success("Ingredient group deleted successfully");
      }

      setDeletingGroup(null);
    } catch (error) {
      console.error("Error deleting ingredient group:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete ingredient group"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveGroup = async (groupId: string, direction: "up" | "down") => {
    const currentIndex = sortedGroups.findIndex((g) => g.id === groupId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === sortedGroups.length - 1)
    ) {
      return;
    }

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const currentGroup = sortedGroups[currentIndex];
    const targetGroup = sortedGroups[targetIndex];

    // Swap sort orders
    const newSortOrder = targetGroup.sortOrder;
    const targetNewSortOrder = currentGroup.sortOrder;

    try {
      // Update current group
      await api.put(
        `/recipes/${recipeId}/ingredient-groups/${currentGroup.id}`,
        { sortOrder: newSortOrder }
      );

      // Update target group
      await api.put(
        `/recipes/${recipeId}/ingredient-groups/${targetGroup.id}`,
        { sortOrder: targetNewSortOrder }
      );

      // Update local state
      onGroupsChange(
        ingredientGroups.map((g) => {
          if (g.id === currentGroup.id)
            return { ...g, sortOrder: newSortOrder };
          if (g.id === targetGroup.id)
            return { ...g, sortOrder: targetNewSortOrder };
          return g;
        })
      );

      toast.success("Group order updated");
    } catch (error) {
      console.error("Error updating group order:", error);
      toast.error("Failed to update group order");
    }
  };

  const openEditDialog = (group: IngredientGroup) => {
    setEditingGroup(group);
    setFormData({ name: group.name, sortOrder: group.sortOrder });
  };

  const getIngredientCountForGroup = (groupId: string) => {
    return ingredients.filter((ing) => ing.groupId === groupId).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" />
          Ingredient Groups
        </h3>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Ingredient Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Dough, Filling, Sauce"
                />
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      <div className="space-y-2">
        {sortedGroups.map((group, index) => (
          <div
            key={group.id}
            className="flex items-center gap-3 p-3 border rounded-lg bg-card"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{group.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {getIngredientCountForGroup(group.id)} ingredients
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Sort order: {group.sortOrder}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveGroup(group.id, "up")}
                disabled={index === 0}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveGroup(group.id, "down")}
                disabled={index === sortedGroups.length - 1}
              >
                <ArrowDown className="w-4 h-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(group)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeletingGroup(group)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {sortedGroups.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No ingredient groups yet</p>
            <p className="text-sm">
              Create groups to organize your ingredients
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ingredient Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editGroupName">Group Name</Label>
              <Input
                id="editGroupName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="editSortOrder">Sort Order</Label>
              <Input
                id="editSortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sortOrder: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditingGroup(null)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateGroup} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Group"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingGroup}
        onOpenChange={() => setDeletingGroup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ingredient Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{deletingGroup?.name}" group?
              Any ingredients in this group will be moved to the "Ungrouped"
              section. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
