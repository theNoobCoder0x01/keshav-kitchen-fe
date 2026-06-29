// Pure helpers for building Menu create/update payloads from form values.
//
// This logic is intentionally extracted from components/dialogs/add-meal-dialog.tsx
// so the Daily Menu Builder rows (components/menu/daily-menu-row.tsx) produce a
// byte-for-byte compatible payload without duplicating the mapping inline. The
// dialog still owns its own copy today; when its submit mapping changes, update
// the functions here too. These functions are framework-agnostic (no React).

import { DEFAULT_UNIT, normalizeUnit } from "@/lib/constants/units";
import { trimIngredients } from "@/lib/utils/form-utils";
import { sumCompatibleQuantities } from "@/lib/utils/unit-conversions";
import type {
  DailyMenuRowFormValues,
  IngredientFormValue,
  IngredientGroupFormValue,
} from "@/types/forms";
import type { MealType } from "@/types/menus";

const UNGROUPED = "Ungrouped";

/** Minimal shape of a recipe needed to hydrate a row from a stored recipe. */
export interface RecipeLike {
  id: string;
  name: string;
  category?: string;
  subcategory?: string;
  preparedQuantity?: number | null;
  preparedQuantityUnit?: string | null;
  servingQuantity?: number | null;
  servingQuantityUnit?: string | null;
  quantityPerPiece?: number | null;
  ingredients?: Array<Record<string, any>>;
  ingredientGroups?: Array<{ id: string; name: string; sortOrder: number }>;
}

/** Minimal shape of a Menu record as returned by GET /api/menus. */
export interface ExistingMenuLike {
  id: string;
  recipeId?: string | null;
  customName?: string | null;
  followRecipe?: boolean;
  ghanFactor?: number | null;
  preparedQuantity?: number | null;
  preparedQuantityUnit?: string | null;
  servingQuantity?: number | null;
  servingQuantityUnit?: string | null;
  quantityPerPiece?: number | null;
  kitchenId?: string | null;
  cook?: string | null;
  notes?: string | null;
  menuComponentId?: string | null;
  ingredients?: Array<Record<string, any>>;
  ingredientGroups?: Array<{ id: string; name: string; sortOrder: number }>;
}

export function createEmptyIngredient(
  generateId: () => string,
): IngredientFormValue {
  return {
    id: undefined,
    name: "",
    quantity: 0,
    unit: DEFAULT_UNIT,
    costPerUnit: 0,
    sequenceNumber: 1,
    localId: generateId(),
    selected: false,
  };
}

function emptyUngroupedGroups(
  generateId: () => string,
): IngredientGroupFormValue[] {
  return [
    {
      name: UNGROUPED,
      sortOrder: 999,
      ingredients: [createEmptyIngredient(generateId)],
    },
  ];
}

/**
 * Organize a flat ingredient list into groups, preserving every named group
 * (even when empty) and collecting groupless ingredients under "Ungrouped".
 * Mirrors organizeIngredientsIntoGroups in add-meal-dialog.tsx.
 */
export function organizeIngredientsIntoGroups(
  ingredients: Array<Record<string, any>>,
  ingredientGroups: Array<{ id: string; name: string; sortOrder: number }> = [],
  generateId: () => string,
  selectedDefault = false,
): IngredientGroupFormValue[] {
  const groups: IngredientGroupFormValue[] = [];

  const mapIngredient = (ing: Record<string, any>): IngredientFormValue => ({
    id: ing.id,
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    costPerUnit: ing.costPerUnit ?? 0,
    sequenceNumber: ing.sequenceNumber ?? 1,
    groupId: ing.groupId ?? null,
    localId: ing.localId || generateId(),
    selected: ing.selected ?? selectedDefault,
  });

  ingredientGroups.forEach((group) => {
    const groupIngredients = ingredients
      .filter((ing) => ing.groupId === group.id)
      .map(mapIngredient);

    groups.push({
      id: group.id,
      name: group.name,
      sortOrder: group.sortOrder,
      ingredients:
        groupIngredients.length > 0
          ? groupIngredients
          : [createEmptyIngredient(generateId)],
    });
  });

  const ungrouped = ingredients.filter((ing) => !ing.groupId).map(mapIngredient);

  if (ungrouped.length > 0) {
    groups.push({ name: UNGROUPED, sortOrder: 999, ingredients: ungrouped });
  }

  if (groups.length === 0 && ingredients.length > 0) {
    groups.push({
      name: UNGROUPED,
      sortOrder: 999,
      ingredients: ingredients.map(mapIngredient),
    });
  }

  if (groups.length === 0) {
    return emptyUngroupedGroups(generateId);
  }

  return groups.sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Build initial Formik values for a row, from an existing menu or blank defaults. */
export function getRowInitialValues(params: {
  existingMenu?: ExistingMenuLike | null;
  menuComponentId?: string;
  defaultKitchenId?: string;
  /** Default cook for the default kitchen, pre-filled on new rows. */
  defaultCook?: string;
  generateId: () => string;
}): DailyMenuRowFormValues {
  const {
    existingMenu,
    menuComponentId,
    defaultKitchenId,
    defaultCook,
    generateId,
  } = params;

  if (existingMenu?.id) {
    const followRecipe = Boolean(existingMenu.followRecipe);
    const ingredientGroups =
      existingMenu.ingredients && existingMenu.ingredients.length > 0
        ? organizeIngredientsIntoGroups(
            existingMenu.ingredients,
            existingMenu.ingredientGroups ?? [],
            generateId,
            followRecipe,
          )
        : emptyUngroupedGroups(generateId);

    return {
      recipeCategory: "all",
      recipeSubcategory: "all",
      recipeId: existingMenu.recipeId || "",
      customName: existingMenu.customName || "",
      followRecipe,
      ghanFactor: existingMenu.ghanFactor || 1.0,
      preparedQuantity: existingMenu.preparedQuantity ?? 0,
      preparedQuantityUnit:
        (existingMenu.preparedQuantityUnit as any) ?? DEFAULT_UNIT,
      servingQuantity: existingMenu.servingQuantity ?? 0,
      servingQuantityUnit:
        (existingMenu.servingQuantityUnit as any) ?? DEFAULT_UNIT,
      quantityPerPiece: existingMenu.quantityPerPiece ?? undefined,
      kitchenId: existingMenu.kitchenId || defaultKitchenId || "",
      cook: existingMenu.cook || "",
      notes: existingMenu.notes || "",
      menuComponentId: existingMenu.menuComponentId || menuComponentId,
      ingredientGroups,
    };
  }

  return {
    recipeCategory: "all",
    recipeSubcategory: "all",
    recipeId: "",
    customName: "",
    followRecipe: false,
    ghanFactor: 1.0,
    preparedQuantity: 0,
    preparedQuantityUnit: DEFAULT_UNIT,
    servingQuantity: 0,
    servingQuantityUnit: DEFAULT_UNIT,
    quantityPerPiece: undefined,
    kitchenId: defaultKitchenId || "",
    cook: defaultCook || "",
    notes: "",
    menuComponentId,
    ingredientGroups: emptyUngroupedGroups(generateId),
  };
}

/**
 * Field updates to apply (via setFieldValue) when a stored recipe is selected.
 * Mirrors handleRecipeSelect in add-meal-dialog.tsx.
 */
export function applyRecipeToForm(
  recipe: RecipeLike,
  generateId: () => string,
): Partial<DailyMenuRowFormValues> {
  const ingredientGroups = organizeIngredientsIntoGroups(
    recipe.ingredients ?? [],
    recipe.ingredientGroups ?? [],
    generateId,
    true,
  ).map((group) => ({
    ...group,
    ingredients: group.ingredients.map((ing) => ({ ...ing, selected: true })),
  }));

  return {
    followRecipe: true,
    recipeId: recipe.id,
    preparedQuantity: recipe.preparedQuantity ?? 0,
    preparedQuantityUnit: (recipe.preparedQuantityUnit as any) ?? DEFAULT_UNIT,
    servingQuantity: recipe.servingQuantity ?? 0,
    servingQuantityUnit: (recipe.servingQuantityUnit as any) ?? DEFAULT_UNIT,
    quantityPerPiece: recipe.quantityPerPiece ?? undefined,
    ingredientGroups,
  };
}

interface ProcessedGroup {
  id: string;
  name: string;
  sortOrder: number;
}

/** Flatten the form's grouped ingredients into the API ingredient + group arrays. */
export function buildIngredientsPayload(values: DailyMenuRowFormValues): {
  processedGroups: ProcessedGroup[];
  allIngredients: Array<Record<string, any>>;
} {
  const processedGroups: ProcessedGroup[] = values.ingredientGroups
    .map((group, index) => ({
      id: group.id || `temp_${index}`,
      name: String(group.name || "").trim(),
      sortOrder:
        typeof group.sortOrder === "number" ? Number(group.sortOrder) : index,
    }))
    .filter((group) => group.name !== UNGROUPED);

  const allIngredients: Array<Record<string, any>> = [];
  values.ingredientGroups.forEach((group, groupIndex) => {
    const groupId = group.id || `temp_${groupIndex}`;
    group.ingredients.forEach((ingredient, ingredientIndex) => {
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
            String(group.name || "").trim() === UNGROUPED ? null : groupId,
        });
      }
    });
  });

  return { processedGroups, allIngredients };
}

export function computeDeletedGroupIds(
  originalGroups: Array<{ id: string; name: string }>,
  processedGroups: ProcessedGroup[],
): string[] {
  const originalIds = new Set(
    originalGroups.filter((g) => g.name !== UNGROUPED).map((g) => g.id),
  );
  const currentIds = new Set(processedGroups.map((g) => g.id));
  return Array.from(originalIds).filter((id) => !currentIds.has(id));
}

/**
 * Resolve the prepared/serving/ghan quantities to persist.
 * - Follow-recipe rows use the entered values directly (prepared is per-ghan).
 * - Manual rows use the entered prepared quantity (the dish's main quantity,
 *   shown on the row's primary line); only when it is blank do we fall back to
 *   summing the ingredient quantities.
 */
function resolveQuantities(
  values: DailyMenuRowFormValues,
  allIngredients: Array<Record<string, any>>,
) {
  if (values.followRecipe) {
    return {
      preparedQuantity: values.preparedQuantity,
      preparedQuantityUnit: values.preparedQuantityUnit as string,
      servingQuantity: values.servingQuantity,
      servingQuantityUnit: values.servingQuantityUnit as string,
      ghanFactor: values.ghanFactor,
    };
  }

  let preparedQuantity = values.preparedQuantity;
  let preparedQuantityUnit: string = values.preparedQuantityUnit;
  if (!preparedQuantity) {
    const aggregated = sumCompatibleQuantities(allIngredients as any, {
      preferUnit: values.preparedQuantityUnit,
    });
    if (aggregated) {
      preparedQuantity = aggregated.quantity;
      preparedQuantityUnit = aggregated.unit;
    }
  }

  // No separate per-person serving on manual rows: treat the whole dish as one
  // serving so downstream serving math stays well-defined.
  const servingQuantity = values.servingQuantity || preparedQuantity || 1;
  const servingQuantityUnit = values.servingQuantity
    ? values.servingQuantityUnit
    : preparedQuantityUnit;

  return {
    preparedQuantity,
    preparedQuantityUnit,
    servingQuantity,
    servingQuantityUnit,
    ghanFactor: 1,
  };
}

/** Common scalar + ingredient fields shared by create and update payloads. */
function buildMutationFields(values: DailyMenuRowFormValues) {
  const { processedGroups, allIngredients } = buildIngredientsPayload(values);
  const quantities = resolveQuantities(values, allIngredients);

  return {
    fields: {
      recipeId: values.recipeId || null,
      customName: values.followRecipe ? null : values.customName || null,
      preparedQuantity: quantities.preparedQuantity,
      preparedQuantityUnit: quantities.preparedQuantityUnit,
      servingQuantity: quantities.servingQuantity,
      servingQuantityUnit: quantities.servingQuantityUnit,
      quantityPerPiece: values.quantityPerPiece ?? null,
      ghanFactor: quantities.ghanFactor,
      followRecipe: values.followRecipe,
      cook: values.cook?.trim() || null,
      notes: values.notes?.trim() || null,
      kitchenId: values.kitchenId,
      menuComponentId: values.menuComponentId || undefined,
      ingredients: trimIngredients(allIngredients),
      ingredientGroups: processedGroups,
    },
    processedGroups,
  };
}

export interface CreateMenuContext {
  epochMs: number;
  mealType: MealType;
  premiseId: string;
  userId: string;
}

export function buildCreateMenuPayload(
  values: DailyMenuRowFormValues,
  ctx: CreateMenuContext,
) {
  const { fields } = buildMutationFields(values);
  return {
    ...fields,
    epochMs: ctx.epochMs,
    mealType: ctx.mealType,
    premiseId: ctx.premiseId,
    userId: ctx.userId,
    deletedIngredientGroupIds: [] as string[],
  };
}

export function buildUpdateMenuPayload(
  values: DailyMenuRowFormValues,
  originalGroups: Array<{ id: string; name: string }> = [],
) {
  const { fields, processedGroups } = buildMutationFields(values);
  return {
    ...fields,
    deletedIngredientGroupIds: computeDeletedGroupIds(
      originalGroups,
      processedGroups,
    ),
  };
}

/** Short summary (dish name + total quantity) for a collapsed row header. */
export function getRowSummary(
  values: DailyMenuRowFormValues,
  recipes: RecipeLike[],
): { title: string; hasContent: boolean } {
  const title = values.followRecipe
    ? recipes.find((r) => r.id === values.recipeId)?.name || ""
    : values.customName || "";

  const hasIngredients = values.ingredientGroups.some((group) =>
    group.ingredients.some((ing) => ing.name.trim()),
  );

  return { title: title.trim(), hasContent: Boolean(title.trim()) || hasIngredients };
}
