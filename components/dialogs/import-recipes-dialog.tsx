"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/hooks/use-translations";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ImportRecipesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export function ImportRecipesDialog({
  isOpen,
  onOpenChange,
  onImportSuccess,
}: ImportRecipesDialogProps) {
  const { t } = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    imported: number;
    total: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error(t("messages.invalidFileType"), {
          description: t("messages.invalidFileTypeDescription"),
        });
        return;
      }

      setFile(selectedFile);
      setUploadProgress(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error(t("messages.pleaseSelectFile"));
      return;
    }

    setIsUploading(true);
    setUploadProgress(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/recipes/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors && Array.isArray(result.errors)) {
          setUploadProgress({
            imported: result.validRecipes || 0,
            total: result.validRecipes || 0,
            errors: result.errors,
          });
          toast.error(t("messages.importCompletedWithErrors"), {
            description: t("messages.importCompletedWithErrorsDescription", {
              count: result.validRecipes || 0,
              errorCount: result.errors.length,
            }),
          });
        } else {
          toast.error(t("messages.importFailed"), {
            description: result.error || t("messages.failedToImportRecipes"),
          });
        }
        return;
      }

      setUploadProgress({
        imported: result.importedCount,
        total: result.totalRecipes,
        errors: result.errors || [],
      });

      toast.success(t("messages.importSuccessful"), {
        description: t("messages.importSuccessfulDescription", {
          count: result.importedCount,
        }),
      });

      // Reset form
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Call success callback to refresh recipes
      onImportSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("messages.uploadFailed"), {
        description: t("messages.uploadFailedDescription"),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create a sample Excel template
    const templateData = [
      [
        t("recipes.template.recipeName"),
        t("recipes.template.category"),
        t("recipes.template.subcategory"),
        t("recipes.template.description"),
        t("recipes.template.instructions"),
        t("recipes.template.servings"),
        t("recipes.template.ingredients"),
        t("recipes.template.quantities"),
        t("recipes.template.units"),
        t("recipes.template.costPerUnit"),
      ],
      [
        "Butter Potato",
        "Main Course",
        "Indian",
        "Creamy and flavorful Indian curry",
        "1. Marinate potato in spices\n2. Cook in tomato-based gravy\n3. Add cream and butter",
        "4",
        "Potato,Tomato,Peas,Cheese,Ginger,Cream,Butter",
        "500,200,100,20,10,100,50",
        "grams,grams,grams,grams,grams,ml,grams",
        "2.5,0.5,0.3,0.1,0.05,1.2,0.8",
      ],
      [
        "Chocolate Cake",
        "Dessert",
        "Baked",
        "Rich and moist chocolate cake",
        "1. Mix dry ingredients\n2. Add wet ingredients\n3. Bake at 180°C for 30 minutes",
        "8",
        "Flour,Sugar,Cocoa,Paneer,Milk,Oil",
        "200,150,50,3,200,100",
        "grams,grams,grams,pieces,ml,ml",
        "0.8,1.2,2.5,0.3,0.6,1.0",
      ],
    ];

    // Convert to CSV format
    const csvContent = templateData
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipe_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(t("messages.templateDownloaded"), {
      description: t("messages.templateDownloadedDescription"),
    });
  };

  const handleClose = () => {
    setFile(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={handleClose}
      title={t("recipes.importRecipesFromExcel")}
      description={t("recipes.importRecipesDescription")}
      icon={<FileSpreadsheet className="w-5 h-5 text-primary-foreground" />}
      size="4xl"
      footer={
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t("recipes.downloadTemplate")}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t("recipes.importing")}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {t("recipes.importRecipes")}
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="file-upload">
              {t("recipes.selectExcelCsvFile")}
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t("recipes.downloadTemplate")}
            </Button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!file ? (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">
                    {t("recipes.clickToSelectOrDragDrop")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("recipes.supportsFileTypes")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t("recipes.chooseFile")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
                <div>
                  <p className="font-medium text-green-700">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  {t("recipes.changeFile")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  {t("recipes.importCompleted", {
                    imported: uploadProgress.imported,
                    total: uploadProgress.total,
                  })}
                </p>
                {uploadProgress.errors.length > 0 && (
                  <div>
                    <p className="font-medium text-destructive">
                      {t("recipes.errors")}:
                    </p>
                    <ul className="text-sm text-destructive space-y-1 max-h-32 overflow-y-auto">
                      {uploadProgress.errors.map((error, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <X className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            {t("recipes.requiredFormat")}:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • <strong>{t("recipes.template.recipeName")}:</strong>{" "}
              {t("recipes.template.recipeNameDesc")}
            </li>
            <li>
              • <strong>{t("recipes.template.category")}:</strong>{" "}
              {t("recipes.template.categoryDesc")}
            </li>
            <li>
              • <strong>{t("recipes.template.subcategory")}:</strong>{" "}
              {t("recipes.template.subcategoryDesc")}
            </li>
            <li>
              • <strong>{t("recipes.template.description")}:</strong>{" "}
              {t("recipes.template.descriptionDesc")}
            </li>
            <li>
              • <strong>{t("recipes.template.instructions")}:</strong>{" "}
              {t("recipes.template.instructionsDesc")}
            </li>
            <li>
              • <strong>{t("recipes.template.servings")}:</strong>{" "}
              {t("recipes.template.servingsDesc")}
            </li>
            <li>
              • <strong>{t("recipes.template.ingredients")}:</strong>{" "}
              {t("recipes.template.ingredientsDesc")}
            </li>
            <li>
              • <strong>{t("recipes.template.quantities")}:</strong>{" "}
              {t("recipes.template.quantitiesDesc")}
            </li>
            <li>
              • <strong>{t("recipes.template.units")}:</strong>{" "}
              {t("recipes.template.unitsDesc")}
            </li>
            <li>
              • <strong>{t("recipes.template.costPerUnit")}:</strong>{" "}
              {t("recipes.template.costPerUnitDesc")}
            </li>
          </ul>
        </div>
      </div>
    </BaseDialog>
  );
}
