"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
        toast.error("Invalid file type", {
          description: "Please select an Excel file (.xlsx, .xls) or CSV file.",
        });
        return;
      }

      setFile(selectedFile);
      setUploadProgress(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
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
          toast.error("Import completed with errors", {
            description: `Imported ${result.validRecipes || 0} recipes with ${result.errors.length} errors.`,
          });
        } else {
          toast.error("Import failed", {
            description: result.error || "Failed to import recipes",
          });
        }
        return;
      }

      setUploadProgress({
        imported: result.importedCount,
        total: result.totalRecipes,
        errors: result.errors || [],
      });

      toast.success("Import successful", {
        description: `Successfully imported ${result.importedCount} recipes.`,
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
      toast.error("Upload failed", {
        description: "An error occurred while uploading the file.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create a sample Excel template
    const templateData = [
      [
        "Recipe Name",
        "Category",
        "Subcategory",
        "Description (optional)",
        "Instructions (optional)",
        "Servings (optional)",
        "Ingredients (comma-separated)",
        "Quantities (comma-separated)",
        "Units (comma-separated)",
        "Cost Per Unit (comma-separated, optional)",
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

    toast.success("Template downloaded", {
      description: "Recipe import template has been downloaded.",
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <div className="overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Import Recipes from Excel
            </DialogTitle>
            <DialogDescription>
              Upload an Excel or CSV file to import multiple recipes at once.
              Make sure your file follows the required format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="file-upload">Select Excel/CSV File</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template
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
                        Click to select a file or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports .xlsx, .xls, and .csv files
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
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
                      Change File
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
                      Import completed: {uploadProgress.imported} of{" "}
                      {uploadProgress.total} recipes imported successfully.
                    </p>
                    {uploadProgress.errors.length > 0 && (
                      <div>
                        <p className="font-medium text-red-600">Errors:</p>
                        <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
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
                Required Format:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • <strong>Recipe Name:</strong> Name of the recipe (required)
                </li>
                <li>
                  • <strong>Category:</strong> Recipe category (required)
                </li>
                <li>
                  • <strong>Subcategory:</strong> Recipe subcategory (required)
                </li>
                <li>
                  • <strong>Description:</strong> Recipe description (optional)
                </li>
                <li>
                  • <strong>Instructions:</strong> Cooking instructions
                  (optional)
                </li>
                <li>
                  • <strong>Servings:</strong> Number of servings (optional)
                </li>
                <li>
                  • <strong>Ingredients:</strong> Comma-separated ingredient
                  names (required)
                </li>
                <li>
                  • <strong>Quantities:</strong> Comma-separated quantities
                  (required)
                </li>
                <li>
                  • <strong>Units:</strong> Comma-separated units (required)
                </li>
                <li>
                  • <strong>Cost Per Unit:</strong> Comma-separated costs
                  (optional)
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-linear-to-r from-[#674af5] to-[#856ef7] hover:from-[#674af5]/90 hover:to-[#856ef7]/90 text-white"
            >
              {isUploading ? "Importing..." : "Import Recipes"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
