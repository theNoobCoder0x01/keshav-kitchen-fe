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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChefHat,
  DollarSign,
  Plus,
  Utensils,
  X,
} from "lucide-react";
import * as Yup from "yup";

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  costPerUnit?: string;
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
    }>;
  }) => void;
  initialRecipe?: {
    recipeName: string;
    category: string;
    subcategory: string;
    selectedRecipe: string;
    ingredients: Array<{
      name: string;
      quantity: string;
      unit: string;
      costPerUnit: string;
    }>;
  } | null;
}

const validationSchema = Yup.object({
  recipeName: Yup.string().trim().required("Recipe name is required."),
  category: Yup.string().trim().required("Recipe category is required."),
  subcategory: Yup.string().trim().required("Subcategory is required."),
  selectedRecipe: Yup.string(),
  ingredients: Yup.array()
    .of(
      Yup.object({
        name: Yup.string().trim().required("Name is required."),
        quantity: Yup.string().trim().required("Quantity is required."),
        unit: Yup.string().required("Unit is required."),
        costPerUnit: Yup.string().test(
          "is-number-or-empty",
          "Must be a valid non-negative number.",
          (value) => !value || (!isNaN(Number(value)) && Number(value) >= 0),
        ),
      }),
    )
    .min(1, "At least one ingredient is required."),
});

const unitOptions = [
  { value: "Kg", label: "Kilograms (Kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "L", label: "Liters (L)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "tbsp", label: "Tablespoons (tbsp)" },
  { value: "tsp", label: "Teaspoons (tsp)" },
  { value: "cup", label: "Cups (cup)" },
];

export function AddRecipeDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialRecipe = null,
}: AddRecipeDialogProps) {
  const isEditMode = !!initialRecipe;

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
      : [{ name: "", quantity: "", unit: "Kg", costPerUnit: "" }],
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
  const calculateTotalCost = (ingredients: Ingredient[]) => {
    return ingredients.reduce((total, ingredient) => {
      const quantity = parseFloat(ingredient.quantity) || 0;
      const costPerUnit = parseFloat(ingredient.costPerUnit || "0") || 0;
      return total + quantity * costPerUnit;
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-5xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                {isEditMode ? (
                  <BookOpen className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <ChefHat className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {isEditMode ? "Edit Recipe" : "Add New Recipe"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {isEditMode
                    ? "Update your recipe details and ingredients"
                    : "Create a new recipe with ingredients and details"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, isSubmitting, dirty, errors, touched }) => (
              <Form className="space-y-6 p-6">
                {/* Recipe Basic Information */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Recipe Information
                    </CardTitle>
                    <CardDescription>
                      Enter the basic details for your recipe
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label
                        htmlFor="recipeName"
                        className="text-sm font-medium text-foreground mb-2 block"
                      >
                        Recipe Name *
                      </Label>
                      <Field
                        as={Input}
                        id="recipeName"
                        name="recipeName"
                        placeholder="Enter recipe name (e.g., Chicken Curry, Pasta Carbonara)"
                        className="border-border focus:border-primary focus:ring-primary/20"
                      />
                      <ErrorMessage
                        name="recipeName"
                        component="p"
                        className="text-destructive text-xs mt-1 flex items-center gap-1"
                      >
                        {(msg) => (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            {msg}
                          </>
                        )}
                      </ErrorMessage>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="category"
                          className="text-sm font-medium text-foreground mb-2 block"
                        >
                          Recipe Category *
                        </Label>
                        <Field
                          as={Input}
                          id="category"
                          name="category"
                          placeholder="e.g., Main Course, Dessert, Appetizer"
                          className="border-border focus:border-primary focus:ring-primary/20"
                        />
                        <ErrorMessage
                          name="category"
                          component="p"
                          className="text-destructive text-xs mt-1 flex items-center gap-1"
                        >
                          {(msg) => (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              {msg}
                            </>
                          )}
                        </ErrorMessage>
                      </div>

                      <div>
                        <Label
                          htmlFor="subcategory"
                          className="text-sm font-medium text-foreground mb-2 block"
                        >
                          Subcategory *
                        </Label>
                        <Field
                          as={Input}
                          id="subcategory"
                          name="subcategory"
                          placeholder="e.g., Indian, Italian, Vegetarian"
                          className="border-border focus:border-primary focus:ring-primary/20"
                        />
                        <ErrorMessage
                          name="subcategory"
                          component="p"
                          className="text-destructive text-xs mt-1 flex items-center gap-1"
                        >
                          {(msg) => (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              {msg}
                            </>
                          )}
                        </ErrorMessage>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ingredients Section */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Utensils className="w-5 h-5 text-primary" />
                          Ingredients
                        </CardTitle>
                        <CardDescription>
                          Add ingredients with quantities and costs
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {values.ingredients.length} ingredient
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
                              unit: "Kg",
                              costPerUnit: "",
                            };
                            values.ingredients.push(newIngredient);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-3 h-3" />
                          Add Ingredient
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FieldArray name="ingredients">
                      {({ remove }: { remove: (index: number) => void }) => (
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
                                  Ingredient #{index + 1}
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
                                    Ingredient Name *
                                  </Label>
                                  <Field
                                    as={Input}
                                    name={`ingredients[${index}].name`}
                                    placeholder="e.g., Chicken breast, Rice, Tomatoes"
                                    className="border-border focus:border-primary focus:ring-primary/20"
                                  />
                                  <ErrorMessage
                                    name={`ingredients[${index}].name`}
                                    component="p"
                                    className="text-destructive text-xs mt-1 flex items-center gap-1"
                                  >
                                    {(msg) => (
                                      <>
                                        <AlertCircle className="w-3 h-3" />
                                        {msg}
                                      </>
                                    )}
                                  </ErrorMessage>
                                </div>

                                <div className="sm:col-span-3">
                                  <Label className="text-sm font-medium text-foreground mb-2 block">
                                    Quantity *
                                  </Label>
                                  <Field
                                    as={Input}
                                    name={`ingredients[${index}].quantity`}
                                    placeholder="5"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    className="border-border focus:border-primary focus:ring-primary/20"
                                  />
                                  <ErrorMessage
                                    name={`ingredients[${index}].quantity`}
                                    component="p"
                                    className="text-destructive text-xs mt-1 flex items-center gap-1"
                                  >
                                    {(msg) => (
                                      <>
                                        <AlertCircle className="w-3 h-3" />
                                        {msg}
                                      </>
                                    )}
                                  </ErrorMessage>
                                </div>

                                <div className="sm:col-span-2">
                                  <Label className="text-sm font-medium text-foreground mb-2 block">
                                    Unit *
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
                                        <SelectTrigger className="border-border focus:border-primary focus:ring-primary/20">
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
                                    Cost/Unit
                                  </Label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Field
                                      as={Input}
                                      name={`ingredients[${index}].costPerUnit`}
                                      placeholder="0.00"
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
                                  >
                                    {(msg) => (
                                      <>
                                        <AlertCircle className="w-3 h-3" />
                                        {msg}
                                      </>
                                    )}
                                  </ErrorMessage>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </FieldArray>

                    {/* Cost Summary */}
                    {values.ingredients.length > 0 && (
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            Estimated Total Cost:
                          </span>
                          <span className="text-lg font-bold text-primary">
                            ${calculateTotalCost(values.ingredients).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Validation Error for Ingredients Array */}
                    {errors.ingredients && touched.ingredients && (
                      <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-destructive text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {errors.ingredients as string}
                        </p>
                      </div>
                    )}
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
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !dirty}
                    className="bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        {isEditMode ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {isEditMode ? "Update Recipe" : "Create Recipe"}
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </DialogContent>
    </Dialog>
  );
}
