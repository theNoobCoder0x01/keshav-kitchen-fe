"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getSortedMenuGroupNames,
  groupMenuIngredientsByGroup,
} from "@/lib/utils/menu-utils";
import { MenuIngredient, MenuIngredientGroup } from "@/types/menus";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "../ui/skeleton";

interface MenuItem {
  id: string;
  name: string;
  weight?: string;
  isAddItem?: boolean;
  ingredients?: MenuIngredient[];
  ingredientGroups?: MenuIngredientGroup[];
}

interface MenuCardProps {
  title: string;
  items: MenuItem[];
  onAdd: () => void;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (itemId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function MenuCard({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  showActions = false,
  className,
}: MenuCardProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEditStart = (item: MenuItem) => {
    setEditingItem(item.id);
    setEditValue(item.name);
  };

  const handleEditSave = (item: MenuItem) => {
    if (editValue.trim()) {
      onEdit?.({ ...item, name: editValue.trim() });
    }
    setEditingItem(null);
    setEditValue("");
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditValue("");
  };

  // Helper function to render grouped ingredients
  const renderGroupedIngredients = (item: MenuItem) => {
    if (!item.ingredients || item.ingredients.length === 0) return null;

    const groupedIngredients = groupMenuIngredientsByGroup(
      item.ingredients,
      item.ingredientGroups,
    );
    const sortedGroupNames = getSortedMenuGroupNames(groupedIngredients);

    return (
      <div className="mt-2 space-y-2">
        {sortedGroupNames.map((groupName) => {
          const group = groupedIngredients[groupName];
          const totalQuantity = group.ingredients.reduce(
            (sum, ing) => sum + ing.quantity,
            0,
          );
          const totalCost = group.ingredients.reduce(
            (sum, ing) => sum + ing.costPerUnit * ing.quantity,
            0,
          );

          return (
            <div key={groupName} className="border-l-2 border-primary/20 pl-3">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-xs font-medium text-primary">
                  {groupName}
                  {groupName === "Ungrouped" && (
                    <span className="text-muted-foreground ml-1">
                      (Default)
                    </span>
                  )}
                </h5>
                <span className="text-xs text-muted-foreground">
                  {group.ingredients.length} items • ${totalCost.toFixed(2)}
                </span>
              </div>
              <div className="space-y-1">
                {group.ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground truncate flex-1">
                      {ingredient.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {ingredient.quantity} {ingredient.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card
      className={cn(
        "bg-card/100 backdrop-blur-xs border-border/50 hover:shadow-lg transition-all duration-300",
        className,
      )}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {items?.length} items
            </p>
          </div>
          <Button
            size="sm"
            className="bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
            onClick={onAdd}
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>

        <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
          {items?.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex items-center p-3 hover:bg-muted rounded-xl transition-all duration-200",
                showActions ? "justify-between" : "space-x-3",
              )}
            >
              {item.isAddItem ? (
                <>
                  <div className="w-10 h-10 bg-linear-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center border border-primary/10">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground flex-1 font-medium">
                    {item.name}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    {editingItem === item.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-primary rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary/20 bg-background"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditSave(item);
                            if (e.key === "Escape") handleEditCancel();
                          }}
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditSave(item)}
                            className="h-7 px-3 text-xs bg-primary hover:bg-primary/90"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                            className="h-7 px-3 text-xs bg-transparent"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-foreground font-medium truncate">
                          {item.name}
                        </p>
                        {item.weight && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.weight}
                          </p>
                        )}
                        {/* Render grouped ingredients if available */}
                        {/* {renderGroupedIngredients(item)} */}
                      </>
                    )}
                  </div>

                  {showActions && editingItem !== item.id && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 text-primary hover:bg-primary/10"
                        onClick={() => onEdit?.(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete?.(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton loader for MenuCard
export function MenuCardSkeleton({
  itemCount = 3,
  className = "",
}: {
  itemCount?: number;
  className?: string;
}) {
  return (
    <Card
      className={cn("bg-card/100 backdrop-blur-xs border-border/50", className)}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <Skeleton className="h-6 w-24 mb-2 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <Skeleton className="h-8 w-20 rounded" />
        </div>
        <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
          {Array.from({ length: itemCount }).map((_, idx) => (
            <div key={idx} className="flex items-center p-3 rounded-xl">
              <div className="flex-1 min-w-0">
                <Skeleton className="h-5 w-32 mb-1 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="h-8 w-8 ml-2 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
