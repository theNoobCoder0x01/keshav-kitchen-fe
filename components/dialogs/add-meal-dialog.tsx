"use client";

import { ErrorMessage, Field, FieldArray, Formik } from "formik";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as Yup from "yup";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDailyMenu } from "@/lib/actions/menu";
import { getRecipes } from "@/lib/actions/recipes";
import { fetchIngredients } from "@/lib/api/ingredients";
import { Plus, X } from "lucide-react";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";

interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number | null;
}

interface APIFullRecipe {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  servings: number | null;
  category: string;
  subcategory: string | null;
  ingredients: Array<{
    id: string;
    name: string;
  }>;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
}

export interface MealFormValues {
  recipeId: string;
  followRecipe: boolean;
  ghan: string;
  servingAmount: string;
  servingUnit: string;
  ingredients: IngredientFormValue[];
}

const validationSchema = Yup.object().shape({
  recipeId: Yup.string().required("Recipe is required"),
  followRecipe: Yup.boolean().default(false),
  ghan: Yup.string()
    .required("Ghan is required")
    .matches(/^\d+(\.\d+)?$/, "Must be a valid number"),
  servingAmount: Yup.string()
    .required("Serving amount is required")
    .matches(/^\d+(\.\d+)?$/, "Must be a valid number"),
  servingUnit: Yup.string().required("Serving unit is required"),
  ingredients: Yup.array()
    .of(
      Yup.object().shape({
        name: Yup.string().required("Ingredient name is required"),
        quantityPerGhan: Yup.object().shape({
          amount: Yup.string()
            .required("Quantity is required")
            .matches(/^\d+(\.\d+)?$/, "Must be a valid number"),
          unit: Yup.string().required("Unit is required"),
        }),
        cost: Yup.number()
          .required("Cost is required")
          .min(0, "Cost cannot be negative"),
      })
    )
    .min(1, "At least one ingredient is required"),
});

const initialValues: MealFormValues = {
  recipeId: "",
  followRecipe: false,
  ghan: "1.0",
  servingAmount: "100",
  servingUnit: "g",
  ingredients: [],
};

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType;
  selectedDate: Date;
}

interface IngredientOption {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number | null;
}

// Common units for ingredients
const UNITS = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "L", label: "L" },
  { value: "tsp", label: "tsp" },
  { value: "tbsp", label: "tbsp" },
  { value: "cup", label: "cup" },
  { value: "pcs", label: "pcs" },
];

interface Recipe {
  id: string;
  name: string;
}

interface IngredientOption {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number | null;
}

export interface IngredientFormValue {
  id: string | undefined;
  name: string;
  quantity: string;
  unit: string;
  costPerUnit: string;
}

export interface MealFormValues {
  recipeId: string;
  followRecipe: boolean;
  ghan: string;
  servingAmount: string;
  servingUnit: string;
  ingredients: IngredientFormValue[];
}

interface MealFormProps {
  ingredientOptions: IngredientOption[];
  isSubmitting: boolean;
}

export function AddMealDialog({
  open,
  onOpenChange,
  mealType,
  selectedDate,
}: AddMealDialogProps) {
  const { data: session } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<
    IngredientOption[]
  >([]);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [recipesData, ingredientsData] = await Promise.all([
          getRecipes(),
          fetchIngredients(),
        ]);
        setRecipes(recipesData);
        setIngredientOptions(ingredientsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load recipes and ingredients");
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  const handleRecipeSelect = (
    recipeId: string,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const selectedRecipe = recipes.find((r) => r.id === recipeId);
    if (selectedRecipe) {
      const ingredients = selectedRecipe.ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        costPerUnit: ingredient.costPerUnit || 0,
      }));
      setFieldValue("ingredients", ingredients);
      setFieldValue("followRecipe", true);
    }
  };

  const handleSubmit = async (
    values: MealFormValues,
    { resetForm }: { resetForm: () => void }
  ) => {
    if (!session?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setIsFormSubmitting(true);

    try {
      const menuItemData = {
        date: selectedDate,
        mealType,
        recipeId: values.recipeId,
        kitchenId: session.user.id,
        servings: parseFloat(values.ghan),
        ghanFactor: 1.0,
        notes: `Follow recipe: ${values.followRecipe ? "Yes" : "No"}`,
        ingredients: values.ingredients.map((ing) => ({
          name: ing.name,
          quantity: parseFloat(ing.quantity) * parseFloat(values.ghan),
          unit: ing.unit,
          costPerUnit: ing.costPerUnit,
        })),
      };

      const result = await createDailyMenu(menuItemData);

      if (result.success) {
        toast.success("Meal added successfully!");
        resetForm();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to add meal");
      }
    } catch (error) {
      console.error("Error saving meal:", error);
      toast.error("An error occurred while saving the meal");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({
          isSubmitting,
          values,
          setFieldValue,
          errors,
          touched,
          handleChange,
          handleBlur,
        }) => {
          // Calculate derived values based on form values
          const calculateValues = () => {
            const ghanValue = parseFloat(values.ghan) || 0;
            const servingAmount = parseFloat(values.servingAmount) || 0;

            // Calculate per person quantity (default to 100g per person if serving amount is 0)
            const perPerson = servingAmount > 0 ? servingAmount : 100;

            // Calculate persons per 1 ghan (1000g / perPerson)
            const oneGhanPersons =
              perPerson > 0 ? (1000 / perPerson).toFixed(2) : "0.00";

            // Calculate total persons for the specified ghan
            const totalPersons = (
              parseFloat(oneGhanPersons) * ghanValue
            ).toFixed(2);

            // Calculate total cost and per person cost
            const totalCost = values.ingredients.reduce((sum, ing) => {
              const quantity = parseFloat(ing.quantity) || 0;
              const costPerUnit = parseFloat(ing.costPerUnit) || 0;
              return sum + quantity * costPerUnit * ghanValue;
            }, 0);

            const perPersonCost = (
              totalCost / parseFloat(totalPersons) || 0
            ).toFixed(2);

            return {
              perPerson: perPerson.toFixed(2),
              perPersonCost,
              oneGhanPersons,
              totalPersons,
            };
          };

          const calculations = calculateValues();

          const getError = (field: string) => {
            const error = Yup.getIn(errors, field);
            const touchedField = Yup.getIn(touched, field);
            return touchedField && error ? String(error) : null;
          };

          // Helper to safely get form field errors
          const getFieldError = (field: string, index?: number) => {
            if (index !== undefined) {
              const fieldError = errors.ingredients?.[index];
              if (typeof fieldError === "string") return fieldError;
              return fieldError?.[field as keyof IngredientFormValue] as
                | string
                | undefined;
            }
            return errors[field as keyof typeof errors] as string | undefined;
          };

          // Helper to check if field is touched
          const isFieldTouched = (field: string, index?: number) => {
            if (index !== undefined) {
              return touched.ingredients?.[index]?.[
                field as keyof IngredientFormValue
              ];
            }
            return touched[field as keyof typeof touched];
          };
          return (
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add {mealType.toLowerCase()} meal</DialogTitle>
              </DialogHeader>

              <form>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6 sm:col-span-9">
                    <Label
                      htmlFor="recipe"
                      className="text-base font-medium text-[#4b465c] mb-2"
                    >
                      Recipe
                    </Label>
                    <Field name={`recipeId`}>
                      {({ field }: { field: any }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange({
                              target: { name: field.name, value },
                            });
                            handleRecipeSelect(value, setFieldValue);
                          }}
                        >
                          <SelectTrigger className="w-full border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20">
                            <SelectValue placeholder="Select a recipe" />
                          </SelectTrigger>
                          <SelectContent>
                            {recipes.map((recipe) => (
                              <SelectItem key={recipe.id} value={recipe.id}>
                                {recipe.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                    <ErrorMessage
                      name={`recipeId`}
                      component="p"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <Label className="text-base font-medium text-[#4b465c]">
                      Follow Recipe
                    </Label>
                    <Field name={`followRecipe`}>
                      {({ field }: { field: any }) => (
                        <div className="w-full h-10 flex items-center">
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange({
                                target: { name: field.name, value: checked },
                              })
                            }
                            className="data-[state=checked]:bg-[#674af5]"
                          />
                        </div>
                      )}
                    </Field>
                  </div>

                  <div className="col-span-5">
                    <Label className="text-base font-medium text-[#4b465c] mb-2 block">
                      Ghan
                    </Label>
                    <Field
                      as={Input}
                      name={`ghan`}
                      type="number"
                      min="0.1"
                      step="0.1"
                      className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                    />
                    <ErrorMessage
                      name={`ghan`}
                      component="p"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>

                  <div className="col-span-4">
                    <Label className="text-base font-medium text-[#4b465c] mb-2 block">
                      Serving amount
                    </Label>
                    <Field
                      as={Input}
                      name={`servingAmount`}
                      type="number"
                      min="0.1"
                      step="0.1"
                      className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                    />
                    <ErrorMessage
                      name={`servingAmount`}
                      component="p"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>

                  <div className="col-span-3">
                    <Label className="text-base font-medium text-[#4b465c] mb-2 block">
                      Serving unit
                    </Label>
                    <Field name={`servingUnit`}>
                      {({ field }: { field: any }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) =>
                            field.onChange({
                              target: { name: field.name, value },
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select unit" />
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
                    <ErrorMessage
                      name={`servingUnit`}
                      component="p"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>

                  <div className="col-span-12 space-y-4">
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
                            id: undefined,
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
                              <div className="col-span-5 sm:col-span-3">
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
                                        {UNITS.map((unit) => (
                                          <SelectItem
                                            key={unit.value}
                                            value={unit.value}
                                          >
                                            {unit.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </Field>
                              </div>
                              <div className="col-span-1">
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

                  <div className="col-span-12 bg-[#f8f7fa] p-4 rounded-lg space-y-2">
                    <div className="grid grid-cols-12 gap-8 text-sm">
                      <div className="col-span-6 flex justify-between">
                        <span className="font-medium text-[#4b465c]">
                          Per Person
                        </span>
                        <span className="text-[#4b465c]">
                          {calculations.perPerson} {values.servingUnit}
                        </span>
                      </div>
                      <div className="col-span-6 flex justify-between">
                        <span className="font-medium text-[#4b465c]">
                          Per Person cost
                        </span>
                        <span className="text-[#4b465c]">
                          ₹{calculations.perPersonCost}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-8 text-sm">
                      <div className="col-span-6 flex justify-between">
                        <span className="font-medium text-[#4b465c]">
                          1 Ghan
                        </span>
                        <span className="text-[#4b465c]">
                          {calculations.oneGhanPersons} Person
                        </span>
                      </div>
                      <div className="col-span-6 flex justify-between">
                        <span className="font-medium text-[#4b465c]">
                          {values.ghan} Ghan
                        </span>
                        <span className="text-[#4b465c]">
                          {calculations.totalPersons} Person
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isFormSubmitting}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#674af5] hover:bg-[#5e3ef3] text-white"
                    disabled={isFormSubmitting}
                  >
                    {isFormSubmitting ? "Saving..." : "Save Meal"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          );
        }}
      </Formik>
    </Dialog>
  );
}
