"use client";

import { AddMealDialog } from "@/components/dialogs/add-meal-dialog";
import { ReportsGenerationDialog } from "@/components/dialogs/reports-generation-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MenuGrid } from "@/components/menu/menu-grid";
import { Button } from "@/components/ui/button";
import { DateSelector } from "@/components/ui/date-selector";
import { PageHeader, WelcomeHeader } from "@/components/ui/page-header";
import { StatsGrid } from "@/components/ui/stats-grid";
import { TabNavigation } from "@/components/ui/tab-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getKitchens } from "@/lib/actions/kitchens";
import { fetchMenus } from "@/lib/api/menus";
import { getMenuStats } from "@/lib/actions/menu";
import { MealType } from "@prisma/client";
import { 
  FileText, 
  Upload, 
  Users, 
  Coffee, 
  Utensils, 
  Moon, 
  TrendingUp, 
  Activity,
  Calendar,
  ChefHat
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("");
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

      // Set initial active tab if not set
      if (!activeTab && kitchensData.length > 0) {
        setActiveTab(kitchensData[0].id);
      }

      // Get current kitchen ID
      const currentKitchenId = activeTab || kitchensData[0]?.id || session?.user?.kitchenId;

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

  // Enhanced stats with modern design
  const getStatsForTab = () => {
    if (!menuStats) return [];

    return [
      {
        id: "total-planned",
        title: "Total Planned",
        value: menuStats.total.planned.toString(),
        icon: <Users className="w-5 h-5" />,
        color: "primary" as const,
        change: {
          value: "+12%",
          type: "increase" as const,
          period: "from yesterday",
        },
        description: "Total meals planned for today",
        trend: {
          data: [12, 19, 15, 27, 32, 25, 28],
          positive: true,
        },
      },
      {
        id: "breakfast",
        title: "Breakfast",
        value: menuStats.byMealType.BREAKFAST.toString(),
        icon: <Coffee className="w-5 h-5" />,
        color: "warning" as const,
        change: {
          value: "+8%",
          type: "increase" as const,
          period: "from yesterday",
        },
        description: "Morning meals planned",
      },
      {
        id: "lunch",
        title: "Lunch",
        value: menuStats.byMealType.LUNCH.toString(),
        icon: <Utensils className="w-5 h-5" />,
        color: "success" as const,
        change: {
          value: "-5%",
          type: "decrease" as const,
          period: "from yesterday",
        },
        description: "Afternoon meals planned",
      },
      {
        id: "dinner",
        title: "Dinner",
        value: menuStats.byMealType.DINNER.toString(),
        icon: <Moon className="w-5 h-5" />,
        color: "primary" as const,
        change: {
          value: "0%",
          type: "neutral" as const,
          period: "from yesterday",
        },
        description: "Evening meals planned",
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

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
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

  // Show modern loading screen while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/40 rounded-full animate-spin mx-auto" style={{ animationDirection: "reverse", animationDuration: "1.5s" }}></div>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Loading Kitchen Dashboard</h2>
          <p className="text-muted-foreground">Please wait while we prepare your workspace...</p>
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
          <div className="text-center animate-fade-in">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Transform kitchens for new tab navigation
  const kitchenTabs = kitchens.map((kitchen) => ({
    id: kitchen.id,
    label: kitchen.name,
    icon: <ChefHat className="w-4 h-4" />,
  }));

  return (
    <DashboardLayout activeMenuItem="dashboard">
      {/* Welcome Header */}
      <WelcomeHeader
        name={session?.user?.name?.split(' ')[0] || "User"}
        message="Ready to manage your kitchen operations for today?"
        actions={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={() => setReportsDialog(true)}
              className="shadow-modern hover:shadow-modern-md"
            >
              Generate Reports
            </Button>
            <Button 
              variant="gradient"
              size="lg"
              leftIcon={<Upload className="w-4 h-4" />}
              className="shadow-modern-lg hover:shadow-modern-xl"
            >
              Bulk Upload
            </Button>
          </div>
        }
      />

      {/* Quick Stats and Date Section */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
        {/* Date Selector */}
        <div className="xl:col-span-2">
          <Card className="h-full" variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Select Date</h3>
                  <p className="text-sm text-muted-foreground">Choose date for menu planning</p>
                </div>
              </div>
              <DateSelector
                date={selectedDate}
                onDateChange={handleDateChange}
                className="border-0 bg-transparent"
              />
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="xl:col-span-3">
          <StatsGrid 
            stats={getStatsForTab()} 
            columns={4}
            variant="detailed"
            className="h-full"
          />
        </div>
      </div>

      {/* Kitchen Selection */}
      {kitchenTabs.length > 0 && (
        <div className="mb-8">
          <Card variant="outlined">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-success/10">
                  <Activity className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Kitchen Selection</h3>
                  <p className="text-sm text-muted-foreground">Choose which kitchen to manage</p>
                </div>
              </div>
              <TabNavigation
                tabs={kitchenTabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                variant="pills"
                size="md"
                className="mt-4"
              />
            </CardContent>
          </Card>
        </div>
      )}

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
        kitchenId={kitchens.find(k => k.id === activeTab)?.id || session?.user?.kitchenId}
        editMeal={editMeal}
      />
      <ReportsGenerationDialog
        open={reportsDialog}
        onOpenChange={setReportsDialog}
      />
    </DashboardLayout>
  );
}