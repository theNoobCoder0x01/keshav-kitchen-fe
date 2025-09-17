"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_UNIT, UNIT_OPTIONS } from "@/lib/constants/units";
import { ErrorMessage, Field, FieldArray } from "formik";
import {
  ChevronDown,
  DollarSign,
  GripVertical,
  Package,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { ClipboardEvent } from "react";
import { useCallback, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Ingredient Component
interface SortableIngredientProps {
  ingredient: any;
  ingredientIndex: number;
  groupIndex: number;
  selectedIds: Set<string>;
  toggleRowSelected: (localId: string, checked: boolean) => void;
  removeIngredient: (index: number) => void;
  name: string;
  groupIngredientsLength: number;
}

function SortableIngredient({
  ingredient,
  ingredientIndex,
  groupIndex,
  selectedIds,
  toggleRowSelected,
  removeIngredient,
  name,
  groupIngredientsLength,
}: SortableIngredientProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ingredient.localId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 border border-border/50 rounded-lg bg-background/50 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <Checkbox
            checked={Boolean(selectedIds.has(ingredient.localId))}
            onCheckedChange={(checked) =>
              toggleRowSelected(ingredient.localId, Boolean(checked))
            }
          />
          <h5 className="text-sm font-medium text-muted-foreground">
            Ingredient #{ingredientIndex + 1}
          </h5>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => removeIngredient(ingredientIndex)}
          className="w-6 h-6 p-0 text-destructive hover:bg-destructive/10"
          disabled={groupIngredientsLength === 1}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5">
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">
            Name *
          </Label>
          <Field
            as={Input}
            name={`${name}[${groupIndex}].ingredients[${ingredientIndex}].name`}
            placeholder="Ingredient name"
            className="text-sm"
          />
          <ErrorMessage
            name={`${name}[${groupIndex}].ingredients[${ingredientIndex}].name`}
            component="p"
            className="text-destructive text-xs mt-1"
          />
        </div>

        <div className="sm:col-span-3">
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">
            Quantity *
          </Label>
          <Field
            as={Input}
            name={`${name}[${groupIndex}].ingredients[${ingredientIndex}].quantity`}
            placeholder="Amount"
            type="number"
            min={0}
            step={0.0001}
            className="text-sm"
          />
          <ErrorMessage
            name={`${name}[${groupIndex}].ingredients[${ingredientIndex}].quantity`}
            component="p"
            className="text-destructive text-xs mt-1"
          />
        </div>

        <div className="sm:col-span-2">
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">
            Unit *
          </Label>
          <Field name={`${name}[${groupIndex}].ingredients[${ingredientIndex}].unit`}>
            {({ field }: { field: any }) => (
              <Select
                value={field.value}
                onValueChange={(value) =>
                  field.onChange({
                    target: { name: field.name, value },
                  })
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent searchable>
                  {UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">
            Cost/Unit
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Field
              as={Input}
              name={`${name}[${groupIndex}].ingredients[${ingredientIndex}].costPerUnit`}
              placeholder="0.00"
              type="number"
              min={0}
              step={0.0001}
              className="pl-6 text-sm"
            />
          </div>
          <ErrorMessage
            name={`${name}[${groupIndex}].ingredients[${ingredientIndex}].costPerUnit`}
            component="p"
            className="text-destructive text-xs mt-1"
          />
        </div>
      </div>
    </div>
  );
}

// Generic ingredient interface to support both recipe and meal ingredient types
export interface GenericIngredient {
  name: string;
  quantity: string | number;
  unit: string;
  costPerUnit?: string | number;
  localId?: string;
}

export interface IngredientGroup<
  T extends GenericIngredient = GenericIngredient,
> {
  id?: string;
  name: string;
  sortOrder: number;
  ingredients: T[];
}

interface IngredientsInputProps<
  T extends GenericIngredient = GenericIngredient,
> {
  name: string; // Formik field name (e.g., "ingredientGroups")
  ingredientGroups: IngredientGroup<T>[];
  onFieldChange: (field: string, value: any, shouldValidate?: boolean) => void;
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  generateStableId: () => string;
  title?: string;
  description?: string;
  showCostSummary?: boolean;
  quantityType?: "string" | "number"; // For recipe vs meal dialogs
  onPasteIngredients?: (e: ClipboardEvent) => void;
}

export function IngredientsInput<
  T extends GenericIngredient = GenericIngredient,
>({
  name,
  ingredientGroups,
  onFieldChange,
  selectedIds,
  onSelectionChange,
  generateStableId,
  title = "Ingredient Groups",
  description = "Organize ingredients into logical groups",
  showCostSummary = true,
  quantityType = "string",
  onPasteIngredients,
}: IngredientsInputProps<T>) {
  const toggleRowSelected = (localId: string, checked: boolean) => {
    const newSelection = new Set(selectedIds);
    if (checked) {
      newSelection.add(localId);
    } else {
      newSelection.delete(localId);
    }
    onSelectionChange(newSelection);
  };

  const setGroupSelection = (groupIndex: number, checked: boolean) => {
    const ids = ingredientGroups[groupIndex].ingredients.map(
      (ing: any) => ing.localId,
    );
    const newSelection = new Set(selectedIds);
    if (checked) {
      ids.forEach((id: string) => newSelection.add(id));
    } else {
      ids.forEach((id: string) => newSelection.delete(id));
    }
    onSelectionChange(newSelection);
  };

  const clearSelection = () => onSelectionChange(new Set());

  const moveSelectedIngredients = (
    destinationGroupIndex: number,
    position: "end" | "start" = "end",
  ) => {
    if (selectedIds.size === 0) return;

    const nextGroups = ingredientGroups.map((g) => ({
      ...g,
      ingredients: [...g.ingredients],
    }));

    const moved: any[] = [];
    nextGroups.forEach((group) => {
      const keep: any[] = [];
      for (const ing of group.ingredients as any[]) {
        if (selectedIds.has(ing.localId)) {
          moved.push(ing);
        } else {
          keep.push(ing);
        }
      }
      group.ingredients = keep.length ? keep : [createEmptyIngredient()];
    });

    const dest = nextGroups[destinationGroupIndex];
    dest.ingredients =
      position === "start"
        ? [...moved, ...dest.ingredients]
        : [...dest.ingredients, ...moved];

    onFieldChange(name, nextGroups, false);
    clearSelection();
  };

  const createEmptyIngredient = (): T => {
    const baseIngredient = {
      name: "",
      quantity: quantityType === "string" ? "" : 0,
      unit: DEFAULT_UNIT,
      costPerUnit: quantityType === "string" ? "" : 0,
      localId: generateStableId(),
    };
    return baseIngredient as T;
  };

  // Calculate total cost from ingredient groups
  const calculateTotalCost = (groups: IngredientGroup<T>[]) => {
    return groups.reduce((total, group) => {
      return (
        total +
        group.ingredients.reduce((groupTotal, ingredient) => {
          const quantity = parseFloat(String(ingredient.quantity)) || 0;
          const costPerUnit =
            parseFloat(String(ingredient.costPerUnit || "0")) || 0;
          return groupTotal + quantity * costPerUnit;
        }, 0)
      );
    }, 0);
  };

  const handlePasteIngredients = useCallback(
    (e: ClipboardEvent) => {
      if (onPasteIngredients) {
        onPasteIngredients(e);
      }
    },
    [onPasteIngredients],
  );

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const updateSequenceNumbers = (groups: IngredientGroup<T>[]) => {
    let sequence = 1;
    groups.forEach((group) => {
      group.ingredients.forEach((ingredient: any) => {
        if (ingredient.sequenceNumber !== undefined) {
          ingredient.sequenceNumber = sequence++;
        }
      });
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the source group and ingredient
    let sourceGroupIndex = -1;
    let sourceIngredientIndex = -1;
    let destinationGroupIndex = -1;
    let destinationIngredientIndex = -1;

    ingredientGroups.forEach((group, gIdx) => {
      group.ingredients.forEach((ing: any, iIdx) => {
        if (ing.localId === activeId) {
          sourceGroupIndex = gIdx;
          sourceIngredientIndex = iIdx;
        }
        if (ing.localId === overId) {
          destinationGroupIndex = gIdx;
          destinationIngredientIndex = iIdx;
        }
      });
    });

    // If dropping on a group (not an ingredient), move to that group
    if (destinationGroupIndex === -1) {
      // Check if overId is a group
      ingredientGroups.forEach((group, gIdx) => {
        if (`group-${gIdx}` === overId) {
          destinationGroupIndex = gIdx;
        }
      });
    }

    if (sourceGroupIndex === -1) return;

    const nextGroups = ingredientGroups.map((g) => ({
      ...g,
      ingredients: [...g.ingredients],
    }));

    if (sourceGroupIndex === destinationGroupIndex) {
      // Reordering within the same group
      const group = nextGroups[sourceGroupIndex];
      if (destinationIngredientIndex !== -1) {
        group.ingredients = arrayMove(
          group.ingredients,
          sourceIngredientIndex,
          destinationIngredientIndex,
        );
      }
    } else if (destinationGroupIndex !== -1) {
      // Moving to different group
      const sourceGroup = nextGroups[sourceGroupIndex];
      const destGroup = nextGroups[destinationGroupIndex];
      const [moved] = sourceGroup.ingredients.splice(sourceIngredientIndex, 1);

      if (destinationIngredientIndex !== -1) {
        destGroup.ingredients.splice(destinationIngredientIndex, 0, moved);
      } else {
        destGroup.ingredients.push(moved);
      }

      // Remove empty groups or add empty ingredient if needed
      if (sourceGroup.ingredients.length === 0) {
        sourceGroup.ingredients = [createEmptyIngredient()];
      }
    }

    updateSequenceNumbers(nextGroups);
    onFieldChange(name, nextGroups, false);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <FieldArray name={name}>
        {({ remove: removeGroup, push: pushGroup }) => (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    {title}
                  </CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Badge variant="outline" className="text-xs">
                    {ingredientGroups.reduce(
                      (total, group) => total + group.ingredients.length,
                      0,
                    )}{" "}
                    ingredients
                  </Badge>
                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {selectedIds.size} selected
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs px-3 py-1 h-7"
                          >
                            Move To <ChevronDown className="w-3 h-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {ingredientGroups.map((g, idx) => (
                            <DropdownMenuItem
                              key={idx}
                              onClick={() => {
                                moveSelectedIngredients(idx);
                              }}
                              className="cursor-pointer"
                            >
                              {g.name || `Group ${idx + 1}`}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      pushGroup({
                        name: "",
                        sortOrder: ingredientGroups.length,
                        ingredients: [createEmptyIngredient()],
                      });
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    Add Group
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {ingredientGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  id={`group-${groupIndex}`}
                  className="border border-border rounded-lg p-4 bg-card/30"
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={
                          group.ingredients.length > 0 &&
                          group.ingredients.every((ing: any) =>
                            selectedIds.has(ing.localId),
                          )
                        }
                        onCheckedChange={(checked) =>
                          setGroupSelection(groupIndex, Boolean(checked))
                        }
                        className="mr-1"
                      />
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <Field
                          as={Input}
                          name={`${name}[${groupIndex}].name`}
                          placeholder="Group name (e.g., Dough, Filling, Sauce)"
                          className="font-medium"
                        />
                        <ErrorMessage
                          name={`${name}[${groupIndex}].name`}
                          component="p"
                          className="text-destructive text-xs mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {group.ingredients.length} items
                      </Badge>
                      {ingredientGroups.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGroup(groupIndex)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Group Ingredients */}
                  <FieldArray name={`${name}[${groupIndex}].ingredients`}>
                    {({ remove: removeIngredient, push: pushIngredient }) => (
                      <div className="space-y-3" onPaste={handlePasteIngredients}>
                        <SortableContext
                          items={group.ingredients.map((ing: any) => ing.localId)}
                          strategy={verticalListSortingStrategy}
                        >
                          {group.ingredients.map(
                            (ingredient: any, ingredientIndex) => (
                              <SortableIngredient
                                key={ingredient.localId}
                                ingredient={ingredient}
                                ingredientIndex={ingredientIndex}
                                groupIndex={groupIndex}
                                selectedIds={selectedIds}
                                toggleRowSelected={toggleRowSelected}
                                removeIngredient={removeIngredient}
                                name={name}
                                groupIngredientsLength={group.ingredients.length}
                              />
                            ),
                          )}
                        </SortableContext>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            pushIngredient(createEmptyIngredient());
                          }}
                          className="w-full border-dashed"
                        >
                          <Plus className="w-3 h-3 mr-2" />
                          Add Ingredient to {group.name || "Group"}
                        </Button>
                      </div>
                    )}
                  </FieldArray>
                </div>
              ))}

              {/* Cost Summary */}
              {showCostSummary && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Estimated Total Cost:
                    </span>
                    <span className="text-lg font-bold text-primary">
                      ${calculateTotalCost(ingredientGroups).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </FieldArray>
      <DragOverlay>
        {activeId ? (
          <div className="p-3 border border-border/50 rounded-lg bg-background/80 shadow-lg">
            <div className="text-sm font-medium">
              {(() => {
                for (const group of ingredientGroups) {
                  const ing = group.ingredients.find((i: any) => i.localId === activeId);
                  if (ing) return ing.name || "Unnamed ingredient";
                }
                return "Ingredient";
              })()}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
