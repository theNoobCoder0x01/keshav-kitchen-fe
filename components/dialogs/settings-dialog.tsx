"use client";

import { Badge } from "@/components/ui/badge";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "@/hooks/use-translations";
import { LANGUAGE_OPTIONS, useLanguage } from "@/lib/contexts/language-context";
import {
  Calendar,
  CheckCircle,
  FileText,
  Globe,
  Info,
  RefreshCw,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import api from "@/lib/api/axios";
import type { CalendarEventBase as CalendarEvent } from "@/types/calendar";

interface CalendarData {
  events: CalendarEvent[];
  totalCount: number;
  lastUploaded?: string;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { language, updateUserLanguage } = useLanguage();
  const { settings, messages } = useTranslations();

  // Load calendar data on component mount
  useEffect(() => {
    if (open) {
      loadCalendarData();
    }
  }, [open]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(
        "/calendar/events?epochMs=" + new Date().getTime(),
      );
      if (response.status.toString().startsWith("2")) {
        const { data, success } = await response.data;
        if (success && data.events.length > 0) {
          setCalendarData({
            events: data.events,
            totalCount: data.events.length,
            lastUploaded: data.events[0]?.createdAt,
          });
        } else {
          setCalendarData(null);
        }
      } else {
        setCalendarData(null);
      }
    } catch (error) {
      console.error("Error loading calendar data:", error);
      setCalendarData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".ics")) {
      toast.error(messages("invalidFileType"));
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error(messages("fileSizeTooLarge"));
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.postForm("/calendar/upload", formData);

      const result = await response.data;

      if (!response.status.toString().startsWith("2") || !result.success) {
        throw new Error(result.message || messages("uploadFailed"));
      }

      toast.success(
        settings("calendarEventsUploaded", { count: result.data.eventsCount }),
      );

      // Reload calendar data
      await loadCalendarData();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Error uploading ICS file:", error);
      toast.error(error.message || messages("uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearData = async () => {
    if (!calendarData) return;

    setIsClearing(true);

    try {
      const response = await api.delete("/calendar/clear");

      const result = await response.data;

      if (!response.status.toString().startsWith("2") || !result.success) {
        throw new Error(result.message || messages("clearFailed"));
      }

      toast.success(
        settings("calendarEventsCleared", { count: result.data.deletedCount }),
      );
      setCalendarData(null);
    } catch (error: any) {
      console.error("Error clearing calendar data:", error);
      toast.error(error.message || messages("clearFailed"));
    } finally {
      setIsClearing(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === language) return;

    setIsUpdatingLanguage(true);
    try {
      await updateUserLanguage(newLanguage as "en" | "gu");
      toast.success(messages("languageChanged"));
    } catch (error) {
      console.error("Error updating language:", error);
      toast.error(messages("saveError"));
    } finally {
      setIsUpdatingLanguage(false);
    }
  };

  return (
    <TooltipProvider>
      <BaseDialog
        open={open}
        onOpenChange={onOpenChange}
        title={settings("title")}
        description={settings("description")}
        icon={<Settings className="w-5 h-5 text-primary-foreground" />}
        size="2xl"
      >
        <div className="space-y-6">
          {/* Language Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                {settings("languageSettings")}
              </Label>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                {settings("selectLanguage")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {settings("languageDescription")}
              </p>

              <Select
                value={language}
                onValueChange={handleLanguageChange}
                disabled={isUpdatingLanguage}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.nativeLabel}</span>
                        {option.label !== option.nativeLabel && (
                          <span className="text-muted-foreground text-xs">
                            ({option.label})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {settings("calendarSettings")}
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{settings("calendarDescription")}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* ICS File Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">
                  {settings("uploadCalendar")}
                </Label>
                {calendarData && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {settings("active")}
                  </Badge>
                )}
              </div>

              {!calendarData ? (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {settings("uploadIcsCalendarFile")}
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {settings("uploadIcsDescription")}
                      </p>
                      <Button
                        onClick={handleFileSelect}
                        disabled={isUploading || isLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            {settings("processing")}
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            {settings("chooseFile")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {settings("calendarEventsLoaded")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {settings("eventsAvailable", {
                            count: calendarData.totalCount,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadCalendarData}
                        disabled={isLoading}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearData}
                        disabled={isClearing}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {isClearing ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {calendarData.events.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">
                        {settings("sampleEvents", {
                          count: calendarData.events.length,
                        })}
                      </p>
                      <div className="space-y-1">
                        {calendarData.events.slice(0, 3).map((event, index) => (
                          <div
                            key={index}
                            className="text-xs bg-background rounded px-2 py-1 border border-border"
                          >
                            {event.summary}
                          </div>
                        ))}
                        {calendarData.events.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{calendarData.events.length - 3}{" "}
                            {settings("moreEvents")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".ics"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* File Requirements */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {settings("fileRequirements")}
                  </p>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• {settings("fileFormatRequired")}</li>
                    <li>• {settings("maxFileSize")}</li>
                    <li>• {settings("validCalendarEvents")}</li>
                    <li>• {settings("gujaratiTithiInfo")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Other Settings Sections */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                {settings("otherSettings")}
              </Label>
            </div>

            <div className="bg-muted border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                {settings("additionalSettingsDescription")}
              </p>
            </div>
          </div>
        </div>
      </BaseDialog>
    </TooltipProvider>
  );
}
