import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { generateReportHTML } from "./pdf-templates";

// Interface matching the report data structure
interface ReportData {
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
        name: string;
        quantity: number;
        unit: string;
        costPerUnit?: number;
      }>;
    };
    ingredients?: Array<{
      name: string;
      quantity: number;
      unit: string;
      costPerUnit: number;
    }>;
  }>;
}

export async function createReportPDFWithPuppeteer(
  data: ReportData,
  type: string,
  date: string
): Promise<Buffer> {
  console.log("Creating PDF with Puppeteer for type:", type, "date:", date);

  let browser;
  try {
    // Generate the HTML using our simplified templates
    const html = generateReportHTML(data, type);

    // Launch puppeteer with optimized settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
    });

    const page = await browser.newPage();
    
    // Set content and wait for it to load
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF with optimized settings
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
      preferCSSPageSize: true,
    });

    console.log("PDF generated successfully, size:", pdf.length);
    return pdf;

  } catch (error) {
    console.error("Error generating PDF with Puppeteer:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Helper function to create a filename based on report type and date
export function generateReportFilename(type: string, date: string): string {
  const cleanType = type.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanDate = date.replace(/[^0-9-]/g, '');
  return `${cleanType}-report-${cleanDate}.pdf`;
}