"use client";

import { ErrorMessage, Field, Formik } from "formik";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as Yup from "yup";

import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { IngredientsInput } from "@/components/ui/ingredients-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/hooks/use-translations";
import api from "@/lib/api/axios";
import { createMenu, updateMenu } from "@/lib/api/menus";
import { fetchAllRecipesForDropdown } from "@/lib/api/recipes";
import { BookOpen, Utensils } from "lucide-react";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";

import { DEFAULT_UNIT, UNIT_OPTIONS } from "@/lib/constants/units";
import { trimIngredients } from "@/lib/utils/form-utils";
import { getCalculatedQuantities } from "@/lib/utils/meal-calculations";
import type { IngredientFormValue, MealFormValues } from "@/types/forms";
import type { MealType } from "@/types/menus";
import type { RecipeApiItem } from "@/types/recipes";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

// Use centralized unit options
const UNITS = UNIT_OPTIONS;

type Recipe = Pick<
  RecipeApiItem,
  | "id"
  | "name"
  | "category"
  | "subcategory"
  | "preparedQuantity"
  | "preparedQuantityUnit"
  | "servingQuantity"
  | "servingQuantityUnit"
  | "quantityPerPiece"
  | "ingredients"
  | "ingredientGroups"
>;

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
  ingredients: (IngredientFormValue & { sequenceNumber?: number })[];
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
    preparedQuantity: number;
    preparedQuantityUnit: string;
    servingQuantity: number;
    servingQuantityUnit: string;
    quantityPerPiece?: number;
    ghanFactor: number;
    menuComponentId?: string;
    recipe?: {
      id: string;
      name: string;
    };
    ingredients?: IngredientFormValue[];
    ingredientGroups?: Array<{
      id: string;
      name: string;
      sortOrder: number;
    }>;
    followRecipe?: boolean;
  } | null;
}

interface MealFormProps {
  ingredientOptions: IngredientOption[];
  isSubmitting: boolean;
}

// Update MealFormValues to include ingredient groups
interface MealFormValuesWithGroups extends Omit<MealFormValues, "ingredients"> {
  ingredientGroups: IngredientGroupFormValue[];
  menuComponentId?: string;
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
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedRecipeCategory, setSelectedRecipeCategory] =
    useState<string>("all");
  const [selectedRecipeSubcategory, setSelectedRecipeSubcategory] =
    useState<string>("all");
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Step 1: Add state for loading and fetched menu
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [fetchedMenu, setFetchedMenu] = useState<any>(null);

  // Reset fetched menu when dialog closes or menu ID changes
  useEffect(() => {
    if (!open) {
      setFetchedMenu(null);
      setIsLoadingMenu(false);
    }
  }, [open]);

  useEffect(() => {
    setFetchedMenu(null);
    setIsLoadingMenu(false);
  }, [editMeal?.id]);

  // Fetch menu details when in edit mode
  useEffect(() => {
    const fetchMenuDetails = async () => {
      if (open && editMeal?.id && !fetchedMenu) {
        setIsLoadingMenu(true);
        try {
          const response = await api.get(`/menus/${editMeal.id}/`);
          if (response.status === 200) {
            setFetchedMenu(response.data);
          } else {
            console.error("Failed to fetch menu details");
            toast.error(t("meals.failedToLoadMenu"));
          }
        } catch (error) {
          console.error("Error fetching menu details:", error);
          toast.error(t("meals.failedToLoadMenu"));
        } finally {
          setIsLoadingMenu(false);
        }
      }
    };

    fetchMenuDetails();
  }, [open, editMeal?.id, fetchedMenu]);

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
          sequenceNumber: ing.sequenceNumber ?? 1,
          localId:
            ing.localId ||
            (typeof crypto !== "undefined"
              ? String(uuidv4())
              : `${Math.random()}`),
        }));

      // Always preserve the group, even if it has no ingredients
      groups.push({
        id: group.id,
        name: group.name,
        sortOrder: group.sortOrder,
        ingredients:
          groupIngredients.length > 0
            ? groupIngredients
            : [
                {
                  id: undefined,
                  name: "",
                  quantity: 0,
                  unit: DEFAULT_UNIT,
                  costPerUnit: 0,
                  localId:
                    typeof crypto !== "undefined"
                      ? String(uuidv4())
                      : `${Math.random()}`,
                },
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
        sequenceNumber: ing.sequenceNumber ?? 1,
        localId:
          ing.localId ||
          (typeof crypto !== "undefined"
            ? String(uuidv4())
            : `${Math.random()}`),
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
          sequenceNumber: ing.sequenceNumber ?? 1,
          localId:
            ing.localId ||
            (typeof crypto !== "undefined"
              ? String(uuidv4())
              : `${Math.random()}`),
        })),
      });
    }

    // Sort groups by sortOrder
    return groups.sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const validationSchema = Yup.object().shape({
    recipeId: Yup.string().trim().required(t("meals.recipeRequired")),
    followRecipe: Yup.boolean().default(false),
    ghanFactor: Yup.number()
      .required(t("meals.ghanRequired"))
      .positive(t("meals.ghanPositive"))
      .max(100, t("meals.ghanMax")),
    preparedQuantity: Yup.number()
      .required(t("meals.preparedQuantityRequired"))
      .positive(t("meals.preparedQuantityPositive")),
    preparedQuantityUnit: Yup.string()
      .trim()
      .required(t("meals.preparedQuantityUnitRequired")),
    servingQuantity: Yup.number()
      .required(t("meals.servingQuantityRequired"))
      .positive(t("meals.servingQuantityPositive")),
    servingQuantityUnit: Yup.string()
      .trim()
      .required(t("meals.servingQuantityUnitRequired")),
    quantityPerPiece: Yup.number().positive(
      t("meals.quantityPerPiecePositive")
    ),
    ingredientGroups: Yup.array()
      .of(
        Yup.object().shape({
          name: Yup.string().trim().required("Group name is required"),
          sortOrder: Yup.number().min(0),
          ingredients: Yup.array()
            .of(
              Yup.object().shape({
                name: Yup.string()
                  .trim()
                  .required(t("meals.ingredientNameRequired")),
                quantity: Yup.number()
                  .required(t("meals.quantityRequired"))
                  .positive(t("meals.quantityPositive")),
                unit: Yup.string().trim().required(t("meals.unitRequired")),
                costPerUnit: Yup.number()
                  .required(t("meals.costPerUnitRequired"))
                  .min(0, t("meals.costPerUnitMin")),
              })
            )
            .min(0), // Allow empty groups
        })
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
    recipes?: Recipe[]
  ): MealFormValuesWithGroups => {
    if (editMeal?.id) {
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
          sequenceNumber: (ingredient as any).sequenceNumber ?? 1,
          localId:
            ingredient.localId ||
            (typeof crypto !== "undefined"
              ? String(uuidv4())
              : `${Math.random()}`),
        }));
        if (editMeal.ingredientGroups && editMeal.ingredientGroups.length > 0) {
          // Preserve existing menu ingredient groups
          ingredientGroups = organizeIngredientsIntoGroups(
            ingredients,
            editMeal.ingredientGroups
          );
        } else {
          // Create default "Ungrouped" group
          ingredientGroups = [
            {
              name: "Ungrouped",
              sortOrder: 999,
              ingredients: ingredients.map((ing) => ({
                ...ing,
                localId:
                  ing.localId ||
                  (typeof crypto !== "undefined"
                    ? String(uuidv4())
                    : `${Math.random()}`),
              })),
            },
          ];
        }
      } else {
        // Fall back to recipe ingredients if menu doesn't have ingredients saved
        const selectedRecipe = recipes?.find((r) => r.id === editMeal.recipeId);
        const recipeIngredients = selectedRecipe?.ingredients || [];
        const recipeGroups = selectedRecipe?.ingredientGroups || [];

        if (recipeGroups.length > 0) {
          // Use recipe ingredient groups
          ingredientGroups = organizeIngredientsIntoGroups(
            recipeIngredients,
            recipeGroups
          );
        } else {
          // Create default "Ungrouped" group
          ingredients =
            recipeIngredients.length > 0
              ? recipeIngredients.map((ingredient) => ({
                  id: ingredient.id,
                  name: ingredient.name,
                  quantity: ingredient.quantity,
                  unit: ingredient.unit,
                  costPerUnit: ingredient.costPerUnit || 0,
                  localId:
                    ingredient.localId ||
                    (typeof crypto !== "undefined"
                      ? String(uuidv4())
                      : `${Math.random()}`),
                }))
              : [
                  {
                    id: undefined,
                    name: "",
                    quantity: 0,
                    unit: DEFAULT_UNIT,
                    costPerUnit: 0,
                    localId:
                      typeof crypto !== "undefined"
                        ? String(uuidv4())
                        : `${Math.random()}`,
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
        followRecipe:
          typeof editMeal.followRecipe === "boolean"
            ? editMeal.followRecipe
            : false,
        ghanFactor: editMeal.ghanFactor || 1.0,
        preparedQuantity: editMeal.preparedQuantity,
        preparedQuantityUnit: editMeal.preparedQuantityUnit,
        servingQuantity: editMeal.servingQuantity,
        servingQuantityUnit: editMeal.servingQuantityUnit,
        quantityPerPiece: editMeal.quantityPerPiece,
        menuComponentId: editMeal.menuComponentId,
        ingredientGroups,
      };
    }

    return {
      recipeId: "",
      followRecipe: false,
      ghanFactor: 1.0,
      servingQuantity: 0,
      servingQuantityUnit: DEFAULT_UNIT,
      preparedQuantity: 0,
      preparedQuantityUnit: DEFAULT_UNIT,
      menuComponentId: editMeal?.menuComponentId,
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
              localId:
                typeof crypto !== "undefined"
                  ? String(uuidv4())
                  : `${Math.random()}`,
            },
          ],
        },
      ],
    };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const recipesData = await fetchAllRecipesForDropdown();
        setRecipes(recipesData);
      } catch (error: any) {
        // Don't show error for aborted requests
        if (error.name === "AbortError" || error.name === "CanceledError") {
          console.log("Add meal dialog recipes fetch was cancelled");
          return;
        }
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
    values: MealFormValuesWithGroups
  ) => {
    const selectedRecipe = recipes.find((r) => r.id === recipeId);
    if (selectedRecipe) {
      const recipeIngredients = selectedRecipe.ingredients || [];
      const recipeGroups = selectedRecipe.ingredientGroups || [];

      if (selectedRecipe.preparedQuantity) {
        setFieldValue("preparedQuantity", selectedRecipe.preparedQuantity);
      } else {
        if (selectedRecipe.preparedQuantity) {
          setFieldValue("preparedQuantity", selectedRecipe.preparedQuantity);
        }
      }

      if (selectedRecipe.preparedQuantityUnit) {
        setFieldValue(
          "preparedQuantityUnit",
          selectedRecipe.preparedQuantityUnit
        );
      }
      if (selectedRecipe.servingQuantity) {
        setFieldValue("servingQuantity", selectedRecipe.servingQuantity);
      }
      if (selectedRecipe.servingQuantityUnit) {
        setFieldValue(
          "servingQuantityUnit",
          selectedRecipe.servingQuantityUnit
        );
      }
      if (selectedRecipe.quantityPerPiece) {
        setFieldValue("quantityPerPiece", selectedRecipe.quantityPerPiece);
      }

      if (recipeGroups.length > 0) {
        // Use recipe ingredient groups
        const ingredientGroups = organizeIngredientsIntoGroups(
          recipeIngredients,
          recipeGroups
        );
        setFieldValue("ingredientGroups", ingredientGroups);
      } else {
        // Create default "Ungrouped" group
        const ingredients = recipeIngredients.map((ingredient) => ({
          id: ingredient.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          costPerUnit: ingredient.costPerUnit || 0,
          sequenceNumber: (ingredient as any).sequenceNumber ?? 1,
          localId:
            ingredient.localId ||
            (typeof crypto !== "undefined"
              ? String(uuidv4())
              : `${Math.random()}`),
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

  const handleFollowRecipeChange = (
    followRecipe: boolean,
    setFieldValue: (field: string, value: any) => void,
    values: MealFormValuesWithGroups
  ) => {
    setFieldValue("followRecipe", followRecipe);
    if (followRecipe && values.recipeId) {
      handleRecipeSelect(values.recipeId, setFieldValue, values);
    } else {
      setFieldValue("ghanFactor", 1.0);
    }
  };

  const handleSubmit = async (
    values: MealFormValuesWithGroups,
    { resetForm }: { resetForm: () => void }
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
      if (values.servingQuantity <= 0) {
        throw new Error("Serving quantity must be greater than zero.");
      }

      if (values.ghanFactor <= 0) {
        throw new Error("Ghan factor must be greater than zero.");
      }

      // Prepare ingredient group definitions to send to API
      const processedGroups = values.ingredientGroups
        .map((group: any, index: number) => ({
          id: group.id || `temp_${index}`,
          name: group.name,
          sortOrder: Number(group.sortOrder) || 0,
        }))
        .filter((g: any) => g.name !== "Ungrouped");

      // Compute deleted group IDs if editing an existing menu (groups that were present before and now removed)
      const originalGroups: Array<{ id: string; name: string }> =
        editMeal?.ingredientGroups?.map((g: any) => ({
          id: g.id,
          name: g.name,
        })) || [];
      const originalGroupIds = new Set(
        originalGroups.filter((g) => g.name !== "Ungrouped").map((g) => g.id)
      );
      const currentGroupIds = new Set(processedGroups.map((g) => g.id!));
      const deletedGroupIds = Array.from(originalGroupIds).filter(
        (id) => !currentGroupIds.has(id)
      );

      if (editMeal?.id) {
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
                sequenceNumber:
                  ingredient.sequenceNumber != null
                    ? Number(ingredient.sequenceNumber)
                    : undefined,
                groupId: group.name === "Ungrouped" ? null : groupId,
              });
            }
          });
        });

        const updateData = {
          recipeId: values.recipeId,
          preparedQuantity: values.preparedQuantity,
          preparedQuantityUnit: values.preparedQuantityUnit,
          servingQuantity: values.servingQuantity,
          servingQuantityUnit: values.servingQuantityUnit,
          quantityPerPiece: values.quantityPerPiece,
          ghanFactor: values.ghanFactor,
          notes: `Meal updated for ${mealType.toLowerCase()} with ${values.servingQuantity} ${values.servingQuantityUnit} servings and ${values.ghanFactor} ghan factor.`,
          ingredients: trimIngredients(allIngredients),
          ingredientGroups: processedGroups,
          deletedIngredientGroupIds: deletedGroupIds,
          menuComponentId: values.menuComponentId,
        };

        const result = await updateMenu(editMeal.id, updateData);
        toast.success(
          t("meals.mealUpdatedSuccessfully", {
            mealType: mealType.toLowerCase(),
          })
        );
      } else {
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
                sequenceNumber:
                  ingredient.sequenceNumber != null
                    ? Number(ingredient.sequenceNumber)
                    : undefined,
                groupId: group.name === "Ungrouped" ? null : groupId,
              });
            }
          });
        });

        const menuData = {
          epochMs: selectedDate.getTime(),
          mealType: mealType,
          recipeId: values.recipeId,
          kitchenId: targetKitchenId,
          userId: session.user.id,
          preparedQuantity: values.preparedQuantity,
          preparedQuantityUnit: values.preparedQuantityUnit,
          servingQuantity: values.servingQuantity,
          servingQuantityUnit: values.servingQuantityUnit,
          quantityPerPiece: values.quantityPerPiece,
          ghanFactor: values.ghanFactor,
          notes: t("meals.mealPlannedNotes", {
            mealType: mealType.toLowerCase(),
            servings: values.servingQuantity,
            unit: values.servingQuantityUnit,
            ghanFactor: values.ghanFactor,
          }),
          ingredients: trimIngredients(allIngredients),
          ingredientGroups: processedGroups,
          deletedIngredientGroupIds: [],
          menuComponentId: values.menuComponentId,
        };

        const result = await createMenu(menuData);
        toast.success(
          t("meals.mealAddedSuccessfully", {
            mealType: mealType.toLowerCase(),
          })
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

  const filteredRecipes = useMemo(() => {
    return recipes.filter(
      (recipe) =>
        (selectedRecipeCategory === "all" ||
          selectedRecipeCategory === recipe.category) &&
        (selectedRecipeSubcategory === "all" ||
          selectedRecipeSubcategory === recipe.subcategory)
    );
  }, [recipes, selectedRecipeCategory, selectedRecipeSubcategory]);

  const recipeCategories = useMemo(() => {
    const categories = [
      "all",
      ...Array.from(
        new Set(recipes.map((recipe) => recipe.category).filter(Boolean))
      ),
    ];
    return categories;
  }, [recipes]);

  const recipeSubcategories = useMemo(() => {
    const subcategories = [
      "all",
      ...(Array.from(
        new Set(
          recipes
            .filter((recipe) =>
              selectedRecipeCategory
                ? selectedRecipeCategory === "all" ||
                  recipe.category === selectedRecipeCategory
                : true
            )
            .map((recipe) => recipe.subcategory)
            .filter(Boolean)
        )
      ) ?? []),
    ];
    return subcategories;
  }, [recipes, selectedRecipeCategory]);

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        editMeal?.id
          ? t("meals.editMeal", { mealType: mealType.toLowerCase() })
          : t("meals.addMeal", { mealType: mealType.toLowerCase() })
      }
      description={t("meals.configureMealDetails", {
        mealType: mealType.toLowerCase(),
      })}
      icon={<Utensils className="w-5 h-5 text-primary-foreground" />}
      size="6xl"
    >
      {/* Show loading state while fetching menu details */}
      {isLoadingMenu ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("meals.loadingMenu")}</p>
          </div>
        </div>
      ) : (
        <Formik
          initialValues={getInitialValues(fetchedMenu || editMeal, recipes)}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={false}
          key={editMeal?.id || "new"} // Force re-initialization when switching between add/edit
        >
          {({ values, setFieldValue, handleSubmit: formikHandleSubmit }) => {
            // Generate stable ID function for the component
            const generateStableId = () => {
              return typeof crypto !== "undefined"
                ? String(uuidv4())
                : `id_${Date.now()}_${Math.random()}`;
            };

            // Removing helpers that referenced non-existent fields in this form
            return (
              <div className="overflow-y-auto">
                <form onSubmit={formikHandleSubmit}>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 sm:col-span-3 md:col-span-3">
                      <Label
                        htmlFor="recipeCategory"
                        className="text-base font-medium text-foreground mb-2"
                      >
                        {t("recipes.category")}
                      </Label>
                      <Field name={`recipeCategory`}>
                        {({ field }: { field: any }) => (
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange({
                                target: { name: field.name, value },
                              });
                              setSelectedRecipeCategory(value);
                            }}
                          >
                            <SelectTrigger className="w-full border-border focus:border-primary focus:ring-primary/20">
                              <SelectValue
                                placeholder={t("recipes.allCategories")}
                              />
                            </SelectTrigger>
                            <SelectContent searchable>
                              {recipeCategories.map((recipeCategory) => (
                                <SelectItem
                                  key={recipeCategory}
                                  value={recipeCategory}
                                >
                                  {recipeCategory === "all"
                                    ? t("recipes.allCategories")
                                    : recipeCategory}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </Field>
                      <ErrorMessage
                        name={`recipeCategory`}
                        component="p"
                        className="text-destructive text-xs mt-1 flex items-center gap-1"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-3 md:col-span-3">
                      <Label
                        htmlFor="recipeSubcategory"
                        className="text-base font-medium text-foreground mb-2"
                      >
                        {t("recipes.subcategory")}
                      </Label>
                      <Field name={`recipeSubcategory`}>
                        {({ field }: { field: any }) => (
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange({
                                target: { name: field.name, value },
                              });
                              setSelectedRecipeSubcategory(value);
                            }}
                          >
                            <SelectTrigger className="w-full border-border focus:border-primary focus:ring-primary/20">
                              <SelectValue
                                placeholder={t("recipes.allSubcategories")}
                              />
                            </SelectTrigger>
                            <SelectContent searchable>
                              {recipeSubcategories.map((subcategory) => (
                                <SelectItem
                                  key={subcategory}
                                  value={subcategory}
                                  className="break-all"
                                >
                                  {subcategory === "all"
                                    ? t("recipes.allSubcategories")
                                    : subcategory}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </Field>
                      <ErrorMessage
                        name={`recipeSubcategory`}
                        component="p"
                        className="text-destructive text-xs mt-1 flex items-center gap-1"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-3 md:col-span-4">
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
                              handleRecipeSelect(value, setFieldValue, values);
                            }}
                          >
                            <SelectTrigger className="w-full border-border focus:border-primary focus:ring-primary/20">
                              <SelectValue
                                placeholder={t("meals.selectRecipe")}
                              />
                            </SelectTrigger>
                            <SelectContent searchable>
                              {filteredRecipes.map((recipe) => (
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
                    <div className="col-span-12 sm:col-span-3 md:col-span-2">
                      <Label className="text-base font-medium text-foreground">
                        {t("meals.followRecipe")}
                      </Label>
                      <Field name={`followRecipe`}>
                        {({ field }: { field: any }) => (
                          <div className="w-full h-10 flex items-center">
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                handleFollowRecipeChange(
                                  checked,
                                  setFieldValue,
                                  values
                                );
                                return field.onChange({
                                  target: { name: field.name, value: checked },
                                });
                              }}
                              className="data-[state=checked]:bg-primary"
                            />
                          </div>
                        )}
                      </Field>
                    </div>

                    <Card className="col-span-12">
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
                        <div className="@container grid grid-cols-12 gap-4">
                          {values.followRecipe && (
                            <div className="col-span-12 @sm:col-span-6 @xl:col-span-4 @5xl:col-span-2">
                              <Label className="text-sm font-medium text-foreground mb-2 block">
                                {t("meals.ghan")}
                              </Label>
                              <Field
                                as={Input}
                                name={`ghanFactor`}
                                type="number"
                                min={0}
                                step={0.0001}
                                className="border-border focus:border-primary focus:ring-primary/20"
                              />
                              <ErrorMessage
                                name={`ghanFactor`}
                                component="p"
                                className="text-destructive text-xs mt-1 flex items-center gap-1"
                              />
                            </div>
                          )}

                          {/* Prepared Quantity */}
                          <div className="col-span-12 @sm:col-span-6 @xl:col-span-4 @5xl:col-span-2">
                            <Label
                              htmlFor="preparedQuantity"
                              className="text-sm font-medium text-foreground mb-2 block"
                            >
                              {t("recipes.preparedQuantity")}{" "}
                              {values.followRecipe ? "(per ghan)" : ""}
                            </Label>
                            <Field
                              as={Input}
                              id="preparedQuantity"
                              name="preparedQuantity"
                              type="number"
                              min={0}
                              step={0.0001}
                              placeholder={t("recipes.preparedQuantity")}
                              className="border-border focus:border-primary focus:ring-primary/20"
                            />
                            <ErrorMessage
                              name="preparedQuantity"
                              component="p"
                              className="text-destructive text-xs mt-1 flex items-center gap-1"
                            />
                          </div>
                          <div className="col-span-12 @sm:col-span-6 @xl:col-span-4 @5xl:col-span-2">
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
                          <div className="col-span-12 @sm:col-span-6 @xl:col-span-4 @5xl:col-span-2">
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
                              min={0}
                              step={0.0001}
                              placeholder="Serving quantity"
                              className="border-border focus:border-primary focus:ring-primary/20"
                            />
                            <ErrorMessage
                              name="servingQuantity"
                              component="p"
                              className="text-destructive text-xs mt-1 flex items-center gap-1"
                            />
                          </div>
                          <div className="col-span-12 @sm:col-span-6 @xl:col-span-4 @5xl:col-span-2">
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
                          {(values.servingQuantityUnit === "pcs" ||
                            values.preparedQuantityUnit === "pcs") && (
                            <div className="col-span-12 @sm:col-span-6 @xl:col-span-4 @5xl:col-span-2">
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
                                min={0}
                                step={0.0001}
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
                                preparedQuantityUnit:
                                  values.preparedQuantityUnit,
                                servingQuantity: values.servingQuantity,
                                servingQuantityUnit: values.servingQuantityUnit,
                                quantityPerPiece:
                                  values.quantityPerPiece ?? null,
                                ghanFactor: values.followRecipe
                                  ? values.ghanFactor
                                  : 1,
                              })
                            ) => (
                              <div className="space-y-1">
                                <div>
                                  <span className="font-medium">
                                    Total {t("recipes.preparedQuantity")}:
                                  </span>{" "}
                                  {calculatedQuantities.preparedQuantity}{" "}
                                  {calculatedQuantities.preparedUnit}
                                </div>
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
                    <div
                      className={`col-span-12 ${values.followRecipe ? "pointer-events-none" : ""}`}
                    >
                      <IngredientsInput
                        name="ingredientGroups"
                        ingredientGroups={values.ingredientGroups}
                        onFieldChange={setFieldValue}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        generateStableId={generateStableId}
                        title={t("meals.ingredients")}
                        description="Organize ingredients into logical groups"
                        showCostSummary={false}
                        quantityType="number"
                      />
                    </div>

                    {/* Form Actions */}
                    <div className="col-span-12 flex justify-end space-x-3 pt-4 border-t border-border mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="border-border text-foreground hover:bg-muted bg-transparent"
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        type="submit"
                        disabled={isFormSubmitting}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isFormSubmitting
                          ? t("meals.saving")
                          : t("meals.saveMeal")}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            );
          }}
        </Formik>
      )}
    </BaseDialog>
  );
}
