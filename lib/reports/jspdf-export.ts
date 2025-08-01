import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import { addGujaratiFontSupport, containsGujaratiText, encodeTextForPDF } from "@/lib/fonts/gujarati-font";

interface MenuReportData {
  type: string;
  date: Date;
  totalQuantity?: number;
  totalMeals?: number;
  breakfastCount?: number;
  lunchCount?: number;
  dinnerCount?: number;
  combinedIngredients?: Array<{
    name: string;
    totalQuantity: number;
    unit: string;
    totalCost: number;
    sources: Array<{
      kitchen: string;
      mealType: string;
      recipe: string;
      quantity: number;
      servings: number;
    }>;
  }>;
  summary?: {
    totalIngredients: number;
    totalCost: number;
    uniqueIngredients: number;
    mealTypesCombined: boolean;
    kitchensCombined: boolean;
  };
  selectedMealTypes?: string[];
  combineKitchens?: boolean;
  combineMealTypes?: boolean;
  menus: Array<{
    id: string;
    date: Date;
    mealType: string;
    servings: number;
    ghanFactor: number;
    status: string;
    actualCount?: number;
    notes?: string;
    kitchen: {
      name: string;
    };
    recipe: {
      name: string;
      description?: string;
      ingredients?: Array<{
        ingredient: {
          name: string;
          unit: string;
        };
        quantity: number;
      }>;
    };
  }>;
}

// Helper function to safely add text with Unicode support
function addUnicodeText(doc: jsPDF, text: string, x: number, y: number, options?: any) {
  try {
    const encodedText = encodeTextForPDF(text);
    
    // Check if text contains Gujarati characters
    if (containsGujaratiText(text)) {
      console.log('Gujarati text detected:', text);
      // Ensure Gujarati font support is enabled
      addGujaratiFontSupport(doc);
    }
    
    doc.text(encodedText, x, y, options);
  } catch (error) {
    console.warn('Unicode text rendering failed, using fallback:', error);
    // Fallback to original text
    doc.text(text, x, y, options);
  }
}

// Helper function to prepare table data with Unicode support
function prepareTableData(data: any[][]): string[][] {
  return data.map(row => 
    row.map(cell => {
      if (typeof cell === 'string') {
        return encodeTextForPDF(cell);
      }
      return String(cell);
    })
  );
}

export function createMenuReportPDFWithJsPDF(
  data: MenuReportData,
  type: string,
  date: string,
): Buffer {
  console.log("Creating PDF with jsPDF for type:", type, "date:", date);
  
  // Create new PDF document with Unicode support
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true,
  });

  // Add Gujarati font support
  addGujaratiFontSupport(doc);

  // Set document properties with Unicode support
  doc.setProperties({
    title: encodeTextForPDF(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`),
    subject: encodeTextForPDF('Kitchen Report'),
    author: encodeTextForPDF('Keshav Kitchen'),
    creator: encodeTextForPDF('Keshav Kitchen System')
  });

  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  let title: string;
  
  if (type === 'ingredients') {
    title = 'Combined Ingredients Report';
  } else if (type === 'combined-meals') {
    title = 'Combined Meal Types Report';
  } else {
    title = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
  }
  
  const titleWidth = doc.getTextWidth(title);
  const pageWidth = doc.internal.pageSize.getWidth();
  addUnicodeText(doc, title, (pageWidth - titleWidth) / 2, 20);

  // Add date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date(date).toLocaleDateString();
  const dateText = `Date: ${dateStr}`;
  const dateWidth = doc.getTextWidth(dateText);
  addUnicodeText(doc, dateText, (pageWidth - dateWidth) / 2, 30);

  let yPosition = 45;

  // Handle different report types
  if (type === 'ingredients') {
    // Combined Ingredients Report
    if (data.summary) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      addUnicodeText(doc, 'Ingredients Summary', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      addUnicodeText(doc, `Total Ingredients: ${data.summary.totalIngredients}`, 20, yPosition);
      yPosition += 6;
      addUnicodeText(doc, `Unique Ingredients: ${data.summary.uniqueIngredients}`, 20, yPosition);
      yPosition += 6;
      addUnicodeText(doc, `Total Cost: ₹${data.summary.totalCost.toFixed(2)}`, 20, yPosition);
      yPosition += 6;
      
      if (data.selectedMealTypes && data.selectedMealTypes.length > 0) {
        addUnicodeText(doc, `Meal Types: ${data.selectedMealTypes.join(', ')}`, 20, yPosition);
        yPosition += 6;
      }
      
      if (data.summary.mealTypesCombined) {
        addUnicodeText(doc, '✓ Meal types combined', 20, yPosition);
        yPosition += 6;
      }
      
      if (data.summary.kitchensCombined) {
        addUnicodeText(doc, '✓ Kitchens combined', 20, yPosition);
        yPosition += 6;
      }
      
      yPosition += 10;
    }

    // Combined Ingredients Table
    if (data.combinedIngredients && data.combinedIngredients.length > 0) {
      const tableData = data.combinedIngredients.map(ingredient => [
        ingredient.name,
        ingredient.totalQuantity.toFixed(2),
        ingredient.unit,
        `₹${ingredient.totalCost.toFixed(2)}`,
        ingredient.sources.length.toString(),
        ingredient.sources.map(s => `${s.kitchen} - ${s.mealType}`).join(', ')
      ]);

      // Prepare data with Unicode support
      const unicodeTableData = prepareTableData(tableData);
      const unicodeHeaders = prepareTableData([['Ingredient', 'Total Qty', 'Unit', 'Cost', 'Sources', 'Details']]);

      autoTable(doc, {
        head: unicodeHeaders,
        body: unicodeTableData,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          font: 'helvetica',
        },
        headStyles: {
          fillColor: [103, 74, 245],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          5: { cellWidth: 'wrap' } // Make details column wrap
        }
      });
    } else {
      addUnicodeText(doc, 'No ingredients found for the selected criteria', 20, yPosition);
    }

  } else if (type === 'combined-meals') {
    // Combined Meal Types Report
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    addUnicodeText(doc, 'Combined Meals Summary', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    addUnicodeText(doc, `Total Meals: ${data.totalMeals || 0}`, 20, yPosition);
    yPosition += 6;
    addUnicodeText(doc, `Total Servings: ${data.totalQuantity || 0}`, 20, yPosition);
    yPosition += 6;
    addUnicodeText(doc, `Breakfast Count: ${data.breakfastCount || 0}`, 20, yPosition);
    yPosition += 6;
    addUnicodeText(doc, `Lunch Count: ${data.lunchCount || 0}`, 20, yPosition);
    yPosition += 6;
    addUnicodeText(doc, `Dinner Count: ${data.dinnerCount || 0}`, 20, yPosition);
    yPosition += 6;
    
    if (data.selectedMealTypes && data.selectedMealTypes.length > 0) {
      addUnicodeText(doc, `Selected Meal Types: ${data.selectedMealTypes.join(', ')}`, 20, yPosition);
      yPosition += 6;
    }
    
    yPosition += 10;

    // Combined Ingredients Section
    if (data.combinedIngredients && data.combinedIngredients.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      addUnicodeText(doc, 'Combined Ingredients', 20, yPosition);
      yPosition += 10;

      const ingredientsTableData = data.combinedIngredients.map(ingredient => [
        ingredient.name,
        ingredient.totalQuantity.toFixed(2),
        ingredient.unit,
        `₹${ingredient.totalCost.toFixed(2)}`,
        ingredient.sources.length.toString()
      ]);

      // Prepare data with Unicode support
      const unicodeIngredientsData = prepareTableData(ingredientsTableData);
      const unicodeIngredientsHeaders = prepareTableData([['Ingredient', 'Total Quantity', 'Unit', 'Total Cost', 'Sources']]);

      autoTable(doc, {
        head: unicodeIngredientsHeaders,
        body: unicodeIngredientsData,
        startY: yPosition,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          font: 'helvetica',
        },
        headStyles: {
          fillColor: [103, 74, 245],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { left: 20, right: 20 }
      });
      
      // Get current Y position after table
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Detailed Menus Table
    if (data.menus && data.menus.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      addUnicodeText(doc, 'Detailed Menu Items', 20, yPosition);
      yPosition += 10;

      const tableData = data.menus.map(menu => [
        menu.kitchen?.name || 'N/A',
        menu.recipe?.name || 'N/A',
        menu.mealType || 'N/A',
        (menu.servings || 0).toString(),
        menu.status || 'N/A',
        menu.notes || ''
      ]);

      // Prepare data with Unicode support
      const unicodeMenuData = prepareTableData(tableData);
      const unicodeMenuHeaders = prepareTableData([['Kitchen', 'Recipe', 'Meal Type', 'Servings', 'Status', 'Notes']]);

      autoTable(doc, {
        head: unicodeMenuHeaders,
        body: unicodeMenuData,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          font: 'helvetica',
        },
        headStyles: {
          fillColor: [103, 74, 245],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { left: 20, right: 20 }
      });
    }

  } else if (type === 'summary') {
    // Summary section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    addUnicodeText(doc, 'Daily Summary', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    addUnicodeText(doc, `Total Meals: ${data.totalMeals || 0}`, 20, yPosition);
    yPosition += 6;
    addUnicodeText(doc, `Breakfast Count: ${data.breakfastCount || 0}`, 20, yPosition);
    yPosition += 6;
    addUnicodeText(doc, `Lunch Count: ${data.lunchCount || 0}`, 20, yPosition);
    yPosition += 6;
    addUnicodeText(doc, `Dinner Count: ${data.dinnerCount || 0}`, 20, yPosition);
    yPosition += 15;

    // Create table data for summary
    const tableData = data.menus && data.menus.length > 0 
      ? data.menus.map(menu => [
          menu.kitchen?.name || 'N/A',
          menu.recipe?.name || 'N/A',
          menu.mealType || 'N/A',
          (menu.servings || 0).toString(),
          menu.status || 'N/A',
          menu.notes || ''
        ])
      : [['No data available for this date', '', '', '', '', '']];

    // Prepare data with Unicode support
    const unicodeSummaryData = prepareTableData(tableData);
    const unicodeSummaryHeaders = prepareTableData([['Kitchen', 'Recipe', 'Meal Type', 'Servings', 'Status', 'Notes']]);

    autoTable(doc, {
      head: unicodeSummaryHeaders,
      body: unicodeSummaryData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [103, 74, 245],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 20, right: 20 }
    });

  } else {
    // Meal-specific report
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    addUnicodeText(doc, `Total Servings: ${data.totalQuantity || 0}`, 20, yPosition);
    yPosition += 15;

    // Create table data for meal-specific report
    const tableData = data.menus && data.menus.length > 0 
      ? data.menus.map(menu => [
          menu.kitchen?.name || 'N/A',
          menu.recipe?.name || 'N/A',
          (menu.servings || 0).toString(),
          (menu.ghanFactor || 1.0).toString(),
          menu.status || 'N/A'
        ])
      : [['No data available for this date', '', '', '', '']];

    // Prepare data with Unicode support
    const unicodeMealData = prepareTableData(tableData);
    const unicodeMealHeaders = prepareTableData([['Kitchen', 'Recipe', 'Servings', 'Ghan Factor', 'Status']]);

    autoTable(doc, {
      head: unicodeMealHeaders,
      body: unicodeMealData,
      startY: yPosition,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [103, 74, 245],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 20, right: 20 }
    });
  }

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const footerText = `Page ${i} of ${pageCount}`;
    const footerWidth = doc.getTextWidth(footerText);
    addUnicodeText(doc, footerText, (pageWidth - footerWidth) / 2, doc.internal.pageSize.getHeight() - 10);
  }

  // Convert to buffer
  const pdfData = doc.output('arraybuffer');
  console.log("jsPDF generation completed, buffer size:", pdfData.byteLength);
  
  return Buffer.from(pdfData);
}