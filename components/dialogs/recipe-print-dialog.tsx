"use client";

import { RecipePdfTemplate } from "@/components/recipes/recipe-pdf-template";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/hooks/use-translations";
import api from "@/lib/api/axios";
import { type RecipeDetailData } from "@/types";
import { Download, Eye, FileText, Loader2, Printer } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

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
  const { t } = useTranslations();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true); // Changed to true to keep preview open by default
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${t("recipes.printRecipe")}: ${recipe?.name}</title>
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
      const response = await api.post(
        "/api/recipes/print",
        {
          recipeId: recipe.id,
        },
        {
          responseType: "blob",
        }
      );

      if (!response.status.toString().startsWith("2")) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `recipe-${recipe.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t("messages.pdfDownloadedSuccess"));
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(t("messages.pdfGenerationError"));
    } finally {
      setIsGenerating(false);
    }
  };

  if (!recipe) return null;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title={`${t("recipes.printRecipe")}: ${recipe.name}`}
      description={t("recipes.printRecipeDescription")}
      icon={<FileText className="w-5 h-5 text-primary-foreground" />}
      size="4xl"
      footer={
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            {t("recipes.print")}
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
            {isGenerating ? t("recipes.generating") : t("recipes.downloadPdf")}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Preview Toggle */}
        <Card className="bg-muted/30 border border-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              {showPreview ? t("recipes.preview") : t("recipes.showPreview")}
            </CardTitle>
            <Button
              variant={showPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4 mr-1" />
              {showPreview
                ? t("recipes.hidePreview")
                : t("recipes.showPreview")}
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
    </BaseDialog>
  );
}
