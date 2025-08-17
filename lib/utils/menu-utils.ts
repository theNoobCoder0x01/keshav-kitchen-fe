import { MenuIngredient, GroupedMenuIngredients, MenuIngredientGroup } from "@/types/menus";

/**
 * Groups menu ingredients by their group, with ungrouped ingredients in a special "Ungrouped" section
 */
export function groupMenuIngredientsByGroup(
  ingredients: MenuIngredient[],
  ingredientGroups?: MenuIngredientGroup[]
): GroupedMenuIngredients {
  const grouped: GroupedMenuIngredients = {};
  
  // Create a map of group IDs to group info for quick lookup
  const groupMap = new Map<string, { name: string; sortOrder: number }>();
  
  ingredientGroups?.forEach(group => {
    groupMap.set(group.id, { name: group.name, sortOrder: group.sortOrder });
  });

  // Group ingredients
  ingredients.forEach(ingredient => {
    let groupName = "Ungrouped";
    let groupId = null;
    let sortOrder = 999; // Default sort order for ungrouped

    if (ingredient.groupId && groupMap.has(ingredient.groupId)) {
      const group = groupMap.get(ingredient.groupId)!;
      groupName = group.name;
      groupId = ingredient.groupId;
      sortOrder = group.sortOrder;
    }

    if (!grouped[groupName]) {
      grouped[groupName] = {
        groupId,
        sortOrder,
        ingredients: [],
      };
    }

    grouped[groupName].ingredients.push(ingredient);
  });

  // Sort ingredients within each group by name
  Object.values(grouped).forEach(group => {
    group.ingredients.sort((a, b) => a.name.localeCompare(b.name));
  });

  return grouped;
}

/**
 * Gets sorted group names for display (by sortOrder, then alphabetically)
 */
export function getSortedMenuGroupNames(groupedIngredients: GroupedMenuIngredients): string[] {
  return Object.keys(groupedIngredients).sort((a, b) => {
    const groupA = groupedIngredients[a];
    const groupB = groupedIngredients[b];
    
    // Sort by sortOrder first, then by name
    if (groupA.sortOrder !== groupB.sortOrder) {
      return groupA.sortOrder - groupB.sortOrder;
    }
    
    return a.localeCompare(b);
  });
}

/**
 * Calculates total cost for a group of menu ingredients
 */
export function calculateMenuGroupCost(ingredients: MenuIngredient[]): number {
  return ingredients.reduce(
    (sum, ingredient) => sum + (ingredient.costPerUnit || 0) * ingredient.quantity,
    0
  );
}

/**
 * Checks if a menu has any ingredient groups (other than just "Ungrouped")
 */
export function hasCustomMenuGroups(ingredientGroups?: MenuIngredientGroup[]): boolean {
  if (!ingredientGroups || ingredientGroups.length === 0) return false;
  if (ingredientGroups.length === 1 && ingredientGroups[0].name === "Ungrouped") return false;
  return true;
}

/**
 * Creates a default "Ungrouped" group structure for menu ingredients
 */
export function createUngroupedMenuGroup(ingredients: MenuIngredient[]): GroupedMenuIngredients {
  return {
    "Ungrouped": {
      groupId: null,
      sortOrder: 999,
      ingredients,
    },
  };
}

/**
 * Calculates total quantity for a group of menu ingredients
 */
export function calculateMenuGroupQuantity(ingredients: MenuIngredient[]): number {
  return ingredients.reduce(
    (sum, ingredient) => sum + ingredient.quantity,
    0
  );
}

/**
 * Gets the most common unit for a group of ingredients
 */
export function getMostCommonUnit(ingredients: MenuIngredient[]): string {
  if (ingredients.length === 0) return '';
  
  const unitCounts: { [key: string]: number } = {};
  ingredients.forEach(ingredient => {
    unitCounts[ingredient.unit] = (unitCounts[ingredient.unit] || 0) + 1;
  });
  
  return Object.entries(unitCounts).reduce((a, b) => 
    unitCounts[a[0]] > unitCounts[b[0]] ? a : b
  )[0];
}