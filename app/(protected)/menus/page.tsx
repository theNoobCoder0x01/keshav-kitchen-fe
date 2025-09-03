"use client";

import { AddMealDialog } from "@/components/dialogs/add-meal-dialog";
import { MenuGrid, MenuGridSkeleton } from "@/components/menu/menu-grid";
import { BaseDialog } from "@/components/ui/base-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompactDateSelector } from "@/components/ui/compact-date-selector";
import {
  createMenuStats,
  EnhancedStatsGrid,
  EnhancedStatsGridSkeleton,
} from "@/components/ui/enhanced-stats-grid";
import { PageHeader } from "@/components/ui/page-header";
import {
  TabNavigation,
  TabNavigationSkeleton,
} from "@/components/ui/tab-navigation";
import { useTranslations } from "@/hooks/use-translations";
import { fetchKitchens } from "@/lib/api/kitchens";
import { deleteMenu, fetchMenus, fetchMenuStats } from "@/lib/api/menus";
import type { MealType as UnifiedMealType } from "@/types/menus";
import { MealTypeEnum as MealType } from "@/types/menus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { AlertTriangle, ChevronDown, File } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function MenuPage() {
  const { t } = useTranslations();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [addMealDialog, setAddMealDialog] = useState(false);
  const [reportPdfPreviewDialog, setReportPdfPreviewDialog] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<UnifiedMealType>(
    MealType.BREAKFAST
  );
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
      const kitchensData = await fetchKitchens();
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
  }, []);

  const loadMenuData = useCallback(async () => {
    if (kitchens.length === 0) return; // Wait for kitchens to load first

    try {
      // Get current kitchen ID
      const currentKitchenId = kitchens[activeTab]?.id;

      if (!currentKitchenId) {
        setMenuStats({
          total: { planned: 0 },
          byMealType: { BREAKFAST: 0, LUNCH: 0, DINNER: 0, SNACK: 0 },
        });
        setDailyMenus({});
        return;
      }

      // Load stats and menus in parallel
      setLoadingStates((prev) => ({
        ...prev,
        stats: prev.stats + 1,
        menus: prev.menus + 1,
      }));

      const [statsData, menusResponse] = await Promise.all([
        fetchMenuStats(selectedDate.getTime(), currentKitchenId),
        fetchMenus({
          kitchenId: currentKitchenId,
          epochMs: selectedDate.getTime(),
        }),
      ]);

      // Transform menus data to match the expected format
      const groupedMenus = {
        BREAKFAST: menusResponse.filter(
          (m: any) => m.mealType === MealType.BREAKFAST
        ),
        LUNCH: menusResponse.filter((m: any) => m.mealType === MealType.LUNCH),
        DINNER: menusResponse.filter(
          (m: any) => m.mealType === MealType.DINNER
        ),
        SNACK: menusResponse.filter((m: any) => m.mealType === MealType.SNACK),
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
  }, [selectedDate, activeTab, kitchens]);

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

  const handleAddMeal = (
    mealType: UnifiedMealType,
    menuComponentId?: string
  ) => {
    setSelectedMealType(mealType);
    setEditMeal({
      menuComponentId,
    });
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
        const response = await deleteMenu(mealId);

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

  const handleDownloadReport = (type: string) => {
    const url = `/api/reports/pdf?url=${window.origin}/reports/${type}?epochMs=${selectedDate.getTime()}`;
    window.open(url, "_blank");
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

  const handleReportPdfPreviewClose = (open: boolean) => {
    setReportPdfPreviewDialog(open);
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
              />

              {/* Reports Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10 bg-background/80 backdrop-blur-xs flex items-center"
                  >
                    <span className="hidden sm:inline">
                      {t("reports.title")}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="end"
                  className="z-10 bg-secondary drop-shadow-lg py-2 flex flex-col rounded-lg border"
                >
                  <DropdownMenuItem
                    className="hover:bg-accent-foreground/30 cursor-pointer px-3 py-1.5 transition-colors duration-300"
                    onClick={() => handleDownloadReport("cook")}
                  >
                    Cook Report
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="hover:bg-accent-foreground/30 cursor-pointer px-3 py-1.5 transition-colors duration-300"
                    onClick={() => handleDownloadReport("supplier")}
                  >
                    Supplier Report
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="hover:bg-accent-foreground/30 cursor-pointer px-3 py-1.5 transition-colors duration-300"
                    onClick={() => handleDownloadReport("recipes")}
                  >
                    Recipes Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              menus={dailyMenus}
              kitchenId={kitchens[activeTab]?.id}
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
                <AlertTriangle className="w-7 h-7" />{" "}
                {t("menus.noKitchensFound")}
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
        kitchenId={kitchens[activeTab]?.id}
        editMeal={editMeal}
      />
      <BaseDialog
        open={reportPdfPreviewDialog}
        onOpenChange={handleReportPdfPreviewClose}
        title="Preview"
        description="This is a preview of pdf report"
        icon={<File className="w-5 h-5 text-primary-foreground" />}
        size="6xl"
      >
        <div className="p-2 border border-primary">
          <iframe
            src={`/api/reports/pdf?url=${window.origin}/reports/recipes?epochMs=1755967928000`}
            width="100%"
            height="800"
          />
        </div>
      </BaseDialog>
    </div>
  );
}
