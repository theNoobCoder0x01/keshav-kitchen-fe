"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BaseDialog } from "@/components/ui/base-dialog";
import { fetchMenuComponents } from "@/lib/api/menu-components";
import { cn } from "@/lib/utils";
import type { KitchenPersonType } from "@/types/kitchens";
import type { MenuComponentApiItem } from "@/types/menu-components";
import { MenuIngredient, MenuIngredientGroup } from "@/types/menus";
import { Edit, Plus, SlidersHorizontal, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "../ui/skeleton";

interface MenuItem {
  id: string;
  name: string;
  weight?: string;
  isAddItem?: boolean;
  ingredients?: MenuIngredient[];
  ingredientGroups?: MenuIngredientGroup[];
  menuComponent?: any;
}

interface MenuCardProps {
  id: string;
  kitchenId: string;
  title: string;
  items: MenuItem[];
  onAdd: (menuComponentId?: string) => void;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (itemId: string) => void;
  showActions?: boolean;
  className?: string;
  personTypes?: KitchenPersonType[];
  personCounts?: Record<string, number>;
  onPersonCountChange?: (personTypeId: string, count: number) => void;
  onAddPersonType?: () => void;
  onEditMenuComponent?: (menuComponent: MenuComponentApiItem) => void;
  menuComponentsRefreshKey?: number;
}

export function MenuCard({
  kitchenId,
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  showActions = false,
  className,
  personTypes = [],
  personCounts = {},
  onPersonCountChange,
  onAddPersonType,
  onEditMenuComponent,
  menuComponentsRefreshKey = 0,
}: MenuCardProps) {
  const [menuComponents, setMenuComponents] = useState<MenuComponentApiItem[]>(
    [],
  );
  const [peopleDialogOpen, setPeopleDialogOpen] = useState(false);

  const loadMenuComponents = async () => {
    try {
      let menuComponents = await fetchMenuComponents(kitchenId, {
        mealType: title.toUpperCase(),
      });

      setMenuComponents(menuComponents);
    } catch (error) {
      console.error("Failed to fetch menu components:", error);
    }
  };

  useEffect(() => {
    loadMenuComponents();
  }, [title, kitchenId, menuComponentsRefreshKey]);

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

  const countSummary = useMemo(() => {
    return personTypes
      .map((personType) => ({
        id: personType.id,
        name: personType.name,
        count: personCounts[personType.id] || 0,
      }))
      .filter((item) => item.count > 0);
  }, [personCounts, personTypes]);

  const totalPeople = useMemo(
    () => countSummary.reduce((sum, item) => sum + item.count, 0),
    [countSummary],
  );

  return (
    <Card
      className={cn(
        "bg-card/100 backdrop-blur-xs border-border/50 hover:shadow-lg transition-all duration-300",
        className,
      )}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {items?.length} items
            </p>
            {countSummary.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {totalPeople} people
                </span>
                {countSummary.slice(0, 2).map((item) => (
                  <span
                    key={item.id}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {item.name}: {item.count}
                  </span>
                ))}
                {countSummary.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{countSummary.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setPeopleDialogOpen(true)}
              title={`People for ${title}`}
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
              onClick={() => onAdd()}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        </div>
        <BaseDialog
          open={peopleDialogOpen}
          onOpenChange={setPeopleDialogOpen}
          title={`People for ${title}`}
          description="Set person counts for this meal type"
          icon={<Users className="h-5 w-5 text-primary-foreground" />}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={onAddPersonType}>
                <Plus className="mr-1 h-4 w-4" />
                Add Person Type
              </Button>
            </div>
            {personTypes.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {personTypes.map((personType) => (
                  <div
                    key={personType.id}
                    className="rounded-md border border-border bg-background p-3"
                  >
                    <Label
                      htmlFor={`${title}-${personType.id}-count`}
                      className="text-sm font-medium text-foreground"
                    >
                      {personType.name}
                    </Label>
                    {personType.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {personType.description}
                      </p>
                    ) : null}
                    <Input
                      id={`${title}-${personType.id}-count`}
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={personCounts[personType.id] ?? 0}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value || 0);
                        onPersonCountChange?.(
                          personType.id,
                          Number.isFinite(nextValue) && nextValue > 0
                            ? nextValue
                            : 0,
                        );
                      }}
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Add a person type to enter counts for this meal.
              </div>
            )}
          </div>
        </BaseDialog>
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
                      {component && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-8 h-8 p-0 text-muted-foreground hover:bg-muted"
                          title={`Edit averages for ${component.label}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditMenuComponent?.(component);
                          }}
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </Button>
                      )}
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
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex gap-2 items-center text-primary">
                    <div className="flex items-center justify-center p-1.5 bg-accent-foreground/10 rounded-full">
                      <Plus className="size-4" />
                    </div>
                    <span className="text-sm">Add {component?.label}</span>
                  </div>
                  {component && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-muted-foreground hover:bg-muted"
                      title={`Edit averages for ${component.label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditMenuComponent?.(component);
                      }}
                    >
                      <SlidersHorizontal className="mr-1 h-4 w-4" />
                      Averages
                    </Button>
                  )}
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
