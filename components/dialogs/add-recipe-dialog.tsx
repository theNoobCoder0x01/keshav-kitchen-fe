"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import { Plus, X, ChefHat } from "lucide-react";
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
    description?: string;
    instructions?: string;
    servings?: number;
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
    description?: string;
    instructions?: string;
    servings?: number;
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
  recipeName: Yup.string().trim().required("Recipe name is required"),
  category: Yup.string().trim().required("Recipe category is required"),
  subcategory: Yup.string().trim().required("Subcategory is required"),
  description: Yup.string().trim(),
  instructions: Yup.string().trim(),
  servings: Yup.number().min(1, "Servings must be at least 1").nullable(),
  selectedRecipe: Yup.string(),
  ingredients: Yup.array()
    .of(
      Yup.object({
        name: Yup.string().trim().required("Ingredient name is required"),
        quantity: Yup.string().trim().required("Quantity is required"),
        unit: Yup.string().required("Unit is required"),
        costPerUnit: Yup.string().test(
          "is-number-or-empty",
          "Must be a valid non-negative number",
          (value) => !value || (!isNaN(Number(value)) && Number(value) >= 0),
        ),
      }),
    )
    .min(1, "At least one ingredient is required"),
});

const UNITS = [
  { value: "g", label: "Grams (g)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "L", label: "Liters (L)" },
  { value: "tsp", label: "Teaspoons (tsp)" },
  { value: "tbsp", label: "Tablespoons (tbsp)" },
  { value: "cup", label: "Cups" },
  { value: "pcs", label: "Pieces" },
];

export function AddRecipeDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialRecipe = null,
}: AddRecipeDialogProps) {
  const initialValues = {
    recipeName: initialRecipe?.recipeName || "",
    category: initialRecipe?.category || "",
    subcategory: initialRecipe?.subcategory || "",
    description: initialRecipe?.description || "",
    instructions: initialRecipe?.instructions || "",
    servings: initialRecipe?.servings || null,
    selectedRecipe: initialRecipe?.selectedRecipe || "",
    ingredients: initialRecipe?.ingredients
      ? initialRecipe.ingredients.map((ing) => ({
          ...ing,
          quantity: ing.quantity !== undefined ? String(ing.quantity) : "",
          costPerUnit: ing.costPerUnit !== undefined ? String(ing.costPerUnit) : "",
        }))
      : [{ name: "", quantity: "", unit: "g", costPerUnit: "" }],
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
      description: values.description || undefined,
      instructions: values.instructions || undefined,
      servings: values.servings || undefined,
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary-foreground" />
              </div>
              {initialRecipe ? "Edit Recipe" : "Create New Recipe"}
            </DialogTitle>
          </DialogHeader>
          
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, isSubmitting, dirty }) => (
              <Form className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="heading-3 text-primary">Basic Information</h3>
                  
                  <div className="form-group">
                    <Label htmlFor="recipeName" className="form-label">
                      Recipe Name *
                    </Label>
                    <Field
                      as={Input}
                      id="recipeName"
                      name="recipeName"
                      placeholder="Enter a descriptive recipe name"
                      className="form-input"
                    />
                    <ErrorMessage
                      name="recipeName"
                      component="p"
                      className="text-destructive body-small mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="form-group">
                      <Label htmlFor="category" className="form-label">
                        Category *
                      </Label>
                      <Field
                        as={Input}
                        id="category"
                        name="category"
                        placeholder="e.g., Main Course, Dessert"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="category"
                        component="p"
                        className="text-destructive body-small mt-1"
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="subcategory" className="form-label">
                        Subcategory *
                      </Label>
                      <Field
                        as={Input}
                        id="subcategory"
                        name="subcategory"
                        placeholder="e.g., Indian, Italian"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="subcategory"
                        component="p"
                        className="text-destructive body-small mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="form-group">
                      <Label htmlFor="description" className="form-label">
                        Description
                      </Label>
                      <Field
                        as={Textarea}
                        id="description"
                        name="description"
                        placeholder="Brief description of the recipe"
                        className="form-input min-h-[100px]"
                      />
                    </div>

                    <div className="form-group">
                      <Label htmlFor="servings" className="form-label">
                        Servings
                      </Label>
                      <Field
                        as={Input}
                        id="servings"
                        name="servings"
                        type="number"
                        min="1"
                        placeholder="Number of servings"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="servings"
                        component="p"
                        className="text-destructive body-small mt-1"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <Label htmlFor="instructions" className="form-label">
                      Cooking Instructions
                    </Label>
                    <Field
                      as={Textarea}
                      id="instructions"
                      name="instructions"
                      placeholder="Step-by-step cooking instructions (separate steps with new lines)"
                      className="form-input min-h-[120px]"
                    />
                  </div>
                </div>

                {/* Ingredients Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="heading-3 text-primary">Ingredients *</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        values.ingredients.push({
                          name: "",
                          quantity: "",
                          unit: "g",
                          costPerUnit: "",
                        });
                      }}
                      className="border-primary/20 text-primary hover:bg-primary/10 btn-hover"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Ingredient
                    </Button>
                  </div>

                  <FieldArray name="ingredients">
                    {({ remove }: { remove: (index: number) => void }) => (
                      <div className="space-y-4">
                        {values.ingredients.map((ingredient, index) => (
                          <div
                            key={index}
                            className="glass p-4 rounded-xl border-0 space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-foreground">
                                Ingredient {index + 1}
                              </h4>
                              {values.ingredients.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="w-8 h-8 p-0 text-destructive hover:bg-destructive/10"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                              <div className="sm:col-span-5">
                                <Label className="form-label">Name *</Label>
                                <Field
                                  as={Input}
                                  name={`ingredients[${index}].name`}
                                  placeholder="Ingredient name"
                                  className="form-input"
                                />
                                <ErrorMessage
                                  name={`ingredients[${index}].name`}
                                  component="p"
                                  className="text-destructive body-small mt-1"
                                />
                              </div>
                              
                              <div className="sm:col-span-3">
                                <Label className="form-label">Quantity *</Label>
                                <Field
                                  as={Input}
                                  name={`ingredients[${index}].quantity`}
                                  placeholder="Amount"
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  className="form-input"
                                />
                                <ErrorMessage
                                  name={`ingredients[${index}].quantity`}
                                  component="p"
                                  className="text-destructive body-small mt-1"
                                />
                              </div>
                              
                              <div className="sm:col-span-2">
                                <Label className="form-label">Unit *</Label>
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
                                      <SelectTrigger className="form-input">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {UNITS.map((unit) => (
                                          <SelectItem key={unit.value} value={unit.value}>
                                            {unit.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </Field>
                              </div>
                              
                              <div className="sm:col-span-2">
                                <Label className="form-label">Cost/Unit</Label>
                                <Field
                                  as={Input}
                                  name={`ingredients[${index}].costPerUnit`}
                                  placeholder="₹0.00"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="form-input"
                                />
                                <ErrorMessage
                                  name={`ingredients[${index}].costPerUnit`}
                                  component="p"
                                  className="text-destructive body-small mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </FieldArray>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="btn-hover"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !dirty}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg btn-hover"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <ChefHat className="w-4 h-4 mr-2" />
                        {initialRecipe ? "Update Recipe" : "Create Recipe"}
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