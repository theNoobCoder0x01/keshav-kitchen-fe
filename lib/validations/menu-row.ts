// Yup validation schema for a Daily Menu Builder row.
//
// Adapted from the inline schema in components/dialogs/add-meal-dialog.tsx so
// the autosave gate (only save when valid) matches the dialog's rules. Built as
// a factory because the messages are localized via the translation function.

import { isValidUnit } from "@/lib/constants/units";
import * as Yup from "yup";

type TranslateFn = (key: string, values?: Record<string, any>) => string;

export function buildMenuRowSchema(t: TranslateFn) {
  return Yup.object().shape({
    kitchenId: Yup.string().trim().required(t("meals.kitchenRequired")),
    cook: Yup.string().trim(),
    notes: Yup.string().trim(),
    recipeId: Yup.string().trim(),
    customName: Yup.string().when("followRecipe", {
      is: false,
      then: (schema) =>
        schema
          .trim()
          .required(t("dailyMenu.itemNameRequired")),
      otherwise: (schema) => schema.notRequired(),
    }),
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
    // The dish's main quantity (the PDF "1 kg") is always required.
    preparedQuantity: Yup.number()
      .required(t("meals.preparedQuantityRequired"))
      .positive(t("meals.preparedQuantityPositive")),
    preparedQuantityUnit: Yup.string()
      .trim()
      .required(t("meals.preparedQuantityUnitRequired"))
      .test(
        "valid-prepared-unit",
        t("meals.unitRequired"),
        (value) => !value || isValidUnit(value),
      ),
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
          name: Yup.string().trim().required(t("dailyMenu.groupNameRequired")),
          sortOrder: Yup.number().min(0),
          // Only rows the user has actually started (named) are validated; blank
          // placeholder rows are ignored here and filtered out before saving.
          ingredients: Yup.array().of(
            Yup.object().shape({
              name: Yup.string().trim(),
              quantity: Yup.number().when("name", {
                is: (name?: string) => Boolean(name && name.trim()),
                then: (schema) =>
                  schema
                    .required(t("meals.quantityRequired"))
                    .positive(t("meals.quantityPositive")),
                otherwise: (schema) => schema.notRequired(),
              }),
              unit: Yup.string().when("name", {
                is: (name?: string) => Boolean(name && name.trim()),
                then: (schema) =>
                  schema
                    .trim()
                    .required(t("meals.unitRequired"))
                    .test(
                      "valid-unit",
                      t("meals.unitRequired"),
                      (value) => !value || isValidUnit(value),
                    ),
                otherwise: (schema) => schema.notRequired(),
              }),
              costPerUnit: Yup.number().when("name", {
                is: (name?: string) => Boolean(name && name.trim()),
                then: (schema) =>
                  schema
                    .required(t("meals.costPerUnitRequired"))
                    .min(0, t("meals.costPerUnitMin")),
                otherwise: (schema) => schema.notRequired(),
              }),
            }),
          ),
        }),
      )
      .min(1, t("meals.ingredientsRequired"))
      // At least one named ingredient across all groups is required.
      .test("has-named-ingredient", t("meals.ingredientsRequired"), (groups) => {
        if (!groups) return false;
        return groups.some((group: any) =>
          group.ingredients?.some(
            (ing: any) => ing?.name && String(ing.name).trim(),
          ),
        );
      }),
  });
}
