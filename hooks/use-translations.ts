import { useIntl } from 'react-intl';
import { ReactElement } from 'react';

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

  // Helper functions for common translation patterns
  const tn = (key: string, values?: TranslationValues) => t(`navigation.${key}`, values);
  const tc = (key: string, values?: TranslationValues) => t(`common.${key}`, values);
  const ts = (key: string, values?: TranslationValues) => t(`settings.${key}`, values);
  const tr = (key: string, values?: TranslationValues) => t(`recipes.${key}`, values);
  const tm = (key: string, values?: TranslationValues) => t(`menus.${key}`, values);
  const trep = (key: string, values?: TranslationValues) => t(`reports.${key}`, values);
  const ta = (key: string, values?: TranslationValues) => t(`auth.${key}`, values);
  const tmsg = (key: string, values?: TranslationValues) => t(`messages.${key}`, values);

  return {
    t, // General translation function
    tn, // Navigation translations
    tc, // Common translations
    ts, // Settings translations
    tr, // Recipe translations
    tm, // Menu translations
    trep, // Report translations
    ta, // Auth translations
    tmsg, // Message translations
    intl, // Direct access to intl object for advanced usage
  };
}

// Type-safe translation key helpers
export type TranslationKey = 
  | `navigation.${keyof typeof import('@/locales/en/common.json')['navigation']}`
  | `common.${keyof typeof import('@/locales/en/common.json')['common']}`
  | `settings.${keyof typeof import('@/locales/en/common.json')['settings']}`
  | `recipes.${keyof typeof import('@/locales/en/common.json')['recipes']}`
  | `menus.${keyof typeof import('@/locales/en/common.json')['menus']}`
  | `reports.${keyof typeof import('@/locales/en/common.json')['reports']}`
  | `auth.${keyof typeof import('@/locales/en/common.json')['auth']}`
  | `messages.${keyof typeof import('@/locales/en/common.json')['messages']}`;

// Export for use in components that need strongly typed keys
export function useTypedTranslations() {
  const { t } = useTranslations();
  
  return {
    t: (key: TranslationKey, values?: TranslationValues) => t(key, values),
  };
}