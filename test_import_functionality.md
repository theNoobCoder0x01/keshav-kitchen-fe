# Testing Recipe Import Functionality

## Overview

This guide will help you test the recipe import functionality that has been implemented.

## What's Been Created

### 1. API Endpoint
- **File**: `app/api/recipes/import/route.ts`
- **Endpoint**: `POST /api/recipes/import`
- **Features**: 
  - Excel file validation
  - Data parsing and validation
  - Database import with error handling
  - Detailed error reporting

### 2. UI Component
- **File**: `components/dialogs/import-recipes-dialog.tsx`
- **Features**:
  - File upload interface
  - Template download
  - Progress feedback
  - Error display
  - Success confirmation

### 3. Updated Recipes Page
- **File**: `app/recipes/page.tsx`
- **Changes**:
  - Added "Import Recipes" button
  - Integrated import dialog
  - Automatic refresh after import

### 4. Test Files
- **File**: `test_recipes_import.csv` - Sample data with 10 recipes
- **File**: `recipe_import_template.csv` - Generated template
- **File**: `create_simple_template.py` - Template generator script

## How to Test

### Step 1: Start the Development Server
```bash
npm run dev
```

### Step 2: Navigate to Recipes Page
1. Go to `http://localhost:3000/recipes`
2. You should see the "Import Recipes" button next to "Add New Recipe"

### Step 3: Test the Import Dialog
1. Click "Import Recipes" button
2. The dialog should open with:
   - Template download option
   - File upload interface
   - Format instructions
   - Import button

### Step 4: Download Template
1. Click "Download Template" in the dialog
2. This should download a CSV file with sample data
3. Verify the file contains proper headers and sample recipes

### Step 5: Test with Sample Data
1. Use the `test_recipes_import.csv` file for testing
2. Click "Select Excel File" and choose the CSV file
3. Click "Import Recipes"
4. Check the results:
   - Success message should appear
   - Recipes should be added to the database
   - Recipes should appear in the recipes list

### Step 6: Test Error Handling
1. Try uploading a file with missing required fields
2. Try uploading a file with invalid ingredient format
3. Try uploading a non-Excel file
4. Verify error messages are displayed properly

## Expected Behavior

### Successful Import
- File upload should work
- Progress indicator should show during import
- Success message should appear
- Recipes should be added to the database
- Recipes should appear in the recipes list
- Dialog should close automatically after success

### Error Handling
- Invalid file types should show error
- Missing required fields should show specific errors
- Invalid ingredient format should show error
- Network errors should be handled gracefully

### UI Feedback
- File selection should show file name
- Upload button should be disabled when no file selected
- Progress spinner should show during upload
- Error messages should be clearly displayed
- Success messages should be clearly displayed

## Test Cases

### Test Case 1: Valid Import
1. Use `test_recipes_import.csv`
2. Import should succeed
3. 10 recipes should be added
4. No errors should occur

### Test Case 2: Missing Required Fields
1. Create a CSV with missing recipe names
2. Import should fail with specific error messages
3. No recipes should be added

### Test Case 3: Invalid Ingredients Format
1. Create a CSV with malformed ingredients
2. Import should fail with ingredient format error
3. No recipes should be added

### Test Case 4: Invalid File Type
1. Try uploading a text file
2. Import should fail with file type error
3. No recipes should be added

### Test Case 5: Partial Import
1. Create a CSV with some valid and some invalid rows
2. Valid recipes should be imported
3. Invalid recipes should be reported as errors
4. Success count should match valid recipes

## Troubleshooting

### Import Not Working?
1. Check browser console for errors
2. Check server logs for API errors
3. Verify file format is correct
4. Check network connectivity

### Recipes Not Appearing?
1. Check if import was successful
2. Refresh the page
3. Check database directly
4. Verify user authentication

### UI Issues?
1. Check if all components are properly imported
2. Verify CSS classes are applied
3. Check for JavaScript errors
4. Test in different browsers

## Files Created/Modified

### New Files
- `app/api/recipes/import/route.ts` - API endpoint
- `components/dialogs/import-recipes-dialog.tsx` - UI component
- `test_recipes_import.csv` - Test data
- `recipe_import_template.csv` - Template
- `create_simple_template.py` - Template generator
- `RECIPE_IMPORT_GUIDE.md` - Documentation
- `test_import_functionality.md` - This test guide

### Modified Files
- `app/recipes/page.tsx` - Added import button and dialog

## Next Steps

After testing, you can:
1. Customize the import format as needed
2. Add more validation rules
3. Implement export functionality
4. Add bulk edit capabilities
5. Create more sophisticated error handling