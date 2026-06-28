"use client";

import { ErrorMessage, Field, Formik } from "formik";
import {
  AlertCircle,
  BookOpen,
  Check,
  Loader2,
  Trash2,
} from "lucide-react";
import type { ClipboardEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IngredientsInput } from "@/components/ui/ingredients-input";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  FormikAutosave,
  type AutosaveStatus,
} from "@/components/menu/formik-autosave";
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
  getRowInitialValues,
  getRowSummary,
  type ExistingMenuLike,
} from "@/lib/utils/menu-payload";
import { buildMenuRowSchema } from "@/lib/validations/menu-row";
import type { DailyMenuRowFormValues } from "@/types/forms";
import type { MenuComponentApiItem } from "@/types/menu-components";
import type { MealType } from "@/types/menus";

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

  // menuId lives in a ref (not state) so it is visible synchronously to any
  // pending autosave retry — this prevents a second create firing before the
  // first POST's id is captured. The UI does not depend on it for rendering.
  const menuIdRef = useRef<string | null>(initialMenu?.id ?? null);
  const [saveStatus, setSaveStatus] = useState<AutosaveStatus>("idle");
  const [isDeleting, setIsDeleting] = useState(false);
  const originalGroupsRef = useRef<Array<{ id: string; name: string }>>(
    (initialMenu?.ingredientGroups ?? []) as Array<{
      id: string;
      name: string;
    }>,
  );

  // Computed once on mount. The row remounts (via its key) when the underlying
  // record changes from a page-level reload, so this never needs to reinit.
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

  // Recipe picker filters (local to this row).
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

  // Consumption planner state (seeded from the day's saved person counts).
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
    const pieceWeightsInGrams: number[] = [];
    let totalPieces = 0;

    menuComponent.averages.forEach((avg) => {
      const count = Number(personCounts[avg.personTypeId] || 0);
      if (count <= 0) return;
      totalPersons += count;

      if (avg.unit === "pcs") {
        const pieces = avg.quantity * count;
        totalPieces += pieces;
        if (avg.weightPerPiece != null && avg.weightPerPieceUnit) {
          const grams = convertUnits(
            avg.weightPerPiece,
            avg.weightPerPieceUnit,
            "g",
          );
          pieceWeightsInGrams.push(grams);
          totalGrams += pieces * grams;
        }
        return;
      }
      totalGrams += convertUnits(avg.quantity * count, avg.unit, "g");
    });

    if (totalPersons === 0 || totalGrams <= 0) return null;

    const unit = totalGrams >= 1000 ? "kg" : "g";
    const normalizedPieceWeight =
      pieceWeightsInGrams.length > 0 &&
      pieceWeightsInGrams.every(
        (w) => Math.abs(w - pieceWeightsInGrams[0]) < 0.0001,
      )
        ? convertUnits(pieceWeightsInGrams[0], "g", unit)
        : null;

    return {
      totalPersons,
      totalPieces,
      preparedQuantity: convertUnits(totalGrams, "g", unit),
      preparedQuantityUnit: unit,
      servingQuantity: convertUnits(totalGrams / totalPersons, "g", unit),
      servingQuantityUnit: unit,
      quantityPerPiece: normalizedPieceWeight,
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
        toast.error(error?.message || t("dailyMenu.saveFailed"));
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
      if (currentMenuId) {
        await deleteMenu(currentMenuId);
      }
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
        const summary = getRowSummary(values, recipes);
        const totalPrepared =
          (values.preparedQuantity || 0) *
          (values.followRecipe ? values.ghanFactor || 1 : 1);

        const applyRecipe = (recipeId: string) => {
          const recipe = recipes.find((r) => r.id === recipeId);
          if (!recipe) return;
          const updates = applyRecipeToForm(recipe, generateStableId);
          Object.entries(updates).forEach(([key, value]) =>
            setFieldValue(key, value as any),
          );
        };

        const handleFollowRecipeChange = (checked: boolean) => {
          setFieldValue("followRecipe", checked);
          if (checked && values.recipeId) {
            applyRecipe(values.recipeId);
          } else if (!checked) {
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
              next.push({
                id: undefined,
                name: "",
                quantity: 0,
                unit: DEFAULT_UNIT,
                costPerUnit: 0,
                sequenceNumber: index + 1,
                localId: generateStableId(),
                selected: false,
              });
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
          <AccordionItem
            value={rowKey}
            className="rounded-lg border border-border/60 bg-card/40 px-0"
          >
            <div className="flex items-center gap-1 pr-2">
              <AccordionTrigger className="flex-1 px-3 py-3 hover:no-underline">
                <div className="flex flex-1 items-center justify-between gap-3 pr-2 text-left">
                  <div className="min-w-0">
                    {categoryLabel ? (
                      <p className="text-xs font-medium text-muted-foreground">
                        {categoryLabel}
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-muted-foreground">
                        {t("dailyMenu.customItem")}
                      </p>
                    )}
                    <p className="truncate font-medium text-foreground">
                      {summary.title || (
                        <span className="text-muted-foreground">
                          {t("dailyMenu.emptyRow")}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {totalPrepared > 0 && values.followRecipe ? (
                      <span className="text-sm text-muted-foreground">
                        {formatDecimal(totalPrepared)}{" "}
                        {values.preparedQuantityUnit}
                      </span>
                    ) : null}
                    <SaveStatusBadge status={saveStatus} t={t} />
                  </div>
                </div>
              </AccordionTrigger>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting}
                title={t("dailyMenu.deleteRow")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <AccordionContent className="px-3">
              <div className="grid grid-cols-12 gap-4 pt-1">
                {/* Kitchen */}
                <div className="col-span-12 sm:col-span-6 md:col-span-4">
                  <Label className="mb-2 block text-sm font-medium text-foreground">
                    {t("meals.kitchen")} *
                  </Label>
                  <Field name="kitchenId">
                    {({ field }: { field: any }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange({
                            target: { name: field.name, value },
                          });
                          if (!values.cook) {
                            const selected = kitchens.find(
                              (k) => k.id === value,
                            );
                            setFieldValue("cook", selected?.defaultCook || "");
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
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
                  <ErrorMessage
                    name="kitchenId"
                    component="p"
                    className="mt-1 text-xs text-destructive"
                  />
                </div>

                {/* Cook */}
                <div className="col-span-12 sm:col-span-6 md:col-span-5">
                  <Label className="mb-2 block text-sm font-medium text-foreground">
                    {t("meals.cook")}
                  </Label>
                  <Field
                    as={Input}
                    name="cook"
                    placeholder={t("meals.cookPlaceholder")}
                  />
                </div>

                {/* Follow recipe */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label className="mb-2 block text-sm font-medium text-foreground">
                    {t("meals.followRecipe")}
                  </Label>
                  <div className="flex h-10 items-center">
                    <Field name="followRecipe">
                      {({ field }: { field: any }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            handleFollowRecipeChange(checked);
                            field.onChange({
                              target: { name: field.name, value: checked },
                            });
                          }}
                          className="data-[state=checked]:bg-primary"
                        />
                      )}
                    </Field>
                  </div>
                </div>

                {/* Recipe pickers OR custom name */}
                {values.followRecipe ? (
                  <>
                    <div className="col-span-12 sm:col-span-4">
                      <Label className="mb-2 block text-sm font-medium text-foreground">
                        {t("recipes.category")}
                      </Label>
                      <Select
                        value={recipeCategory}
                        onValueChange={setRecipeCategory}
                      >
                        <SelectTrigger className="w-full">
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
                    <div className="col-span-12 sm:col-span-4">
                      <Label className="mb-2 block text-sm font-medium text-foreground">
                        {t("recipes.subcategory")}
                      </Label>
                      <Select
                        value={recipeSubcategory}
                        onValueChange={setRecipeSubcategory}
                      >
                        <SelectTrigger className="w-full">
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
                    <div className="col-span-12 sm:col-span-4">
                      <Label className="mb-2 block text-sm font-medium text-foreground">
                        {t("meals.recipe")}
                      </Label>
                      <Field name="recipeId">
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
                                applyRecipe(nextRecipeId);
                              } else {
                                setFieldValue("followRecipe", false);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={t("meals.selectRecipe")}
                              />
                            </SelectTrigger>
                            <SelectContent searchable>
                              <SelectItem value="__no_recipe__">
                                {t("dailyMenu.noStoredRecipe")}
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
                    </div>
                  </>
                ) : (
                  <div className="col-span-12">
                    <Label className="mb-2 block text-sm font-medium text-foreground">
                      {t("dailyMenu.itemName")} *
                    </Label>
                    <Field
                      as={Input}
                      name="customName"
                      placeholder={t("dailyMenu.itemNamePlaceholder")}
                    />
                    <ErrorMessage
                      name="customName"
                      component="p"
                      className="mt-1 text-xs text-destructive"
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="col-span-12">
                  <Label className="mb-2 block text-sm font-medium text-foreground">
                    {t("dailyMenu.notes")}
                  </Label>
                  <Field
                    as={Textarea}
                    name="notes"
                    rows={2}
                    placeholder={t("dailyMenu.notesPlaceholder")}
                  />
                </div>

                {/* Quantity planning (follow-recipe mode) */}
                {values.followRecipe && (
                  <Card className="col-span-12">
                    <CardHeader className="px-4 py-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpen className="h-4 w-4 text-primary" />
                        {t("recipes.quantityInformation")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 pb-4">
                      {menuComponent &&
                      menuComponent.averages.length > 0 ? (
                        <div className="rounded-md border border-border bg-muted/30 p-3">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-foreground">
                                {t("dailyMenu.consumptionPlanner")}
                              </h4>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t("dailyMenu.consumptionPlannerHint")}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 shrink-0 px-3"
                              onClick={applyConsumptionSuggestion}
                              disabled={!consumptionSuggestion}
                            >
                              {t("dailyMenu.applySuggestion")}
                            </Button>
                          </div>
                          <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_14rem]">
                            <div className="grid gap-2 xl:grid-cols-2">
                              {menuComponent.averages.map((avg) => (
                                <div
                                  key={avg.id}
                                  className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <Label className="block truncate text-sm font-medium text-foreground">
                                      {avg.personType.name}
                                    </Label>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {t("dailyMenu.avgLabel")}{" "}
                                      {formatDecimal(avg.quantity)} {avg.unit}
                                    </p>
                                  </div>
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
                                    className="h-8 text-right"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="rounded-md bg-background px-3 py-2 text-sm">
                              {consumptionSuggestion ? (
                                <div className="grid gap-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {t("dailyMenu.suggested")}
                                    </span>
                                    <span className="font-medium">
                                      {formatDecimal(
                                        consumptionSuggestion.preparedQuantity,
                                      )}{" "}
                                      {consumptionSuggestion.preparedQuantityUnit}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {t("dailyMenu.people")}
                                    </span>
                                    <span className="font-medium">
                                      {consumptionSuggestion.totalPersons}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  {t("dailyMenu.enterCounts")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="@container grid grid-cols-12 gap-3">
                        <div className="col-span-12 @sm:col-span-4">
                          <Label className="mb-1 block text-xs font-medium text-foreground">
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
                        <div className="col-span-12 @sm:col-span-4">
                          <QuantityWithPieceInput
                            label={`${t("recipes.preparedQuantity")} (${t("dailyMenu.perGhan")})`}
                            quantityName="preparedQuantity"
                            unitName="preparedQuantityUnit"
                            pieceQuantityName="quantityPerPiece"
                            pieceUnit={values.servingQuantityUnit}
                            min={0}
                            step={0.0001}
                            inputClassName="h-9"
                            labelClassName="text-xs"
                          />
                        </div>
                        <div className="col-span-12 @sm:col-span-4">
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
                          <div className="grid gap-x-4 gap-y-1 rounded-md border border-border bg-accent px-3 py-2 text-sm sm:grid-cols-3">
                            <div className="flex items-center justify-between gap-2 sm:block">
                              <span className="text-xs text-muted-foreground">
                                {t("dailyMenu.totalPrepared")}
                              </span>
                              <span className="font-medium text-foreground sm:block">
                                {formatDecimal(calc.preparedQuantity)}{" "}
                                {calc.preparedUnit}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 sm:block">
                              <span className="text-xs text-muted-foreground">
                                {t("recipes.numberOfServings")}
                              </span>
                              <span className="font-medium text-foreground sm:block">
                                {calc.numberOfServings}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 sm:block">
                              <span className="text-xs text-muted-foreground">
                                {t("recipes.extraQuantity")}
                              </span>
                              <span className="font-medium text-foreground sm:block">
                                {formatDecimal(calc.extraQuantity)}{" "}
                                {calc.preparedUnit}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* Ingredients */}
                <div
                  className={`col-span-12 ${
                    values.followRecipe ? "pointer-events-none opacity-90" : ""
                  }`}
                >
                  <IngredientsInput
                    name="ingredientGroups"
                    ingredientGroups={values.ingredientGroups}
                    generateStableId={generateStableId}
                    title={t("meals.ingredients")}
                    description={t("dailyMenu.ingredientsHint")}
                    showCostSummary={false}
                    quantityType="number"
                    onPasteIngredients={handlePasteIngredients}
                    hideGroupManagement
                  />
                </div>
              </div>

            </AccordionContent>
          </AccordionItem>
          {/* Rendered outside AccordionContent so it stays mounted (and keeps
              its pending debounce) even while the row is collapsed. */}
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
