"use client";

import { Badge } from "@/components/ui/badge";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DateSelector } from "@/components/ui/date-selector";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Combine,
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  Info,
  Loader2,
  ShoppingCart,
  Users,
  Utensils,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ReportsGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReportOption {
  id: string;
  label: string;
  description: string;
  detailedDescription: string;
  icon: React.ElementType;
  checked: boolean;
  category: "meal" | "analysis" | "summary";
}

import type { Kitchen } from "@/types";

interface ReportProgress {
  current: number;
  total: number;
  currentReport: string;
  status: "idle" | "generating" | "success" | "error";
}

export function ReportsGenerationDialog({
  open,
  onOpenChange,
}: ReportsGenerationDialogProps) {
  const { t } = useTranslations();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [combineMealTypes, setCombineMealTypes] = useState(false);
  const [combineKitchens, setCombineKitchens] = useState(false);
  const [generateBothVersions, setGenerateBothVersions] = useState(false);
  const [attachRecipePrints, setAttachRecipePrints] = useState(false);
  const [includeNutritionalInfo, setIncludeNutritionalInfo] = useState(true);
  const [includeCostAnalysis, setIncludeCostAnalysis] = useState(true);
  const [selectedKitchens, setSelectedKitchens] = useState<string[]>([]);
  const [allKitchens, setAllKitchens] = useState<Kitchen[]>([]);
  const [reportProgress, setReportProgress] = useState<ReportProgress>({
    current: 0,
    total: 0,
    currentReport: "",
    status: "idle",
  });

  const [reportTypes, setReportTypes] = useState<ReportOption[]>([
    {
      id: "breakfast",
      label: t("reports.breakfastReport"),
      description: t("reports.breakfastReportDescription"),
      detailedDescription: t("reports.breakfastReportDetailedDescription"),
      icon: Clock,
      checked: true,
      category: "meal",
    },
    {
      id: "lunch",
      label: t("reports.lunchReport"),
      description: t("reports.lunchReportDescription"),
      detailedDescription: t("reports.lunchReportDetailedDescription"),
      icon: Utensils,
      checked: true,
      category: "meal",
    },
    {
      id: "dinner",
      label: t("reports.dinnerReport"),
      description: t("reports.dinnerReportDescription"),
      detailedDescription: t("reports.dinnerReportDetailedDescription"),
      icon: ShoppingCart,
      checked: true,
      category: "meal",
    },
    {
      id: "ingredients",
      label: t("reports.combinedIngredientsReport"),
      description: t("reports.combinedIngredientsReportDescription"),
      detailedDescription: t(
        "reports.combinedIngredientsReportDetailedDescription",
      ),
      icon: BarChart3,
      checked: false,
      category: "analysis",
    },
    {
      id: "summary",
      label: t("reports.executiveSummary"),
      description: t("reports.executiveSummaryDescription"),
      detailedDescription: t("reports.executiveSummaryDetailedDescription"),
      icon: FileText,
      checked: false,
      category: "summary",
    },
  ]);

  const formatOptions = [
    {
      value: "pdf",
      label: t("reports.pdfDocument"),
      description: t("reports.pdfDocumentDescription"),
      icon: FileText,
      detailedDescription: t("reports.pdfDocumentDetailedDescription"),
    },
    {
      value: "xlsx",
      label: t("reports.excelSpreadsheet"),
      description: t("reports.excelSpreadsheetDescription"),
      icon: FileSpreadsheet,
      detailedDescription: t("reports.excelSpreadsheetDetailedDescription"),
    },
    {
      value: "csv",
      label: t("reports.csvFile"),
      description: t("reports.csvFileDescription"),
      icon: FileType,
      detailedDescription: t("reports.csvFileDetailedDescription"),
    },
  ];

  // Load kitchens when dialog opens
  useEffect(() => {
    if (open) {
      loadKitchens();
    }
  }, [open]);

  const loadKitchens = async () => {
    try {
      const response = await fetch("/api/kitchens");
      if (response.ok) {
        const kitchens = await response.json();
        setAllKitchens(kitchens);
        // Select all kitchens by default
        setSelectedKitchens(kitchens.map((k: Kitchen) => k.id));
      }
    } catch (error) {
      console.error("Failed to load kitchens:", error);
      toast.error(t("messages.failedToLoadKitchens"));
    }
  };

  const handleReportTypeChange = (reportId: string, checked: boolean) => {
    setReportTypes((prev) =>
      prev.map((report) =>
        report.id === reportId ? { ...report, checked } : report,
      ),
    );
  };

  const handleKitchenToggle = (kitchenId: string) => {
    setSelectedKitchens((prev) =>
      prev.includes(kitchenId)
        ? prev.filter((id) => id !== kitchenId)
        : [...prev, kitchenId],
    );
  };

  const handleSelectAllKitchens = () => {
    setSelectedKitchens(allKitchens.map((k) => k.id));
  };

  const handleDeselectAllKitchens = () => {
    setSelectedKitchens([]);
  };

  const handleGenerateReport = async () => {
    const selectedReports = reportTypes.filter((report) => report.checked);

    if (selectedReports.length === 0) {
      toast.error(t("reports.pleaseSelectAtLeastOneReportType"));
      return;
    }

    if (selectedKitchens.length === 0) {
      toast.error(t("reports.pleaseSelectAtLeastOneKitchen"));
      return;
    }

    setIsGenerating(true);
    setReportProgress({
      current: 0,
      total: 0,
      currentReport: "",
      status: "generating",
    });

    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const selectedMealTypes = selectedReports
        .filter((r) => ["breakfast", "lunch", "dinner"].includes(r.id))
        .map((r) => r.id);

      // Generate individual reports
      const reports = [];

      if (generateBothVersions || !combineMealTypes || !combineKitchens) {
        // Generate individual reports for each combination
        for (const report of selectedReports) {
          if (report.id === "ingredients" || report.id === "summary") continue; // Handle separately

          if (!combineKitchens) {
            // Generate separate reports for each kitchen
            for (const kitchenId of selectedKitchens) {
              reports.push({
                type: report.id,
                kitchenIds: [kitchenId],
                filename: `${report.id}-${allKitchens.find((k) => k.id === kitchenId)?.name}-${dateStr}`,
              });
            }
          } else {
            // Generate combined kitchen report
            reports.push({
              type: report.id,
              kitchenIds: selectedKitchens,
              filename: `${report.id}-combined-${dateStr}`,
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
              type: "combined-meals",
              kitchenIds: [kitchenId],
              mealTypes: selectedMealTypes,
              filename: `combined-meals-${allKitchens.find((k) => k.id === kitchenId)?.name}-${dateStr}`,
            });
          }
        } else {
          // Generate fully combined report
          reports.push({
            type: "combined-meals",
            kitchenIds: selectedKitchens,
            mealTypes: selectedMealTypes,
            filename: `combined-meals-all-kitchens-${dateStr}`,
          });
        }
      }

      // Generate ingredients report if selected
      if (selectedReports.some((r) => r.id === "ingredients")) {
        reports.push({
          type: "ingredients",
          kitchenIds: selectedKitchens,
          mealTypes: selectedMealTypes,
          filename: `ingredients-combined-${dateStr}`,
        });
      }

      // Generate summary report if selected
      if (selectedReports.some((r) => r.id === "summary")) {
        reports.push({
          type: "summary",
          kitchenIds: selectedKitchens,
          mealTypes: selectedMealTypes,
          filename: `executive-summary-${dateStr}`,
        });
      }

      setReportProgress({
        current: 0,
        total: reports.length,
        currentReport: "",
        status: "generating",
      });

      // Generate all reports
      for (let i = 0; i < reports.length; i++) {
        const reportConfig = reports[i];
        setReportProgress((prev) => ({
          ...prev,
          current: i + 1,
          currentReport: reportConfig.filename,
        }));

        try {
          const params = new URLSearchParams({
            type: reportConfig.type,
            date: dateStr,
            format: selectedFormat,
            kitchenIds: reportConfig.kitchenIds.join(","),
            ...(reportConfig.mealTypes && {
              mealTypes: reportConfig.mealTypes.join(","),
            }),
            combineMealTypes: combineMealTypes.toString(),
            combineKitchens: combineKitchens.toString(),
            attachRecipePrints: attachRecipePrints.toString(),
            includeNutritionalInfo: includeNutritionalInfo.toString(),
            includeCostAnalysis: includeCostAnalysis.toString(),
          });

          const response = await fetch(`/api/reports/generate?${params}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            let errorMessage = `${t("reports.failedToGenerate")} ${reportConfig.filename}`;
            try {
              const errorData = await response.json();
              errorMessage =
                errorData.details || errorData.error || errorMessage;
            } catch {
              errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const blob = await response.blob();

          if (blob.size === 0) {
            throw new Error(
              `${t("reports.emptyFileReceived")} ${reportConfig.filename}`,
            );
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
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (reportError: any) {
          console.error(
            `${t("reports.errorGenerating")} ${reportConfig.filename}:`,
            reportError,
          );
          setReportProgress((prev) => ({ ...prev, status: "error" }));
          throw new Error(`${reportConfig.filename}: ${reportError.message}`);
        }
      }

      setReportProgress((prev) => ({ ...prev, status: "success" }));
      toast.success(
        `${reports.length} ${t("reports.report")}(s) ${t("reports.generatedSuccessfully")}!`,
      );
      onOpenChange(false);
    } catch (error: any) {
      setReportProgress((prev) => ({ ...prev, status: "error" }));
      toast.error(error.message || t("reports.failedToGenerateReports"));
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
  const selectedMealTypes = reportTypes.filter(
    (r) => ["breakfast", "lunch", "dinner"].includes(r.id) && r.checked,
  ).length;

  const getReportCategoryIcon = (category: string) => {
    switch (category) {
      case "meal":
        return <Utensils className="w-4 h-4" />;
      case "analysis":
        return <BarChart3 className="w-4 h-4" />;
      case "summary":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getProgressIcon = () => {
    switch (reportProgress.status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "generating":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <TooltipProvider>
      <BaseDialog
        open={open}
        onOpenChange={handleClose}
        title={t("reports.generateReports")}
        description={t("reports.generateReportsDescription")}
        icon={<Download className="w-5 h-5 text-primary-foreground" />}
        size="6xl"
        footer={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleGenerateReport}
              disabled={
                isGenerating ||
                selectedCount === 0 ||
                selectedKitchens.length === 0
              }
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t("reports.generating")}...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {t("reports.generateAndDownload")}
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Progress Bar */}
          {isGenerating && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {getProgressIcon()}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {t("reports.generatingReports")} ({reportProgress.current}
                      /{reportProgress.total})
                    </p>
                    {reportProgress.currentReport && (
                      <p className="text-xs text-muted-foreground">
                        {t("reports.currentReport")}:{" "}
                        {reportProgress.currentReport}
                      </p>
                    )}
                  </div>
                </div>
                <Progress
                  value={(reportProgress.current / reportProgress.total) * 100}
                  className="h-2"
                />
              </CardContent>
            </Card>
          )}

          {/* Date Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {t("reports.reportDate")}
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {t("reports.selectReportDateDescription")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DateSelector
                date={selectedDate}
                onDateChange={setSelectedDate}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Kitchen Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {t("reports.selectKitchens")}
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {t("reports.chooseKitchensDescription")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllKitchens}
                    disabled={selectedKitchens.length === allKitchens.length}
                  >
                    {t("reports.selectAll")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllKitchens}
                    disabled={selectedKitchens.length === 0}
                  >
                    {t("reports.deselectAll")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allKitchens.map((kitchen) => (
                  <div
                    key={kitchen.id}
                    className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={kitchen.id}
                      checked={selectedKitchens.includes(kitchen.id)}
                      onCheckedChange={() => handleKitchenToggle(kitchen.id)}
                    />
                    <Label
                      htmlFor={kitchen.id}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {kitchen.name}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedKitchens.length > 0 && (
                <Badge className="mt-3 bg-primary text-primary-foreground">
                  {selectedKitchens.length} {t("reports.kitchen")}(s){" "}
                  {t("reports.selected")}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Report Types Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {t("reports.reportTypes")}
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {t("reports.selectReportTypesDescription")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                {selectedCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground">
                    {selectedCount} {t("reports.selected")}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["meal", "analysis", "summary"].map((category) => {
                  const categoryReports = reportTypes.filter(
                    (r) => r.category === category,
                  );
                  if (categoryReports.length === 0) return null;

                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {getReportCategoryIcon(category)}
                        {category.charAt(0).toUpperCase() +
                          category.slice(1)}{" "}
                        {t("reports.reports")}
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {categoryReports.map((report) => (
                          <div
                            key={report.id}
                            className={cn(
                              "p-4 border-2 rounded-lg transition-all cursor-pointer",
                              report.checked
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-muted/50",
                            )}
                            onClick={() =>
                              handleReportTypeChange(report.id, !report.checked)
                            }
                          >
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id={report.id}
                                checked={report.checked}
                                onCheckedChange={(checked) =>
                                  handleReportTypeChange(
                                    report.id,
                                    checked as boolean,
                                  )
                                }
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <report.icon className="w-4 h-4 text-primary" />
                                  <Label
                                    htmlFor={report.id}
                                    className="text-foreground font-medium cursor-pointer"
                                  >
                                    {report.label}
                                  </Label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="w-3 h-3 text-muted-foreground hover:text-primary cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">
                                        {report.detailedDescription}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {report.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                {t("reports.advancedOptions")}
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {t("reports.advancedOptionsDescription")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Combination Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Combine className="w-4 h-4" />
                  {t("reports.combinationOptions")}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="combine-meals"
                          className="text-sm font-medium"
                        >
                          {t("reports.combineMealTypes")}
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground hover:text-primary cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              {t("reports.combineMealTypesDescription")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("reports.aggregateIngredientsFromSelectedMealTypes")}
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
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="combine-kitchens"
                          className="text-sm font-medium"
                        >
                          {t("reports.combineKitchens")}
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground hover:text-primary cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              {t("reports.combineKitchensDescription")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "reports.aggregateIngredientsFromAllSelectedKitchens",
                        )}
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
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="both-versions"
                          className="text-sm font-medium"
                        >
                          {t("reports.generateBothVersions")}
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground hover:text-primary cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              {t("reports.generateBothVersionsDescription")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("reports.createBothCombinedAndSeparateReports")}
                      </p>
                    </div>
                    <Switch
                      id="both-versions"
                      checked={generateBothVersions}
                      onCheckedChange={setGenerateBothVersions}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Content Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  {t("reports.contentOptions")}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="attach-recipes"
                          className="text-sm font-medium"
                        >
                          {t("reports.attachRecipePrints")}
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground hover:text-primary cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              {t("reports.attachRecipePrintsDescription")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "reports.includeDetailedRecipePagesForAllUsedRecipes",
                        )}
                      </p>
                    </div>
                    <Switch
                      id="attach-recipes"
                      checked={attachRecipePrints}
                      onCheckedChange={setAttachRecipePrints}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="nutritional-info"
                          className="text-sm font-medium"
                        >
                          {t("reports.includeNutritionalInfo")}
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground hover:text-primary cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              {t("reports.includeNutritionalInfoDescription")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "reports.includeCaloriesProteinCarbsAndOtherNutrients",
                        )}
                      </p>
                    </div>
                    <Switch
                      id="nutritional-info"
                      checked={includeNutritionalInfo}
                      onCheckedChange={setIncludeNutritionalInfo}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="cost-analysis"
                          className="text-sm font-medium"
                        >
                          {t("reports.includeCostAnalysis")}
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground hover:text-primary cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              {t("reports.includeCostAnalysisDescription")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("reports.includeIngredientCostsAndBudgetAnalysis")}
                      </p>
                    </div>
                    <Switch
                      id="cost-analysis"
                      checked={includeCostAnalysis}
                      onCheckedChange={setIncludeCostAnalysis}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Format Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                {t("reports.exportFormat")}
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {t("reports.chooseFileFormatDescription")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex items-center gap-2">
                        <format.icon className="w-4 h-4" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{format.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {format.description}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Preview Info */}
          {selectedCount > 0 && selectedKitchens.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {t("reports.reportSummary")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    {t("reports.date")}: {selectedDate.toLocaleDateString()}
                  </p>
                  <p>
                    {t("reports.format")}:{" "}
                    {
                      formatOptions.find((f) => f.value === selectedFormat)
                        ?.label
                    }
                  </p>
                  <p>
                    {t("reports.kitchens")}: {selectedKitchens.length}{" "}
                    {t("reports.selected")}
                  </p>
                  <p>
                    {t("reports.reports")}:{" "}
                    {reportTypes
                      .filter((r) => r.checked)
                      .map((r) => r.label)
                      .join(", ")}
                  </p>
                  {(combineMealTypes || combineKitchens) && (
                    <p className="text-primary font-medium">
                      {t("reports.combinationMode")}:{" "}
                      {combineMealTypes ? t("reports.meals") : ""}{" "}
                      {combineMealTypes && combineKitchens ? "+" : ""}{" "}
                      {combineKitchens ? t("reports.kitchens") : ""}
                    </p>
                  )}
                  {attachRecipePrints && (
                    <p className="text-primary font-medium flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {t("reports.recipePrintsWillBeAttached")}
                    </p>
                  )}
                  {includeNutritionalInfo && (
                    <p className="text-primary font-medium flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {t("reports.nutritionalInformationIncluded")}
                    </p>
                  )}
                  {includeCostAnalysis && (
                    <p className="text-primary font-medium flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      {t("reports.costAnalysisIncluded")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </BaseDialog>
    </TooltipProvider>
  );
}
