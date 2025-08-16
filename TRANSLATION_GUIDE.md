# Translation System Guide

This project now supports internationalization (i18n) with English and Gujarati languages. This guide explains how to use and extend the translation system.

## Overview

The translation system uses:
- **React Intl** for internationalization
- **Custom Language Context** for state management
- **Database storage** for user language preferences
- **Type-safe translation hooks** for easy usage

## Quick Start

### Using Translations in Components

```tsx
import { useTranslations } from "@/hooks/use-translations";

function MyComponent() {
  const { tc, tn, ts } = useTranslations();
  
  return (
    <div>
      <h1>{tc('title')}</h1>
      <nav>{tn('recipes')}</nav>
      <p>{ts('description')}</p>
    </div>
  );
}
```

### Translation Helper Functions

- `t(key, values?)` - General translation function
- `tc(key, values?)` - Common translations
- `tn(key, values?)` - Navigation translations
- `ts(key, values?)` - Settings translations
- `tr(key, values?)` - Recipe translations
- `tm(key, values?)` - Menu translations
- `trep(key, values?)` - Report translations
- `ta(key, values?)` - Authentication translations
- `tmsg(key, values?)` - Message translations

## Language Management

### Changing Language

```tsx
import { useLanguage } from "@/lib/contexts/language-context";

function LanguageSelector() {
  const { language, updateUserLanguage } = useLanguage();
  
  const handleLanguageChange = async (newLang) => {
    try {
      await updateUserLanguage(newLang);
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };
  
  return (
    <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
      <option value="en">English</option>
      <option value="gu">ગુજરાતી</option>
    </select>
  );
}
```

## Translation Files

Translation files are located in `/locales/[language]/common.json`:

```
locales/
├── en/
│   └── common.json
└── gu/
    └── common.json
```

### Adding New Translations

1. Add the key-value pair to both `en/common.json` and `gu/common.json`
2. Use the translation in your component
3. Update TypeScript types if necessary

Example:
```json
// locales/en/common.json
{
  "common": {
    "newButton": "Click Me"
  }
}

// locales/gu/common.json
{
  "common": {
    "newButton": "મને ક્લિક કરો"
  }
}
```

## Database Schema

User language preferences are stored in the `User` table:

```prisma
model User {
  // ... other fields
  language      String          @default("en")
  // ... other fields
}
```

## API Endpoints

### Get User Language
- **GET** `/api/user/language`
- Returns the current user's language preference

### Update User Language
- **PATCH** `/api/user/language`
- Body: `{ "language": "en" | "gu" }`
- Updates the user's language preference

## Architecture

### Components Structure

```
app/layout.tsx                 - Root LanguageProvider
├── LanguageProvider           - Context provider
├── SessionProviderWrapper     - Authentication
└── children                   - App content

app/(protected)/layout.tsx      - Protected routes
├── LanguageLoader             - Loads user language preference
├── Header                     - App header
├── Sidebar                    - Navigation (translated)
└── children                   - Page content
```

### Translation Flow

1. User signs in → `LanguageLoader` fetches language preference from database
2. Language preference is stored in `LanguageContext`
3. Components use `useTranslations()` hook to get translated strings
4. User changes language → API call updates database and context

## Available Languages

- **English** (`en`) - Default language
- **Gujarati** (`gu`) - ગુજરાતી

## Adding New Languages

1. Create new translation file: `locales/[lang-code]/common.json`
2. Add language option to `LANGUAGE_OPTIONS` in `language-context.tsx`
3. Update API validation in `/api/user/language/route.ts`
4. Update TypeScript types if using typed translations

## Best Practices

1. **Use semantic keys**: `common.save` instead of `common.saveButton`
2. **Group related translations**: Navigation, settings, forms, etc.
3. **Provide context**: Use specific translation functions (`tc`, `tn`, etc.)
4. **Handle pluralization**: Use React Intl's plural support when needed
5. **Test in both languages**: Ensure UI works well with different text lengths

## Advanced Usage

### Pluralization
```tsx
const { intl } = useTranslations();

const message = intl.formatMessage(
  { id: 'items.count' },
  { count: items.length }
);
```

### Date and Number Formatting
```tsx
const { intl } = useTranslations();

const formattedDate = intl.formatDate(new Date());
const formattedNumber = intl.formatNumber(1234.56);
```

## Troubleshooting

### Common Issues

1. **Translation key not found**: Check if the key exists in both language files
2. **TypeScript errors**: Ensure the key exists in the English translation file
3. **Language not loading**: Check browser console for API errors
4. **Fallback not working**: Verify the default language is properly set

### Debug Mode

The translation hook will log warnings for missing keys in development:
```
Translation key "missing.key" not found
```

## Migration from Hardcoded Strings

To migrate existing components:

1. Identify hardcoded strings
2. Add them to translation files
3. Replace with translation function calls
4. Test in both languages

Example migration:
```tsx
// Before
<Button>Save Changes</Button>

// After
<Button>{tc('save')}</Button>
```

## Performance Considerations

- Translation files are loaded once at application startup
- Language changes are immediate (no page reload required)
- Database updates happen asynchronously
- Local storage provides backup for language preference