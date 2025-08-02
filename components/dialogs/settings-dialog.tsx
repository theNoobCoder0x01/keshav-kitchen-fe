"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Settings, 
  Upload, 
  FileText, 
  Calendar, 
  Info, 
  X, 
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  uid: string;
}

interface CalendarData {
  events: CalendarEvent[];
  totalCount: number;
  lastUploaded?: string;
}

export function SettingsDialog({
  open,
  onOpenChange,
}: SettingsDialogProps) {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load calendar data on component mount
  useEffect(() => {
    if (open) {
      loadCalendarData();
    }
  }, [open]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/calendar/events?date=' + new Date().toISOString().split('T')[0]);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.events.length > 0) {
          setCalendarData({
            events: data.events,
            totalCount: data.events.length,
            lastUploaded: data.events[0]?.createdAt
          });
        } else {
          setCalendarData(null);
        }
      } else {
        setCalendarData(null);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setCalendarData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.ics')) {
      toast.error('Please select a valid ICS file (.ics extension)');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error('File size must be less than 1MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/calendar/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const result = await response.json();
      
      toast.success(result.message);
      
      // Reload calendar data
      await loadCalendarData();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading ICS file:', error);
      toast.error(error.message || 'Failed to upload calendar file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearData = async () => {
    if (!calendarData) return;

    setIsClearing(true);

    try {
      const response = await fetch('/api/calendar/clear', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear data');
      }

      const result = await response.json();
      
      toast.success(result.message);
      setCalendarData(null);
    } catch (error: any) {
      console.error('Error clearing calendar data:', error);
      toast.error(error.message || 'Failed to clear calendar data');
    } finally {
      setIsClearing(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-[#dbdade]">
              <DialogTitle className="text-xl font-semibold text-[#4b465c] flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#674af5] to-[#856ef7] rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                Settings
              </DialogTitle>
              <p className="text-sm text-[#4b465c]/70 mt-2">
                Configure application settings and upload calendar files
              </p>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Calendar Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium text-[#4b465c] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#674af5]" />
                    Calendar Settings
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-[#4b465c]/50 hover:text-[#674af5] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Upload an ICS calendar file to display Gujarati tithi and event information in the date selector. This will show event summaries and tithi details for selected dates.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* ICS File Upload */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-[#4b465c]">
                      Calendar File (ICS)
                    </Label>
                    {calendarData && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>

                  {!calendarData ? (
                    <div className="border-2 border-dashed border-[#dbdade] rounded-lg p-6 text-center hover:border-[#674af5]/50 transition-colors">
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-[#674af5]/10 rounded-full flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6 text-[#674af5]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#4b465c] mb-1">
                            Upload ICS Calendar File
                          </p>
                          <p className="text-xs text-[#4b465c]/70 mb-3">
                            Upload a .ics file to display tithi and event information
                          </p>
                          <Button
                            onClick={handleFileSelect}
                            disabled={isUploading || isLoading}
                            className="bg-[#674af5] hover:bg-[#674af5]/90 text-white"
                          >
                            {isUploading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Choose File
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#f8f7fa] border border-[#dbdade] rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#674af5]/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#674af5]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#4b465c]">
                              Calendar Events Loaded
                            </p>
                            <p className="text-xs text-[#4b465c]/70">
                              {calendarData.totalCount} events available
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadCalendarData}
                            disabled={isLoading}
                            className="text-[#674af5] hover:text-[#674af5]/80 hover:bg-[#674af5]/10"
                          >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                        <div className="mt-3 pt-3 border-t border-[#dbdade]">
                          <p className="text-xs text-[#4b465c]/70 mb-2">
                            Sample events: {calendarData.events.length}
                          </p>
                          <div className="space-y-1">
                            {calendarData.events.slice(0, 3).map((event, index) => (
                              <div key={index} className="text-xs bg-white rounded px-2 py-1 border">
                                {event.summary}
                              </div>
                            ))}
                            {calendarData.events.length > 3 && (
                              <p className="text-xs text-[#4b465c]/50">
                                +{calendarData.events.length - 3} more events
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900">
                        File Requirements
                      </p>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• File must be in .ics format</li>
                        <li>• Maximum file size: 1MB</li>
                        <li>• Must contain valid calendar events</li>
                        <li>• Events with Gujarati tithi information will be displayed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Settings Sections */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium text-[#4b465c] flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#674af5]" />
                    Other Settings
                  </Label>
                </div>

                <div className="bg-[#f8f7fa] border border-[#dbdade] rounded-lg p-4">
                  <p className="text-sm text-[#4b465c]/70">
                    Additional settings will be available here in future updates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-[#dbdade]">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#dbdade] text-[#4b465c] hover:bg-[#f8f7fa] bg-transparent"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </TooltipProvider>
  );
}