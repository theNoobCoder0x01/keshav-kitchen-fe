# Enhanced Reports Generation Features

## Overview

The reports generation system has been significantly enhanced to support ingredient combination across meal types and kitchens, providing powerful aggregation capabilities for kitchen operations management.

## New Features

### 1. Kitchen Selection
- **Multi-Kitchen Selection**: Choose specific kitchens to include in reports
- **All Kitchens by Default**: All available kitchens are selected automatically
- **Flexible Filtering**: Generate reports for individual kitchens or combinations

### 2. Meal Type Combination
- **Toggle Option**: "Combine Meal Types" switch
- **Smart Aggregation**: Automatically combines ingredients from breakfast, lunch, and dinner
- **Ingredient Matching**: Matches ingredients by name (case-insensitive)
- **Unit Conversion**: Normalizes units for proper aggregation (kg→g, l→ml, etc.)
- **Scaling Support**: Accounts for servings and ghan factors in calculations

### 3. Kitchen Combination
- **Toggle Option**: "Combine Kitchens" switch
- **Cross-Kitchen Aggregation**: Combines ingredients across multiple kitchen locations
- **Source Tracking**: Maintains visibility of ingredient sources

### 4. Combined Ingredients Report
- **New Report Type**: Dedicated combined ingredients report
- **Detailed Breakdown**: Shows total quantities, costs, and source information
- **Summary Statistics**: Total ingredients, unique ingredients, total cost
- **Source Tracking**: Details which kitchens/meals contributed to each ingredient

### 5. Both Versions Generation
- **Toggle Option**: "Generate Both Versions" switch
- **Comprehensive Output**: Creates both combined and separate reports simultaneously
- **Flexible Analysis**: Allows comparison between combined and individual reports

## Report Types

### 1. Individual Meal Reports (breakfast, lunch, dinner)
- Standard meal-specific reports
- Can be filtered by kitchen
- Shows recipes, servings, and ingredients

### 2. Combined Meals Report
- Aggregates selected meal types
- Shows combined ingredient totals
- Includes detailed menu breakdown
- Respects kitchen combination settings

### 3. Combined Ingredients Report
- Pure ingredient aggregation
- Matches ingredients by name across meals/kitchens
- Provides cost analysis
- Shows source traceability

### 4. Summary Report
- Overview of all meals for the day
- Basic statistics and counts
- Traditional summary format maintained

## Technical Implementation

### Core Components

#### 1. Enhanced UI (`components/dialogs/reports-generation-dialog.tsx`)
- Kitchen selection checkboxes
- Combination option toggles
- Updated report type options
- Real-time preview of selections

#### 2. Ingredient Combiner (`lib/utils/ingredient-combiner.ts`)
- **`combineIngredients()`**: Core aggregation logic
- **`generateIngredientSummary()`**: Summary statistics
- **`formatCombinedIngredientsForExport()`**: Export formatting
- Unit normalization and conversion
- Source tracking and attribution

#### 3. Enhanced API (`app/api/reports/generate/route.ts`)
- Support for new query parameters:
  - `kitchenIds`: Comma-separated kitchen IDs
  - `mealTypes`: Comma-separated meal types
  - `combineMealTypes`: Boolean flag
  - `combineKitchens`: Boolean flag
- Dynamic query building based on parameters
- Enhanced data fetching with ingredient relationships

#### 4. Updated Export Functions
- **PDF Export** (`lib/reports/jspdf-export.ts`): Enhanced layouts for new report types
- **Excel Export** (`lib/reports/menu-export.ts`): Multiple sheets and sections
- **CSV Export**: Structured data with clear sections

### Data Flow

```
User Selection → API Parameters → Database Query → Ingredient Combination → Export Generation
```

1. **User Selection**: UI captures user preferences for kitchens, meal types, and combination options
2. **API Parameters**: Frontend sends structured parameters to the generation endpoint
3. **Database Query**: API builds dynamic Prisma queries with proper joins and filters
4. **Ingredient Combination**: Core logic aggregates ingredients based on settings
5. **Export Generation**: Format-specific functions create PDF, Excel, or CSV outputs

### Ingredient Matching Logic

#### Name-Based Matching
- Case-insensitive comparison
- Trimmed whitespace handling
- Exact name matching (can be enhanced with fuzzy matching)

#### Unit Normalization
- Weight: kg → grams, gram/grams → grams
- Volume: l/liter/litre → ml, milliliter/millilitre → ml
- Count: piece/pieces/pc → pcs
- Custom units preserved as-is

#### Quantity Scaling
```typescript
scaledQuantity = baseQuantity * servings * ghanFactor
```

#### Key Generation
- Combines ingredient name with meal type and/or kitchen ID based on settings
- Ensures proper separation when combination is disabled
- Handles unit conflicts by creating separate entries

## Usage Examples

### Example 1: Basic Ingredient Combination
- Select: Breakfast + Lunch
- Enable: Combine Meal Types
- Result: Single report with combined breakfast and lunch ingredients

### Example 2: Multi-Kitchen Analysis
- Select: All Kitchens, All Meal Types
- Enable: Combine Kitchens + Combine Meal Types
- Result: Complete ingredient aggregation across entire operation

### Example 3: Comparative Analysis
- Select: Multiple options
- Enable: Generate Both Versions
- Result: Both combined and individual reports for comparison

### Example 4: Kitchen-Specific Aggregation
- Select: Kitchen A, Breakfast + Lunch
- Enable: Combine Meal Types only
- Result: Combined meal ingredients for specific kitchen

## Benefits

### 1. Operational Efficiency
- **Purchasing Optimization**: See total ingredient needs across meals
- **Inventory Management**: Better understanding of ingredient consumption
- **Cost Analysis**: Track ingredient costs across operations

### 2. Strategic Planning
- **Menu Optimization**: Identify ingredient overlap opportunities
- **Resource Allocation**: Understand kitchen-specific needs
- **Budget Planning**: Accurate cost projections

### 3. Reporting Flexibility
- **Multiple Perspectives**: Same data, different views
- **Stakeholder Needs**: Different reports for different audiences
- **Historical Analysis**: Consistent data structure for trend analysis

## Future Enhancements

### Potential Improvements
1. **Fuzzy Ingredient Matching**: Handle slight name variations
2. **Advanced Unit Conversions**: More comprehensive unit mappings
3. **Recipe Scaling**: Dynamic recipe quantity adjustments
4. **Seasonal Analysis**: Time-based ingredient tracking
5. **Supplier Integration**: Link ingredients to suppliers and costs
6. **Nutritional Analysis**: Add nutritional information aggregation

### Performance Optimizations
1. **Caching**: Cache frequently requested combinations
2. **Background Processing**: Handle large datasets asynchronously
3. **Incremental Updates**: Update only changed ingredients
4. **Database Indexing**: Optimize queries for large datasets

## Technical Notes

### Database Relationships
- Menus → Recipes → Ingredients
- Menus → Kitchens
- Menus → MenuIngredients (optional override)

### Error Handling
- Graceful handling of missing ingredients
- Unit conversion failures
- Empty result sets
- API timeout scenarios

### Type Safety
- Comprehensive TypeScript interfaces
- Runtime type validation
- Error boundary implementation

This enhanced reporting system provides powerful ingredient aggregation capabilities while maintaining the flexibility to generate traditional individual reports, supporting both operational efficiency and strategic planning needs.