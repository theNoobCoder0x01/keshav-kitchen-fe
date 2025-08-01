"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, AlertCircle, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

interface ImportRecipesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export function ImportRecipesDialog({ isOpen, onOpenChange, onImportSuccess }: ImportRecipesDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [importResults, setImportResults] = useState<{
    success: boolean;
    message: string;
    importedCount: number;
    errors?: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error("Invalid file type. Please select an Excel file (.xlsx or .xls)");
        return;
      }
      setFile(selectedFile);
      setErrors([]);
      setImportResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    setIsUploading(true);
    setErrors([]);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/recipes/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportResults(result);
        toast.success(result.message);
        onImportSuccess();
        // Reset form after successful import
        setTimeout(() => {
          setFile(null);
          setImportResults(null);
          onOpenChange(false);
        }, 2000);
      } else {
        if (result.details) {
          setErrors(result.details);
        } else {
          setErrors([result.error || "Failed to import recipes"]);
        }
        toast.error(result.error || "Failed to import recipes");
      }
    } catch (error) {
      console.error("Import error:", error);
      setErrors(["Network error. Please try again."]);
      toast.error("Network error. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample Excel template
    const templateData = [
      ["Recipe Name", "Category", "Subcategory", "Description", "Instructions", "Servings", "Ingredients"],
      ["Chicken Curry", "Main Course", "Indian", "A delicious chicken curry", "1. Marinate chicken\n2. Cook with spices", "4", "Chicken,500,g,0.02;Onion,100,g,0.01;Spices,50,g,0.05"],
      ["Rice Pilaf", "Side Dish", "Indian", "Fragrant rice dish", "1. Wash rice\n2. Cook with spices", "6", "Rice,300,g,0.03;Spices,20,g,0.05;Oil,30,ml,0.02"],
    ];

    // Create CSV content
    const csvContent = templateData.map(row => row.join(",")).join("\n");
    
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
  };

  const handleClose = () => {
    setFile(null);
    setErrors([]);
    setImportResults(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Recipes from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file to import multiple recipes at once. 
            Make sure your file follows the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-medium text-blue-900">Download Template</h4>
              <p className="text-sm text-blue-700">
                Download our template to see the correct format for importing recipes.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="bg-blue-100 hover:bg-blue-200 border-blue-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Select Excel File</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {file && (
              <p className="text-sm text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                {file.name} selected
              </p>
            )}
          </div>

          {/* Format Instructions */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Required Format:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Column A:</strong> Recipe Name (required)</p>
              <p><strong>Column B:</strong> Category (required)</p>
              <p><strong>Column C:</strong> Subcategory (required)</p>
              <p><strong>Column D:</strong> Description (optional)</p>
              <p><strong>Column E:</strong> Instructions (optional)</p>
              <p><strong>Column F:</strong> Servings (optional)</p>
              <p><strong>Column G:</strong> Ingredients (optional)</p>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <p><strong>Ingredients format:</strong> "Name,Quantity,Unit,CostPerUnit;Name2,Quantity2,Unit2,CostPerUnit2"</p>
              <p><strong>Example:</strong> "Chicken,500,g,0.02;Onion,100,g,0.01"</p>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm">{error}</p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Import Results */}
          {importResults && (
            <Alert className={importResults.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-medium">{importResults.message}</p>
                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Some errors occurred:</p>
                    <ul className="text-sm mt-1 space-y-1">
                      {importResults.errors.map((error, index) => (
                        <li key={index} className="text-red-700">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || isUploading}
            className="bg-gradient-to-r from-[#674af5] to-[#856ef7] hover:from-[#674af5]/90 hover:to-[#856ef7]/90"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Recipes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}