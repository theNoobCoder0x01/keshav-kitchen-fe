"use client";

import { AddMealDialog } from "@/components/dialogs/add-meal-dialog";
import { ReportsGenerationDialog } from "@/components/dialogs/reports-generation-dialog";
import { MenuGrid } from "@/components/menu/menu-grid";
import { Button } from "@/components/ui/button";
import { CompactDateSelector } from "@/components/ui/compact-date-selector";
import {
  EnhancedStatsGrid,
  createMenuStats,
} from "@/components/ui/enhanced-stats-grid";
import { PageHeader } from "@/components/ui/page-header";
import { TabNavigation } from "@/components/ui/tab-navigation";
import { getKitchens } from "@/lib/actions/kitchens";
import { getMenuStats } from "@/lib/actions/menu";
import { fetchMenus } from "@/lib/api/menus";
import { MealType } from "@prisma/client";
import { FileText } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Temporary interface for MenuGrid props to resolve lint errors
interface MenuGridProps {
  onAddMeal: (mealType: string) => void;
  dailyMenus: any;
  selectedDate: Date;
}

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

      console.log(
        `Loading data for kitchen: ${currentKitchenId}, date: ${selectedDate.toISOString().split("T")[0]}, activeTab: ${activeTab}`,
      );

      // Fetch menus and stats
      const [statsData, menusResponse] = await Promise.all([
        getMenuStats(selectedDate, currentKitchenId),
        fetchMenus({
          kitchenId: currentKitchenId,
          date: selectedDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
        }),
      ]);

      console.log(
        `Fetched ${menusResponse.length} menus for kitchen ${currentKitchenId}:`,
        menusResponse,
      );

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatsForTab = () => {
    if (!menuStats) {
      return createMenuStats({
        byMealType: { BREAKFAST: 0, LUNCH: 0, DINNER: 0, SNACK: 0 },
      });
    }

    return createMenuStats(menuStats);
  };

  const handleAddMeal = (mealType: MealType) => {
    setSelectedMealType(mealType);
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
        const response = await fetch(`/api/menus/${mealId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Meal deleted successfully");
          loadData(); // Reload data
        } else {
          toast.error("Failed to delete meal");
        }
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
      setEditMeal(null);
      loadData(); // Reload data when dialog closes
    }
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
      <div className="w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <PageHeader
          title="Kitchen Dashboard"
          subtitle={
            <span className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Manage your daily menu and track kitchen operations</span>
            </span>
          }
          actions={
            <div className="flex items-center gap-3">
              {/* Date Selector */}
              <CompactDateSelector
                date={selectedDate}
                onDateChange={handleDateChange}
                className="w-auto"
                kitchenId={session?.user?.kitchenId ?? undefined}
              />

              {/* Reports Button */}
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 bg-background/80 backdrop-blur-xs"
                onClick={() => setReportsDialog(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Reports</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* Stats Section */}
      <div className="mb-6 sm:mb-8">
        <div className="mb-6">
          {/* Enhanced Stats Grid */}
          <EnhancedStatsGrid stats={getStatsForTab()} />
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
          onEditMeal={handleEditMeal}
          onDeleteMeal={handleDeleteMeal}
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
        kitchenId={kitchens[activeTab]?.id || session?.user?.kitchenId}
        editMeal={editMeal}
      />
      <ReportsGenerationDialog
        open={reportsDialog}
        onOpenChange={setReportsDialog}
      />
    </div>
  );
}
