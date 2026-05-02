"use client";

import { ErrorMessage, Field, Formik } from "formik";
import { useSession } from "next-auth/react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ClipboardEvent } from "react";
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
import { FormikValueUnitInput } from "@/components/ui/value-unit-input";
import { QuantityWithPieceInput } from "@/components/ui/quantity-with-piece-input";
import { useTranslations } from "@/hooks/use-translations";
import api from "@/lib/api/axios";
import { fetchMenuComponents } from "@/lib/api/menu-components";
import { createMenu, updateMenu } from "@/lib/api/menus";
import { fetchAllRecipesForDropdown } from "@/lib/api/recipes";
import { BookOpen, Utensils } from "lucide-react";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";

import {
  convertUnits,
  DEFAULT_UNIT,
  UNIT_OPTIONS,
  isValidUnit,
  normalizeUnit,
} from "@/lib/constants/units";
import { formatDecimal } from "@/lib/utils";
import { trimIngredients } from "@/lib/utils/form-utils";
import { getCalculatedQuantities } from "@/lib/utils/meal-calculations";
import { sumCompatibleQuantities } from "@/lib/utils/unit-conversions";
import type { IngredientFormValue, MealFormValues } from "@/types/forms";
import type { MenuComponentApiItem } from "@/types/menu-components";
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
  initialPersonCounts?: Record<string, number>;
  editMeal?: {
    id: string;
    recipeId?: string | null;
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
    } | null;
    ingredients?: IngredientFormValue[];
    ingredientGroups?: Array<{
      id: string;
      name: string;
      sortOrder: number;
    }>;
    followRecipe?: boolean;
  } | null;
}

interface ConsumptionSuggestion {
  totalPersons: number;
  totalPieces: number;
  preparedQuantity: number;
  preparedQuantityUnit: "g" | "kg";
  servingQuantity: number;
  servingQuantityUnit: "g" | "kg";
  quantityPerPiece: number | null;
}

// Update MealFormValues to include ingredient groups
interface MealFormValuesWithGroups extends Omit<MealFormValues, "ingredients"> {
  ingredientGroups: IngredientGroupFormValue[];
  menuComponentId?: string;
  recipeCategory: string;
  recipeSubcategory: string;
}

export function AddMealDialog({
  open,
  onOpenChange,
  mealType,
  selectedDate,
  kitchenId,
  initialPersonCounts = {},
  editMeal,
}: AddMealDialogProps) {
  const { t } = useTranslations();
  const { data: session } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeCategory, setSelectedRecipeCategory] =
    useState<string>("all");
  const [selectedRecipeSubcategory, setSelectedRecipeSubcategory] =
    useState<string>("all");
  const deferredRecipeCategory = useDeferredValue(selectedRecipeCategory);
  const deferredRecipeSubcategory = useDeferredValue(selectedRecipeSubcategory);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [menuComponents, setMenuComponents] = useState<MenuComponentApiItem[]>(
    [],
  );
  const [personCounts, setPersonCounts] = useState<Record<string, number>>({});
  const [hasAppliedConsumptionSuggestion, setHasAppliedConsumptionSuggestion] =
    useState(false);

  // Step 1: Add state for loading and fetched menu
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [fetchedMenu, setFetchedMenu] = useState<any>(null);

  // Stable ID generation to prevent unnecessary re-renders and ensure temp IDs
  // used for new groups are consistent across the submission process.
  const generateStableId = useCallback(() => {
    return typeof crypto !== "undefined"
      ? String(uuidv4())
      : `id_${Date.now()}_${Math.random()}`;
  }, []);

  // Reset fetched menu when dialog closes or menu ID changes
  useEffect(() => {
    if (!open) {
      setFetchedMenu(null);
      setIsLoadingMenu(false);
      setPersonCounts({});
      setHasAppliedConsumptionSuggestion(false);
    }
  }, [open]);

  useEffect(() => {
    setFetchedMenu(null);
    setIsLoadingMenu(false);
    setPersonCounts({});
    setHasAppliedConsumptionSuggestion(false);
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
  }, [open, editMeal?.id, fetchedMenu, t]);

  // Helper function to organize ingredients into groups
  const organizeIngredientsIntoGroups = useCallback(
    (
      ingredients: any[],
      ingredientGroups: any[] = [],
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
            localId: ing.localId || generateStableId(),
            selected: (ing as any).selected ?? false,
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
                    localId: generateStableId(),
                    selected: false,
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
          localId: ing.localId || generateStableId(),
          selected: (ing as any).selected ?? false,
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
            localId: ing.localId || generateStableId(),
            selected: (ing as any).selected ?? false,
          })),
        });
      }

      // Sort groups by sortOrder
      return groups.sort((a, b) => a.sortOrder - b.sortOrder);
    },
    [generateStableId],
  );

  const validationSchema = Yup.object().shape({
    recipeId: Yup.string().trim(),
    followRecipe: Yup.boolean().default(false),
    ghanFactor: Yup.number().when("followRecipe", {
      is: true,
      then: (schema) =>
        schema
          .required(t("meals.ghanRequired"))
          .positive(t("meals.ghanPositive"))
          .max(100, t("meals.ghanMax")),
      otherwise: (schema) => schema.notRequired(),
    }),
    preparedQuantity: Yup.number().when("followRecipe", {
      is: true,
      then: (schema) =>
        schema
          .required(t("meals.preparedQuantityRequired"))
          .positive(t("meals.preparedQuantityPositive")),
      otherwise: (schema) => schema.notRequired(),
    }),
    preparedQuantityUnit: Yup.string().when("followRecipe", {
      is: true,
      then: (schema) =>
        schema
          .trim()
          .required(t("meals.preparedQuantityUnitRequired"))
          .test(
            "valid-prepared-unit",
            t("meals.unitRequired"),
            (value) => !value || isValidUnit(value),
          ),
      otherwise: (schema) => schema.notRequired(),
    }),
    servingQuantity: Yup.number().when("followRecipe", {
      is: true,
      then: (schema) =>
        schema
          .required(t("meals.servingQuantityRequired"))
          .positive(t("meals.servingQuantityPositive")),
      otherwise: (schema) => schema.notRequired(),
    }),
    servingQuantityUnit: Yup.string().when("followRecipe", {
      is: true,
      then: (schema) =>
        schema
          .trim()
          .required(t("meals.servingQuantityUnitRequired"))
          .test(
            "valid-serving-unit",
            t("meals.unitRequired"),
            (value) => !value || isValidUnit(value),
          ),
      otherwise: (schema) => schema.notRequired(),
    }),
    quantityPerPiece: Yup.number()
      .nullable()
      .positive(t("meals.quantityPerPiecePositive")),
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
                unit: Yup.string()
                  .trim()
                  .required(t("meals.unitRequired"))
                  .test(
                    "valid-unit",
                    t("meals.unitRequired"),
                    (value) => !value || isValidUnit(value),
                  ),
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
          (group) => group.ingredients && group.ingredients.length > 0,
        );
      }),
  });

  // This will be computed dynamically based on editMeal prop
  const getInitialValues = useCallback(
    (
      editMeal?: AddMealDialogProps["editMeal"],
      recipes?: Recipe[],
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
            groupId: (ingredient as any).groupId ?? null,
            sequenceNumber: (ingredient as any).sequenceNumber ?? 1,
            localId: ingredient.localId || generateStableId(),
            selected:
              (ingredient as any).selected ?? Boolean(editMeal.followRecipe),
          }));
          if (
            editMeal.ingredientGroups &&
            editMeal.ingredientGroups.length > 0
          ) {
            // Preserve existing menu ingredient groups
            ingredientGroups = organizeIngredientsIntoGroups(
              ingredients,
              editMeal.ingredientGroups,
            );
          } else {
            // Create default "Ungrouped" group
            ingredientGroups = [
              {
                name: "Ungrouped",
                sortOrder: 999,
                ingredients: ingredients.map((ing) => ({
                  ...ing,
                  localId: ing.localId || generateStableId(),
                })),
              },
            ];
          }
        } else {
          // Fall back to recipe ingredients if menu doesn't have ingredients saved
          const selectedRecipe = editMeal.recipeId
            ? recipes?.find((r) => r.id === editMeal.recipeId)
            : null;
          const recipeIngredients = selectedRecipe?.ingredients || [];
          const recipeGroups = selectedRecipe?.ingredientGroups || [];

          if (recipeGroups.length > 0) {
            // Use recipe ingredient groups
            ingredientGroups = organizeIngredientsIntoGroups(
              recipeIngredients.map((ingredient) => ({
                ...ingredient,
                selected: Boolean(editMeal.followRecipe),
              })),
              recipeGroups,
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
                    groupId: (ingredient as any).groupId ?? null,
                    localId: ingredient.localId || generateStableId(),
                    selected: Boolean(editMeal.followRecipe),
                  }))
                : [
                    {
                      id: undefined,
                      name: "",
                      quantity: 0,
                      unit: DEFAULT_UNIT,
                      costPerUnit: 0,
                      localId: generateStableId(),
                      selected: false,
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
          recipeCategory: "all",
          recipeSubcategory: "all",
          recipeId: editMeal.recipeId || "",
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
        recipeCategory: "all",
        recipeSubcategory: "all",
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
                localId: generateStableId(),
                selected: false,
              },
            ],
          },
        ],
      };
    },
    [generateStableId, organizeIngredientsIntoGroups],
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [recipesData, menuComponentData] = await Promise.all([
          fetchAllRecipesForDropdown(),
          kitchenId
            ? fetchMenuComponents(kitchenId, { mealType })
            : Promise.resolve([] as MenuComponentApiItem[]),
        ]);
        setRecipes(recipesData);
        setMenuComponents(menuComponentData);
      } catch (error: any) {
        // Don't show error for aborted requests
        if (error.name === "AbortError" || error.name === "CanceledError") {
          console.log("Add meal dialog recipes fetch was cancelled");
          return;
        }
        console.error("Error loading data:", error);
        toast.error("Failed to load recipes and meal configuration");
      }
    };

    if (open) {
      loadData();
    }
  }, [open, kitchenId, mealType]);

  const selectedMenuComponent = useMemo(() => {
    const selectedMenuComponentId =
      fetchedMenu?.menuComponentId ?? editMeal?.menuComponentId;

    if (!selectedMenuComponentId) {
      return null;
    }

    return (
      menuComponents.find(
        (component) => component.id === selectedMenuComponentId,
      ) || null
    );
  }, [menuComponents, editMeal?.menuComponentId, fetchedMenu?.menuComponentId]);

  const consumptionSuggestion = useMemo<ConsumptionSuggestion | null>(() => {
    if (!selectedMenuComponent || selectedMenuComponent.averages.length === 0) {
      return null;
    }

    let totalPersons = 0;
    let totalPieces = 0;
    let totalGrams = 0;
    const pieceWeightsInGrams: number[] = [];

    selectedMenuComponent.averages.forEach((average) => {
      const personCount = Number(personCounts[average.personTypeId] || 0);
      if (personCount <= 0) {
        return;
      }

      totalPersons += personCount;

      if (average.unit === "pcs") {
        const pieces = average.quantity * personCount;
        totalPieces += pieces;

        if (average.weightPerPiece != null && average.weightPerPieceUnit) {
          const weightPerPieceGrams = convertUnits(
            average.weightPerPiece,
            average.weightPerPieceUnit,
            "g",
          );
          pieceWeightsInGrams.push(weightPerPieceGrams);
          totalGrams += pieces * weightPerPieceGrams;
        }

        return;
      }

      totalGrams += convertUnits(
        average.quantity * personCount,
        average.unit,
        "g",
      );
    });

    if (totalPersons === 0 || totalGrams <= 0) {
      return null;
    }

    const preparedQuantityUnit = totalGrams >= 1000 ? "kg" : "g";
    const preparedQuantity = convertUnits(
      totalGrams,
      "g",
      preparedQuantityUnit,
    );
    const servingQuantity = convertUnits(
      totalGrams / totalPersons,
      "g",
      preparedQuantityUnit,
    );

    const normalizedPieceWeight =
      pieceWeightsInGrams.length > 0 &&
      pieceWeightsInGrams.every(
        (weight) => Math.abs(weight - pieceWeightsInGrams[0]) < 0.0001,
      )
        ? convertUnits(pieceWeightsInGrams[0], "g", preparedQuantityUnit)
        : null;

    return {
      totalPersons,
      totalPieces,
      preparedQuantity,
      preparedQuantityUnit,
      servingQuantity,
      servingQuantityUnit: preparedQuantityUnit,
      quantityPerPiece: normalizedPieceWeight,
    };
  }, [personCounts, selectedMenuComponent]);

  const handleRecipeSelect = (
    recipeId: string,
    setFieldValue: (field: string, value: any) => void,
    values: MealFormValuesWithGroups,
  ) => {
    const selectedRecipe = recipes.find((r) => r.id === recipeId);
    if (selectedRecipe) {
      const recipeIngredients = selectedRecipe.ingredients || [];
      const recipeGroups = selectedRecipe.ingredientGroups || [];

      if (selectedRecipe.preparedQuantity) {
        setFieldValue("preparedQuantity", selectedRecipe.preparedQuantity);
      }

      if (selectedRecipe.preparedQuantityUnit) {
        setFieldValue(
          "preparedQuantityUnit",
          selectedRecipe.preparedQuantityUnit,
        );
      }
      if (selectedRecipe.servingQuantity) {
        setFieldValue("servingQuantity", selectedRecipe.servingQuantity);
      }
      if (selectedRecipe.servingQuantityUnit) {
        setFieldValue(
          "servingQuantityUnit",
          selectedRecipe.servingQuantityUnit,
        );
      }
      if (selectedRecipe.quantityPerPiece) {
        setFieldValue("quantityPerPiece", selectedRecipe.quantityPerPiece);
      }

      if (recipeGroups.length > 0) {
        // Use recipe ingredient groups
        const ingredientGroupsWithSelection = organizeIngredientsIntoGroups(
          recipeIngredients,
          recipeGroups,
        ).map((group) => ({
          ...group,
          ingredients: group.ingredients.map((ing: any) => ({
            ...ing,
            selected: true, // Select all when following recipe
          })),
        }));
        setFieldValue("ingredientGroups", ingredientGroupsWithSelection);
      } else {
        // Create default "Ungrouped" group
        const ingredients = recipeIngredients.map((ingredient) => ({
          id: ingredient.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          costPerUnit: ingredient.costPerUnit || 0,
          sequenceNumber: (ingredient as any).sequenceNumber ?? 1,
          groupId: (ingredient as any).groupId ?? null,
          localId: ingredient.localId || generateStableId(),
          selected: true, // Select all when following recipe
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
    values: MealFormValuesWithGroups,
  ) => {
    setFieldValue("followRecipe", followRecipe);
    if (followRecipe && values.recipeId) {
      handleRecipeSelect(values.recipeId, setFieldValue, values);
    } else {
      setFieldValue("ghanFactor", 1.0);
      // Deselect all ingredients when follow recipe is turned OFF
      const updatedGroups = values.ingredientGroups.map((group) => ({
        ...group,
        ingredients: group.ingredients.map((ing: any) => ({
          ...ing,
          selected: false,
        })),
      }));
      setFieldValue("ingredientGroups", updatedGroups);
    }
  };

  useEffect(() => {
    if (!selectedMenuComponent) {
      setPersonCounts(initialPersonCounts);
      return;
    }

    setPersonCounts((currentCounts) => {
      const nextCounts: Record<string, number> = {};

      selectedMenuComponent.averages.forEach((average) => {
        nextCounts[average.personTypeId] =
          currentCounts[average.personTypeId] ||
          initialPersonCounts[average.personTypeId] ||
          0;
      });

      return nextCounts;
    });
  }, [selectedMenuComponent, initialPersonCounts]);

  const applyConsumptionSuggestion = (
    setFieldValue: (field: string, value: any) => void,
  ) => {
    if (!consumptionSuggestion) {
      return;
    }

    setFieldValue("preparedQuantity", consumptionSuggestion.preparedQuantity);
    setFieldValue(
      "preparedQuantityUnit",
      consumptionSuggestion.preparedQuantityUnit,
    );
    setFieldValue("servingQuantity", consumptionSuggestion.servingQuantity);
    setFieldValue(
      "servingQuantityUnit",
      consumptionSuggestion.servingQuantityUnit,
    );
    setFieldValue("quantityPerPiece", consumptionSuggestion.quantityPerPiece);
    setHasAppliedConsumptionSuggestion(true);
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

      // Additional validation for positive values when following recipe
      if (values.followRecipe) {
        if (values.servingQuantity <= 0) {
          throw new Error("Serving quantity must be greater than zero.");
        }

        if (values.ghanFactor <= 0) {
          throw new Error("Ghan factor must be greater than zero.");
        }
      }

      // Prepare ingredient group definitions to send to API (exclude Ungrouped)
      // Use recipe dialog's temp id format so server-side mapping can detect
      // frontend temporary group IDs.
      const processedGroups = values.ingredientGroups
        .map((group: any, index: number) => ({
          id: group.id || `temp_${index}`,
          name: String(group.name || "").trim(),
          // keep sortOrder stable with current UI order if not explicitly set
          sortOrder:
            typeof group.sortOrder === "number"
              ? Number(group.sortOrder)
              : index,
        }))
        .filter((g: any) => g.name !== "Ungrouped");

      // Compute deleted group IDs if editing an existing menu (groups that were present before and now removed)
      const originalGroupsSource =
        (fetchedMenu as any)?.ingredientGroups ||
        editMeal?.ingredientGroups ||
        [];
      const originalGroups: Array<{ id: string; name: string }> = (
        originalGroupsSource as any[]
      ).map((g: any) => ({ id: g.id, name: g.name }));
      const originalGroupIds = new Set(
        originalGroups.filter((g) => g.name !== "Ungrouped").map((g) => g.id),
      );
      const currentGroupIds = new Set(processedGroups.map((g) => g.id!));
      const deletedGroupIds = Array.from(originalGroupIds).filter(
        (id) => !currentGroupIds.has(id),
      );

      const allIngredients: any[] = [];
      values.ingredientGroups.forEach((group: any, groupIndex: number) => {
        const groupId = group.id || `temp_${groupIndex}`;
        group.ingredients.forEach(
          (ingredient: any, ingredientIndex: number) => {
            if (
              ingredient.name.trim() &&
              (ingredient.selected || !values.followRecipe)
            ) {
              allIngredients.push({
                id: ingredient.id ?? undefined,
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: normalizeUnit(ingredient.unit),
                costPerUnit: ingredient.costPerUnit,
                sequenceNumber:
                  ingredient.sequenceNumber != null
                    ? Number(ingredient.sequenceNumber)
                    : ingredientIndex + 1,
                groupId:
                  String(group.name || "").trim() === "Ungrouped"
                    ? null
                    : groupId,
              });
            }
          },
        );
      });

      if (allIngredients.length === 0) {
        throw new Error(t("meals.ingredientsRequired"));
      }

      const derivePreparedQuantityFromIngredients = () => {
        const aggregatedQuantity = sumCompatibleQuantities(allIngredients, {
          preferUnit: values.preparedQuantityUnit,
        });

        if (!aggregatedQuantity) {
          return null;
        }

        return {
          preparedQuantity: aggregatedQuantity.quantity,
          preparedQuantityUnit: aggregatedQuantity.unit,
          servingQuantity: 1,
          servingQuantityUnit: aggregatedQuantity.unit,
          ghanFactor: 1.0,
        };
      };

      let calculatedPreparedQuantity = values.preparedQuantity;
      let calculatedPreparedQuantityUnit = values.preparedQuantityUnit;
      let calculatedServingQuantity = values.servingQuantity;
      let calculatedServingQuantityUnit = values.servingQuantityUnit;
      let calculatedGhanFactor = values.ghanFactor;

      if (!values.followRecipe) {
        const derivedQuantity = derivePreparedQuantityFromIngredients();

        if (derivedQuantity) {
          calculatedPreparedQuantity = derivedQuantity.preparedQuantity;
          calculatedPreparedQuantityUnit = derivedQuantity.preparedQuantityUnit;
          calculatedServingQuantity = derivedQuantity.servingQuantity;
          calculatedServingQuantityUnit = derivedQuantity.servingQuantityUnit;
          calculatedGhanFactor = derivedQuantity.ghanFactor;
        }
      }

      if (editMeal?.id) {
        const updateData = {
          recipeId: values.recipeId || null,
          preparedQuantity: calculatedPreparedQuantity,
          preparedQuantityUnit: calculatedPreparedQuantityUnit,
          servingQuantity: calculatedServingQuantity,
          servingQuantityUnit: calculatedServingQuantityUnit,
          quantityPerPiece: values.quantityPerPiece,
          ghanFactor: calculatedGhanFactor,
          notes: `Meal updated for ${mealType.toLowerCase()}.`,
          ingredients: trimIngredients(allIngredients),
          ingredientGroups: processedGroups,
          deletedIngredientGroupIds: deletedGroupIds,
          menuComponentId: values.menuComponentId,
          followRecipe: values.followRecipe,
        };

        await updateMenu(editMeal.id, updateData);
        toast.success(
          t("meals.mealUpdatedSuccessfully", {
            mealType: mealType.toLowerCase(),
          }),
        );
      } else {
        const menuData = {
          epochMs: selectedDate.getTime(),
          mealType: mealType,
          recipeId: values.recipeId || null,
          kitchenId: targetKitchenId,
          userId: session.user.id,
          preparedQuantity: calculatedPreparedQuantity,
          preparedQuantityUnit: calculatedPreparedQuantityUnit,
          servingQuantity: calculatedServingQuantity,
          servingQuantityUnit: calculatedServingQuantityUnit,
          quantityPerPiece: values.quantityPerPiece,
          ghanFactor: calculatedGhanFactor,
          followRecipe: values.followRecipe,
          notes: t("meals.mealPlannedNotes", {
            mealType: mealType.toLowerCase(),
            servings: calculatedServingQuantity,
            unit: calculatedServingQuantityUnit,
            ghanFactor: calculatedGhanFactor,
          }),
          ingredients: trimIngredients(allIngredients),
          ingredientGroups: processedGroups,
          deletedIngredientGroupIds: [],
          menuComponentId: values.menuComponentId,
        };

        await createMenu(menuData);
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

  const initialFormValues = useMemo(
    () => getInitialValues(fetchedMenu || editMeal, recipes),
    [fetchedMenu, editMeal, recipes, getInitialValues],
  );

  const filteredRecipes = useMemo(() => {
    return recipes.filter(
      (recipe) =>
        (deferredRecipeCategory === "all" ||
          deferredRecipeCategory === recipe.category) &&
        (deferredRecipeSubcategory === "all" ||
          deferredRecipeSubcategory === recipe.subcategory),
    );
  }, [recipes, deferredRecipeCategory, deferredRecipeSubcategory]);

  const recipeCategories = useMemo(() => {
    const categories = [
      "all",
      ...Array.from(
        new Set(recipes.map((recipe) => recipe.category).filter(Boolean)),
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
              deferredRecipeCategory
                ? deferredRecipeCategory === "all" ||
                  recipe.category === deferredRecipeCategory
                : true,
            )
            .map((recipe) => recipe.subcategory)
            .filter(Boolean),
        ),
      ) ?? []),
    ];
    return subcategories;
  }, [recipes, deferredRecipeCategory]);

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
          initialValues={initialFormValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
          key={editMeal?.id || editMeal?.menuComponentId || "new"}
        >
          {({ values, setFieldValue, handleSubmit: formikHandleSubmit }) => {
            // Removing helpers that referenced non-existent fields in this form
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
                    id: undefined,
                    name: "",
                    quantity: 0,
                    unit: DEFAULT_UNIT,
                    costPerUnit: 0,
                    sequenceNumber: rowIndex + 1,
                    localId: generateStableId(),
                    selected: false,
                  });
                }
                if (!nextIngredients[rowIndex]) {
                  nextIngredients[rowIndex] = {
                    id: undefined,
                    name: "",
                    quantity: 0,
                    unit: DEFAULT_UNIT,
                    costPerUnit: 0,
                    sequenceNumber: rowIndex + 1,
                    localId: generateStableId(),
                    selected: false,
                  } as any;
                }
              };

              const normalizePastedUnit = (raw: string) => {
                const trimmed = raw.trim();
                if (!trimmed) return DEFAULT_UNIT;
                const normalizedValue = normalizeUnit(trimmed);
                return isValidUnit(normalizedValue) ? normalizedValue : trimmed;
              };

              grid.forEach((cells, r) => {
                const rowIndex = ingredientIndex + r;
                ensureRow(rowIndex);
                const updatedRow = { ...nextIngredients[rowIndex] } as any;
                cells.forEach((cell, c) => {
                  const colIndex = startCol + c;
                  if (colIndex > columnOrder.length - 1) return;
                  const key = columnOrder[colIndex];
                  const rawValue = (cell ?? "").trim();
                  if (key === "unit") {
                    updatedRow.unit = normalizePastedUnit(rawValue);
                  } else if (key === "quantity" || key === "costPerUnit") {
                    const parsed = parseFloat(rawValue);
                    updatedRow[key] = isNaN(parsed) ? 0 : parsed;
                  } else {
                    updatedRow[key] = rawValue;
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
                              const nextRecipeId =
                                value === "__no_recipe__" ? "" : value;
                              field.onChange({
                                target: {
                                  name: field.name,
                                  value: nextRecipeId,
                                },
                              });
                              if (nextRecipeId) {
                                handleRecipeSelect(
                                  nextRecipeId,
                                  setFieldValue,
                                  values,
                                );
                              } else {
                                setFieldValue("followRecipe", false);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full border-border focus:border-primary focus:ring-primary/20">
                              <SelectValue
                                placeholder={t("meals.selectRecipe")}
                              />
                            </SelectTrigger>
                            <SelectContent searchable>
                              <SelectItem value="__no_recipe__">
                                No stored recipe
                              </SelectItem>
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
                                  values,
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

                    {values.followRecipe && (
                      <Card className="col-span-12">
                        <CardHeader className="px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <BookOpen className="h-4 w-4 text-primary" />
                              {t("recipes.quantityInformation")}
                            </CardTitle>
                            <CardDescription className="hidden max-w-xl text-xs md:block">
                              {t("recipes.quantityInformationDescription")}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 px-4 pb-4">
                          {selectedMenuComponent &&
                          selectedMenuComponent.averages.length > 0 ? (
                            <div className="rounded-md border border-border bg-muted/30 p-3">
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                  <h3 className="text-sm font-semibold leading-none text-foreground">
                                    Consumption planner
                                  </h3>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Counts generate the suggested quantity.
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 shrink-0 px-3"
                                  onClick={() =>
                                    applyConsumptionSuggestion(setFieldValue)
                                  }
                                  disabled={!consumptionSuggestion}
                                >
                                  {hasAppliedConsumptionSuggestion
                                    ? "Refresh suggestion"
                                    : "Apply suggestion"}
                                </Button>
                              </div>

                              <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_14rem]">
                                <div className="grid gap-2 xl:grid-cols-2">
                                  {selectedMenuComponent.averages.map(
                                    (average) => (
                                      <div
                                        key={average.id}
                                        className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
                                      >
                                        <div className="min-w-0">
                                          <Label
                                            htmlFor={`person-count-${average.personTypeId}`}
                                            className="block truncate text-sm font-medium leading-tight text-foreground"
                                          >
                                            {average.personType.name}
                                          </Label>
                                          <p className="truncate text-xs text-muted-foreground">
                                            {average.personType.description
                                              ? `${average.personType.description} · `
                                              : ""}
                                            Avg{" "}
                                            {formatDecimal(average.quantity)}{" "}
                                            {average.unit}
                                            {average.unit === "pcs" &&
                                            average.weightPerPiece != null
                                              ? ` @ ${formatDecimal(average.weightPerPiece)} ${average.weightPerPieceUnit}`
                                              : ""}
                                          </p>
                                        </div>
                                        <Input
                                          id={`person-count-${average.personTypeId}`}
                                          type="number"
                                          min={0}
                                          step={1}
                                          value={
                                            personCounts[
                                              average.personTypeId
                                            ] || 0
                                          }
                                          onChange={(event) => {
                                            const nextValue = Number(
                                              event.target.value || 0,
                                            );
                                            setPersonCounts(
                                              (currentCounts) => ({
                                                ...currentCounts,
                                                [average.personTypeId]:
                                                  Number.isFinite(nextValue) &&
                                                  nextValue > 0
                                                    ? nextValue
                                                    : 0,
                                              }),
                                            );
                                          }}
                                          className="h-8 text-right"
                                        />
                                      </div>
                                    ),
                                  )}
                                </div>

                                <div className="rounded-md bg-background px-3 py-2 text-sm text-foreground">
                                  {consumptionSuggestion ? (
                                    <div className="grid gap-y-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          Suggested
                                        </span>
                                        <span className="font-medium">
                                          {formatDecimal(
                                            consumptionSuggestion.preparedQuantity,
                                          )}{" "}
                                          {
                                            consumptionSuggestion.preparedQuantityUnit
                                          }
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          Per person
                                        </span>
                                        <span className="font-medium">
                                          {formatDecimal(
                                            consumptionSuggestion.servingQuantity,
                                          )}{" "}
                                          {
                                            consumptionSuggestion.servingQuantityUnit
                                          }
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          People
                                        </span>
                                        <span className="font-medium">
                                          {consumptionSuggestion.totalPersons}
                                        </span>
                                      </div>
                                      {consumptionSuggestion.totalPieces > 0 ? (
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs text-muted-foreground">
                                            Pieces
                                          </span>
                                          <span className="font-medium">
                                            {formatDecimal(
                                              consumptionSuggestion.totalPieces,
                                            )}{" "}
                                            pcs
                                          </span>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">
                                      Enter a person count to calculate a
                                      suggestion.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <div className="@container grid grid-cols-12 gap-3">
                            {values.followRecipe && (
                              <div className="col-span-12 @sm:col-span-6 @xl:col-span-4 @5xl:col-span-2">
                                <Label className="mb-1 block text-xs font-medium text-foreground">
                                  {t("meals.ghan")}
                                </Label>
                                <Field
                                  as={Input}
                                  name={`ghanFactor`}
                                  type="number"
                                  min={0}
                                  step={0.0001}
                                  className="h-9 border-border focus:border-primary focus:ring-primary/20"
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
                              <QuantityWithPieceInput
                                id="preparedQuantity"
                                label={`${t("recipes.preparedQuantity")}${values.followRecipe ? " (per ghan)" : ""}`}
                                quantityName="preparedQuantity"
                                unitName="preparedQuantityUnit"
                                pieceQuantityName="quantityPerPiece"
                                pieceUnit={values.servingQuantityUnit}
                                min={0}
                                step={0.0001}
                                placeholder={t("recipes.preparedQuantity")}
                                inputClassName="h-9"
                                labelClassName="text-xs"
                              />
                            </div>
                            <div className="col-span-12 @sm:col-span-6 @xl:col-span-4 @5xl:col-span-2">
                              <QuantityWithPieceInput
                                id="servingQuantity"
                                label={t("recipes.servingQuantity")}
                                quantityName="servingQuantity"
                                unitName="servingQuantityUnit"
                                pieceQuantityName="quantityPerPiece"
                                pieceUnit={values.preparedQuantityUnit}
                                min={0}
                                step={0.0001}
                                placeholder={t("recipes.servingQuantity")}
                                inputClassName="h-9"
                                labelClassName="text-xs"
                              />
                            </div>
                          </div>

                          {/* Quantity calculations */}
                          <div className="rounded-md border border-border bg-accent px-3 py-2">
                            <div className="text-sm text-foreground/70">
                              {((
                                calculatedQuantities = getCalculatedQuantities({
                                  preparedQuantity: values.preparedQuantity,
                                  preparedQuantityUnit:
                                    values.preparedQuantityUnit,
                                  servingQuantity: values.servingQuantity,
                                  servingQuantityUnit:
                                    values.servingQuantityUnit,
                                  quantityPerPiece:
                                    values.quantityPerPiece ?? null,
                                  ghanFactor: values.followRecipe
                                    ? values.ghanFactor
                                    : 1,
                                }),
                              ) => (
                                <div className="grid gap-x-4 gap-y-1 sm:grid-cols-3">
                                  <div className="flex items-center justify-between gap-2 sm:block">
                                    <span className="text-xs text-muted-foreground">
                                      Total prepared
                                    </span>{" "}
                                    <span className="font-medium text-foreground sm:block">
                                      {formatDecimal(
                                        calculatedQuantities.preparedQuantity,
                                      )}{" "}
                                      {calculatedQuantities.preparedUnit}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 sm:block">
                                    <span className="text-xs text-muted-foreground">
                                      {t("recipes.numberOfServings")}
                                    </span>{" "}
                                    <span className="font-medium text-foreground sm:block">
                                      {calculatedQuantities.numberOfServings}{" "}
                                      {calculatedQuantities.numberOfServings ===
                                      1
                                        ? "person"
                                        : "people"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 sm:block">
                                    <span className="text-xs text-muted-foreground">
                                      {t("recipes.extraQuantity")}
                                    </span>{" "}
                                    <span className="font-medium text-foreground sm:block">
                                      {calculatedQuantities.extraQuantity}{" "}
                                      {calculatedQuantities.preparedUnit}
                                    </span>
                                  </div>
                                </div>
                              ))()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Ingredient Groups Section */}
                    <div
                      className={`col-span-12 ${values.followRecipe ? "pointer-events-none" : ""}`}
                    >
                      <IngredientsInput
                        name="ingredientGroups"
                        ingredientGroups={values.ingredientGroups}
                        onFieldChange={setFieldValue}
                        generateStableId={generateStableId}
                        title={t("meals.ingredients")}
                        description="Organize ingredients into logical groups"
                        showCostSummary={false}
                        quantityType="number"
                        onPasteIngredients={handlePasteIngredients}
                        hideGroupManagement={true}
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
