"use client";

import {
  AddEditKitchenPersonTypeDialog,
  type KitchenPersonTypeForm,
} from "@/components/dialogs/add-edit-kitchen-person-type-dialog";
import {
  AddEditMenuComponentDialog,
  type MenuComponentForm,
} from "@/components/dialogs/add-edit-menu-component-dialog";
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
import api from "@/lib/api/axios";
import {
  createKitchenPersonType,
  fetchKitchenPersonTypes,
} from "@/lib/api/kitchen-person-types";
import { fetchKitchens } from "@/lib/api/kitchens";
import {
  fetchMealPersonCounts,
  saveMealPersonCount,
} from "@/lib/api/meal-person-counts";
import { deleteMenu, fetchMenus, fetchMenuStats } from "@/lib/api/menus";
import type { KitchenPersonType } from "@/types/kitchens";
import type { MenuComponentApiItem } from "@/types/menu-components";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
// import html2pdf from "html2pdf.js";

const EMPTY_PERSON_COUNTS: Record<string, number> = {};

type MealDialogState =
  | { mode: "create"; initialMeal?: { menuComponentId?: string } }
  | { mode: "update"; menuId: string; initialMeal: any };

export default function MenuPage() {
  const { t } = useTranslations();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [addMealDialog, setAddMealDialog] = useState(false);
  const [personTypeDialogOpen, setPersonTypeDialogOpen] = useState(false);
  const [menuComponentDialogOpen, setMenuComponentDialogOpen] = useState(false);
  const [editingMenuComponent, setEditingMenuComponent] =
    useState<MenuComponentForm | null>(null);
  const [menuComponentsRefreshKey, setMenuComponentsRefreshKey] = useState(0);
  const [reportPdfPreviewDialog, setReportPdfPreviewDialog] = useState<
    string | undefined
  >(undefined);
  const [selectedMealType, setSelectedMealType] = useState<UnifiedMealType>(
    MealType.BREAKFAST,
  );
  const [mealDialogState, setMealDialogState] =
    useState<MealDialogState | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [personTypes, setPersonTypes] = useState<KitchenPersonType[]>([]);
  const [personCountsByMealType, setPersonCountsByMealType] = useState<
    Record<string, Record<string, number>>
  >({});
  const [menuStats, setMenuStats] = useState<any>(null);
  const [dailyMenus, setDailyMenus] = useState<any>({});
  const [loadingStates, setLoadingStates] = useState({
    kitchens: 0,
    stats: 0,
    menus: 0,
  });

  const reportIFrameRef = useRef<HTMLIFrameElement | null>(null);

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
        setPersonTypes([]);
        return;
      }

      // Load stats and menus in parallel
      setLoadingStates((prev) => ({
        ...prev,
        stats: prev.stats + 1,
        menus: prev.menus + 1,
      }));

      const [
        statsData,
        menusResponse,
        personTypesData,
        mealPersonCountsData,
      ] = await Promise.all([
        fetchMenuStats(selectedDate.getTime(), currentKitchenId),
        fetchMenus({
          kitchenId: currentKitchenId,
          epochMs: selectedDate.getTime(),
        }),
        fetchKitchenPersonTypes(currentKitchenId),
        fetchMealPersonCounts(currentKitchenId, {
          epochMs: selectedDate.getTime(),
        }),
      ]);

      // Transform menus data to match the expected format
      const groupedMenus = {
        BREAKFAST: menusResponse.filter(
          (m: any) => m.mealType === MealType.BREAKFAST,
        ),
        LUNCH: menusResponse.filter((m: any) => m.mealType === MealType.LUNCH),
        DINNER: menusResponse.filter(
          (m: any) => m.mealType === MealType.DINNER,
        ),
        SNACK: menusResponse.filter((m: any) => m.mealType === MealType.SNACK),
      };

      setMenuStats(statsData);
      setDailyMenus(groupedMenus);
      setPersonTypes(personTypesData);
      setPersonCountsByMealType(
        mealPersonCountsData.reduce(
          (counts, countRow) => {
            counts[countRow.mealType] = {
              ...(counts[countRow.mealType] || {}),
              [countRow.personTypeId]: countRow.count,
            };
            return counts;
          },
          {} as Record<string, Record<string, number>>,
        ),
      );
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
    menuComponentId?: string,
  ) => {
    setSelectedMealType(mealType);
    setMealDialogState({
      mode: "create",
      initialMeal: { menuComponentId },
    });
    setAddMealDialog(true);
  };

  const handleEditMeal = (mealType: UnifiedMealType, meal: any) => {
    setSelectedMealType(mealType);
    setMealDialogState({
      mode: "update",
      menuId: meal.id,
      initialMeal: meal,
    });
    setAddMealDialog(true);
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (window.confirm(t("messages.confirmDeleteMeal"))) {
      try {
        const response = await deleteMenu(mealId);
        loadMenuData(); // Reload data after deletion
        toast.success(response.message);
      } catch (error) {
        console.error("Error deleting meal:", error);
        toast.error(t("messages.mealDeleteError"));
      }
    }
  };

  const handleDownloadReport = async (type: string) => {
    const sep = type.includes("?") ? "&" : "?";
    const reportUrl = `/reports/${type}${sep}epochMs=${selectedDate.getTime()}`;
    setReportPdfPreviewDialog(reportUrl);
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setPersonCountsByMealType({});
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setPersonCountsByMealType({});
  };

  const handlePersonCountChange = (
    mealType: UnifiedMealType,
    personTypeId: string,
    count: number,
  ) => {
    setPersonCountsByMealType((currentCounts) => ({
      ...currentCounts,
      [mealType]: {
        ...(currentCounts[mealType] || {}),
        [personTypeId]: count,
      },
    }));

    const currentKitchenId = kitchens[activeTab]?.id;
    if (!currentKitchenId) {
      return;
    }

    void saveMealPersonCount(currentKitchenId, {
      epochMs: selectedDate.getTime(),
      mealType,
      personTypeId,
      count,
    }).catch((error) => {
      console.error("Failed to save meal person count:", error);
      toast.error("Failed to save person count");
    });
  };

  const handleSavePersonType = async (personType: KitchenPersonTypeForm) => {
    const currentKitchenId = kitchens[activeTab]?.id;
    if (!currentKitchenId) {
      toast.error("Kitchen information not found. Please try again.");
      return false;
    }

    try {
      await createKitchenPersonType(currentKitchenId, {
        name: personType.name,
        description: personType.description || undefined,
        sequenceNumber: Number(personType.sequenceNumber),
      });
      toast.success(t("messages.personTypeAdded"));
      setPersonTypeDialogOpen(false);
      const updatedPersonTypes = await fetchKitchenPersonTypes(currentKitchenId);
      setPersonTypes(updatedPersonTypes);
      return true;
    } catch {
      toast.error(t("messages.failedToSavePersonType"));
      return false;
    }
  };

  const handleEditMenuComponent = (menuComponent: MenuComponentApiItem) => {
    setEditingMenuComponent(menuComponent);
    setMenuComponentDialogOpen(true);
  };

  const handleSaveMenuComponent = async (menuComponent: MenuComponentForm) => {
    const currentKitchenId = kitchens[activeTab]?.id;
    if (!currentKitchenId || !menuComponent.id) {
      toast.error("Menu component information not found. Please try again.");
      return false;
    }

    try {
      await api.put(
        `/kitchens/${currentKitchenId}/menu-components/${menuComponent.id}/`,
        menuComponent,
      );
      toast.success(t("messages.menuComponentUpdated"));
      setMenuComponentDialogOpen(false);
      setEditingMenuComponent(null);
      setMenuComponentsRefreshKey((key) => key + 1);
      await loadMenuData();
      return true;
    } catch {
      toast.error(t("messages.failedToSaveMenuComponent"));
      return false;
    }
  };

  const handleMealDialogClose = (open: boolean) => {
    setAddMealDialog(open);
    if (!open) {
      setMealDialogState(null);
      loadMenuData(); // Reload data when dialog closes
    }
  };

  const handleReportPdfPreviewClose = () => {
    setReportPdfPreviewDialog(undefined);
  };

  const handleDownloadIframePdfV2 = async () => {
    const iframe = reportIFrameRef.current;

    if (!iframe?.contentDocument) {
      console.error("Iframe not found or not loaded yet");
      return;
    }
    const reportRoute = `${window.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ""}/reports/cook?epochMs=${selectedDate.getTime()}`;
    const headerHtml = `<h1>Kitchen Report</h1><p>${new Date().toLocaleDateString()}</p>`;
    const authToken = localStorage.getItem("pdfToken"); // or any short-lived token
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const res = await api.post(
        "/reports/pdf/",
        { route: reportRoute, headerHtml, authToken, timezone },
        { responseType: "arraybuffer" },
      );

      const arrayBuffer = await res.data;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "report.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };
  const handleDownloadIframePdf = () => {
    const iframe = document.getElementById(
      "report-preview-iframe",
    ) as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
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
              />

              {/* Reports buttons */}
              <Button
                variant="outline"
                onClick={() => handleDownloadReport("recipes?compact=true")}
              >
                Recipes Report
              </Button>
              {false && (
                <Button
                  variant="default"
                  onClick={() => handleDownloadReport("recipes")}
                >
                  Recipes Report old
                </Button>
              )}

              {/* Reports Dropdown Menu */}
              {false && (
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
              )}
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
              personTypes={personTypes}
              personCountsByMealType={personCountsByMealType}
              onPersonCountChange={handlePersonCountChange}
              onAddPersonType={() => setPersonTypeDialogOpen(true)}
              onEditMenuComponent={handleEditMenuComponent}
              menuComponentsRefreshKey={menuComponentsRefreshKey}
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
        mode={mealDialogState?.mode ?? "create"}
        menuId={
          mealDialogState?.mode === "update" ? mealDialogState.menuId : undefined
        }
        initialMeal={mealDialogState?.initialMeal}
        initialPersonCounts={
          personCountsByMealType[selectedMealType] || EMPTY_PERSON_COUNTS
        }
      />
      <AddEditKitchenPersonTypeDialog
        open={personTypeDialogOpen}
        onOpenChange={setPersonTypeDialogOpen}
        initialPersonType={{
          name: "",
          description: "",
          sequenceNumber:
            Math.max(0, ...personTypes.map((type) => type.sequenceNumber)) + 1,
        }}
        onSave={handleSavePersonType}
      />
      <AddEditMenuComponentDialog
        open={menuComponentDialogOpen}
        onOpenChange={(open) => {
          setMenuComponentDialogOpen(open);
          if (!open) {
            setEditingMenuComponent(null);
          }
        }}
        initialMenuComponent={editingMenuComponent}
        personTypes={personTypes}
        onSave={handleSaveMenuComponent}
      />
      <BaseDialog
        open={!!reportPdfPreviewDialog}
        onOpenChange={handleReportPdfPreviewClose}
        title="Preview"
        description="This is a preview of pdf report"
        icon={<File className="w-5 h-5 text-primary-foreground" />}
        size="6xl"
      >
        <div className="flex justify-end gap-2 mb-2">
          {/* <Button variant="outline" onClick={handleDownloadIframePdf}>
            Download
          </Button> */}
          <Button variant="outline" onClick={handleDownloadIframePdf}>
            Print
          </Button>
        </div>
        <div
          className="p-2 border border-primary"
          style={{ colorScheme: "light" }}
        >
          <iframe
            id="report-preview-iframe"
            ref={reportIFrameRef}
            src={`${window.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${reportPdfPreviewDialog}`}
            width="100%"
            height="800"
          />
        </div>
      </BaseDialog>
    </div>
  );
}
