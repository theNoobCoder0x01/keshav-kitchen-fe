import { ReactElement } from "react";
import { useIntl } from "react-intl";

interface TranslationValues {
  [key: string]: string | number | Date | ReactElement<any, any> | any;
}

export function useTranslations() {
  const intl = useIntl();

  // Helper function to get nested translation keys
  const t = (id: string, values?: TranslationValues) => {
    try {
      return intl.formatMessage({ id }, values);
    } catch (error) {
      console.warn(`Translation key "${id}" not found`);
      return id; // Return the key itself as fallback
    }
  };

  // Helper functions for accessing nested translation sections
  const navigation = (key: string, values?: TranslationValues) =>
    t(`navigation.${key}`, values);
  const common = (key: string, values?: TranslationValues) =>
    t(`common.${key}`, values);
  const newsletter = (key: string, values?: TranslationValues) =>
    t(`newsletter.${key}`, values);
  const settings = (key: string, values?: TranslationValues) =>
    t(`settings.${key}`, values);
  const meals = (key: string, values?: TranslationValues) =>
    t(`meals.${key}`, values);
  const reports = (key: string, values?: TranslationValues) =>
    t(`reports.${key}`, values);
  const recipes = (key: string, values?: TranslationValues) =>
    t(`recipes.${key}`, values);
  const ingredients = (key: string, values?: TranslationValues) =>
    t(`ingredients.${key}`, values);
  const menus = (key: string, values?: TranslationValues) =>
    t(`menus.${key}`, values);
  const auth = (key: string, values?: TranslationValues) =>
    t(`auth.${key}`, values);
  const kitchens = (key: string, values?: TranslationValues) =>
    t(`kitchens.${key}`, values);
  const dashboard = (key: string, values?: TranslationValues) =>
    t(`dashboard.${key}`, values);
  const messages = (key: string, values?: TranslationValues) =>
    t(`messages.${key}`, values);

  return {
    t, // General translation function
    navigation, // Navigation translations
    common, // Common translations
    newsletter, // Newsletter translations
    settings, // Settings translations
    meals, // Meals translations
    reports, // Report translations
    recipes, // Recipe translations
    ingredients, // Ingredient translations
    menus, // Menu translations
    auth, // Auth translations
    kitchens, // Kitchen translations
    dashboard, // Dashboard translations
    messages, // Message translations
    intl, // Direct access to intl object for advanced usage
  };
}

// Type-safe translation key helpers for the flattened structure
export type TranslationKey = string;

// Export for use in components that need strongly typed keys
export function useTypedTranslations() {
  const { t } = useTranslations();

  return {
    t: (key: TranslationKey, values?: TranslationValues) => t(key, values),
  };
}
