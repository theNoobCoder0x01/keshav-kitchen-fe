# Recipe Import from Excel - User Guide

## Overview

The Recipe Import functionality allows you to bulk import recipes from Excel (.xlsx, .xls) or CSV files. This feature is designed to save time when adding multiple recipes to your kitchen management system.

## How to Use

### 1. Access the Import Feature

1. Navigate to the **Recipes** page in your kitchen management system
2. Click the **"Import from Excel"** button in the top-right corner
3. The Import Recipes dialog will open

### 2. Download Template (Recommended)

1. Click the **"Download Template"** button in the import dialog
2. This will download a CSV template file with the correct format
3. Use this template as a reference for your data

### 3. Prepare Your Excel File

Your Excel file must have the following columns in the exact order:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| Recipe Name | ✅ | Name of the recipe | "Butter Potato" |
| Category | ✅ | Recipe category | "Main Course" |
| Subcategory | ✅ | Recipe subcategory | "Indian" |
| Description (optional) | ❌ | Recipe description | "Creamy and flavorful curry" |
| Instructions (optional) | ❌ | Cooking instructions | "1. Marinate potato...\n2. Cook..." |
| Servings (optional) | ❌ | Number of servings | 4 |
| Ingredients (comma-separated) | ✅ | Ingredient names | "Potato,Tomato,Peas" |
| Quantities (comma-separated) | ✅ | Ingredient quantities | "500,200,100" |
| Units (comma-separated) | ✅ | Ingredient units | "grams,grams,grams" |
| Cost Per Unit (comma-separated, optional) | ❌ | Cost per unit | "2.5,0.5,0.3" |

### 4. Data Format Rules

#### Required Fields
- **Recipe Name**: Must not be empty
- **Category**: Must not be empty
- **Subcategory**: Must not be empty
- **Ingredients**: At least one ingredient required
- **Quantities**: Must match number of ingredients
- **Units**: Must match number of ingredients

#### Optional Fields
- **Description**: Can be left empty
- **Instructions**: Can be left empty
- **Servings**: Must be a number if provided
- **Cost Per Unit**: Can be left empty or contain numbers

#### Ingredient Format
- Ingredients, quantities, and units must be comma-separated
- The number of items in each list must match
- Example: `"Potato,Tomato,Peas"` with `"500,200,100"` and `"grams,grams,grams"`

### 5. Upload and Import

1. Click **"Choose File"** and select your Excel/CSV file
2. Review the file details
3. Click **"Import Recipes"** to start the import process
4. Wait for the import to complete
5. Review the results and any error messages

## Example Data

Here's an example of how your Excel file should look:

```
Recipe Name,Category,Subcategory,Description,Instructions,Servings,Ingredients,Quantities,Units,Cost Per Unit
Butter Potato,Main Course,Indian,Creamy curry,1. Marinate potato\n2. Cook gravy,4,Potato,Tomato,Peas,500,200,100,grams,grams,grams,2.5,0.5,0.3
Chocolate Cake,Dessert,Baked,Rich cake,1. Mix ingredients\n2. Bake,8,Flour,Sugar,Paneer,200,150,3,grams,grams,pieces,0.8,1.2,0.3
```

## Error Handling

The system will validate your data and report any issues:

### Common Errors
- **Missing required headers**: Ensure all required column headers are present
- **Empty required fields**: Recipe name, category, and subcategory cannot be empty
- **Mismatched ingredient counts**: Number of ingredients, quantities, and units must match
- **Invalid file format**: Only .xlsx, .xls, and .csv files are supported

### Error Messages
- Row-specific errors will show which row has issues
- Import will continue with valid recipes even if some rows have errors
- A summary will show how many recipes were successfully imported

## Tips for Success

1. **Use the template**: Download and use the provided template as a starting point
2. **Test with small files**: Start with a few recipes to test the format
3. **Check data consistency**: Ensure ingredient counts match across all columns
4. **Use clear categories**: Use consistent category and subcategory names
5. **Backup existing data**: Make sure you have backups before bulk importing

## File Size Limits

- Maximum file size: 10MB
- Recommended: Keep files under 5MB for better performance
- Large files may take longer to process

## Supported File Formats

- **Excel (.xlsx)**: Recommended format
- **Excel (.xls)**: Legacy Excel format
- **CSV (.csv)**: Simple text format

## Troubleshooting

### Import Fails
- Check file format and size
- Ensure all required headers are present
- Verify data consistency

### Partial Import
- Review error messages for specific issues
- Fix the problematic rows and try again
- Valid recipes will still be imported

### Performance Issues
- Break large files into smaller chunks
- Close other applications to free up memory
- Try using CSV format for very large files

## Support

If you encounter issues with the import functionality:

1. Check the error messages in the import dialog
2. Verify your file format matches the template
3. Try importing a smaller subset of data first
4. Contact support if problems persist

## Test File

A test file `test_recipes_import.xlsx` is included with this system for testing the import functionality. This file contains sample recipes that demonstrate the correct format and can be used to verify the import process works correctly.