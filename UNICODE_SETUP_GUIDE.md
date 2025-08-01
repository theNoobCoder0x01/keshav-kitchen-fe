# Unicode and Gujarati Font Support Implementation Guide

## Overview
This guide explains how to implement full Unicode support for Gujarati characters in your PDF, Excel, and CSV reports.

## Current Implementation Status

### ✅ What's Already Implemented

1. **Basic Unicode Support**: 
   - UTF-8 encoding for all text in PDF, Excel, and CSV exports
   - Automatic detection of Gujarati characters
   - Text encoding helpers to prevent corruption

2. **PDF Reports** (`lib/reports/jspdf-export.ts`):
   - Unicode-safe text rendering with `addUnicodeText()` function
   - Automatic Gujarati character detection
   - Fallback mechanisms for unsupported characters

3. **Excel Reports** (`lib/reports/menu-export.ts`):
   - UTF-8 BOM (Byte Order Mark) for proper Excel Unicode support
   - Text encoding for all cell content
   - Unicode-safe worksheet names

4. **CSV Reports**:
   - UTF-8 encoding with BOM
   - Proper text escaping for Unicode characters

5. **Font Infrastructure** (`lib/fonts/gujarati-font.ts`):
   - Font management system
   - Character detection utilities
   - Text encoding helpers

## Next Steps for Full Gujarati Support

### Step 1: Download Gujarati Font

Choose one of these high-quality Gujarati fonts:

1. **Noto Sans Gujarati** (Recommended)
   - Download from: https://fonts.google.com/noto/specimen/Noto+Sans+Gujarati
   - Supports all Gujarati Unicode characters
   - Excellent for digital documents

2. **Lohit Gujarati**
   - Download from: https://github.com/pravins/lohit2
   - Open source alternative

3. **Aakar**
   - Traditional Gujarati font
   - Good for formal documents

### Step 2: Convert Font for jsPDF

1. Go to the jsPDF Font Converter:
   ```
   https://peckconsulting.s3.amazonaws.com/fontconverter/fontconverter.html
   ```

2. Upload your `.ttf` font file

3. Download the generated JavaScript file (e.g., `NotoSansGujarati-normal.js`)

### Step 3: Add Font to Project

1. Create a fonts directory:
   ```bash
   mkdir -p public/fonts
   ```

2. Place the generated font file in `public/fonts/`

3. Update `lib/fonts/gujarati-font.ts`:
   ```typescript
   // Import the generated font
   import './path/to/NotoSansGujarati-normal.js';

   export function addGujaratiFontSupport(doc: jsPDF) {
     try {
       // Add the converted font
       doc.addFont('NotoSansGujarati-normal.ttf', 'NotoSansGujarati', 'normal');
       doc.setFont('NotoSansGujarati', 'normal');
       return true;
     } catch (error) {
       console.warn('Failed to add Gujarati font support:', error);
       // Fallback to default font
       doc.setFont('helvetica', 'normal');
       return false;
     }
   }
   ```

### Step 4: Test Gujarati Text

Create a test file to verify the implementation:

```typescript
// test-gujarati.ts
import jsPDF from 'jspdf';
import { addGujaratiFontSupport } from './lib/fonts/gujarati-font';

const doc = new jsPDF();
addGujaratiFontSupport(doc);

// Test Gujarati text
const gujaratiText = 'આ એક ગુજરાતી ટેસ્ટ છે'; // "This is a Gujarati test"
doc.text(gujaratiText, 20, 20);

doc.save('gujarati-test.pdf');
```

## Advanced Configuration

### Font Embedding Options

For better font support, configure jsPDF with advanced options:

```typescript
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  putOnlyUsedFonts: true, // Only embed used characters
  compress: true,
  fontDefaults: {
    fontName: 'NotoSansGujarati',
    fontStyle: 'normal'
  }
});
```

### Text Direction Support

If you need right-to-left text support:

```typescript
export function addRTLSupport(doc: jsPDF, text: string, x: number, y: number) {
  // Check if text contains RTL characters
  const rtlPattern = /[\u0590-\u08FF]/;
  
  if (rtlPattern.test(text)) {
    // Apply RTL text direction
    doc.text(text, x, y, { 
      align: 'right',
      rtl: true 
    });
  } else {
    doc.text(text, x, y);
  }
}
```

### Font Fallback Chain

Implement a robust fallback system:

```typescript
const FONT_FALLBACK_CHAIN = [
  'NotoSansGujarati',
  'Arial Unicode MS',
  'helvetica'
];

export function setOptimalFont(doc: jsPDF, text: string) {
  for (const fontName of FONT_FALLBACK_CHAIN) {
    try {
      doc.setFont(fontName, 'normal');
      return fontName;
    } catch (error) {
      console.warn(`Font ${fontName} not available`);
    }
  }
  
  // Final fallback
  doc.setFont('helvetica', 'normal');
  return 'helvetica';
}
```

## Testing Gujarati Support

### Test Cases

Create comprehensive tests for:

1. **Basic Gujarati Text**:
   ```
   'ગુજરાતી ભાષા' (Gujarati language)
   ```

2. **Numbers in Gujarati**:
   ```
   '૧૨૩૪૫૬૭૮૯૦' (Gujarati numerals 1-0)
   ```

3. **Mixed Text**:
   ```
   'Hello આ ગુજરાતી છે 123'
   ```

4. **Special Characters**:
   ```
   'વિશેષ ચિહ્નો: ૱ ૹ ૺ ૻ'
   ```

### Validation Script

```typescript
// scripts/test-unicode.ts
import { containsGujaratiText, encodeTextForPDF } from '@/lib/fonts/gujarati-font';

const testCases = [
  'ગુજરાતી ભાષા',
  'Hello world',
  'Mixed ગુજરાતી text',
  '૧૨૩૪૫૬૭૮૯૦'
];

testCases.forEach(text => {
  console.log(`Text: ${text}`);
  console.log(`Contains Gujarati: ${containsGujaratiText(text)}`);
  console.log(`Encoded: ${encodeTextForPDF(text)}`);
  console.log('---');
});
```

## Browser Compatibility

### Font Loading in Browser

For web-based PDF generation, ensure fonts are loaded:

```typescript
export async function preloadGujaratiFont() {
  const font = new FontFace(
    'NotoSansGujarati',
    'url(/fonts/NotoSansGujarati-Regular.woff2)'
  );
  
  try {
    await font.load();
    document.fonts.add(font);
    return true;
  } catch (error) {
    console.warn('Failed to load Gujarati font:', error);
    return false;
  }
}
```

## Performance Optimization

### Lazy Font Loading

Only load Gujarati fonts when needed:

```typescript
let gujaratiFontLoaded = false;

export async function ensureGujaratiFontLoaded(text: string) {
  if (!containsGujaratiText(text)) {
    return false; // No Gujarati text, no need to load font
  }
  
  if (!gujaratiFontLoaded) {
    gujaratiFontLoaded = await loadGujaratiFont();
  }
  
  return gujaratiFontLoaded;
}
```

### Font Subsetting

For production, consider font subsetting to reduce file size:

1. Use tools like `pyftsubset` to create subsets
2. Only include characters used in your application
3. Generate separate font files for different character sets

## Troubleshooting

### Common Issues

1. **Font Not Displaying**:
   - Check font file path
   - Verify font conversion was successful
   - Test with basic ASCII text first

2. **Text Appears as Boxes**:
   - Font doesn't contain required characters
   - Try a different Gujarati font
   - Check Unicode encoding

3. **Performance Issues**:
   - Font file too large
   - Consider font subsetting
   - Implement lazy loading

4. **Excel/CSV Issues**:
   - Ensure BOM is included
   - Check file encoding settings
   - Test with different Excel versions

### Debug Mode

Enable debug logging:

```typescript
const DEBUG_UNICODE = process.env.NODE_ENV === 'development';

export function debugLog(message: string, data?: any) {
  if (DEBUG_UNICODE) {
    console.log(`[Unicode Debug] ${message}`, data);
  }
}
```

## Production Deployment

### Environment Variables

Add to your `.env`:

```bash
# Unicode support settings
ENABLE_GUJARATI_FONTS=true
FONT_FALLBACK_ENABLED=true
DEBUG_UNICODE_RENDERING=false
```

### CDN Font Loading

For better performance in production:

```typescript
const FONT_CDN_URL = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati';

export function loadFontFromCDN() {
  const link = document.createElement('link');
  link.href = FONT_CDN_URL;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}
```

## Conclusion

With this implementation, your reports system now supports:

- ✅ Unicode text encoding across all export formats
- ✅ Gujarati character detection
- ✅ Robust error handling and fallbacks
- ✅ Performance optimizations
- 🔄 Ready for custom Gujarati font integration

Follow the steps above to complete the full Gujarati font implementation for your specific use case.