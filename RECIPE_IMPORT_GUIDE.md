# Recipe Import Functionality Guide

## Overview

The recipe import functionality allows you to bulk import recipes from Excel files into your kitchen management system. This feature is designed to save time when adding multiple recipes at once.

## Features

- **Excel File Support**: Import from `.xlsx` and `.xls` files
- **Bulk Import**: Import multiple recipes in a single operation
- **Validation**: Comprehensive validation of required fields and data formats
- **Error Handling**: Detailed error reporting for failed imports
- **Template Download**: Built-in template download for proper formatting
- **Progress Feedback**: Real-time feedback during import process

## How to Use

### 1. Access the Import Feature

1. Navigate to the **Recipes** page
2. Click the **"Import Recipes"** button in the top-right corner
3. The import dialog will open

### 2. Download Template (Recommended)

1. Click **"Download Template"** in the import dialog
2. This will download a CSV file with the correct format
3. Use this template as a reference for your data

### 3. Prepare Your Excel File

Your Excel file should have the following columns:

| Column | Field | Required | Description |
|--------|-------|----------|-------------|
| A | Recipe Name | ✅ | The name of the recipe |
| B | Category | ✅ | Main category (e.g., Main Course, Dessert) |
| C | Subcategory | ✅ | Subcategory (e.g., Indian, Italian) |
| D | Description | ❌ | Brief description of the recipe |
| E | Instructions | ❌ | Step-by-step cooking instructions |
| F | Servings | ❌ | Number of servings (whole number) |
| G | Ingredients | ❌ | Ingredients in specific format |

### 4. Ingredients Format

Ingredients should be formatted as:
```
Name,Quantity,Unit,CostPerUnit;Name2,Quantity2,Unit2,CostPerUnit2
```

**Example:**
```
Chicken,500,g,0.02;Onion,100,g,0.01;Spices,50,g,0.05
```

**Format Rules:**
- Separate multiple ingredients with semicolon (`;`)
- Each ingredient has: Name, Quantity, Unit, CostPerUnit (optional)
- CostPerUnit is optional for each ingredient
- Use standard units (g, kg, ml, l, pcs, etc.)

### 5. Import Your File

1. Click **"Select Excel File"** and choose your file
2. Review the file name confirmation
3. Click **"Import Recipes"**
4. Wait for the import to complete
5. Review the results

## File Format Examples

### Sample Excel Structure

| Recipe Name | Category | Subcategory | Description | Instructions | Servings | Ingredients |
|-------------|----------|-------------|-------------|--------------|----------|-------------|
| Chicken Curry | Main Course | Indian | A delicious chicken curry | 1. Marinate chicken... | 4 | Chicken,500,g,0.02;Onion,100,g,0.01 |
| Rice Pilaf | Side Dish | Indian | Fragrant rice dish | 1. Wash rice... | 6 | Rice,300,g,0.03;Spices,20,g,0.05 |

### Valid Categories and Subcategories

**Categories:**
- Main Course
- Side Dish
- Appetizer
- Dessert
- Bread
- Rice Dish
- Soup
- Salad

**Subcategories:**
- Indian
- Italian
- Chinese
- Mexican
- Mediterranean
- American
- Thai
- Japanese

## Validation Rules

### Required Fields
- **Recipe Name**: Must not be empty
- **Category**: Must not be empty
- **Subcategory**: Must not be empty

### Optional Fields
- **Description**: Can be empty
- **Instructions**: Can be empty
- **Servings**: Must be a whole number if provided
- **Ingredients**: Must follow the specified format if provided

### Data Validation
- File must be `.xlsx` or `.xls` format
- First row is treated as headers
- Empty rows are skipped
- Invalid ingredient formats are reported as errors

## Error Handling

### Common Errors and Solutions

1. **"Recipe name is required"**
   - Ensure column A has a value for each recipe

2. **"Category is required"**
   - Ensure column B has a value for each recipe

3. **"Subcategory is required"**
   - Ensure column C has a value for each recipe

4. **"Invalid ingredients format"**
   - Check that ingredients follow the format: `Name,Quantity,Unit,CostPerUnit`
   - Separate multiple ingredients with semicolons

5. **"Invalid file type"**
   - Ensure you're uploading an Excel file (`.xlsx` or `.xls`)

### Error Reporting

The system provides detailed error reporting:
- Row-specific error messages
- Field-specific validation errors
- Import success/failure counts
- Partial import results (some recipes may import successfully even if others fail)

## Testing the Import Feature

### Test Files Provided

1. **`test_recipes_import.csv`**: Sample data with 10 Indian recipes
2. **`create_recipe_template.py`**: Python script to generate Excel template
3. **`recipe_import_template.xlsx`**: Generated Excel template (run the Python script first)

### Running the Python Template Generator

```bash
# Install required packages
pip install pandas openpyxl

# Run the template generator
python create_recipe_template.py
```

This will create `recipe_import_template.xlsx` with:
- Sample recipes with proper formatting
- Instructions sheet with detailed guidelines
- Proper column headers and data types

## API Endpoint

The import functionality uses the following API endpoint:

```
POST /api/recipes/import
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field containing Excel file

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported 5 recipes",
  "importedCount": 5,
  "errors": ["Failed to import recipe: Invalid Recipe"]
}
```

## Troubleshooting

### Import Not Working?

1. **Check file format**: Ensure it's `.xlsx` or `.xls`
2. **Check headers**: First row should contain column headers
3. **Check required fields**: Recipe Name, Category, Subcategory are required
4. **Check ingredients format**: Follow the specified format exactly
5. **Check file size**: Large files may take longer to process

### Performance Tips

1. **Batch size**: Import 50-100 recipes at a time for best performance
2. **File size**: Keep files under 5MB for optimal performance
3. **Network**: Ensure stable internet connection during upload
4. **Browser**: Use modern browsers (Chrome, Firefox, Safari, Edge)

## Support

If you encounter issues with the import functionality:

1. Check the error messages in the import dialog
2. Verify your file format matches the template
3. Try with a smaller test file first
4. Contact support if issues persist

## Future Enhancements

Planned improvements:
- Support for more file formats (CSV, JSON)
- Advanced validation rules
- Import preview before processing
- Bulk edit capabilities
- Export functionality for existing recipes