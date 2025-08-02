"use client";

import { AddMealDialog } from "@/components/dialogs/add-meal-dialog";
import { ReportsGenerationDialog } from "@/components/dialogs/reports-generation-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MenuGrid } from "@/components/menu/menu-grid";
import { Button } from "@/components/ui/button";
import { DateSelector } from "@/components/ui/date-selector";
import { PageHeader } from "@/components/ui/page-header";
import { StatsGrid } from "@/components/ui/stats-grid";
import { TabNavigation } from "@/components/ui/tab-navigation";
import { getKitchens } from "@/lib/actions/kitchens";
import { fetchMenus } from "@/lib/api/menus";
import { getMenuStats } from "@/lib/actions/menu";
import { MealType } from "@prisma/client";
import { FileText, Upload, Users, Eye, TrendingUp, DollarSign } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function MenuPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [addMealDialog, setAddMealDialog] = useState(false);
  const [reportsDialog, setReportsDialog] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    MealType.BREAKFAST,
  );
  const [editMeal, setEditMeal] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [menuStats, setMenuStats] = useState<any>(null);
  const [dailyMenus, setDailyMenus] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Get kitchens first
      const kitchensData = await getKitchens();
      setKitchens(kitchensData);

      // Get current kitchen ID
      const currentKitchenId =
        kitchensData[activeTab]?.id || session?.user?.kitchenId;

      if (!currentKitchenId) {
        setMenuStats({
          total: { planned: 0 },
          byMealType: { BREAKFAST: 0, LUNCH: 0, DINNER: 0, SNACK: 0 },
        });
        setDailyMenus({});
        return;
      }

      // Fetch menus and stats
      const [statsData, menusResponse] = await Promise.all([
        getMenuStats(selectedDate, currentKitchenId),
        fetchMenus({
          kitchenId: currentKitchenId,
          date: selectedDate.toISOString().split("T")[0],
        }),
      ]);

      // Transform menus data to match the expected format
      const groupedMenus = {
        BREAKFAST: menusResponse.filter((m: any) => m.mealType === "BREAKFAST"),
        LUNCH: menusResponse.filter((m: any) => m.mealType === "LUNCH"),
        DINNER: menusResponse.filter((m: any) => m.mealType === "DINNER"),
        SNACK: menusResponse.filter((m: any) => m.mealType === "SNACK"),
      };

      setMenuStats(statsData);
      setDailyMenus(groupedMenus);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, activeTab, session?.user?.kitchenId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
  }, [status, router]);

  // Load data only when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status, loadData]);

  // Dynamic stats based on active tab and date
  const getStatsForTab = () => {
    if (!menuStats) return [];

    return [
      {
        label: "Total Planned",
        value: menuStats.total.planned.toString(),
        icon: Users,
        iconColor: "hsl(var(--primary))",
        trend: { value: 12, isPositive: true },
      },
      {
        label: "Breakfast",
        value: menuStats.byMealType.BREAKFAST.toString(),
        icon: TrendingUp,
        iconColor: "#f59e0b",
        trend: { value: 8, isPositive: true },
      },
      {
        label: "Lunch",
        value: menuStats.byMealType.LUNCH.toString(),
        icon: Eye,
        iconColor: "#10b981",
        trend: { value: 5, isPositive: false },
      },
      {
        label: "Dinner",
        value: menuStats.byMealType.DINNER.toString(),
        icon: DollarSign,
        iconColor: "#ef4444",
        trend: { value: 0, isPositive: true },
      },
    ];
  };

  const handleAddMeal = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setEditMeal(null);
    setAddMealDialog(true);
  };

  const handleEditMeal = (mealType: MealType, meal: any) => {
    setSelectedMealType(mealType);
    setEditMeal(meal);
    setAddMealDialog(true);
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (window.confirm("Are you sure you want to delete this meal?")) {
      try {
        const { deleteMenu } = await import("@/lib/api/menus");
        await deleteMenu(mealId);
        toast.success("Meal deleted successfully!");
        loadData();
      } catch (error) {
        console.error("Error deleting meal:", error);
        toast.error("Failed to delete meal");
      }
    }
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
      loadData();
    }
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === "unauthenticated") {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header Section */}
      <PageHeader
        title="Kitchen Dashboard"
        subtitle="Manage your daily menu and track kitchen operations efficiently"
        actions={
          <>
            <Button
              variant="outline"
              className="border-primary/20 text-primary hover:bg-primary/10 glass btn-hover"
              onClick={() => setReportsDialog(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Generate Reports</span>
            </Button>
            <Button 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg btn-hover"
            >
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Bulk Upload</span>
            </Button>
          </>
        }
      />

      {/* Date and Stats Section */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
        {/* Date Selector */}
        <div className="xl:col-span-2">
          <DateSelector
            date={selectedDate}
            onDateChange={handleDateChange}
            className="h-full"
          />
        </div>

        {/* Stats Grid */}
        <div className="xl:col-span-3">
          <StatsGrid stats={getStatsForTab()} />
        </div>
      </div>

      {/* Kitchen Tabs */}
      <TabNavigation
        tabs={kitchens.map((k) => k.name)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Menu Section */}
      <MenuGrid
        onAddMeal={handleAddMeal}
        onEditMeal={handleEditMeal}
        onDeleteMeal={handleDeleteMeal}
        dailyMenus={dailyMenus}
        selectedDate={selectedDate}
      />

      {/* Dialogs */}
      <AddMealDialog
        open={addMealDialog}
        onOpenChange={handleMealDialogClose}
        mealType={selectedMealType}
        selectedDate={selectedDate}
        kitchenId={kitchens[activeTab]?.id || session?.user?.kitchenId}
        editMeal={editMeal}
      />
      <ReportsGenerationDialog
        open={reportsDialog}
        onOpenChange={setReportsDialog}
      />
    </DashboardLayout>
  );
}