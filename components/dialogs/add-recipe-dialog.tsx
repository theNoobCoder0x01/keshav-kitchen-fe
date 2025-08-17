"use client";

import { LexicalEditor } from "@/components/rich-text/lexical-editor";
import { Badge } from "@/components/ui/badge";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/hooks/use-translation";
import { DEFAULT_UNIT, UNIT_OPTIONS } from "@/lib/constants/units";
import { cn } from "@/lib/utils";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import {
  BookOpen,
  CheckCircle2,
  ChefHat,
  DollarSign,
  Plus,
  Utensils,
  X,
} from "lucide-react";
import type { ClipboardEvent } from "react";
import * as Yup from "yup";

import type { RecipeDialogIngredientValue } from "@/types/forms";

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
    }>;
    instructions?: string | null;
  }) => void;
  initialRecipe?: {
    recipeName: string;
    category: string;
    subcategory: string;
    selectedRecipe: string;
    ingredients: RecipeDialogIngredientValue[];
    instructions?: string | null;
  } | null;
}

export function AddRecipeDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialRecipe = null,
}: AddRecipeDialogProps) {
  const { t } = useTranslation();
  const isEditMode = !!initialRecipe;

  const validationSchema = Yup.object({
    recipeName: Yup.string().trim().required(t("recipes.nameRequired")),
    category: Yup.string().trim().required(t("recipes.categoryRequired")),
    subcategory: Yup.string().trim().required(t("recipes.subcategoryRequired")),
    selectedRecipe: Yup.string(),
    ingredients: Yup.array()
      .of(
        Yup.object({
          name: Yup.string().trim().required(t("ingredients.nameRequired")),
          quantity: Yup.string().trim().required(t("ingredients.quantityRequired")),
          unit: Yup.string().required(t("ingredients.unitRequired")),
          costPerUnit: Yup.string().test(
            "is-number-or-empty",
            t("ingredients.costValidationError"),
            (value) => !value || (!isNaN(Number(value)) && Number(value) >= 0),
          ),
        }),
      )
      .min(1, t("recipes.ingredientsRequired")),
  });

  const initialValues = {
    recipeName: initialRecipe?.recipeName || "",
    category: initialRecipe?.category || "",
    subcategory: initialRecipe?.subcategory || "",
    selectedRecipe: initialRecipe?.selectedRecipe || "",
    ingredients: initialRecipe?.ingredients
      ? initialRecipe.ingredients.map((ing) => ({
          ...ing,
          quantity: ing.quantity !== undefined ? String(ing.quantity) : "",
          costPerUnit:
            ing.costPerUnit !== undefined ? String(ing.costPerUnit) : "",
        }))
      : [{ name: "", quantity: "", unit: DEFAULT_UNIT, costPerUnit: "" }],
    instructions: initialRecipe?.instructions || "",
  };

  const handleSubmit = (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    const mappedIngredients = values.ingredients.map((ingredient) => ({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit || "0",
    }));

    const recipeData = {
      name: values.recipeName,
      category: values.category,
      subcategory: values.subcategory,
      ingredients: mappedIngredients,
      instructions: values.instructions || null,
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

  // Calculate total cost
  const calculateTotalCost = (ingredients: RecipeDialogIngredientValue[]) => {
    return ingredients.reduce((total, ingredient) => {
      const quantity = parseFloat(ingredient.quantity) || 0;
      const costPerUnit = parseFloat(ingredient.costPerUnit || "0") || 0;
      return total + quantity * costPerUnit;
    }, 0);
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
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, isSubmitting, dirty, errors, touched, setFieldValue }) => {
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
              'input[name^="ingredients["]',
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
              /ingredients\[(\d+)\]\.(name|quantity|unit|costPerUnit)/,
            );
            if (!match) return;

            const startRow = parseInt(match[1], 10);
            const startCol = columnOrder.indexOf(
              match[2] as (typeof columnOrder)[number],
            );

            const text = e.clipboardData.getData("text/plain");
            if (!text) return;

            // Only prevent default when we know we're handling ingredients paste
            e.preventDefault();

            const rows = text.replace(/\r/g, "").split("\n");
            if (rows.length && rows[rows.length - 1] === "") rows.pop();
            const grid = rows.map((row) => row.split("\t"));

            const nextIngredients = [...values.ingredients];

            const ensureRow = (rowIndex: number) => {
              while (nextIngredients.length <= rowIndex) {
                nextIngredients.push({
                  name: "",
                  quantity: "",
                  unit: DEFAULT_UNIT,
                  costPerUnit: "",
                });
              }
              if (!nextIngredients[rowIndex]) {
                nextIngredients[rowIndex] = {
                  name: "",
                  quantity: "",
                  unit: DEFAULT_UNIT,
                  costPerUnit: "",
                };
              }
            };

            const normalizeUnit = (raw: string) => {
              const trimmed = raw.trim();
              if (!trimmed) return DEFAULT_UNIT;
              const found = unitOptions.find(
                (opt) =>
                  opt.value.toLowerCase() === trimmed.toLowerCase() ||
                  opt.label.toLowerCase() === trimmed.toLowerCase(),
              );
              return found ? found.value : trimmed;
            };

            grid.forEach((cells, r) => {
              const rowIndex = startRow + r;
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

            setFieldValue("ingredients", nextIngredients, true);
          };

          return (
            <Form className="space-y-6 p-6">
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

              {/* Ingredients Section */}
              <FieldArray name="ingredients">
                {({
                  remove,
                  push,
                }: {
                  remove: (index: number) => void;
                  push: (value: any) => void;
                }) => (
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Utensils className="w-5 h-5 text-primary" />
                            {t("recipes.ingredients")}
                          </CardTitle>
                          <CardDescription>
                            {t("recipes.ingredientsDescription")}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {values.ingredients.length} {t("recipes.ingredient")}
                            {values.ingredients.length !== 1 ? "s" : ""}
                          </Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newIngredient = {
                                name: "",
                                quantity: "",
                                unit: DEFAULT_UNIT,
                                costPerUnit: "",
                              };
                              push(newIngredient);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-3 h-3" />
                            {t("recipes.addIngredient")}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent onPaste={handlePasteIngredients}>
                      <div className="space-y-4">
                        {values.ingredients.map((ingredient, index) => (
                          <div
                            key={index}
                            className={cn(
                              "p-4 border border-border rounded-lg bg-card/50",
                              "hover:border-primary/30 transition-colors",
                            )}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-foreground">
                                {t("recipes.ingredient")} #{index + 1}
                              </h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="w-8 h-8 p-0 text-destructive hover:bg-destructive/10"
                                disabled={values.ingredients.length === 1}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                              <div className="sm:col-span-5">
                                <Label className="text-sm font-medium text-foreground mb-2 block">
                                  {t("recipes.ingredientName")} *
                                </Label>
                                <Field
                                  as={Input}
                                  name={`ingredients[${index}].name`}
                                  placeholder={t("recipes.ingredientNamePlaceholder")}
                                  className="border-border focus:border-primary focus:ring-primary/20"
                                />
                                <ErrorMessage
                                  name={`ingredients[${index}].name`}
                                  component="p"
                                  className="text-destructive text-xs mt-1 flex items-center gap-1"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <Label className="text-sm font-medium text-foreground mb-2 block">
                                  {t("recipes.quantity")} *
                                </Label>
                                <Field
                                  as={Input}
                                  name={`ingredients[${index}].quantity`}
                                  placeholder={t("recipes.quantityPlaceholder")}
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  className="border-border focus:border-primary focus:ring-primary/20"
                                />
                                <ErrorMessage
                                  name={`ingredients[${index}].quantity`}
                                  component="p"
                                  className="text-destructive text-xs mt-1 flex items-center gap-1"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <Label className="text-sm font-medium text-foreground mb-2 block">
                                  {t("recipes.unit")} *
                                </Label>
                                <Field name={`ingredients[${index}].unit`}>
                                  {({ field }: { field: any }) => (
                                    <Select
                                      value={field.value}
                                      onValueChange={(value) =>
                                        field.onChange({
                                          target: { name: field.name, value },
                                        })
                                      }
                                    >
                                      <SelectTrigger
                                        data-field-name={`ingredients[${index}].unit`}
                                        className="border-border focus:border-primary focus:ring-primary/20"
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {unitOptions.map((option) => (
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
                              </div>

                              <div className="sm:col-span-2">
                                <Label className="text-sm font-medium text-foreground mb-2 block">
                                  {t("recipes.costPerUnit")}
                                </Label>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Field
                                    as={Input}
                                    name={`ingredients[${index}].costPerUnit`}
                                    placeholder={t("recipes.costPerUnitPlaceholder")}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="pl-8 border-border focus:border-primary focus:ring-primary/20"
                                  />
                                </div>
                                <ErrorMessage
                                  name={`ingredients[${index}].costPerUnit`}
                                  component="p"
                                  className="text-destructive text-xs mt-1 flex items-center gap-1"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Cost Summary */}
                      {values.ingredients.length > 0 && (
                        <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              {t("recipes.estimatedTotalCost")}:
                            </span>
                            <span className="text-lg font-bold text-primary">
                              $
                              {calculateTotalCost(values.ingredients).toFixed(
                                2,
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </FieldArray>

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
                <CardContent>
                  <Field name="instructions">
                    {({ field }: { field: any }) => (
                      <LexicalEditor
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        placeholder={t("recipes.instructionsPlaceholder")}
                      />
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
                      {isEditMode ? t("recipes.updating") : t("recipes.creating")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {isEditMode ? t("recipes.updateRecipe") : t("recipes.createRecipe")}
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
