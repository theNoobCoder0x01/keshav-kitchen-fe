"use client";

import { ErrorMessage, Field, FieldArray, Formik } from "formik";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { ClipboardEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import {
  FormikAutosave,
  type AutosaveStatus,
} from "@/components/menu/formik-autosave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuantityWithPieceInput } from "@/components/ui/quantity-with-piece-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormikValueUnitInput } from "@/components/ui/value-unit-input";
import { useTranslations } from "@/hooks/use-translations";
import { createMenu, deleteMenu, updateMenu } from "@/lib/api/menus";
import { convertUnits, DEFAULT_UNIT, normalizeUnit } from "@/lib/constants/units";
import { useDailyMenuContext } from "@/lib/contexts/daily-menu-context";
import { formatDecimal } from "@/lib/utils";
import { getCalculatedQuantities } from "@/lib/utils/meal-calculations";
import {
  applyRecipeToForm,
  buildCreateMenuPayload,
  buildUpdateMenuPayload,
  createEmptyIngredient,
  getRowInitialValues,
  type ExistingMenuLike,
} from "@/lib/utils/menu-payload";
import { buildMenuRowSchema } from "@/lib/validations/menu-row";
import type { DailyMenuRowFormValues } from "@/types/forms";
import type { MenuComponentApiItem } from "@/types/menu-components";
import type { MealType } from "@/types/menus";

const CUSTOM = "__custom__";

export interface DailyMenuRowProps {
  rowKey: string;
  mealType: MealType;
  /** Display label for the row (the MenuComponent label, or empty for ad-hoc). */
  categoryLabel: string;
  /** Slot this row fills, if any. */
  menuComponentId?: string;
  /** Full component (with averages) used by the consumption planner. */
  menuComponent?: MenuComponentApiItem;
  /** Existing menu record for this slot/row, if one is already saved. */
  initialMenu?: ExistingMenuLike | null;
  /** Called after this row's menu is first created, so the page can reconcile. */
  onCreated?: (rowKey: string, menuId: string) => void;
  /** Called after the row is deleted/removed (menuId is null if never saved). */
  onDeleted: (rowKey: string, menuId: string | null) => void;
}

function SaveStatusBadge({
  status,
  t,
}: {
  status: AutosaveStatus;
  t: (key: string) => string;
}) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("dailyMenu.saving")}
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <Check className="h-3 w-3" />
        {t("dailyMenu.saved")}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="h-3 w-3" />
        {t("dailyMenu.saveError")}
      </span>
    );
  }
  return null;
}

export function DailyMenuRow({
  rowKey,
  mealType,
  categoryLabel,
  menuComponentId,
  menuComponent,
  initialMenu,
  onCreated,
  onDeleted,
}: DailyMenuRowProps) {
  const { t } = useTranslations();
  const {
    recipes,
    kitchens,
    premiseId,
    selectedDate,
    userId,
    defaultKitchenId,
    personCountsByMealType,
  } = useDailyMenuContext();

  const generateStableId = useCallback(() => uuidv4(), []);

  // menuId in a ref so a pending autosave retry sees it synchronously (prevents
  // a duplicate create before the first POST's id is captured).
  const menuIdRef = useRef<string | null>(initialMenu?.id ?? null);
  const [saveStatus, setSaveStatus] = useState<AutosaveStatus>("idle");
  const [isDeleting, setIsDeleting] = useState(false);
  // Empty / new rows open expanded so the ingredient inputs are visible.
  const [expanded, setExpanded] = useState<boolean>(!initialMenu);
  const originalGroupsRef = useRef<Array<{ id: string; name: string }>>(
    (initialMenu?.ingredientGroups ?? []) as Array<{
      id: string;
      name: string;
    }>,
  );

  const initialValues = useMemo(
    () =>
      getRowInitialValues({
        existingMenu: initialMenu,
        menuComponentId,
        defaultKitchenId,
        generateId: generateStableId,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const validationSchema = useMemo(() => buildMenuRowSchema(t), [t]);

  const [recipeCategory, setRecipeCategory] = useState("all");
  const [recipeSubcategory, setRecipeSubcategory] = useState("all");

  const recipeCategories = useMemo(
    () => [
      "all",
      ...Array.from(new Set(recipes.map((r) => r.category).filter(Boolean))),
    ],
    [recipes],
  );
  const recipeSubcategories = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(
          recipes
            .filter(
              (r) => recipeCategory === "all" || r.category === recipeCategory,
            )
            .map((r) => r.subcategory)
            .filter(Boolean),
        ),
      ),
    ],
    [recipes, recipeCategory],
  );
  const filteredRecipes = useMemo(
    () =>
      recipes.filter(
        (r) =>
          (recipeCategory === "all" || r.category === recipeCategory) &&
          (recipeSubcategory === "all" || r.subcategory === recipeSubcategory),
      ),
    [recipes, recipeCategory, recipeSubcategory],
  );

  const [personCounts, setPersonCounts] = useState<Record<string, number>>(
    () => {
      const seed = personCountsByMealType[mealType] || {};
      const out: Record<string, number> = {};
      (menuComponent?.averages ?? []).forEach((avg) => {
        out[avg.personTypeId] = seed[avg.personTypeId] || 0;
      });
      return out;
    },
  );

  const consumptionSuggestion = useMemo(() => {
    if (!menuComponent || menuComponent.averages.length === 0) return null;

    let totalPersons = 0;
    let totalGrams = 0;
    const pieceWeights: number[] = [];

    menuComponent.averages.forEach((avg) => {
      const count = Number(personCounts[avg.personTypeId] || 0);
      if (count <= 0) return;
      totalPersons += count;
      if (avg.unit === "pcs") {
        if (avg.weightPerPiece != null && avg.weightPerPieceUnit) {
          const grams = convertUnits(
            avg.weightPerPiece,
            avg.weightPerPieceUnit,
            "g",
          );
          pieceWeights.push(grams);
          totalGrams += avg.quantity * count * grams;
        }
        return;
      }
      totalGrams += convertUnits(avg.quantity * count, avg.unit, "g");
    });

    if (totalPersons === 0 || totalGrams <= 0) return null;
    const unit = totalGrams >= 1000 ? "kg" : "g";
    const quantityPerPiece =
      pieceWeights.length > 0 &&
      pieceWeights.every((w) => Math.abs(w - pieceWeights[0]) < 0.0001)
        ? convertUnits(pieceWeights[0], "g", unit)
        : null;

    return {
      totalPersons,
      preparedQuantity: convertUnits(totalGrams, "g", unit),
      preparedQuantityUnit: unit,
      servingQuantity: convertUnits(totalGrams / totalPersons, "g", unit),
      servingQuantityUnit: unit,
      quantityPerPiece,
    };
  }, [personCounts, menuComponent]);

  const handleSave = useCallback(
    async (values: DailyMenuRowFormValues) => {
      try {
        if (!menuIdRef.current) {
          const payload = buildCreateMenuPayload(values, {
            epochMs: selectedDate.getTime(),
            mealType,
            premiseId,
            userId,
          });
          const created = await createMenu(payload as any);
          menuIdRef.current = created.id;
          originalGroupsRef.current = created.ingredientGroups ?? [];
          onCreated?.(rowKey, created.id);
        } else {
          const payload = buildUpdateMenuPayload(
            values,
            originalGroupsRef.current,
          );
          const updated = await updateMenu(menuIdRef.current, payload as any);
          originalGroupsRef.current =
            updated?.ingredientGroups ?? originalGroupsRef.current;
        }
      } catch (error: any) {
        const detail =
          error?.response?.data?.detail ||
          error?.response?.data?.error ||
          error?.message;
        toast.error(detail || t("dailyMenu.saveFailed"));
        throw error;
      }
    },
    [selectedDate, mealType, premiseId, userId, rowKey, onCreated, t],
  );

  const handleDelete = useCallback(async () => {
    if (!window.confirm(t("dailyMenu.confirmDeleteRow"))) return;
    setIsDeleting(true);
    try {
      const currentMenuId = menuIdRef.current;
      if (currentMenuId) await deleteMenu(currentMenuId);
      onDeleted(rowKey, currentMenuId);
    } catch (error: any) {
      toast.error(error?.message || t("dailyMenu.deleteFailed"));
      setIsDeleting(false);
    }
  }, [onDeleted, rowKey, t]);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={() => {}}
    >
      {({ values, setFieldValue }) => {
        const dishSelectValue =
          values.followRecipe && values.recipeId ? values.recipeId : CUSTOM;
        const namedIngredients = values.ingredientGroups
          .flatMap((group) => group.ingredients)
          .filter((ing) => ing.name.trim());
        const hasNamedIngredient = namedIngredients.length > 0;
        const editableIngredients =
          values.ingredientGroups[0]?.ingredients ?? [];

        const applyRecipe = (recipeId: string) => {
          const recipe = recipes.find((r) => r.id === recipeId);
          if (!recipe) return;
          const updates = applyRecipeToForm(recipe, generateStableId);
          Object.entries(updates).forEach(([key, value]) =>
            setFieldValue(key, value as any),
          );
        };

        const onDishChange = (value: string) => {
          if (value === CUSTOM) {
            setFieldValue("followRecipe", false);
            setFieldValue("recipeId", "");
            setFieldValue("ghanFactor", 1.0);
            setFieldValue(
              "ingredientGroups",
              values.ingredientGroups.map((group) => ({
                ...group,
                ingredients: group.ingredients.map((ing) => ({
                  ...ing,
                  selected: false,
                })),
              })),
            );
          } else {
            applyRecipe(value);
          }
        };

        const applyConsumptionSuggestion = () => {
          if (!consumptionSuggestion) return;
          setFieldValue(
            "preparedQuantity",
            consumptionSuggestion.preparedQuantity,
          );
          setFieldValue(
            "preparedQuantityUnit",
            consumptionSuggestion.preparedQuantityUnit,
          );
          setFieldValue("servingQuantity", consumptionSuggestion.servingQuantity);
          setFieldValue(
            "servingQuantityUnit",
            consumptionSuggestion.servingQuantityUnit,
          );
          setFieldValue(
            "quantityPerPiece",
            consumptionSuggestion.quantityPerPiece ?? undefined,
          );
        };

        const handlePasteIngredients = (e: ClipboardEvent) => {
          const columnOrder = [
            "name",
            "quantity",
            "unit",
            "costPerUnit",
          ] as const;
          const target = e.target as HTMLElement | null;
          const inputEl = target?.closest(
            'input[name^="ingredientGroups["]',
          ) as HTMLInputElement | null;
          const fieldName = inputEl?.name;
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
          e.preventDefault();

          const rows = text.replace(/\r/g, "").split("\n");
          if (rows.length && rows[rows.length - 1] === "") rows.pop();
          const grid = rows.map((row) => row.split("\t"));
          const next = [...values.ingredientGroups[groupIndex].ingredients];

          const ensureRow = (index: number) => {
            while (next.length <= index) {
              next.push(createEmptyIngredient(generateStableId));
            }
          };

          grid.forEach((cells, r) => {
            const rowIndex = ingredientIndex + r;
            ensureRow(rowIndex);
            const updated: any = { ...next[rowIndex] };
            cells.forEach((cell, c) => {
              const colIndex = startCol + c;
              if (colIndex > columnOrder.length - 1) return;
              const key = columnOrder[colIndex];
              const raw = (cell ?? "").trim();
              if (key === "unit") {
                updated.unit = normalizeUnit(raw) || DEFAULT_UNIT;
              } else if (key === "quantity" || key === "costPerUnit") {
                const parsed = parseFloat(raw);
                updated[key] = isNaN(parsed) ? 0 : parsed;
              } else {
                updated[key] = raw;
              }
            });
            next[rowIndex] = updated;
          });

          setFieldValue(
            `ingredientGroups[${groupIndex}].ingredients`,
            next,
            true,
          );
        };

        return (
          <>
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[170px_1fr]">
              {/* Label cell */}
              <div className="flex items-start justify-end border-r border-border/60 bg-muted/40 px-2 py-3 text-right">
                <span className="text-sm font-semibold leading-tight text-primary">
                  {categoryLabel || t("dailyMenu.customItem")} :-
                </span>
              </div>

              {/* Value cell */}
              <div className="px-3 py-2.5">
                {/* Primary line */}
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={dishSelectValue} onValueChange={onDishChange}>
                    <SelectTrigger className="h-9 w-[150px] sm:w-[170px]">
                      <SelectValue placeholder={t("dailyMenu.pickRecipe")} />
                    </SelectTrigger>
                    <SelectContent searchable>
                      <SelectItem value={CUSTOM}>
                        {t("dailyMenu.customDish")}
                      </SelectItem>
                      {filteredRecipes.map((recipe) => (
                        <SelectItem key={recipe.id} value={recipe.id}>
                          {recipe.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!values.followRecipe && (
                    <Field
                      as={Input}
                      name="customName"
                      placeholder={t("dailyMenu.itemNamePlaceholder")}
                      className="h-9 min-w-[140px] flex-1"
                    />
                  )}

                  <div className="w-[150px]">
                    <FormikValueUnitInput
                      quantityName="preparedQuantity"
                      unitName="preparedQuantityUnit"
                      min={0}
                      step={0.0001}
                      placeholder={t("recipes.preparedQuantity")}
                      className="h-9"
                    />
                  </div>

                  <Field
                    as={Input}
                    name="cook"
                    placeholder={t("meals.cook")}
                    className="h-9 w-[110px]"
                  />

                  <SaveStatusBadge status={saveStatus} t={t} />

                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground"
                      onClick={() => setExpanded((prev) => !prev)}
                      aria-expanded={expanded}
                    >
                      <ChevronDown
                        className={`mr-1 h-4 w-4 transition-transform ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />
                      {t("dailyMenu.details")}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      title={t("dailyMenu.deleteRow")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Inline errors / hints */}
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                  <ErrorMessage
                    name="customName"
                    component="span"
                    className="text-xs text-destructive"
                  />
                  <ErrorMessage
                    name="preparedQuantity"
                    component="span"
                    className="text-xs text-destructive"
                  />
                  <ErrorMessage
                    name="kitchenId"
                    component="span"
                    className="text-xs text-destructive"
                  />
                  {!hasNamedIngredient && (
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      className="text-xs text-amber-600 hover:underline"
                    >
                      {t("dailyMenu.addIngredientsHint")}
                    </button>
                  )}
                </div>

                {/* Details disclosure */}
                {expanded && (
                  <div className="mt-3 space-y-3 rounded-md border border-dashed border-border bg-muted/20 p-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="w-[180px]">
                        <Label className="mb-1 block text-xs text-muted-foreground">
                          {t("meals.kitchen")} *
                        </Label>
                        <Field name="kitchenId">
                          {({ field }: { field: any }) => (
                            <Select
                              value={field.value}
                              onValueChange={(value) =>
                                field.onChange({
                                  target: { name: field.name, value },
                                })
                              }
                            >
                              <SelectTrigger className="h-9 w-full">
                                <SelectValue
                                  placeholder={t("meals.selectKitchen")}
                                />
                              </SelectTrigger>
                              <SelectContent searchable>
                                {kitchens.map((kitchen) => (
                                  <SelectItem key={kitchen.id} value={kitchen.id}>
                                    {kitchen.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </Field>
                      </div>

                      {values.followRecipe && (
                        <>
                          <div className="w-[150px]">
                            <Label className="mb-1 block text-xs text-muted-foreground">
                              {t("recipes.category")}
                            </Label>
                            <Select
                              value={recipeCategory}
                              onValueChange={setRecipeCategory}
                            >
                              <SelectTrigger className="h-9 w-full">
                                <SelectValue
                                  placeholder={t("recipes.allCategories")}
                                />
                              </SelectTrigger>
                              <SelectContent searchable>
                                {recipeCategories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category === "all"
                                      ? t("recipes.allCategories")
                                      : category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-[150px]">
                            <Label className="mb-1 block text-xs text-muted-foreground">
                              {t("recipes.subcategory")}
                            </Label>
                            <Select
                              value={recipeSubcategory}
                              onValueChange={setRecipeSubcategory}
                            >
                              <SelectTrigger className="h-9 w-full">
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
                          </div>
                        </>
                      )}
                    </div>

                    {/* Follow-recipe planning */}
                    {values.followRecipe && (
                      <div className="space-y-3">
                        {menuComponent && menuComponent.averages.length > 0 && (
                          <div className="rounded-md border border-border bg-background p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-foreground">
                                {t("dailyMenu.consumptionPlanner")}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={applyConsumptionSuggestion}
                                disabled={!consumptionSuggestion}
                              >
                                {t("dailyMenu.applySuggestion")}
                              </Button>
                            </div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              {menuComponent.averages.map((avg) => (
                                <div
                                  key={avg.id}
                                  className="flex items-center justify-between gap-2 rounded border border-border px-2 py-1"
                                >
                                  <span className="truncate text-xs">
                                    {avg.personType.name}
                                  </span>
                                  <Input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={personCounts[avg.personTypeId] || 0}
                                    onChange={(event) => {
                                      const next = Number(
                                        event.target.value || 0,
                                      );
                                      setPersonCounts((current) => ({
                                        ...current,
                                        [avg.personTypeId]:
                                          Number.isFinite(next) && next > 0
                                            ? next
                                            : 0,
                                      }));
                                    }}
                                    className="h-7 w-16 text-right"
                                  />
                                </div>
                              ))}
                            </div>
                            {consumptionSuggestion && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {t("dailyMenu.suggested")}:{" "}
                                {formatDecimal(
                                  consumptionSuggestion.preparedQuantity,
                                )}{" "}
                                {consumptionSuggestion.preparedQuantityUnit} ·{" "}
                                {consumptionSuggestion.totalPersons}{" "}
                                {t("dailyMenu.people")}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-end gap-3">
                          <div className="w-[90px]">
                            <Label className="mb-1 block text-xs text-muted-foreground">
                              {t("meals.ghan")}
                            </Label>
                            <Field
                              as={Input}
                              name="ghanFactor"
                              type="number"
                              min={0}
                              step={0.0001}
                              className="h-9"
                            />
                            <ErrorMessage
                              name="ghanFactor"
                              component="p"
                              className="mt-1 text-xs text-destructive"
                            />
                          </div>
                          <div className="w-[170px]">
                            <QuantityWithPieceInput
                              label={t("recipes.servingQuantity")}
                              quantityName="servingQuantity"
                              unitName="servingQuantityUnit"
                              pieceQuantityName="quantityPerPiece"
                              pieceUnit={values.preparedQuantityUnit}
                              min={0}
                              step={0.0001}
                              inputClassName="h-9"
                              labelClassName="text-xs"
                            />
                          </div>
                          {(() => {
                            const calc = getCalculatedQuantities({
                              preparedQuantity: values.preparedQuantity,
                              preparedQuantityUnit: values.preparedQuantityUnit,
                              servingQuantity: values.servingQuantity,
                              servingQuantityUnit: values.servingQuantityUnit,
                              quantityPerPiece: values.quantityPerPiece ?? null,
                              ghanFactor: values.ghanFactor,
                            });
                            return (
                              <p className="text-xs text-muted-foreground">
                                {t("dailyMenu.totalPrepared")}:{" "}
                                {formatDecimal(calc.preparedQuantity)}{" "}
                                {calc.preparedUnit} ·{" "}
                                {t("recipes.numberOfServings")}:{" "}
                                {calc.numberOfServings}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Ingredients */}
                    <div>
                      <Label className="mb-1.5 block text-xs font-medium text-foreground">
                        {t("meals.ingredients")} *
                      </Label>
                      {values.followRecipe ? (
                        namedIngredients.length > 0 ? (
                          <div className="space-y-1">
                            {namedIngredients.map((ing, idx) => (
                              <div
                                key={ing.localId || idx}
                                className="flex items-center justify-between rounded border border-border bg-background px-2 py-1 text-sm"
                              >
                                <span className="truncate">{ing.name}</span>
                                <span className="shrink-0 text-muted-foreground">
                                  {formatDecimal(Number(ing.quantity) || 0)}{" "}
                                  {ing.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {t("dailyMenu.recipeNoIngredients")}
                          </p>
                        )
                      ) : (
                        <FieldArray name="ingredientGroups[0].ingredients">
                          {({ push, remove }) => (
                            <div
                              className="space-y-1.5"
                              onPaste={handlePasteIngredients}
                            >
                              {editableIngredients.map((ing, i) => (
                                <div
                                  key={ing.localId || i}
                                  className="flex items-center gap-2"
                                >
                                  <Field
                                    as={Input}
                                    name={`ingredientGroups[0].ingredients[${i}].name`}
                                    placeholder={t("dailyMenu.ingredientName")}
                                    className="h-8 flex-1"
                                  />
                                  <div className="w-[140px]">
                                    <FormikValueUnitInput
                                      quantityName={`ingredientGroups[0].ingredients[${i}].quantity`}
                                      unitName={`ingredientGroups[0].ingredients[${i}].unit`}
                                      min={0}
                                      step={0.0001}
                                      className="h-8"
                                    />
                                  </div>
                                  <Field
                                    as={Input}
                                    name={`ingredientGroups[0].ingredients[${i}].costPerUnit`}
                                    type="number"
                                    min={0}
                                    step={0.0001}
                                    placeholder={t("dailyMenu.cost")}
                                    className="h-8 w-[70px]"
                                  />
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => remove(i)}
                                    disabled={editableIngredients.length <= 1}
                                    aria-label={t("dailyMenu.removeIngredient")}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() =>
                                  push(createEmptyIngredient(generateStableId))
                                }
                              >
                                <Plus className="mr-1 h-4 w-4" />
                                {t("dailyMenu.addIngredient")}
                              </Button>
                            </div>
                          )}
                        </FieldArray>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <Label className="mb-1 block text-xs text-muted-foreground">
                        {t("dailyMenu.notes")}
                      </Label>
                      <Field
                        as={Textarea}
                        name="notes"
                        rows={2}
                        placeholder={t("dailyMenu.notesPlaceholder")}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Outside any collapsible region so it never unmounts mid-edit. */}
            <FormikAutosave
              onSave={handleSave}
              onStatusChange={setSaveStatus}
              enabled={!isDeleting}
            />
          </>
        );
      }}
    </Formik>
  );
}
