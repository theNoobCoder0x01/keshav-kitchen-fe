"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Download, FileText, Calendar, Users } from "lucide-react";
import { useState } from "react";
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

export function ReportsGenerationDialog({
  open,
  onOpenChange,
}: ReportsGenerationDialogProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportTypes, setReportTypes] = useState<ReportOption[]>([
    {
      id: "breakfast",
      label: "Breakfast Report",
      description: "Menu items and quantities for breakfast",
      icon: Users,
      checked: true,
    },
    {
      id: "lunch",
      label: "Lunch Report",
      description: "Menu items and quantities for lunch",
      icon: Users,
      checked: true,
    },
    {
      id: "dinner",
      label: "Dinner Report",
      description: "Menu items and quantities for dinner",
      icon: Users,
      checked: true,
    },
    {
      id: "summary",
      label: "Daily Summary",
      description: "Complete daily statistics and overview",
      icon: FileText,
      checked: false,
    },
  ]);

  const formatOptions = [
    { value: "pdf", label: "PDF Document", description: "Formatted printable report" },
    { value: "xlsx", label: "Excel Spreadsheet", description: "Editable data format" },
    { value: "csv", label: "CSV File", description: "Raw data for analysis" },
  ];

  const handleReportTypeChange = (reportId: string, checked: boolean) => {
    setReportTypes((prev) =>
      prev.map((report) =>
        report.id === reportId ? { ...report, checked } : report
      )
    );
  };

  const handleGenerateReport = async () => {
    const selectedReports = reportTypes.filter((report) => report.checked);
    
    if (selectedReports.length === 0) {
      toast.error("Please select at least one report type");
      return;
    }

    setIsGenerating(true);
    
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      
      // Generate reports for each selected type
      for (const report of selectedReports) {
        try {
          const response = await fetch(
            `/api/reports/generate?type=${report.id}&date=${dateStr}&format=${selectedFormat}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          
          if (!response.ok) {
            // Try to get error details from response
            let errorMessage = `Failed to generate ${report.label}`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.details || errorData.error || errorMessage;
            } catch {
              // If response is not JSON, use status text
              errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }
          
          const blob = await response.blob();
          
          // Check if the blob is actually a PDF/Excel/CSV and not an error page
          if (blob.size === 0) {
            throw new Error(`Empty file received for ${report.label}`);
          }
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${report.id}-report-${dateStr}.${selectedFormat}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          
          // Add a small delay between downloads to prevent browser blocking
          if (selectedReports.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (reportError: any) {
          console.error(`Error generating ${report.label}:`, reportError);
          throw new Error(`${report.label}: ${reportError.message}`);
        }
      }
      
      toast.success(`${selectedReports.length} report(s) generated successfully!`);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-[#dbdade]">
        <DialogHeader className="pb-4 border-b border-[#dbdade]">
          <DialogTitle className="text-xl font-semibold text-[#4b465c] flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#674af5] to-[#856ef7] rounded-lg flex items-center justify-center">
              <Download className="w-4 h-4 text-white" />
            </div>
            Generate Reports
          </DialogTitle>
          <p className="text-sm text-[#4b465c]/70 mt-2">
            Create and download detailed reports for your kitchen operations
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
          {selectedCount > 0 && (
            <div className="bg-[#674af5]/5 border border-[#674af5]/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#674af5]" />
                <span className="font-medium text-[#4b465c]">Report Summary</span>
              </div>
              <div className="text-sm text-[#4b465c]/70 space-y-1">
                <p>Date: {selectedDate.toLocaleDateString()}</p>
                <p>Format: {formatOptions.find(f => f.value === selectedFormat)?.label}</p>
                <p>Reports: {reportTypes.filter(r => r.checked).map(r => r.label).join(", ")}</p>
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
            disabled={isGenerating || selectedCount === 0}
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