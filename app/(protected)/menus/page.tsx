"use client";

import { AddMealDialog } from "@/components/dialogs/add-meal-dialog";
import { ReportsGenerationDialog } from "@/components/dialogs/reports-generation-dialog";
import { MenuGrid, MenuGridSkeleton } from "@/components/menu/menu-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompactDateSelector } from "@/components/ui/compact-date-selector";
import {
  EnhancedStatsGrid,
  EnhancedStatsGridSkeleton,
  createMenuStats,
} from "@/components/ui/enhanced-stats-grid";
import { PageHeader } from "@/components/ui/page-header";
import {
  TabNavigation,
  TabNavigationSkeleton,
} from "@/components/ui/tab-navigation";
import { getKitchens } from "@/lib/actions/kitchens";
import { getMenuStats } from "@/lib/actions/menu";
import { fetchMenus } from "@/lib/api/menus";
import { useTranslation } from "@/lib/hooks/use-translation";
import type { MealType as UnifiedMealType } from "@/types/menus";
import { AlertTriangle, FileText } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Temporary interface for MenuGrid props to resolve lint errors
interface MenuGridProps {
  onAddMeal: (mealType: UnifiedMealType) => void;
  dailyMenus: any;
  selectedDate: Date;
}

export default function MenuPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [addMealDialog, setAddMealDialog] = useState(false);
  const [reportsDialog, setReportsDialog] = useState(false);
  const [selectedMealType, setSelectedMealType] =
    useState<UnifiedMealType>("BREAKFAST");
  const [editMeal, setEditMeal] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [menuStats, setMenuStats] = useState<any>(null);
  const [dailyMenus, setDailyMenus] = useState<any>({});
  const [loadingStates, setLoadingStates] = useState({
    kitchens: 0,
    stats: 0,
    menus: 0,
  });

  const loadKitchens = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({
        ...prev,
        kitchens: prev.kitchens + 1,
        stats: prev.stats + 1,
        menus: prev.menus + 1,
      }));
      const kitchensData = await getKitchens();
      setKitchens(kitchensData);
    } catch (error) {
      console.error("Failed to load kitchens:", error);
      toast.error(t("messages.loadKitchensError"));
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        kitchens: prev.kitchens - 1,
        stats: prev.stats - 1,
        menus: prev.menus - 1,
      }));
    }
  }, [t]);

  const loadMenuData = useCallback(async () => {
    if (kitchens.length === 0) return; // Wait for kitchens to load first

    try {
      // Get current kitchen ID
      const currentKitchenId =
        kitchens[activeTab]?.id || session?.user?.kitchenId;

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

      // Load stats and menus in parallel
      setLoadingStates((prev) => ({
        ...prev,
        stats: prev.stats + 1,
        menus: prev.menus + 1,
      }));

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
      console.error("Failed to load menu data:", error);
      toast.error(t("messages.loadMenuDataError"));
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        stats: prev.stats - 1,
        menus: prev.menus - 1,
      }));
    }
  }, [selectedDate, activeTab, session?.user?.kitchenId, kitchens, t]);

  // Load kitchens once on mount
  useEffect(() => {
    loadKitchens();
  }, [loadKitchens]);

  // Load menu data when date, tab, or kitchens change
  useEffect(() => {
    if (kitchens.length > 0) {
      loadMenuData();
    }
  }, [loadMenuData]);

  const getStatsForTab = () => {
    if (!menuStats) {
      return createMenuStats({
        byMealType: { BREAKFAST: 0, LUNCH: 0, DINNER: 0, SNACK: 0 },
      });
    }

    return createMenuStats(menuStats);
  };

  // Helper to check if any loading state is active
  const isAnyLoading = () => {
    return loadingStates.kitchens || loadingStates.stats || loadingStates.menus;
  };

  const handleAddMeal = (mealType: UnifiedMealType) => {
    setSelectedMealType(mealType);
    setAddMealDialog(true);
  };

  const handleEditMeal = (mealType: UnifiedMealType, meal: any) => {
    setSelectedMealType(mealType);
    setEditMeal(meal);
    setAddMealDialog(true);
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (window.confirm(t("messages.confirmDeleteMeal"))) {
      try {
        const response = await fetch(`/api/menus/${mealId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success(t("messages.mealDeletedSuccess"));
          loadMenuData(); // Reload data
        } else {
          toast.error(t("messages.mealDeleteError"));
        }
      } catch (error) {
        console.error("Error deleting meal:", error);
        toast.error(t("messages.mealDeleteError"));
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
      loadMenuData(); // Reload data when dialog closes
    }
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-2 md:gap-4">
      {/* Header Section */}
      <div>
        <PageHeader
          title={t("menus.kitchenDashboard")}
          subtitle={
            <span className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>{t("menus.kitchenDashboardSubtitle")}</span>
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
                <span className="hidden sm:inline">{t("reports.title")}</span>
              </Button>
            </div>
          }
        />
      </div>

      {(loadingStates.kitchens || kitchens.length > 0) && (
        <>
          {loadingStates.kitchens ? (
            <TabNavigationSkeleton tabCount={kitchens.length || 6} />
          ) : (
            <TabNavigation
              tabs={kitchens.map((k) => k.name)}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}
          {/* Stats Section */}
          {loadingStates.stats ? (
            <EnhancedStatsGridSkeleton />
          ) : (
            <EnhancedStatsGrid stats={getStatsForTab()} />
          )}

          {/* Menu Section */}
          {loadingStates.menus ? (
            <MenuGridSkeleton />
          ) : (
            <MenuGrid
              onAddMeal={handleAddMeal}
              onEditMeal={handleEditMeal}
              onDeleteMeal={handleDeleteMeal}
              dailyMenus={dailyMenus}
              selectedDate={selectedDate}
            />
          )}
        </>
      )}

      {!loadingStates.kitchens && kitchens.length === 0 && (
        <Card className="p-4">
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-muted-foreground flex flex-col items-center gap-2 text-xl text-center">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-7 h-7" /> {t("menus.noKitchensFound")}
              </span>
              <span className="text-sm">{t("menus.addKitchenFirst")}</span>
            </p>
            <Button variant="default" onClick={() => router.push("/kitchens")}>
              {t("menus.manageKitchens")}
            </Button>
          </div>
        </Card>
      )}

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
