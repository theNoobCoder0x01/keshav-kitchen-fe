#!/usr/bin/env python3

def create_csv_template():
    """Create a simple CSV template for recipe imports"""
    
    # CSV header and sample data
    csv_content = """Recipe Name,Category,Subcategory,Description,Instructions,Servings,Ingredients
Chicken Curry,Main Course,Indian,A delicious chicken curry with aromatic spices,"1. Marinate chicken with spices
2. Heat oil in a pan
3. Add onions and cook until golden
4. Add chicken and cook until done
5. Add tomatoes and simmer",4,"Chicken,500,g,0.02;Onion,100,g,0.01;Tomato,150,g,0.015;Spices,50,g,0.05;Oil,30,ml,0.02"
Rice Pilaf,Side Dish,Indian,Fragrant basmati rice cooked with spices,"1. Wash and soak rice for 30 minutes
2. Heat oil and add whole spices
3. Add rice and water
4. Cook until done",6,"Basmati Rice,300,g,0.03;Cardamom,5,pcs,0.1;Cinnamon,1,stick,0.05;Oil,20,ml,0.02"
Dal Makhani,Main Course,Indian,Creamy black lentils cooked overnight,"1. Soak lentils overnight
2. Cook in pressure cooker
3. Add cream and butter
4. Simmer until creamy",8,"Black Lentils,200,g,0.025;Kidney Beans,100,g,0.02;Cream,100,ml,0.03;Butter,50,g,0.04;Spices,30,g,0.05"
Naan Bread,Bread,Indian,Soft and fluffy Indian flatbread,"1. Mix flour, yeast, and water
2. Knead for 10 minutes
3. Let rise for 2 hours
4. Shape into flatbreads
5. Cook on hot griddle",10,"All Purpose Flour,500,g,0.015;Yeast,10,g,0.05;Yogurt,100,ml,0.02;Oil,30,ml,0.02"
Gulab Jamun,Dessert,Indian,Sweet milk dumplings in sugar syrup,"1. Mix milk powder and flour
2. Add ghee and make dough
3. Shape into balls
4. Fry until golden
5. Soak in sugar syrup",12,"Milk Powder,200,g,0.04;Flour,50,g,0.015;Ghee,100,g,0.06;Sugar,300,g,0.02;Cardamom,10,pcs,0.1"
Butter Chicken,Main Course,Indian,Rich and creamy chicken curry,"1. Marinate chicken in spices
2. Cook chicken in tandoor or grill
3. Prepare rich tomato-based sauce
4. Add cream and butter
5. Combine and simmer",4,"Chicken,600,g,0.025;Butter,100,g,0.04;Tomato,300,g,0.015;Cream,200,ml,0.03;Spices,40,g,0.05"
Biryani,Rice Dish,Indian,Layered rice with meat and spices,"1. Marinate meat with spices
2. Par-cook rice
3. Layer rice and meat
4. Add saffron and herbs
5. Dum cook for 30 minutes",8,"Basmati Rice,500,g,0.03;Chicken,400,g,0.025;Onion,200,g,0.01;Saffron,1,pinch,0.5;Spices,60,g,0.05;Ghee,100,g,0.06"
Paneer Tikka,Appetizer,Indian,Grilled cottage cheese,"1. Marinate paneer in spices
2. Thread on skewers
3. Grill until charred
4. Serve with chutney",6,"Paneer,400,g,0.035;Yogurt,100,ml,0.015;Spices,30,g,0.05;Oil,40,ml,0.02"
Samosa,Appetizer,Indian,Fried pastry with filling,"1. Make dough with flour and oil
2. Prepare potato-pea filling
3. Shape into triangles
4. Fry until golden
5. Serve hot",8,"All Purpose Flour,300,g,0.015;Potato,400,g,0.02;Peas,200,g,0.025;Oil,200,ml,0.02;Spices,40,g,0.05"
Kheer,Dessert,Indian,Rice pudding,"1. Cook rice in milk
2. Add sugar and cardamom
3. Cook until thickened
4. Add nuts and saffron
5. Serve chilled",12,"Rice,150,g,0.03;Milk,1000,ml,0.02;Sugar,200,g,0.02;Cardamom,10,pcs,0.1;Nuts,100,g,0.08"
"""
    
    # Write to file
    with open("recipe_import_template.csv", "w", encoding="utf-8") as f:
        f.write(csv_content)
    
    print("Recipe import template created successfully!")
    print("File: recipe_import_template.csv")
    print("\nTemplate includes:")
    print("- 10 sample recipes with proper formatting")
    print("- All required and optional fields")
    print("- Proper ingredients format")
    print("- Instructions with line breaks")
    print("\nYou can use this CSV file to test the import functionality.")
    print("Note: The import feature supports both CSV and Excel files.")

if __name__ == "__main__":
    create_csv_template()