"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DateSelector } from "@/components/ui/date-selector";
import { Download, FileText, Calendar, Users, ChefHat, Combine, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ReportsGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReportOption {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  checked: boolean;
}

interface Kitchen {
  id: string;
  name: string;
}

export function ReportsGenerationDialog({
  open,
  onOpenChange,
}: ReportsGenerationDialogProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [combineMealTypes, setCombineMealTypes] = useState(false);
  const [combineKitchens, setCombineKitchens] = useState(false);
  const [generateBothVersions, setGenerateBothVersions] = useState(false);
  const [attachRecipePrints, setAttachRecipePrints] = useState(false);
  const [selectedKitchens, setSelectedKitchens] = useState<string[]>([]);
  const [allKitchens, setAllKitchens] = useState<Kitchen[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportOption[]>([
    {
      id: "breakfast",
      label: "Breakfast Report",
      description: "Menu items and ingredients for breakfast",
      icon: Users,
      checked: true,
    },
    {
      id: "lunch",
      label: "Lunch Report", 
      description: "Menu items and ingredients for lunch",
      icon: Users,
      checked: true,
    },
    {
      id: "dinner",
      label: "Dinner Report",
      description: "Menu items and ingredients for dinner",
      icon: Users,
      checked: true,
    },
    {
      id: "ingredients",
      label: "Combined Ingredients Report",
      description: "Aggregated ingredients across selected meal types and kitchens",
      icon: ChefHat,
      checked: false,
    },
  ]);

  const formatOptions = [
    { value: "pdf", label: "PDF Document", description: "Formatted printable report" },
    { value: "xlsx", label: "Excel Spreadsheet", description: "Editable data format" },
    { value: "csv", label: "CSV File", description: "Raw data for analysis" },
  ];

  // Load kitchens when dialog opens
  useEffect(() => {
    if (open) {
      loadKitchens();
    }
  }, [open]);

  const loadKitchens = async () => {
    try {
      const response = await fetch('/api/kitchens');
      if (response.ok) {
        const kitchens = await response.json();
        setAllKitchens(kitchens);
        // Select all kitchens by default
        setSelectedKitchens(kitchens.map((k: Kitchen) => k.id));
      }
    } catch (error) {
      console.error('Failed to load kitchens:', error);
      toast.error('Failed to load kitchens');
    }
  };

  const handleReportTypeChange = (reportId: string, checked: boolean) => {
    setReportTypes((prev) =>
      prev.map((report) =>
        report.id === reportId ? { ...report, checked } : report
      )
    );
  };

  const handleKitchenToggle = (kitchenId: string) => {
    setSelectedKitchens(prev => 
      prev.includes(kitchenId) 
        ? prev.filter(id => id !== kitchenId)
        : [...prev, kitchenId]
    );
  };

  const handleGenerateReport = async () => {
    const selectedReports = reportTypes.filter((report) => report.checked);
    
    if (selectedReports.length === 0) {
      toast.error("Please select at least one report type");
      return;
    }

    if (selectedKitchens.length === 0) {
      toast.error("Please select at least one kitchen");
      return;
    }

    setIsGenerating(true);
    
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const selectedMealTypes = selectedReports
        .filter(r => ['breakfast', 'lunch', 'dinner'].includes(r.id))
        .map(r => r.id);
      
      // Generate individual reports
      const reports = [];
      
      if (generateBothVersions || !combineMealTypes || !combineKitchens) {
        // Generate individual reports for each combination
        for (const report of selectedReports) {
          if (report.id === 'ingredients') continue; // Handle separately
          
          if (!combineKitchens) {
            // Generate separate reports for each kitchen
            for (const kitchenId of selectedKitchens) {
              reports.push({
                type: report.id,
                kitchenIds: [kitchenId],
                filename: `${report.id}-${allKitchens.find(k => k.id === kitchenId)?.name}-${dateStr}`
              });
            }
          } else {
            // Generate combined kitchen report
            reports.push({
              type: report.id,
              kitchenIds: selectedKitchens,
              filename: `${report.id}-combined-${dateStr}`
            });
          }
        }
      }
      
      // Generate combined meal type reports if enabled
      if (combineMealTypes && selectedMealTypes.length > 1) {
        if (!combineKitchens) {
          // Generate combined meal type reports for each kitchen
          for (const kitchenId of selectedKitchens) {
            reports.push({
              type: 'combined-meals',
              kitchenIds: [kitchenId],
              mealTypes: selectedMealTypes,
              filename: `combined-meals-${allKitchens.find(k => k.id === kitchenId)?.name}-${dateStr}`
            });
          }
        } else {
          // Generate fully combined report
          reports.push({
            type: 'combined-meals',
            kitchenIds: selectedKitchens,
            mealTypes: selectedMealTypes,
            filename: `combined-meals-all-kitchens-${dateStr}`
          });
        }
      }
      
      // Generate ingredients report if selected
      if (selectedReports.some(r => r.id === 'ingredients')) {
        reports.push({
          type: 'ingredients',
          kitchenIds: selectedKitchens,
          mealTypes: selectedMealTypes,
          filename: `ingredients-combined-${dateStr}`
        });
      }
      
      // Generate all reports
      for (const reportConfig of reports) {
        try {
          const params = new URLSearchParams({
            type: reportConfig.type,
            date: dateStr,
            format: selectedFormat,
            kitchenIds: reportConfig.kitchenIds.join(','),
            ...(reportConfig.mealTypes && { mealTypes: reportConfig.mealTypes.join(',') }),
            combineMealTypes: combineMealTypes.toString(),
            combineKitchens: combineKitchens.toString(),
            attachRecipePrints: attachRecipePrints.toString(),
          });
          
          const response = await fetch(`/api/reports/generate?${params}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (!response.ok) {
            let errorMessage = `Failed to generate ${reportConfig.filename}`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.details || errorData.error || errorMessage;
            } catch {
              errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }
          
          const blob = await response.blob();
          
          if (blob.size === 0) {
            throw new Error(`Empty file received for ${reportConfig.filename}`);
          }
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${reportConfig.filename}.${selectedFormat}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          
          // Add a small delay between downloads
          if (reports.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (reportError: any) {
          console.error(`Error generating ${reportConfig.filename}:`, reportError);
          throw new Error(`${reportConfig.filename}: ${reportError.message}`);
        }
      }
      
      toast.success(`${reports.length} report(s) generated successfully!`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate reports");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false);
    }
  };

  const selectedCount = reportTypes.filter((report) => report.checked).length;
  const selectedMealTypes = reportTypes
    .filter(r => ['breakfast', 'lunch', 'dinner'].includes(r.id) && r.checked)
    .length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto border-[#dbdade]">
        <DialogHeader className="pb-4 border-b border-[#dbdade]">
          <DialogTitle className="text-xl font-semibold text-[#4b465c] flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#674af5] to-[#856ef7] rounded-lg flex items-center justify-center">
              <Download className="w-4 h-4 text-white" />
            </div>
            Generate Reports
          </DialogTitle>
          <p className="text-sm text-[#4b465c]/70 mt-2">
            Create and download detailed reports with ingredient combinations for your kitchen operations
          </p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Date Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-[#4b465c] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#674af5]" />
              Report Date
            </Label>
            <div className="bg-[#f8f7fa] border border-[#dbdade] rounded-lg p-4">
              <DateSelector
                date={selectedDate}
                onDateChange={setSelectedDate}
                className="w-full"
              />
            </div>
          </div>

          {/* Kitchen Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-[#4b465c] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#674af5]" />
              Select Kitchens
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-[#f8f7fa] border border-[#dbdade] rounded-lg">
              {allKitchens.map((kitchen) => (
                <div key={kitchen.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={kitchen.id}
                    checked={selectedKitchens.includes(kitchen.id)}
                    onCheckedChange={() => handleKitchenToggle(kitchen.id)}
                  />
                  <Label htmlFor={kitchen.id} className="text-sm cursor-pointer">
                    {kitchen.name}
                  </Label>
                </div>
              ))}
            </div>
            {selectedKitchens.length > 0 && (
              <Badge className="bg-[#674af5] text-white">
                {selectedKitchens.length} kitchen(s) selected
              </Badge>
            )}
          </div>

          {/* Report Types Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium text-[#4b465c] flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Report Types
              </Label>
              {selectedCount > 0 && (
                <Badge className="bg-[#674af5] text-white">
                  {selectedCount} selected
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reportTypes.map((report) => (
                <div
                  key={report.id}
                  className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                    report.checked
                      ? "border-[#674af5] bg-[#674af5]/5"
                      : "border-[#dbdade] hover:border-[#674af5]/50"
                  }`}
                  onClick={() => handleReportTypeChange(report.id, !report.checked)}
                >
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={report.id}
                      checked={report.checked}
                      onCheckedChange={(checked) =>
                        handleReportTypeChange(report.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <report.icon className="w-4 h-4 text-[#674af5]" />
                        <Label
                          htmlFor={report.id}
                          className="text-[#4b465c] font-medium cursor-pointer"
                        >
                          {report.label}
                        </Label>
                      </div>
                      <p className="text-xs text-[#4b465c]/70">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Combination Options */}
          <div className="space-y-4 p-4 bg-[#f8f7fa] border border-[#dbdade] rounded-lg">
            <Label className="text-base font-medium text-[#4b465c] flex items-center gap-2">
              <Combine className="w-4 h-4 text-[#674af5]" />
              Combination Options
            </Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="combine-meals" className="text-sm font-medium">
                    Combine Meal Types
                  </Label>
                  <p className="text-xs text-[#4b465c]/70">
                    Aggregate ingredients from selected meal types (breakfast, lunch, dinner)
                  </p>
                </div>
                <Switch
                  id="combine-meals"
                  checked={combineMealTypes}
                  onCheckedChange={setCombineMealTypes}
                  disabled={selectedMealTypes < 2}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="combine-kitchens" className="text-sm font-medium">
                    Combine Kitchens
                  </Label>
                  <p className="text-xs text-[#4b465c]/70">
                    Aggregate ingredients from all selected kitchens
                  </p>
                </div>
                <Switch
                  id="combine-kitchens"
                  checked={combineKitchens}
                  onCheckedChange={setCombineKitchens}
                  disabled={selectedKitchens.length < 2}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="both-versions" className="text-sm font-medium">
                    Generate Both Versions
                  </Label>
                  <p className="text-xs text-[#4b465c]/70">
                    Create both combined and separate reports
                  </p>
                </div>
                <Switch
                  id="both-versions"
                  checked={generateBothVersions}
                  onCheckedChange={setGenerateBothVersions}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="attach-recipes" className="text-sm font-medium">
                    Attach Recipe Prints
                  </Label>
                  <p className="text-xs text-[#4b465c]/70">
                    Include detailed recipe pages for all used recipes (unique recipes only)
                  </p>
                </div>
                <Switch
                  id="attach-recipes"
                  checked={attachRecipePrints}
                  onCheckedChange={setAttachRecipePrints}
                />
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-[#4b465c]">
              Export Format
            </Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="border-[#dbdade]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{format.label}</span>
                      <span className="text-xs text-[#4b465c]/70">
                        {format.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Info */}
          {selectedCount > 0 && selectedKitchens.length > 0 && (
            <div className="bg-[#674af5]/5 border border-[#674af5]/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#674af5]" />
                <span className="font-medium text-[#4b465c]">Report Summary</span>
              </div>
              <div className="text-sm text-[#4b465c]/70 space-y-1">
                <p>Date: {selectedDate.toLocaleDateString()}</p>
                <p>Format: {formatOptions.find(f => f.value === selectedFormat)?.label}</p>
                <p>Kitchens: {selectedKitchens.length} selected</p>
                <p>Reports: {reportTypes.filter(r => r.checked).map(r => r.label).join(", ")}</p>
                {(combineMealTypes || combineKitchens) && (
                  <p className="text-[#674af5] font-medium">
                    Combination mode: {combineMealTypes ? "Meals" : ""} {combineMealTypes && combineKitchens ? "+" : ""} {combineKitchens ? "Kitchens" : ""}
                  </p>
                )}
                {attachRecipePrints && (
                  <p className="text-[#674af5] font-medium flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Recipe prints will be attached
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-[#dbdade]">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
            className="border-[#dbdade] text-[#4b465c] hover:bg-[#f8f7fa] bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || selectedCount === 0 || selectedKitchens.length === 0}
            className="bg-gradient-to-r from-[#674af5] to-[#856ef7] hover:from-[#674af5]/90 hover:to-[#856ef7]/90 text-white shadow-lg"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate & Download
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}