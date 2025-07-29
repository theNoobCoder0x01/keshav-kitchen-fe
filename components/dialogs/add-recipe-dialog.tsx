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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import { Plus, X } from "lucide-react";
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialRecipe ? "Edit Recipe" : "Add New Recipe"}
          </DialogTitle>
        </DialogHeader>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, isSubmitting, dirty }) => (
            <Form className="space-y-4 px-1 py-2">
              <div>
                <Label
                  htmlFor="recipeName"
                  className="text-sm font-medium text-[#4b465c] mb-1 block"
                >
                  Recipe Name
                </Label>
                <Field
                  as={Input}
                  id="recipeName"
                  name="recipeName"
                  placeholder="Enter recipe name"
                  className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                />
                <ErrorMessage
                  name="recipeName"
                  component="p"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="category"
                    className="text-sm font-medium text-[#4b465c] mb-1 block"
                  >
                    Recipe Category
                  </Label>
                  <Field
                    as={Input}
                    id="category"
                    name="category"
                    placeholder="Enter category"
                    className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                  />
                  <ErrorMessage
                    name="category"
                    component="p"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="subcategory"
                    className="text-sm font-medium text-[#4b465c] mb-1 block"
                  >
                    Subcategory
                  </Label>
                  <Field
                    as={Input}
                    id="subcategory"
                    name="subcategory"
                    placeholder="Enter subcategory"
                    className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                  />
                  <ErrorMessage
                    name="subcategory"
                    component="p"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-[#4b465c]">
                    Ingredients
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
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
                    className="text-[#674af5] hover:bg-[#674af5]/10 gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Ingredients
                  </Button>
                </div>

                <FieldArray name="ingredients">
                  {({ remove }: { remove: (index: number) => void }) => (
                    <>
                      {values.ingredients.map((ingredient, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-2 items-end mb-2"
                        >
                          <div className="col-span-6 sm:col-span-4">
                            <Label className="text-sm font-medium text-[#4b465c] mb-1 block">
                              Ingredient
                            </Label>
                            <Field
                              as={Input}
                              name={`ingredients[${index}].name`}
                              placeholder="Ingredient name"
                              className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                            />
                            <ErrorMessage
                              name={`ingredients[${index}].name`}
                              component="p"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-4">
                            <Label className="text-sm font-medium text-[#4b465c] mb-1 block">
                              Quantity
                            </Label>
                            <Field
                              as={Input}
                              name={`ingredients[${index}].quantity`}
                              placeholder="5"
                              type="number"
                              step="0.1"
                              className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                            />
                            <ErrorMessage
                              name={`ingredients[${index}].quantity`}
                              component="p"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <Label className="text-sm font-medium text-[#4b465c] mb-1 block">
                              Cost/Unit
                            </Label>
                            <Field
                              as={Input}
                              name={`ingredients[${index}].costPerUnit`}
                              placeholder="30"
                              type="number"
                              step="0.01"
                              className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                            />
                            <ErrorMessage
                              name={`ingredients[${index}].costPerUnit`}
                              component="p"
                              className="text-red-500 text-xs mt-1"
                            />
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <Label className="text-sm font-medium text-[#4b465c] mb-1 block">
                              Unit
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
                                  <SelectTrigger className="border-[#dbdade] h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Kg">Kg</SelectItem>
                                    <SelectItem value="g">g</SelectItem>
                                    <SelectItem value="L">L</SelectItem>
                                    <SelectItem value="ml">ml</SelectItem>
                                    <SelectItem value="pcs">pcs</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </Field>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="w-8 h-8 p-0 text-[#ea5455] hover:bg-[#ea5455]/10"
                              disabled={values.ingredients.length === 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </FieldArray>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="border-[#dbdade] text-[#4b465c] hover:bg-[#f8f7fa] bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !dirty}
                  className="bg-[#674af5] hover:bg-[#674af5]/90 text-white"
                >
                  Save
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
