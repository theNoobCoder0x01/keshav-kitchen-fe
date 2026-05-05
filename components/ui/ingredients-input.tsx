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
import { FormikValueUnitInput } from "@/components/ui/value-unit-input";
import { DEFAULT_UNIT } from "@/lib/constants/units";
import type { UnitValue } from "@/types";
import { ErrorMessage, Field, FieldArray, useFormikContext } from "formik";
import {
  ChevronDown,
  DollarSign,
  MoveRight,
  Package,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { ClipboardEvent } from "react";
import { useCallback } from "react";

// Ingredient Component
interface IngredientProps {
  ingredient: any;
  ingredientIndex: number;
  groupIndex: number;
  toggleRowSelected: (
    groupIndex: number,
    ingredientIndex: number,
    checked: boolean,
  ) => void;
  removeIngredient: (index: number) => void;
  name: string;
  groupIngredientsLength: number;
  onSequenceChange: (localId: string, sequence: number) => void;
  values: any;
}

function Ingredient({
  ingredient,
  ingredientIndex,
  groupIndex,
  toggleRowSelected,
  removeIngredient,
  name,
  groupIngredientsLength,
  onSequenceChange,
  values,
}: IngredientProps) {
  return (
    <div
      id={`ingredient-${ingredient.localId}`}
      className="px-1 py-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={Boolean(ingredient.selected)}
            onCheckedChange={(checked) =>
              toggleRowSelected(groupIndex, ingredientIndex, Boolean(checked))
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

      <div className="grid grid-cols-1 sm:grid-cols-13 gap-3">
        <div className="sm:col-span-2">
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">
            Seq
          </Label>
          <Field
            as={Input}
            name={`${name}[${groupIndex}].ingredients[${ingredientIndex}].sequenceNumber`}
            placeholder="1"
            type="number"
            min={1}
            className="text-sm"
            onBlur={() => {
              // Trigger sorting when user finishes editing sequence number
              const currentValue = (values as any)[name]?.[groupIndex]
                ?.ingredients?.[ingredientIndex]?.sequenceNumber;
              if (currentValue) {
                onSequenceChange(ingredient.localId, currentValue);
              }
            }}
          />
          <ErrorMessage
            name={`${name}[${groupIndex}].ingredients[${ingredientIndex}].sequenceNumber`}
            component="p"
            className="text-destructive text-xs mt-1"
          />
        </div>

        <div className="sm:col-span-3">
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

        <div className="sm:col-span-6">
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">
            Quantity *
          </Label>
          <FormikValueUnitInput
            quantityName={`${name}[${groupIndex}].ingredients[${ingredientIndex}].quantity`}
            unitName={`${name}[${groupIndex}].ingredients[${ingredientIndex}].unit`}
            placeholder="Amount"
            min={0}
            step={0.0001}
          />
          <ErrorMessage
            name={`${name}[${groupIndex}].ingredients[${ingredientIndex}].quantity`}
            component="p"
            className="text-destructive text-xs mt-1"
          />
          <ErrorMessage
            name={`${name}[${groupIndex}].ingredients[${ingredientIndex}].unit`}
            component="p"
            className="text-destructive text-xs mt-1"
          />
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
  unit: UnitValue;
  costPerUnit?: string | number;
  localId?: string;
  sequenceNumber?: number;
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
  generateStableId: () => string;
  title?: string;
  description?: string;
  showCostSummary?: boolean;
  quantityType?: "string" | "number"; // For recipe vs meal dialogs
  onPasteIngredients?: (e: ClipboardEvent) => void;
  hideGroupManagement?: boolean; // Hide add/rename/move functionality
}

export function IngredientsInput<
  T extends GenericIngredient = GenericIngredient,
>({
  name,
  ingredientGroups,
  generateStableId,
  title = "Ingredient Groups",
  description = "Organize ingredients into logical groups",
  showCostSummary = true,
  quantityType = "string",
  onPasteIngredients,
  hideGroupManagement = false,
}: IngredientsInputProps<T>) {
  const { setFieldValue, values } = useFormikContext();
  const currentIngredientGroups = (values as any)[name] || ingredientGroups;

  const toggleRowSelected = (
    groupIndex: number,
    ingredientIndex: number,
    checked: boolean,
  ) => {
    setFieldValue(
      `${name}[${groupIndex}].ingredients[${ingredientIndex}].selected`,
      checked,
    );
  };

  const setGroupSelection = (groupIndex: number, checked: boolean) => {
    const group = currentIngredientGroups[groupIndex];
    group.ingredients.forEach((_: any, ingredientIndex: number) => {
      setFieldValue(
        `${name}[${groupIndex}].ingredients[${ingredientIndex}].selected`,
        checked,
      );
    });
  };

  const createEmptyIngredient = (): T => {
    const baseIngredient = {
      name: "",
      quantity: quantityType === "string" ? "" : 0,
      unit: DEFAULT_UNIT,
      costPerUnit: quantityType === "string" ? "" : 0,
      localId: generateStableId(),
      sequenceNumber: 1,
      selected: false,
    } as any;
    return baseIngredient as T;
  };

  const createEmptyGroup = (): IngredientGroup<T> => ({
    name: `Group ${currentIngredientGroups.length + 1}`,
    sortOrder: currentIngredientGroups.length,
    ingredients: [createEmptyIngredient()],
  });

  const updateGroups = (groups: IngredientGroup<T>[]) => {
    setFieldValue(
      name,
      groups.map((group, index) => ({
        ...group,
        sortOrder: group.name === "Ungrouped" ? 999 : index,
        ingredients: group.ingredients.map((ingredient, ingredientIndex) => ({
          ...ingredient,
          sequenceNumber:
            (ingredient as any).sequenceNumber ?? ingredientIndex + 1,
        })),
      })),
    );
  };

  const ensureUngroupedTarget = (groups: IngredientGroup<T>[]) => {
    const existingIndex = groups.findIndex(
      (group) => group.name === "Ungrouped",
    );
    if (existingIndex >= 0) return existingIndex;

    groups.push({
      name: "Ungrouped",
      sortOrder: 999,
      ingredients: [],
    });
    return groups.length - 1;
  };

  const removeGroupAndKeepIngredients = (groupIndex: number) => {
    const groups = currentIngredientGroups.map((group: IngredientGroup<T>) => ({
      ...group,
      ingredients: [...group.ingredients],
    }));
    const [removedGroup] = groups.splice(groupIndex, 1);
    const ingredientsToKeep = (removedGroup?.ingredients || []).filter(
      (ingredient: any) =>
        ingredient.name || ingredient.quantity || ingredient.costPerUnit,
    );

    if (ingredientsToKeep.length > 0) {
      const targetIndex = ensureUngroupedTarget(groups);
      groups[targetIndex] = {
        ...groups[targetIndex],
        ingredients: [
          ...groups[targetIndex].ingredients,
          ...ingredientsToKeep.map((ingredient: any) => ({
            ...ingredient,
            selected: false,
          })),
        ],
      };
    }

    updateGroups(groups.length > 0 ? groups : [createEmptyGroup()]);
  };

  const moveSelectedIngredients = (
    sourceGroupIndex: number,
    targetGroupIndex: number,
  ) => {
    if (sourceGroupIndex === targetGroupIndex) return;

    const groups = currentIngredientGroups.map((group: IngredientGroup<T>) => ({
      ...group,
      ingredients: [...group.ingredients],
    }));
    const sourceGroup = groups[sourceGroupIndex];
    const targetGroup = groups[targetGroupIndex];
    if (!sourceGroup || !targetGroup) return;

    const moving = sourceGroup.ingredients.filter(
      (ingredient: any) => ingredient.selected,
    );
    if (moving.length === 0) return;

    const remaining = sourceGroup.ingredients.filter(
      (ingredient: any) => !ingredient.selected,
    );

    groups[sourceGroupIndex] = {
      ...sourceGroup,
      ingredients:
        remaining.length > 0
          ? remaining
          : [
              {
                ...createEmptyIngredient(),
                sequenceNumber: 1,
              },
            ],
    };
    groups[targetGroupIndex] = {
      ...targetGroup,
      ingredients: [
        ...targetGroup.ingredients.filter(
          (ingredient: any) =>
            ingredient.name || ingredient.quantity || ingredient.costPerUnit,
        ),
        ...moving.map((ingredient: any) => ({
          ...ingredient,
          selected: false,
        })),
      ],
    };

    updateGroups(groups);
  };

  // Calculate total cost from ingredient groups
  const calculateTotalCost = (groups: IngredientGroup<T>[]) => {
    return groups.reduce((total: number, group: IngredientGroup<T>) => {
      return (
        total +
        group.ingredients.reduce((groupTotal: number, ingredient: T) => {
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

  // Sort ingredients by sequence number
  const sortIngredientsBySequence = (groups: IngredientGroup<T>[]) => {
    return groups.map((group) => ({
      ...group,
      ingredients: [...group.ingredients].sort((a, b) => {
        const seqA = (a as any).sequenceNumber || 1;
        const seqB = (b as any).sequenceNumber || 1;
        return seqA - seqB;
      }),
    }));
  };

  // Handle sequence number change
  const handleSequenceChange = (localId: string, sequence: number) => {
    const nextGroups = currentIngredientGroups.map(
      (group: IngredientGroup<T>, groupIndex: number) => ({
        ...group,
        ingredients: group.ingredients.map((ing: any) => {
          if (ing.localId === localId) {
            return { ...ing, sequenceNumber: sequence };
          }
          return ing;
        }),
      }),
    );

    // Sort and update
    const sortedGroups = sortIngredientsBySequence(nextGroups);
    setFieldValue(name, sortedGroups);
  };

  // Get ingredient groups without auto-sorting; sorting happens on blur
  const sortedIngredientGroups = currentIngredientGroups;

  return (
    <FieldArray name={name}>
      {({ push: pushGroup }) => (
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
                  {sortedIngredientGroups.reduce(
                    (total: number, group: IngredientGroup<T>) =>
                      total + group.ingredients.length,
                    0,
                  )}{" "}
                  ingredients
                </Badge>
                {!hideGroupManagement && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      pushGroup({
                        ...createEmptyGroup(),
                        name: `Group ${sortedIngredientGroups.length + 1}`,
                      })
                    }
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    Add Group
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {sortedIngredientGroups.map(
              (group: IngredientGroup<T>, groupIndex: number) => (
                <div
                  key={groupIndex}
                  id={`group-${groupIndex}`}
                  className="border border-border rounded-lg p-4 bg-card/30"
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      {!hideGroupManagement && (
                        <Checkbox
                          checked={
                            group.ingredients.length > 0 &&
                            group.ingredients.every((ing: any) => ing.selected)
                          }
                          onCheckedChange={(checked) =>
                            setGroupSelection(groupIndex, Boolean(checked))
                          }
                          className="mr-1"
                        />
                      )}
                      <div className="flex-1">
                        {hideGroupManagement ? (
                          <h3 className="font-medium text-base">
                            {group.name || `Group ${groupIndex + 1}`}
                          </h3>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {group.ingredients.length} items
                      </Badge>
                      {!hideGroupManagement &&
                        sortedIngredientGroups.length > 1 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                  !group.ingredients.some(
                                    (ingredient: any) => ingredient.selected,
                                  )
                                }
                              >
                                <MoveRight className="w-4 h-4 mr-1" />
                                Move
                                <ChevronDown className="w-3 h-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {sortedIngredientGroups.map(
                                (
                                  targetGroup: IngredientGroup<T>,
                                  targetGroupIndex: number,
                                ) =>
                                  targetGroupIndex !== groupIndex ? (
                                    <DropdownMenuItem
                                      key={`${targetGroup.name}-${targetGroupIndex}`}
                                      onClick={() =>
                                        moveSelectedIngredients(
                                          groupIndex,
                                          targetGroupIndex,
                                        )
                                      }
                                    >
                                      {targetGroup.name ||
                                        `Group ${targetGroupIndex + 1}`}
                                    </DropdownMenuItem>
                                  ) : null,
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      {!hideGroupManagement &&
                        sortedIngredientGroups.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeGroupAndKeepIngredients(groupIndex)
                            }
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
                      <div
                        className="divide-y divide-accent"
                        onPaste={handlePasteIngredients}
                      >
                        {group.ingredients.map(
                          (ingredient: any, ingredientIndex: number) => (
                            <Ingredient
                              key={ingredient.localId}
                              ingredient={ingredient}
                              ingredientIndex={ingredientIndex}
                              groupIndex={groupIndex}
                              toggleRowSelected={toggleRowSelected}
                              removeIngredient={removeIngredient}
                              name={name}
                              groupIngredientsLength={group.ingredients.length}
                              onSequenceChange={handleSequenceChange}
                              values={values}
                            />
                          ),
                        )}

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
              ),
            )}

            {/* Cost Summary */}
            {showCostSummary && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Estimated Total Cost:
                  </span>
                  <span className="text-lg font-bold text-primary">
                    ${calculateTotalCost(sortedIngredientGroups).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </FieldArray>
  );
}
