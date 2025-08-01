"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecipeDetailView, type RecipeDetailData } from "@/components/recipes/recipe-detail-view";
import { Download, Eye, Loader2, Printer } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface RecipePrintDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: RecipeDetailData | null;
}

export function RecipePrintDialog({ isOpen, onOpenChange, recipe }: RecipePrintDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Recipe: ${recipe?.name}</title>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .space-y-6 > * + * { margin-top: 1.5rem; }
                .space-y-4 > * + * { margin-top: 1rem; }
                .space-y-3 > * + * { margin-top: 0.75rem; }
                .grid { display: grid; gap: 1rem; }
                .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
                .flex { display: flex; }
                .items-center { align-items: center; }
                .justify-center { justify-content: center; }
                .justify-between { justify-content: space-between; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .font-semibold { font-weight: 600; }
                .font-medium { font-weight: 500; }
                .text-3xl { font-size: 1.875rem; }
                .text-xl { font-size: 1.25rem; }
                .text-lg { font-size: 1.125rem; }
                .text-sm { font-size: 0.875rem; }
                .rounded-lg { border-radius: 0.5rem; }
                .rounded-full { border-radius: 9999px; }
                .p-3 { padding: 0.75rem; }
                .p-4 { padding: 1rem; }
                .pt-6 { padding-top: 1.5rem; }
                .mb-2 { margin-bottom: 0.5rem; }
                .mb-4 { margin-bottom: 1rem; }
                .mt-8 { margin-top: 2rem; }
                .w-8 { width: 2rem; }
                .h-8 { height: 2rem; }
                .w-12 { width: 3rem; }
                .h-12 { height: 3rem; }
                .border { border: 1px solid #e5e7eb; }
                .border-t { border-top: 1px solid #e5e7eb; }
                .bg-gray-50 { background-color: #f9fafb; }
                .bg-blue-100 { background-color: #dbeafe; }
                .bg-green-100 { background-color: #dcfce7; }
                .bg-purple-100 { background-color: #f3e8ff; }
                .bg-orange-100 { background-color: #fed7aa; }
                .bg-blue-600 { background-color: #2563eb; }
                .text-white { color: white; }
                .text-gray-500 { color: #6b7280; }
                .text-gray-600 { color: #4b5563; }
                .text-gray-700 { color: #374151; }
                .text-gray-900 { color: #111827; }
                .text-green-600 { color: #059669; }
                .card {
                  background: white;
                  border: 1px solid #e5e7eb;
                  border-radius: 0.5rem;
                  padding: 1.5rem;
                  margin-bottom: 1rem;
                }
                .badge {
                  display: inline-flex;
                  align-items: center;
                  border-radius: 9999px;
                  padding: 0.25rem 0.75rem;
                  font-size: 0.75rem;
                  font-weight: 500;
                  background-color: #f3f4f6;
                  color: #374151;
                  margin: 0.25rem;
                }
                @media print {
                  body { margin: 0; padding: 1rem; }
                  .no-print { display: none !important; }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!recipe) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/recipes/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeId: recipe.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recipe-${recipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!recipe) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Print Recipe: {recipe.name}
          </DialogTitle>
          <DialogDescription>
            Preview and print your recipe, or download it as a PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={showPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="border rounded-lg p-4 bg-gray-50 max-h-[60vh] overflow-y-auto">
              <RecipeDetailView recipe={recipe} isPrintMode={true} ref={printRef} />
            </div>
          )}

          {/* Hidden print content */}
          <div className="hidden">
            <RecipeDetailView recipe={recipe} isPrintMode={true} ref={printRef} />
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>

          <Button 
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="bg-gradient-to-r from-[#674af5] to-[#856ef7] hover:from-[#674af5]/90 hover:to-[#856ef7]/90"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? "Generating..." : "Download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}