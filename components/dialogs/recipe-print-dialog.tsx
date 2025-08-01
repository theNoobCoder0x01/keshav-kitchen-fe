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
import { RecipePdfTemplate } from "@/components/recipes/recipe-pdf-template";
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
                  font-family: Arial, sans-serif;
                  line-height: 1.5;
                  color: #333;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 20px;
                  background: white;
                }
                @media print {
                  body { 
                    margin: 0; 
                    padding: 15px; 
                  }
                  .no-print { 
                    display: none !important; 
                  }
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
              <RecipePdfTemplate recipe={recipe} isPrintMode={true} ref={printRef} />
            </div>
          )}

          {/* Hidden print content */}
          <div className="hidden">
            <RecipePdfTemplate recipe={recipe} isPrintMode={true} ref={printRef} />
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