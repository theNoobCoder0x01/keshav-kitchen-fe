"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchMenuComponents } from "@/lib/api/menu-components";
import { cn } from "@/lib/utils";
import { MenuIngredient, MenuIngredientGroup } from "@/types/menus";
import { MenuComponent } from "@prisma/client";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "../ui/skeleton";

interface MenuItem {
  id: string;
  name: string;
  weight?: string;
  isAddItem?: boolean;
  ingredients?: MenuIngredient[];
  ingredientGroups?: MenuIngredientGroup[];
  menuComponent?: MenuComponent;
}

interface MenuCardProps {
  id: string;
  title: string;
  items: MenuItem[];
  onAdd: (menuComponentId?: string) => void;
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
  const [menuComponents, setMenuComponents] = useState<MenuComponent[]>([]);

  const loadMenuComponents = async () => {
    try {
      let menuComponents = await fetchMenuComponents({
        mealType: title.toUpperCase(),
      });

      setMenuComponents(menuComponents);
    } catch (error) {
      console.error("Failed to fetch menu components:", error);
    }
  };

  useEffect(() => {
    loadMenuComponents();
  }, [title]);

  // Create an array containing either a menuComponent or a menu item, connecting them by id
  const menuComponentWithMenuItemList = useMemo(() => {
    const itemsWithMenuComponent = items.filter((item) => item.menuComponent);
    let t = [
      ...menuComponents.map((component) => {
        const item = itemsWithMenuComponent.find(
          (item) => item.menuComponent?.id === component.id,
        );
        return { component, item };
      }),
      ...items
        .filter((item) => !item.menuComponent)
        .map((item) => ({ item, component: undefined })), // Include items without a linked menu component
    ];
    return t;
  }, [menuComponents, items]);

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
            onClick={() => onAdd()}
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
        <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
          {menuComponentWithMenuItemList?.map(({ item, component }) => (
            <div
              key={item?.id ?? component?.id}
              className={cn(
                "group flex items-center p-3 hover:bg-muted rounded-xl transition-all duration-200",
                showActions ? "justify-between" : "space-x-3",
                !item && "cursor-pointer",
              )}
              onClick={(e) => {
                if (!item && component) {
                  e.stopPropagation();
                  e.preventDefault();
                  onAdd(component.id);
                }
              }}
            >
              {item ? (
                <>
                  <div className="flex-1 min-w-0">
                    {component?.label && <p>{component.label}</p>}
                    <p className="text-foreground font-medium truncate">
                      {item.name}
                      {item.weight && (
                        <>
                          -
                          <span className="text-sm text-muted-foreground mt-1">
                            {item.weight}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  {showActions && (
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
              ) : (
                <div className="flex gap-2 items-center text-primary">
                  <div className="flex items-center justify-center p-1.5 bg-accent-foreground/10 rounded-full">
                    <Plus className="size-4" />
                  </div>
                  <span className="text-sm">Add {component?.label}</span>
                </div>
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
