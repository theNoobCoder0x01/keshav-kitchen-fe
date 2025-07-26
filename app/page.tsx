"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DateSelector } from "@/components/ui/date-selector";
import { StatsGrid } from "@/components/ui/stats-grid";
import { TabNavigation } from "@/components/ui/tab-navigation";
import { PageHeader } from "@/components/ui/page-header";
import { MenuGrid } from "@/components/menu/menu-grid";
import { AddMealDialog } from "@/components/dialogs/add-meal-dialog";
import { ReportDialog } from "@/components/dialogs/report-dialog";
import { Button } from "@/components/ui/button";
import { Users, Eye, FileText, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { getDailyMenus, getMenuStats } from "@/lib/actions/menu";
import { getKitchens } from "@/lib/actions/kitchens";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function MenuPage() {
  const { data: session } = useSession();
  const [addMealDialog, setAddMealDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [menuStats, setMenuStats] = useState<any>(null);
  const [dailyMenus, setDailyMenus] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedDate, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kitchensData, statsData, menusData] = await Promise.all([
        getKitchens(),
        getMenuStats(selectedDate, kitchens[activeTab]?.id),
        getDailyMenus(selectedDate, kitchens[activeTab]?.id),
      ]);

      setKitchens(kitchensData);
      setMenuStats(statsData);
      setDailyMenus(menusData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic stats based on active tab and date
  const getStatsForTab = () => {
    if (!menuStats) return [];

    return [
      {
        label: "Total Planned",
        value: menuStats.total.planned.toString(),
        icon: Users,
        iconColor: "#00cfe8",
        trend: { value: 12, isPositive: true },
      },
      {
        label: "Breakfast",
        value: menuStats.byMealType.BREAKFAST.toString(),
        icon: Users,
        iconColor: "#28c76f",
        trend: { value: 8, isPositive: true },
      },
      {
        label: "Lunch",
        value: menuStats.byMealType.LUNCH.toString(),
        icon: Eye,
        iconColor: "#ff9f43",
        trend: { value: 5, isPositive: false },
      },
      {
        label: "Dinner",
        value: menuStats.byMealType.DINNER.toString(),
        icon: Eye,
        iconColor: "#ea5455",
        trend: { value: 0, isPositive: true },
      },
    ];
  };

  const handleAddMeal = (mealType: string) => {
    setSelectedMealType(mealType);
    setAddMealDialog(true);
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleMealDialogClose = (open: boolean) => {
    setAddMealDialog(open);
    if (!open) {
      // Reload data when dialog closes
      loadData();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#674af5] mx-auto mb-4"></div>
            <p className="text-[#4b465c]/70">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <PageHeader
          title="Kitchen Dashboard"
          subtitle="Manage your daily menu and track kitchen operations"
          actions={
            <>
              <Button
                variant="outline"
                className="border-[#674af5] text-[#674af5] hover:bg-[#674af5]/10 bg-white/80 backdrop-blur-sm"
                onClick={() => setReportDialog(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Reports</span>
              </Button>
              <Button className="bg-gradient-to-r from-[#674af5] to-[#856ef7] hover:from-[#674af5]/90 hover:to-[#856ef7]/90 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Bulk Upload</span>
              </Button>
            </>
          }
        />
      </div>

      {/* Date and Stats Section */}
      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 mb-6">
          {/* Date Selector */}
          <div className="xl:col-span-2">
            <DateSelector
              date={selectedDate}
              onDateChange={handleDateChange}
              className="h-full min-h-[120px]"
            />
          </div>

          {/* Stats Grid */}
          <div className="xl:col-span-3">
            <StatsGrid stats={getStatsForTab()} />
          </div>
        </div>

        <TabNavigation
          tabs={kitchens.map((k) => k.name)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Menu Section */}
      <div className="space-y-6">
        <MenuGrid
          onAddMeal={handleAddMeal}
          dailyMenus={dailyMenus}
          selectedDate={selectedDate}
        />
      </div>

      {/* Dialogs */}
      <AddMealDialog
        open={addMealDialog}
        onOpenChange={handleMealDialogClose}
        mealType={selectedMealType}
        selectedDate={selectedDate}
      />
      <ReportDialog open={reportDialog} onOpenChange={setReportDialog} />
    </DashboardLayout>
  );
}
