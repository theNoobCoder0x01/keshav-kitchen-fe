import pandas as pd
import json

def read_excel_and_generate_seed():
    # Read the Excel file with proper encoding
    df = pd.read_excel('liquid.xlsx')
    
    # Print column names to understand the structure
    print("Columns in Excel file:")
    print(df.columns.tolist())
    
    # Print first few rows to understand the data
    print("\nFirst 15 rows:")
    print(df.head(15))
    
    # Based on the output, it looks like the first column has serial numbers
    # and the second column has the recipe names
    # Let's create a proper seed data structure
    recipes = []
    
    # Skip the first row as it seems to be a header
    for index, row in df.iterrows():
        # Skip NaN values
        if pd.isna(row.iloc[0]) or pd.isna(row.iloc[1]):
            continue
            
        # Extract recipe name from the second column
        recipe_name = str(row.iloc[1]).strip()
        
        # Skip if recipe name is empty or just a number
        if not recipe_name or recipe_name.replace('.', '', 1).isdigit():
            continue
        
        recipe = {
            "id": f"recipe-{len(recipes) + 1}",
            "name": recipe_name,
            "category": "Liquid Dessert",
            "subcategory": "Gujarati",
            "description": f"Traditional Gujarati {recipe_name.lower()}",
            "instructions": f"Prepare {recipe_name.lower()} according to traditional Gujarati recipe",
            "servings": 10,
        }
        recipes.append(recipe)
    
    # Save to a JSON file for reference
    with open('recipes_seed_data.json', 'w', encoding='utf-8') as f:
        json.dump(recipes, f, indent=2, ensure_ascii=False)
    
    print(f"\nGenerated {len(recipes)} recipes seed data saved to recipes_seed_data.json")
    
    # Also print to console
    print("\nGenerated seed data:")
    print(json.dumps(recipes[:3], indent=2, ensure_ascii=False))  # Print first 3 for brevity

if __name__ == "__main__":
    read_excel_and_generate_seed()
