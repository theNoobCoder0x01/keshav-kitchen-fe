"use client";

import { type RecipeDetailData } from "@/components/recipes/recipe-detail-view";
import { RecipePdfTemplate } from "@/components/recipes/recipe-pdf-template";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Eye, Loader2, Printer, FileText } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RecipePrintDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: RecipeDetailData | null;
}

export function RecipePrintDialog({
  isOpen,
  onOpenChange,
  recipe,
}: RecipePrintDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
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
      const response = await fetch("/api/recipes/print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeId: recipe.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `recipe-${recipe.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!recipe) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Printer className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  Print Recipe
                  <Badge variant="outline" className="ml-2 text-xs font-normal">
                    {recipe.name}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Preview, print, or download your recipe as a PDF document.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Preview Toggle */}
            <Card className="bg-muted/30 border border-border">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  {showPreview ? "Preview" : "Show Preview"}
                </CardTitle>
                <Button
                  variant={showPreview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </CardHeader>
              {showPreview && (
                <CardContent className="pt-2">
                  <div className="border rounded-lg p-4 bg-background max-h-[50vh] overflow-y-auto">
                    <RecipePdfTemplate
                      recipe={recipe}
                      isPrintMode={true}
                      ref={printRef}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Hidden print content */}
            <div className="hidden">
              <RecipePdfTemplate
                recipe={recipe}
                isPrintMode={true}
                ref={printRef}
              />
            </div>
          </div>

          <Separator className="my-2" />

          <DialogFooter className="flex items-center gap-2 flex-wrap pt-4 border-t border-border">
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
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? "Generating..." : "Download PDF"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
