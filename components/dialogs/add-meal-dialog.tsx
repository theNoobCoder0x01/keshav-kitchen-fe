"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ErrorMessage, Field, FieldArray, Formik } from "formik";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as Yup from "yup";

import { Badge } from "@/components/ui/badge";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/hooks/use-translations";
import { fetchIngredients } from "@/lib/api/ingredients";
import { createMenu, updateMenu } from "@/lib/api/menus";
import { fetchRecipes } from "@/lib/api/recipes";
import {
  calculateMealMetrics,
  validateMealInputs,
} from "@/lib/utils/meal-calculations";
import type { MealCalculationInput } from "@/types/calculations";
import { ChevronDown, GripVertical, Package, Plus, Trash2, Utensils, X } from "lucide-react";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";

import { DEFAULT_UNIT, UNIT_OPTIONS } from "@/lib/constants/units";
import { trimIngredients } from "@/lib/utils/form-utils";
import type { IngredientFormValue, MealFormValues } from "@/types/forms";
import type { MealType } from "@/types/menus";
import type {
  IngredientGroupApi,
  RecipeApiItem,
  RecipeIngredientApi
} from "@/types/recipes";

// Use centralized unit options
const UNITS = UNIT_OPTIONS;

type Recipe = Pick<RecipeApiItem, "id" | "name"> & {
  ingredients?: RecipeIngredientApi[];
  ingredientGroups?: IngredientGroupApi[];
};

type IngredientOption = {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number | null;
};

interface IngredientGroupFormValue {
  id?: string;
  name: string;
  sortOrder: number;
  ingredients: IngredientFormValue[];
}

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType;
  selectedDate: Date;
  kitchenId?: string;
  editMeal?: {
    id: string;
    recipeId: string;
    servings: number;
    ghanFactor: number;
    recipe?: {
      id: string;
      name: string;
    };
    ingredients?: IngredientFormValue[];
  } | null;
}

interface MealFormProps {
  ingredientOptions: IngredientOption[];
  isSubmitting: boolean;
}

// Update MealFormValues to include ingredient groups
interface MealFormValuesWithGroups extends Omit<MealFormValues, 'ingredients'> {
  ingredientGroups: IngredientGroupFormValue[];
}

export function AddMealDialog({
  open,
  onOpenChange,
  mealType,
  selectedDate,
  kitchenId,
  editMeal,
}: AddMealDialogProps) {
  const { t } = useTranslations();
  const { data: session } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<
    IngredientOption[]
  >([]);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

  // Helper function to organize ingredients into groups
  const organizeIngredientsIntoGroups = (
    ingredients: any[],
    ingredientGroups: any[] = []
  ): IngredientGroupFormValue[] => {
    const groups: IngredientGroupFormValue[] = [];

    // Create a map of existing groups
    const groupMap = new Map(ingredientGroups.map((g) => [g.id, g]));

    // Create groups with their ingredients - preserve ALL groups even if empty
    ingredientGroups.forEach((group) => {
      const groupIngredients = ingredients
        .filter((ing) => ing.groupId === group.id)
        .map((ing) => ({
          id: ing.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          costPerUnit: ing.costPerUnit,
          localId: ing.localId || (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`),
        }));

      // Always preserve the group, even if it has no ingredients
      groups.push({
        id: group.id,
        name: group.name,
        sortOrder: group.sortOrder,
        ingredients: groupIngredients.length > 0 ? groupIngredients : [
          {
            id: undefined,
            name: "",
            quantity: 0,
            unit: DEFAULT_UNIT,
            costPerUnit: 0,
            localId: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`,
          }
        ],
      });
    });

    // Handle ingredients without groups (create "Ungrouped" group)
    const ungroupedIngredients = ingredients
      .filter((ing) => !ing.groupId)
      .map((ing) => ({
        id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        costPerUnit: ing.costPerUnit,
        localId: ing.localId || (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`),
      }));

    if (ungroupedIngredients.length > 0) {
      groups.push({
        name: "Ungrouped",
        sortOrder: 999,
        ingredients: ungroupedIngredients,
      });
    }

    // If no groups exist, create a default "Ungrouped" group with all ingredients
    if (groups.length === 0 && ingredients.length > 0) {
      groups.push({
        name: "Ungrouped",
        sortOrder: 999,
        ingredients: ingredients.map((ing) => ({
          id: ing.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          costPerUnit: ing.costPerUnit,
          localId: ing.localId || (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`),
        })),
      });
    }

    // Sort groups by sortOrder
    return groups.sort((a, b) => a.sortOrder - b.sortOrder);
  };

  

  const validationSchema = Yup.object().shape({
    recipeId: Yup.string().trim().required(t("meals.recipeRequired")),
    followRecipe: Yup.boolean().default(false),
    ghan: Yup.number()
      .required(t("meals.ghanRequired"))
      .positive(t("meals.ghanPositive"))
      .max(100, t("meals.ghanMax")),
    servingAmount: Yup.number()
      .required(t("meals.servingAmountRequired"))
      .positive(t("meals.servingAmountPositive"))
      .max(10000, t("meals.servingAmountMax")),
    servingUnit: Yup.string().trim().required(t("meals.servingUnitRequired")),
    ingredientGroups: Yup.array()
      .of(
        Yup.object().shape({
          name: Yup.string().trim().required("Group name is required"),
          sortOrder: Yup.number().min(0),
          ingredients: Yup.array()
            .of(
              Yup.object().shape({
                name: Yup.string().trim().required(t("meals.ingredientNameRequired")),
                quantity: Yup.number()
                  .required(t("meals.quantityRequired"))
                  .positive(t("meals.quantityPositive")),
                unit: Yup.string().trim().required(t("meals.unitRequired")),
                costPerUnit: Yup.number()
                  .required(t("meals.costPerUnitRequired"))
                  .min(0, t("meals.costPerUnitMin")),
              }),
            )
            .min(0), // Allow empty groups
        }),
      )
      .min(1, t("meals.ingredientsRequired"))
      .test("has-ingredients", t("meals.ingredientsRequired"), (groups) => {
        if (!groups) return false;
        return groups.some(
          (group) => group.ingredients && group.ingredients.length > 0
        );
      }),
  });

  // This will be computed dynamically based on editMeal prop
  const getInitialValues = (
    editMeal?: AddMealDialogProps["editMeal"],
    recipes?: Recipe[],
  ): MealFormValuesWithGroups => {
    if (editMeal) {
      // Use ingredients from the menu if available, otherwise fall back to recipe ingredients
      let ingredients;
      let ingredientGroups;

      if (editMeal.ingredients && editMeal.ingredients.length > 0) {
        // Load ingredients from the saved menu
        ingredients = editMeal.ingredients.map((ingredient) => ({
          id: ingredient.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          costPerUnit: ingredient.costPerUnit,
          localId: ingredient.localId || (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`),
        }));
        
        // For now, we'll create a default "Ungrouped" group for existing menus
        // In the future, this could be enhanced to load actual ingredient groups
        ingredientGroups = [
          {
            name: "Ungrouped",
            sortOrder: 999,
            ingredients: ingredients.map(ing => ({
              ...ing,
              localId: ing.localId || (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`)
            })),
          },
        ];
      } else {
        // Fall back to recipe ingredients if menu doesn't have ingredients saved
        const selectedRecipe = recipes?.find((r) => r.id === editMeal.recipeId);
        const recipeIngredients = selectedRecipe?.ingredients || [];
        const recipeGroups = selectedRecipe?.ingredientGroups || [];

        if (recipeGroups.length > 0) {
          // Use recipe ingredient groups
          ingredientGroups = organizeIngredientsIntoGroups(recipeIngredients, recipeGroups);
        } else {
          // Create default "Ungrouped" group
          ingredients = recipeIngredients.length > 0
            ? recipeIngredients.map((ingredient) => ({
                id: ingredient.id,
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                costPerUnit: ingredient.costPerUnit || 0,
                localId: ingredient.localId || (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`),
              }))
            : [
                {
                  id: undefined,
                  name: "",
                  quantity: 0,
                  unit: DEFAULT_UNIT,
                  costPerUnit: 0,
                  localId: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`,
                },
              ];

          ingredientGroups = [
            {
              name: "Ungrouped",
              sortOrder: 999,
              ingredients,
            },
          ];
        }
      }

      return {
        recipeId: editMeal.recipeId,
        followRecipe: true,
        ghan: editMeal.ghanFactor || 1.0,
        servingAmount: editMeal.servings,
        servingUnit: "g", // Default unit, could be enhanced to store this in the database
        ingredientGroups,
      };
    }

    return {
      recipeId: "",
      followRecipe: false,
      ghan: 1.0,
      servingAmount: 100,
      servingUnit: "g",
              ingredientGroups: [
          {
            name: "Ungrouped",
            sortOrder: 999,
            ingredients: [
              {
                id: undefined,
                name: "",
                quantity: 0,
                unit: DEFAULT_UNIT,
                costPerUnit: 0,
                localId: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`,
              },
            ],
          },
        ],
    };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [recipesData, ingredientsData] = await Promise.all([
          fetchRecipes(),
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
    setFieldValue: (field: string, value: any) => void,
  ) => {
    const selectedRecipe = recipes.find((r) => r.id === recipeId);
    if (selectedRecipe) {
      const recipeIngredients = selectedRecipe.ingredients || [];
      const recipeGroups = selectedRecipe.ingredientGroups || [];
      
      if (recipeGroups.length > 0) {
        // Use recipe ingredient groups
        const ingredientGroups = organizeIngredientsIntoGroups(recipeIngredients, recipeGroups);
        setFieldValue("ingredientGroups", ingredientGroups);
      } else {
        // Create default "Ungrouped" group
        const ingredients = recipeIngredients.map((ingredient) => ({
          id: ingredient.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          costPerUnit: ingredient.costPerUnit || 0,
          localId: ingredient.localId || (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`),
        }));
        
        const ingredientGroups = [
          {
            name: "Ungrouped",
            sortOrder: 999,
            ingredients,
          },
        ];
        setFieldValue("ingredientGroups", ingredientGroups);
      }
      setFieldValue("followRecipe", true);
    }
  };

  const handleSubmit = async (
    values: MealFormValuesWithGroups,
    { resetForm }: { resetForm: () => void },
  ) => {
    try {
      setIsFormSubmitting(true);

      // Use the passed kitchenId or fall back to session kitchenId
      const targetKitchenId = kitchenId || session?.user?.kitchenId;

      // Validate required fields
      if (!targetKitchenId) {
        throw new Error("Kitchen information not found. Please try again.");
      }

      if (!session?.user?.id) {
        throw new Error("User information not found. Please log in again.");
      }

      if (!values.recipeId) {
        throw new Error("Please select a recipe from the dropdown.");
      }

      // Additional validation for positive values
      if (values.servingAmount <= 0) {
        throw new Error("Serving amount must be greater than zero.");
      }

      if (values.ghan <= 0) {
        throw new Error("Ghan factor must be greater than zero.");
      }

      if (editMeal) {
        // Update existing meal
        console.log(
          `Updating meal ${editMeal.id} for kitchen: ${targetKitchenId}, mealType: ${mealType}`,
        );

        // Flatten all ingredients with their group assignments
        const allIngredients: any[] = [];
        values.ingredientGroups.forEach((group: any, groupIndex: number) => {
          const groupId = group.id || `temp_${groupIndex}`;
          group.ingredients.forEach((ingredient: any) => {
            if (ingredient.name.trim()) {
              // Only include ingredients with names
              allIngredients.push({
                id: ingredient.id ?? undefined,
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                costPerUnit: ingredient.costPerUnit,
                groupId: group.name === "Ungrouped" ? null : groupId,
              });
            }
          });
        });

        const updateData = {
          recipeId: values.recipeId,
          servings: values.servingAmount,
          ghanFactor: values.ghan,
          notes: `Meal updated for ${mealType.toLowerCase()} with ${values.servingAmount} ${values.servingUnit} servings and ${values.ghan} ghan factor.`,
          ingredients: trimIngredients(allIngredients),
        };

        const result = await updateMenu(editMeal.id, updateData);
        toast.success(
          t("meals.mealUpdatedSuccessfully", {
            mealType: mealType.toLowerCase(),
          }),
        );
      } else {
        // Create new meal
        console.log(
          `Creating meal for kitchen: ${targetKitchenId}, mealType: ${mealType}, date: ${selectedDate.toISOString()}`,
        );

        // Flatten all ingredients with their group assignments
        const allIngredients: any[] = [];
        values.ingredientGroups.forEach((group: any, groupIndex: number) => {
          const groupId = group.id || `temp_${groupIndex}`;
          group.ingredients.forEach((ingredient: any) => {
            if (ingredient.name.trim()) {
              // Only include ingredients with names
              allIngredients.push({
                id: ingredient.id ?? undefined,
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                costPerUnit: ingredient.costPerUnit,
                groupId: group.name === "Ungrouped" ? null : groupId,
              });
            }
          });
        });

        const menuData = {
          date: selectedDate,
          mealType: mealType,
          recipeId: values.recipeId,
          kitchenId: targetKitchenId,
          userId: session.user.id,
          servings: values.servingAmount,
          ghanFactor: values.ghan,
          status: "PLANNED" as const,
          notes: t("meals.mealPlannedNotes", {
            mealType: mealType.toLowerCase(),
            servings: values.servingAmount,
            unit: values.servingUnit,
            ghan: values.ghan,
          }),
          ingredients: trimIngredients(allIngredients),
        };

        const result = await createMenu(menuData);
        toast.success(
          t("meals.mealAddedSuccessfully", {
            mealType: mealType.toLowerCase(),
          }),
        );
      }
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating menu:", error);
      toast.error(error.message || t("meals.failedToAddMeal"));
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Calculate total cost from ingredient groups
  const calculateTotalCost = (ingredientGroups: IngredientGroupFormValue[]) => {
    return ingredientGroups.reduce((total, group) => {
      return (
        total +
        group.ingredients.reduce((groupTotal, ingredient) => {
          const quantity = ingredient.quantity || 0;
          const costPerUnit = ingredient.costPerUnit || 0;
          return groupTotal + quantity * costPerUnit;
        }, 0)
      );
    }, 0);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        editMeal
          ? t("meals.editMeal", { mealType: mealType.toLowerCase() })
          : t("meals.addMeal", { mealType: mealType.toLowerCase() })
      }
      description={t("meals.configureMealDetails", {
        mealType: mealType.toLowerCase(),
      })}
      icon={<Utensils className="w-5 h-5 text-primary-foreground" />}
      size="6xl"
      footer={
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isFormSubmitting}
          >
            {isFormSubmitting ? t("meals.saving") : t("meals.saveMeal")}
          </Button>
        </div>
      }
    >
      <Formik
        initialValues={getInitialValues(editMeal, recipes)}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize={false}
        key={editMeal?.id || "new"} // Force re-initialization when switching between add/edit
      >
        {({
          isSubmitting,
          values,
          setFieldValue,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit: formikHandleSubmit,
          resetForm,
        }) => {
          // Helper functions for ingredient selection and moving
          const toggleRowSelected = (localId: string, checked: boolean) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (checked) next.add(localId);
              else next.delete(localId);
              return next;
            });
          };

          const setGroupSelection = (groupIndex: number, checked: boolean) => {
            const ids = values.ingredientGroups[groupIndex].ingredients.map(
              (ing: any) => ing.localId
            );
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (checked) ids.forEach((id: string) => next.add(id));
              else ids.forEach((id: string) => next.delete(id));
              return next;
            });
          };

          const clearSelection = () => setSelectedIds(new Set());

          const removeIngredientWithPlaceholder = (
            groupIndex: number,
            ingredientIndex: number,
            removeIngredient: (index: number) => void
          ) => {
            const group = values.ingredientGroups[groupIndex];
            if (group.ingredients.length === 1) {
              // If this is the last ingredient, replace it with a placeholder instead of removing
              setFieldValue(
                `ingredientGroups[${groupIndex}].ingredients[0]`,
                {
                  id: undefined,
                  name: "",
                  quantity: 0,
                  unit: DEFAULT_UNIT,
                  costPerUnit: 0,
                  localId: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`,
                },
                false
              );
            } else {
              // Otherwise, remove the ingredient normally
              removeIngredient(ingredientIndex);
            }
          };

          const moveSelectedIngredients = (
            destinationGroupIndex: number,
            position: "end" | "start" = "end"
          ) => {
            if (selectedIds.size === 0) return;
            const nextGroups = values.ingredientGroups.map((g) => ({
              ...g,
              ingredients: [...g.ingredients],
            }));
            const moved: any[] = [];
            nextGroups.forEach((group) => {
              const keep: any[] = [];
              for (const ing of group.ingredients as any[]) {
                if (selectedIds.has(ing.localId)) moved.push(ing);
                else keep.push(ing);
              }
              group.ingredients = keep.length
                ? keep
                : [
                    {
                      id: undefined,
                      name: "",
                      quantity: 0,
                      unit: DEFAULT_UNIT,
                      costPerUnit: 0,
                      localId: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`,
                    },
                  ];
            });
            const dest = nextGroups[destinationGroupIndex];
            dest.ingredients =
              position === "start"
                ? [...moved, ...dest.ingredients]
                : [...dest.ingredients, ...moved];
            setFieldValue("ingredientGroups", nextGroups, false);
            clearSelection();
          };

          const GroupDroppable = ({
            id,
            children,
          }: {
            id: string;
            children: React.ReactNode;
          }) => {
            const { setNodeRef } = useDroppable({ id });
            return (
              <div ref={setNodeRef} data-group-droppable={id}>
                {children}
              </div>
            );
          };

          const DraggableRow = ({
            id,
            children,
          }: {
            id: string;
            children: React.ReactNode;
          }) => {
            const { attributes, listeners, setNodeRef, isDragging } =
              useDraggable({ id });
            return (
              <div
                ref={setNodeRef}
                {...attributes}
                {...listeners}
                className={isDragging ? "opacity-50" : undefined}
              >
                {children}
              </div>
            );
          };

          const findGroupIndexByRowId = (rowId: string) => {
            const localId = rowId.replace(/^row-/, "");
            for (let g = 0; g < values.ingredientGroups.length; g++) {
              if (
                values.ingredientGroups[g].ingredients.some(
                  (ing: any) => ing.localId === localId
                )
              )
                return g;
            }
            return -1;
          };

          const onDragEnd = (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveDragId(null);
            if (!over) return;
            const overId = String(over.id);
            const isOverGroup = overId.startsWith("group-");
            const activeId = String(active.id);
            const sourceGroupIndex = findGroupIndexByRowId(activeId);
            if (sourceGroupIndex === -1) return;

            if (isOverGroup) {
              const destGroupIndex = parseInt(overId.replace("group-", ""), 10);
              const activeLocalId = activeId.replace("row-", "");
              const moveIds = selectedIds.has(activeLocalId)
                ? selectedIds
                : new Set([activeLocalId]);

              const nextGroups = values.ingredientGroups.map((g) => ({
                ...g,
                ingredients: [...g.ingredients],
              }));
              const moved: any[] = [];
              nextGroups.forEach((group) => {
                const keep: any[] = [];
                for (const ing of group.ingredients as any[]) {
                  if (moveIds.has(ing.localId)) moved.push(ing);
                  else keep.push(ing);
                }
                group.ingredients = keep.length
                  ? keep
                  : [
                      {
                        id: undefined,
                        name: "",
                        quantity: 0,
                        unit: DEFAULT_UNIT,
                        costPerUnit: 0,
                        localId: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`,
                      },
                    ];
              });
              const dest = nextGroups[destGroupIndex];
              dest.ingredients = [...dest.ingredients, ...moved];
              setFieldValue("ingredientGroups", nextGroups, false);
              setSelectedIds(new Set());
            }
          };

          // Calculate meal metrics using our utility functions
          const allIngredients = values.ingredientGroups.flatMap(group => 
            group.ingredients.map(ing => ({
              name: ing.name || "",
              quantity: ing.quantity || 0,
              unit: ing.unit || "g",
              costPerUnit: ing.costPerUnit || 0,
              localId: ing.localId,
            }))
          );
          
          const calculationInput: MealCalculationInput = {
            ghan: values.ghan || 1,
            servingAmount: values.servingAmount || 100,
            servingUnit: values.servingUnit || "g",
            ingredients: allIngredients.map((ing) => ({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              costPerUnit: ing.costPerUnit,
              groupId: null,
              group: null,
              localId: ing.localId || (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`),
            })),
            mealType,
          };

          // Validate inputs before calculating
          const validation = validateMealInputs(calculationInput);
          const calculations = validation.isValid
            ? calculateMealMetrics(calculationInput)
            : null;

          const getError = (field: string) => {
            const error = Yup.getIn(errors, field);
            const touchedField = Yup.getIn(touched, field);
            return touchedField && error ? String(error) : null;
          };

          // Removing helpers that referenced non-existent fields in this form
          return (
            <div className="overflow-y-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(values, { resetForm });
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-9">
                    <Label
                      htmlFor="recipe"
                      className="text-base font-medium text-foreground mb-2"
                    >
                      {t("meals.recipe")}
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
                          <SelectTrigger className="w-full border-border focus:border-primary focus:ring-primary/20">
                            <SelectValue
                              placeholder={t("meals.selectRecipe")}
                            />
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
                      className="text-destructive text-xs mt-1 flex items-center gap-1"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-base font-medium text-foreground">
                      {t("meals.followRecipe")}
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
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                      )}
                    </Field>
                  </div>

                  <div className="sm:col-span-4">
                    <Label className="text-base font-medium text-foreground mb-2 block">
                      {t("meals.ghan")}
                    </Label>
                    <Field
                      as={Input}
                      name={`ghan`}
                      type="number"
                      min="0"
                      step="0.000001"
                      className="border-border focus:border-primary focus:ring-primary/20"
                    />
                    <ErrorMessage
                      name={`ghan`}
                      component="p"
                      className="text-destructive text-xs mt-1 flex items-center gap-1"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <Label className="text-base font-medium text-foreground mb-2 block">
                      {t("meals.servingAmount")}
                    </Label>
                    <Field
                      as={Input}
                      name={`servingAmount`}
                      type="number"
                      min="0.1"
                      step="0.000001"
                      className="border-border focus:border-primary focus:ring-primary/20"
                    />
                    <ErrorMessage
                      name={`servingAmount`}
                      component="p"
                      className="text-destructive text-xs mt-1 flex items-center gap-1"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <Label className="text-base font-medium text-[#4b465c] mb-2 block">
                      {t("meals.servingUnit")}
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
                            <SelectValue placeholder={t("meals.selectUnit")} />
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
                      className="text-destructive text-xs mt-1 flex items-center gap-1"
                    />
                  </div>

                  {/* Ingredient Groups Section */}
                  <div className="sm:col-span-12">
                    <FieldArray name="ingredientGroups">
                      {({ remove: removeGroup, push: pushGroup }) => (
                        <Card>
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Package className="w-5 h-5 text-primary" />
                                  {t("meals.ingredients")}
                                </CardTitle>
                                <CardDescription>
                                  Organize ingredients into logical groups
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {values.ingredientGroups.reduce(
                                    (total, group) => total + group.ingredients.length,
                                    0
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
                                        {values.ingredientGroups.map((g, idx) => (
                                          <DropdownMenuItem
                                            key={idx}
                                            onClick={() => {
                                              // Move ingredients immediately when group is selected
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
                                      sortOrder: values.ingredientGroups.length,
                                      ingredients: [
                                        {
                                          id: undefined,
                                          name: "",
                                          quantity: 0,
                                          unit: DEFAULT_UNIT,
                                          costPerUnit: 0,
                                          localId: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`,
                                        },
                                      ],
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
                            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                              {values.ingredientGroups.map((group, groupIndex) => (
                                <GroupDroppable id={`group-${groupIndex}`} key={groupIndex}>
                                  <div
                                    className="border border-border rounded-lg p-4 bg-card/30"
                                  >
                                {/* Group Header */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3 flex-1">
                                    <Checkbox
                                      checked={
                                        group.ingredients.length > 0 &&
                                        group.ingredients.every(
                                          (ing: any) => selectedIds.has(ing.localId)
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
                                        name={`ingredientGroups[${groupIndex}].name`}
                                        placeholder="Group name (e.g., Main Course, Side Dish, Dessert)"
                                        className="font-medium"
                                      />
                                      <ErrorMessage
                                        name={`ingredientGroups[${groupIndex}].name`}
                                        component="p"
                                        className="text-destructive text-xs mt-1"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {group.ingredients.length} items
                                    </Badge>
                                    {values.ingredientGroups.length > 1 && (
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
                                <FieldArray name={`ingredientGroups[${groupIndex}].ingredients`}>
                                  {({ remove: removeIngredient, push: pushIngredient }) => (
                                    <div className="space-y-3">
                                      {group.ingredients.map((ingredient, ingredientIndex) => (
                                        <DraggableRow key={ingredient.localId || ingredientIndex} id={`row-${ingredient.localId || ingredientIndex}`}>
                                          <div className="grid grid-cols-12 gap-2 items-end p-3 border border-border/50 rounded-lg bg-background/50">
                                            <div className="col-span-12 flex items-center justify-between mb-3">
                                              <div className="flex items-center gap-2">
                                                <Checkbox
                                                  checked={Boolean(selectedIds.has(ingredient.localId || String(ingredientIndex)))}
                                                  onCheckedChange={(checked) =>
                                                    toggleRowSelected(ingredient.localId || String(ingredientIndex), Boolean(checked))
                                                  }
                                                />
                                                <h5 className="text-sm font-medium text-muted-foreground">
                                                  Ingredient #{ingredientIndex + 1}
                                                </h5>
                                              </div>
                                            </div>
                                          <div className="col-span-12 sm:col-span-5">
                                            <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                              {t("meals.ingredient")}
                                            </Label>
                                            <Field
                                              as={Input}
                                              name={`ingredientGroups[${groupIndex}].ingredients[${ingredientIndex}].name`}
                                              placeholder={t("meals.ingredientNamePlaceholder")}
                                              className="text-sm"
                                            />
                                            <ErrorMessage
                                              name={`ingredientGroups[${groupIndex}].ingredients[${ingredientIndex}].name`}
                                              component="p"
                                              className="text-destructive text-xs mt-1"
                                            />
                                          </div>

                                          <div className="col-span-6 sm:col-span-3">
                                            <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                              {t("meals.quantity")}
                                            </Label>
                                            <Field
                                              as={Input}
                                              name={`ingredientGroups[${groupIndex}].ingredients[${ingredientIndex}].quantity`}
                                              placeholder="5"
                                              type="number"
                                              step="0.000001"
                                              min="0"
                                              className="text-sm"
                                            />
                                            <ErrorMessage
                                              name={`ingredientGroups[${groupIndex}].ingredients[${ingredientIndex}].quantity`}
                                              component="p"
                                              className="text-destructive text-xs mt-1"
                                            />
                                          </div>

                                          <div className="col-span-6 sm:col-span-2">
                                            <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                              {t("meals.unit")}
                                            </Label>
                                            <Field name={`ingredientGroups[${groupIndex}].ingredients[${ingredientIndex}].unit`}>
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

                                          <div className="col-span-10 sm:col-span-2">
                                            <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                              {t("meals.costPerUnit")}
                                            </Label>
                                            <Field
                                              as={Input}
                                              name={`ingredientGroups[${groupIndex}].ingredients[${ingredientIndex}].costPerUnit`}
                                              placeholder="30"
                                              type="number"
                                              step="0.000001"
                                              min="0"
                                              className="text-sm"
                                            />
                                            <ErrorMessage
                                              name={`ingredientGroups[${groupIndex}].ingredients[${ingredientIndex}].costPerUnit`}
                                              component="p"
                                              className="text-destructive text-xs mt-1"
                                            />
                                          </div>

                                          <div className="col-span-2 flex justify-end">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeIngredientWithPlaceholder(groupIndex, ingredientIndex, removeIngredient)}
                                              className="w-6 h-6 p-0 text-destructive hover:bg-destructive/10"
                                            >
                                              <X className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      </DraggableRow>
                                    ))}

                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          pushIngredient({
                                            id: undefined,
                                            name: "",
                                            quantity: 0,
                                            unit: DEFAULT_UNIT,
                                            costPerUnit: 0,
                                            localId: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Math.random()}`,
                                          });
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
                            </GroupDroppable>
                          ))}
                          <DragOverlay>
                            {activeDragId ? (
                              <div className="p-2 text-xs bg-muted border rounded">Moving…</div>
                            ) : null}
                          </DragOverlay>
                        </DndContext>
                      </CardContent>
                        </Card>
                      )}
                    </FieldArray>
                  </div>
                  <div className="col-span-12 bg-muted p-4 rounded-lg space-y-2">
                    {calculations ? (
                      <>
                        <div className="grid grid-cols-12 gap-8 text-sm">
                          <div className="col-span-6 flex justify-between">
                            <span className="font-medium text-foreground">
                              {t("meals.perPerson")}
                            </span>
                            <span className="text-foreground">
                              {calculations.display.perPersonServing}
                            </span>
                          </div>
                          <div className="col-span-6 flex justify-between">
                            <span className="font-medium text-foreground">
                              {t("meals.perPersonCost")}
                            </span>
                            <span className="text-foreground">
                              {calculations.display.costPerPerson}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 gap-8 text-sm">
                          <div className="col-span-6 flex justify-between">
                            <span className="font-medium text-foreground">
                              {t("meals.oneGhan")}
                            </span>
                            <span className="text-foreground">
                              {calculations.display.personsPerGhan}
                            </span>
                          </div>
                          <div className="col-span-6 flex justify-between">
                            <span className="font-medium text-foreground">
                              {values.ghan} {t("meals.ghan")}
                            </span>
                            <span className="text-foreground">
                              {calculations.display.totalPersons}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 gap-8 text-sm">
                          <div className="col-span-6 flex justify-between">
                            <span className="font-medium text-foreground">
                              {t("meals.totalCost")}
                            </span>
                            <span className="text-foreground">
                              ${calculateTotalCost(values.ingredientGroups).toFixed(2)}
                            </span>
                          </div>
                          <div className="col-span-6 flex justify-between">
                            <span className="font-medium text-foreground">
                              {t("meals.totalWeight")}
                            </span>
                            <span className="text-foreground">
                              {calculations.display.totalWeight}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-sm text-gray-500 py-4">
                        {validation.errors.length > 0 ? (
                          <div className="space-y-1">
                            <p>{t("meals.fixIssuesToSeeCalculations")}</p>
                            <ul className="text-xs text-destructive list-disc list-inside">
                              {validation.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p>
                            {t("meals.enterIngredientDetailsToSeeCalculations")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
          );
        }}
      </Formik>
    </BaseDialog>
  );
}
