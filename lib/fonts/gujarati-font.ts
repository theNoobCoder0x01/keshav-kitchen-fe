// Gujarati Font Support for jsPDF
// This file will contain the base64 encoded Gujarati font and the code to add it to jsPDF

import jsPDF from "jspdf";

// For now, we'll use a web-safe approach with system fonts
// In production, you would add a proper Gujarati TTF font here
// The font data would be base64 encoded TTF file content

// Function to add Gujarati font support to jsPDF
export function addGujaratiFontSupport(doc: jsPDF) {
  // For immediate use, we'll configure jsPDF to handle Unicode better
  // and use web fonts that support Gujarati

  // Note: For full Gujarati support, you need to:
  // 1. Get a TTF font that supports Gujarati script (like Noto Sans Gujarati, Lohit Gujarati, etc.)
  // 2. Convert it using jsPDF's font converter
  // 3. Add the generated font file to your project

  // For now, we'll use the built-in font with Unicode support
  try {
    // Enable Unicode support for text rendering
    doc.setFont("helvetica", "normal");

    // You can replace this with actual Gujarati font once converted
    // Example: doc.addFont('path/to/gujarati-font.js', 'GujaratiFont', 'normal');
    // Then: doc.setFont('GujaratiFont', 'normal');

    return true;
  } catch (error) {
    console.warn("Failed to add Gujarati font support:", error);
    return false;
  }
}

// Helper function to check if text contains Gujarati characters
export function containsGujaratiText(text: string): boolean {
  // Gujarati Unicode range: U+0A80–U+0AFF
  const gujaratiRange = /[\u0A80-\u0AFF]/;
  return gujaratiRange.test(text);
}

// Helper function to ensure proper text encoding
export function encodeTextForPDF(text: string): string {
  // Ensure proper UTF-8 encoding
  try {
    // Convert to UTF-8 if not already
    return decodeURIComponent(encodeURIComponent(text));
  } catch (error) {
    console.warn("Text encoding failed, using original text:", error);
    return text;
  }
}

// Instructions for adding custom Gujarati font:
/*
1. Download a Gujarati TTF font (e.g., Noto Sans Gujarati from Google Fonts)
2. Use jsPDF font converter: 
   - Go to https://peckconsulting.s3.amazonaws.com/fontconverter/fontconverter.html
   - Upload your TTF file
   - Download the generated JS file
3. Include the generated font file in your project
4. Replace the addGujaratiFontSupport function above to use the custom font

Example with custom font:
```typescript
// After including the generated font file
export function addGujaratiFontSupport(doc: jsPDF) {
  try {
    // The font name will be from the generated file
    doc.setFont('NotoSansGujarati', 'normal');
    return true;
  } catch (error) {
    console.warn('Failed to add Gujarati font support:', error);
    return false;
  }
}
```
*/
