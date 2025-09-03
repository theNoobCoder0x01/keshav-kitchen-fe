"use client";

import { LexicalEditor } from "@/components/rich-text/lexical-editor";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IngredientsInput } from "@/components/ui/ingredients-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/hooks/use-translations";
import { DEFAULT_UNIT, UNIT_OPTIONS } from "@/lib/constants/units";
import { trimObjectStrings } from "@/lib/utils/form-utils";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { BookOpen, CheckCircle2, ChefHat } from "lucide-react";
import type { ClipboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Yup from "yup";

import api from "@/lib/api/axios";
import { getCalculatedQuantities } from "@/lib/utils/meal-calculations";
import type { RecipeDialogIngredientValue } from "@/types/forms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface IngredientGroupFormValue {
  id?: string;
  name: string;
  sortOrder: number;
  ingredients: RecipeDialogIngredientValue[];
}

interface AddRecipeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (recipe: {
    name: string;
    category: string;
    subcategory: string;
    ingredients: Array<{
      name: string;
      quantity: string;
      unit: string;
      costPerUnit: string;
      groupId?: string | null;
    }>;
    ingredientGroups?: Array<{
      id?: string;
      name: string;
      sortOrder: number;
    }>;
    instructions?: string | null;
    preparedQuantity?: number | null;
    preparedQuantityUnit?: string | null;
    servingQuantity?: number | null;
    servingQuantityUnit?: string | null;
    quantityPerPiece?: number | null;
  }) => void;
  initialRecipe?: {
    recipeName: string;
    category: string;
    subcategory: string;
    selectedRecipe: string;
    ingredients: RecipeDialogIngredientValue[];
    ingredientGroups?: IngredientGroupFormValue[];
    instructions?: string | null;
    preparedQuantity?: number | null;
    preparedQuantityUnit?: string | null;
    servingQuantity?: number | null;
    servingQuantityUnit?: string | null;
    quantityPerPiece?: number | null;
  } | null;
  isEditMode?: boolean;
  recipeId?: string;
}

export function AddRecipeDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialRecipe = null,
  isEditMode = false,
  recipeId,
}: AddRecipeDialogProps) {
  const { t } = useTranslations();
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
  const [fetchedRecipe, setFetchedRecipe] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Stable ID generation to prevent unnecessary re-renders
  const generateStableId = useCallback(() => {
    return typeof crypto !== "undefined"
      ? crypto.randomUUID()
      : `id_${Date.now()}_${Math.random()}`;
  }, []);

  // Fetch recipe details when in edit mode and recipeId is provided
  useEffect(() => {
    const fetchRecipeDetails = async () => {
      if (isEditMode && recipeId && !fetchedRecipe) {
        setIsLoadingRecipe(true);
        try {
          const response = await api.get(`/recipes/${recipeId}`);
          if (response.status === 200 || response.status === 201) {
            const recipeData = await response.data;
            setFetchedRecipe(recipeData);
          } else {
            console.error("Failed to fetch recipe details");
          }
        } catch (error) {
          console.error("Error fetching recipe details:", error);
        } finally {
          setIsLoadingRecipe(false);
        }
      }
    };

    fetchRecipeDetails();
  }, [isEditMode, recipeId]); // Removed fetchedRecipe from dependencies

  // Helper function to organize ingredients by groups
  const organizeIngredientsIntoGroups = useCallback(
    (ingredients: any[], ingredientGroups: any[] = []) => {
      const groups: IngredientGroupFormValue[] = [];

      // Ensure ingredients is an array
      const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
      const safeGroups = Array.isArray(ingredientGroups)
        ? ingredientGroups
        : [];

      // If no ingredient groups exist, create a default "Ungrouped" group
      if (safeGroups.length === 0) {
        if (safeIngredients.length > 0) {
          groups.push({
            name: "Ungrouped",
            sortOrder: 999,
            ingredients: safeIngredients.map((ing) => ({
              name: ing.name || "",
              quantity: String(ing.quantity || ""),
              unit: ing.unit || DEFAULT_UNIT,
              costPerUnit: String(ing.costPerUnit || ""),
              localId: ing.localId || generateStableId(),
            })),
          });
        } else {
          // Create empty default group
          groups.push({
            name: "Ungrouped",
            sortOrder: 999,
            ingredients: [
              {
                name: "",
                quantity: "",
                unit: DEFAULT_UNIT,
                costPerUnit: "",
                localId: generateStableId(),
              },
            ],
          });
        }
        return groups;
      }

      // Process each ingredient group
      safeGroups.forEach((group) => {
        const groupIngredients = safeIngredients
          .filter((ing) => ing.groupId === group.id)
          .map((ing) => ({
            name: ing.name || "",
            quantity: String(ing.quantity || ""),
            unit: ing.unit || DEFAULT_UNIT,
            costPerUnit: String(ing.costPerUnit || ""),
            localId: ing.localId || generateStableId(),
          }));

        // Always preserve the group, even if it has no ingredients
        groups.push({
          id: group.id,
          name: group.name || "",
          sortOrder: group.sortOrder || 0,
          ingredients:
            groupIngredients.length > 0
              ? groupIngredients
              : [
                  {
                    name: "",
                    quantity: "",
                    unit: DEFAULT_UNIT,
                    costPerUnit: "",
                    localId: generateStableId(),
                  },
                ],
        });
      });

      // Handle ingredients without groups (create "Ungrouped" group)
      const ungroupedIngredients = safeIngredients
        .filter((ing) => !ing.groupId)
        .map((ing) => ({
          name: ing.name || "",
          quantity: String(ing.quantity || ""),
          unit: ing.unit || DEFAULT_UNIT,
          costPerUnit: String(ing.costPerUnit || ""),
          localId: ing.localId || generateStableId(),
        }));

      if (ungroupedIngredients.length > 0) {
        groups.push({
          name: "Ungrouped",
          sortOrder: 999,
          ingredients: ungroupedIngredients,
        });
      }

      // Sort groups by sortOrder
      const sortedGroups = groups.sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
      );
      return sortedGroups;
    },
    [],
  );

  // Reset fetched recipe when dialog opens/closes or recipeId changes
  useEffect(() => {
    if (!isOpen) {
      setFetchedRecipe(null);
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  // Reset fetched recipe when recipeId changes
  useEffect(() => {
    setFetchedRecipe(null);
    setSelectedIds(new Set());
  }, [recipeId]);

  const validationSchema = Yup.object({
    recipeName: Yup.string().trim().required(t("recipes.nameRequired")),
    category: Yup.string().trim().required(t("recipes.categoryRequired")),
    subcategory: Yup.string().trim().required(t("recipes.subcategoryRequired")),
    selectedRecipe: Yup.string(),
    preparedQuantity: Yup.number().nullable(),
    preparedQuantityUnit: Yup.string().nullable(),
    servingQuantity: Yup.number().nullable(),
    servingQuantityUnit: Yup.string().nullable(),
    quantityPerPiece: Yup.number().nullable(),
    ingredientGroups: Yup.array()
      .of(
        Yup.object({
          name: Yup.string().trim().required("Group name is required"),
          sortOrder: Yup.number().min(0),
          ingredients: Yup.array()
            .of(
              Yup.object({
                name: Yup.string()
                  .trim()
                  .required(t("ingredients.nameRequired")),
                quantity: Yup.string()
                  .trim()
                  .required(t("ingredients.quantityRequired")),
                unit: Yup.string()
                  .trim()
                  .required(t("ingredients.unitRequired")),
                costPerUnit: Yup.string().test(
                  "is-number-or-empty",
                  t("ingredients.costValidationError"),
                  (value) =>
                    !value || (!isNaN(Number(value)) && Number(value) >= 0),
                ),
              }),
            )
            .min(0),
        }),
      )
      .min(1, "At least one ingredient group is required")
      .test("has-ingredients", t("recipes.ingredientsRequired"), (groups) => {
        if (!groups) return false;
        return groups.some(
          (group) => group.ingredients && group.ingredients.length > 0,
        );
      }),
  });

  const initialValues = useMemo(() => {
    const values = {
      recipeName: fetchedRecipe?.name || initialRecipe?.recipeName || "",
      category: fetchedRecipe?.category || initialRecipe?.category || "Other",
      subcategory:
        fetchedRecipe?.subcategory || initialRecipe?.subcategory || "Other",
      selectedRecipe: fetchedRecipe?.id || initialRecipe?.selectedRecipe || "",
      ingredientGroups: fetchedRecipe?.ingredients
        ? organizeIngredientsIntoGroups(
            fetchedRecipe.ingredients,
            fetchedRecipe.ingredientGroups,
          )
        : initialRecipe?.ingredientGroups
          ? initialRecipe.ingredientGroups.map((group) => ({
              ...group,
              ingredients: group.ingredients.map((ing) => ({
                ...ing,
                localId: ing.localId || generateStableId(),
              })),
            }))
          : [
              {
                name: "Ungrouped",
                sortOrder: 999,
                ingredients: [
                  {
                    name: "",
                    quantity: "",
                    unit: DEFAULT_UNIT,
                    costPerUnit: "",
                    localId: generateStableId(),
                  },
                ],
              },
            ],
      instructions:
        fetchedRecipe?.instructions || initialRecipe?.instructions || "",
      preparedQuantity:
        fetchedRecipe?.preparedQuantity ??
        initialRecipe?.preparedQuantity ??
        null,
      preparedQuantityUnit:
        fetchedRecipe?.preparedQuantityUnit ??
        initialRecipe?.preparedQuantityUnit ??
        DEFAULT_UNIT,
      servingQuantity:
        fetchedRecipe?.servingQuantity ??
        initialRecipe?.servingQuantity ??
        null,
      servingQuantityUnit:
        fetchedRecipe?.servingQuantityUnit ??
        initialRecipe?.servingQuantityUnit ??
        DEFAULT_UNIT,
      quantityPerPiece:
        fetchedRecipe?.quantityPerPiece ??
        initialRecipe?.quantityPerPiece ??
        null,
    };
    return values;
  }, [fetchedRecipe, initialRecipe, organizeIngredientsIntoGroups]);

  const handleSubmit = (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    // Trim all string fields before submission using utility function
    const trimmedValues = trimObjectStrings(values);

    // Generate unique IDs for new groups
    const processedGroups = trimmedValues.ingredientGroups.map(
      (group: any, index: number) => ({
        id: group.id || `temp_${index}`,
        name: group.name,
        sortOrder: group.sortOrder,
      }),
    );

    // Flatten all ingredients with their group assignments
    const allIngredients: any[] = [];
    trimmedValues.ingredientGroups.forEach((group: any, groupIndex: number) => {
      const groupId = group.id || `temp_${groupIndex}`;
      group.ingredients.forEach((ingredient: any) => {
        if (ingredient.name.trim()) {
          // Only include ingredients with names
          allIngredients.push({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            costPerUnit: ingredient.costPerUnit || "0",
            groupId: group.name === "Ungrouped" ? null : groupId,
          });
        }
      });
    });

    const recipeData = {
      name: trimmedValues.recipeName,
      category: trimmedValues.category,
      subcategory: trimmedValues.subcategory,
      ingredients: allIngredients,
      ingredientGroups: processedGroups.filter((g) => g.name !== "Ungrouped"),
      instructions: trimmedValues.instructions,
      preparedQuantity: trimmedValues.preparedQuantity,
      preparedQuantityUnit: trimmedValues.preparedQuantityUnit,
      servingQuantity: trimmedValues.servingQuantity,
      servingQuantityUnit: trimmedValues.servingQuantityUnit,
      quantityPerPiece:
        trimmedValues.servingQuantityUnit === "pcs"
          ? trimmedValues.quantityPerPiece
          : null,
    };

    if (onSave) {
      onSave(recipeData);
    }
    setSubmitting(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={handleClose}
      title={isEditMode ? t("recipes.editRecipe") : t("recipes.addRecipe")}
      description={
        isEditMode
          ? t("recipes.editRecipeDescription")
          : t("recipes.addRecipeDescription")
      }
      icon={
        isEditMode ? (
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        ) : (
          <ChefHat className="w-5 h-5 text-primary-foreground" />
        )
      }
      size="5xl"
    >
      <Formik
        key={`${isEditMode ? "edit" : "new"}-${fetchedRecipe?.id || "new-recipe"}`}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize={false}
      >
        {({ values, isSubmitting, dirty, errors, touched, setFieldValue }) => {
          // Ensure stable localId per ingredient for selection & DnD
          // We'll handle this in the render function instead of useEffect to avoid form interference

          // Show loading state while fetching recipe details
          if (isEditMode && recipeId && (isLoadingRecipe || !fetchedRecipe)) {
            return (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    {t("recipes.loadingRecipe")}
                  </p>
                </div>
              </div>
            );
          }

          const handlePasteIngredients = (e: ClipboardEvent) => {
            const columnOrder = [
              "name",
              "quantity",
              "unit",
              "costPerUnit",
            ] as const;
            const targetElement = e.target as HTMLElement | null;
            if (!targetElement) return;

            const inputEl = targetElement.closest(
              'input[name^="ingredientGroups["]',
            ) as HTMLInputElement | null;
            let fieldName: string | null = inputEl?.name || null;
            if (!fieldName) {
              const fieldEl = targetElement.closest(
                "[data-field-name]",
              ) as HTMLElement | null;
              fieldName = fieldEl?.getAttribute("data-field-name") ?? null;
            }
            if (!fieldName) return;

            const match = fieldName.match(
              /ingredientGroups\[(\d+)\]\.ingredients\[(\d+)\]\.(name|quantity|unit|costPerUnit)/,
            );
            if (!match) return;

            const groupIndex = parseInt(match[1], 10);
            const ingredientIndex = parseInt(match[2], 10);
            const startCol = columnOrder.indexOf(
              match[3] as (typeof columnOrder)[number],
            );

            const text = e.clipboardData.getData("text/plain");
            if (!text) return;

            // Only prevent default when we know we're handling ingredients paste
            e.preventDefault();

            const rows = text.replace(/\r/g, "").split("\n");
            if (rows.length && rows[rows.length - 1] === "") rows.pop();
            const grid = rows.map((row) => row.split("\t"));

            const nextIngredients = [
              ...values.ingredientGroups[groupIndex].ingredients,
            ];

            const ensureRow = (rowIndex: number) => {
              while (nextIngredients.length <= rowIndex) {
                nextIngredients.push({
                  name: "",
                  quantity: "",
                  unit: DEFAULT_UNIT,
                  costPerUnit: "",
                  localId: generateStableId(),
                });
              }
              if (!nextIngredients[rowIndex]) {
                nextIngredients[rowIndex] = {
                  name: "",
                  quantity: "",
                  unit: DEFAULT_UNIT,
                  costPerUnit: "",
                  localId: generateStableId(),
                };
              }
            };

            const normalizeUnit = (raw: string) => {
              const trimmed = raw.trim();
              if (!trimmed) return DEFAULT_UNIT;
              const found = UNIT_OPTIONS.find(
                (opt) =>
                  opt.value.toLowerCase() === trimmed.toLowerCase() ||
                  opt.label.toLowerCase() === trimmed.toLowerCase(),
              );
              return found ? found.value : trimmed;
            };

            grid.forEach((cells, r) => {
              const rowIndex = ingredientIndex + r;
              ensureRow(rowIndex);
              const updatedRow = { ...nextIngredients[rowIndex] } as any;
              cells.forEach((cell, c) => {
                const colIndex = startCol + c;
                if (colIndex > columnOrder.length - 1) return;
                const key = columnOrder[colIndex];
                const rawValue = cell ?? "";
                if (key === "unit") {
                  updatedRow.unit = normalizeUnit(rawValue);
                } else {
                  updatedRow[key] = rawValue.trim();
                }
              });
              nextIngredients[rowIndex] = updatedRow;
            });

            setFieldValue(
              `ingredientGroups[${groupIndex}].ingredients`,
              nextIngredients,
              true,
            );
          };

          return (
            <Form className="space-y-6">
              {/* Recipe Basic Information */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {t("recipes.recipeInformation")}
                  </CardTitle>
                  <CardDescription>
                    {t("recipes.recipeInformationDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="recipeName"
                      className="text-sm font-medium text-foreground mb-2 block"
                    >
                      {t("recipes.recipeName")} *
                    </Label>
                    <Field
                      as={Input}
                      id="recipeName"
                      name="recipeName"
                      placeholder={t("recipes.recipeNamePlaceholder")}
                      className="border-border focus:border-primary focus:ring-primary/20"
                    />
                    <ErrorMessage
                      name="recipeName"
                      component="p"
                      className="text-destructive text-xs mt-1 flex items-center gap-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="category"
                        className="text-sm font-medium text-foreground mb-2 block"
                      >
                        {t("recipes.recipeCategory")} *
                      </Label>
                      <Field
                        as={Input}
                        id="category"
                        name="category"
                        placeholder={t("recipes.recipeCategoryPlaceholder")}
                        className="border-border focus:border-primary focus:ring-primary/20"
                      />
                      <ErrorMessage
                        name="category"
                        component="p"
                        className="text-destructive text-xs mt-1 flex items-center gap-1"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="subcategory"
                        className="text-sm font-medium text-foreground mb-2 block"
                      >
                        {t("recipes.subcategory")} *
                      </Label>
                      <Field
                        as={Input}
                        id="subcategory"
                        name="subcategory"
                        placeholder={t("recipes.subcategoryPlaceholder")}
                        className="border-border focus:border-primary focus:ring-primary/20"
                      />
                      <ErrorMessage
                        name="subcategory"
                        component="p"
                        className="text-destructive text-xs mt-1 flex items-center gap-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {t("recipes.quantityInformation")}
                  </CardTitle>
                  <CardDescription>
                    {t("recipes.quantityInformationDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Prepared Quantity */}
                  <div className="@container grid grid-cols-12 gap-4">
                    <div className="col-span-12 @sm:col-span-6 @xl:col-span-3 @3xl:col-span-2">
                      <Label
                        htmlFor="preparedQuantity"
                        className="text-sm font-medium text-foreground mb-2 block"
                      >
                        {t("recipes.preparedQuantity")}
                      </Label>
                      <Field
                        as={Input}
                        id="preparedQuantity"
                        name="preparedQuantity"
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder={t("recipes.preparedQuantity")}
                        className="border-border focus:border-primary focus:ring-primary/20"
                      />
                      <ErrorMessage
                        name="preparedQuantity"
                        component="p"
                        className="text-destructive text-xs mt-1 flex items-center gap-1"
                      />
                    </div>
                    <div className="col-span-12 @sm:col-span-6 @xl:col-span-3">
                      <Label
                        htmlFor="preparedQuantityUnit"
                        className="text-sm font-medium text-foreground mb-2 block"
                      >
                        {t("recipes.preparedQuantityUnit")}
                      </Label>
                      <Field name="preparedQuantityUnit">
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
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </Field>
                      <ErrorMessage
                        name="preparedQuantityUnit"
                        component="p"
                        className="text-destructive text-xs mt-1 flex items-center gap-1"
                      />
                    </div>
                    <div className="col-span-12 @sm:col-span-6 @xl:col-span-3 @3xl:col-span-2">
                      <Label
                        htmlFor="servingQuantity"
                        className="text-sm font-medium text-foreground mb-2 block"
                      >
                        {t("recipes.servingQuantity")}
                      </Label>
                      <Field
                        as={Input}
                        id="servingQuantity"
                        name="servingQuantity"
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder="Serving quantity"
                        className="border-border focus:border-primary focus:ring-primary/20"
                      />
                      <ErrorMessage
                        name="servingQuantity"
                        component="p"
                        className="text-destructive text-xs mt-1 flex items-center gap-1"
                      />
                    </div>
                    <div className="col-span-12 @sm:col-span-6 @xl:col-span-3">
                      <Label
                        htmlFor="servingQuantityUnit"
                        className="text-sm font-medium text-foreground mb-2 block"
                      >
                        {t("recipes.servingQuantityUnit")}
                      </Label>
                      <Field name="servingQuantityUnit">
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
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </Field>
                      <ErrorMessage
                        name="servingQuantityUnit"
                        component="p"
                        className="text-destructive text-xs mt-1 flex items-center gap-1"
                      />
                    </div>
                    {/* Quantity Per Piece (only if servingQuantityUnit is 'pcs') */}
                    {values.servingQuantityUnit === "pcs" && (
                      <div className="col-span-12 @sm:col-span-6 @xl:col-span-3 @3xl:col-span-2">
                        <Label
                          htmlFor="quantityPerPiece"
                          className="text-sm font-medium text-foreground mb-2 block"
                        >
                          {t("recipes.quantityPerPiece")}
                        </Label>
                        <Field
                          as={Input}
                          id="quantityPerPiece"
                          name="quantityPerPiece"
                          type="number"
                          step="0.000001"
                          min="0"
                          placeholder="Quantity per piece"
                          className="border-border focus:border-primary focus:ring-primary/20"
                        />
                        <ErrorMessage
                          name="quantityPerPiece"
                          component="p"
                          className="text-destructive text-xs mt-1 flex items-center gap-1"
                        />
                      </div>
                    )}
                  </div>

                  {/* Quantity calculations */}
                  <div className="p-2 border border-border rounded-lg bg-accent">
                    <p className="text-sm text-foreground/70">
                      {((
                        calculatedQuantities = getCalculatedQuantities({
                          preparedQuantity: values.preparedQuantity,
                          preparedQuantityUnit: values.preparedQuantityUnit,
                          servingQuantity: values.servingQuantity,
                          servingQuantityUnit: values.servingQuantityUnit,
                          quantityPerPiece: values.quantityPerPiece ?? null,
                        }),
                      ) => (
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">
                              {t("recipes.numberOfServings")}:
                            </span>{" "}
                            {calculatedQuantities.numberOfServings}{" "}
                            {calculatedQuantities.numberOfServings === 1
                              ? "person"
                              : "people"}
                          </div>
                          <div>
                            <span className="font-medium">
                              {t("recipes.extraQuantity")}:
                            </span>{" "}
                            {calculatedQuantities.extraQuantity}{" "}
                            {calculatedQuantities.preparedUnit}
                          </div>
                        </div>
                      ))()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Ingredient Groups Section */}
              <IngredientsInput
                name="ingredientGroups"
                ingredientGroups={values.ingredientGroups}
                onFieldChange={setFieldValue}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                generateStableId={generateStableId}
                title="Ingredient Groups"
                description="Organize ingredients into logical groups like 'Dough', 'Filling', 'Sauce'"
                showCostSummary={true}
                quantityType="string"
                onPasteIngredients={handlePasteIngredients}
              />

              {/* Instructions Section */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {t("recipes.instructions")}
                  </CardTitle>
                  <CardDescription>
                    {t("recipes.instructionsDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field name="instructions" id="instructions">
                    {({ field: { onChange, name, value } }: { field: any }) => (
                      <>
                        <LexicalEditor
                          onChange={(newValue) => {
                            setFieldValue("instructions", newValue);
                          }}
                          placeholder={t("recipes.instructionsPlaceholder")}
                          outputFormat="json"
                          value={value}
                        />
                      </>
                    )}
                  </Field>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="border-border text-foreground hover:bg-muted bg-transparent"
                >
                  {t("recipes.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !dirty}
                  className="bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      {isEditMode
                        ? t("recipes.updating")
                        : t("recipes.creating")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {isEditMode
                        ? t("recipes.updateRecipe")
                        : t("recipes.createRecipe")}
                    </>
                  )}
                </Button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </BaseDialog>
  );
}
