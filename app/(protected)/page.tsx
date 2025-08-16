"use client";

import { HomePageSkeleton } from "@/components/home/home-skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "@/hooks/use-translations";
import { formatTimeAgo } from "@/lib/utils/date";
import {
  ArrowRight,
  Calendar,
  ChefHat,
  Clock,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface HomeStats {
  totalMealsPlanned: number;
  activeRecipes: number;
  totalCostToday: number;
  mealsPlannedChange: number;
  recipesChange: number;
  costChange: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  icon: string;
}

interface QuickActionsData {
  menusCount: number;
  recipesCount: number;
  kitchensCount: number;
  ingredientsCount: number;
}

export default function HomePage() {
  const { t } = useTranslations();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [homeStats, setHomeStats] = useState<HomeStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [quickActionsData, setQuickActionsData] =
    useState<QuickActionsData | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    activity: true,
    quickActions: true,
  });

  const loadHomeData = useCallback(async () => {
    try {
      setLoadingStates({
        stats: true,
        activity: true,
        quickActions: true,
      });

      // Load all data in one API call
      const response = await fetch("/api/home");

      if (response.ok) {
        const data = await response.json();
        setHomeStats(data.stats);
        setRecentActivity(data.activity);
        setQuickActionsData(data.quickActions);
      } else {
        console.error("Failed to fetch home data");
        toast.error(t("messages.networkError"));
      }
    } catch (error) {
      console.error("Error loading home data:", error);
      toast.error(t("messages.networkError"));
    } finally {
      setLoadingStates({
        stats: false,
        activity: false,
        quickActions: false,
      });
    }
  }, []);

  // Load data when component mounts
  useEffect(() => {
    if (status === "authenticated") {
      loadHomeData();
    }
  }, [status, loadHomeData]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
  }, [status, router]);

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

  // Show skeleton while loading data
  if (
    loadingStates.stats ||
    loadingStates.activity ||
    loadingStates.quickActions
  ) {
    return <HomePageSkeleton />;
  }

  const quickActions = [
    {
      title: t("dashboard.manageMenus"),
      description: t("dashboard.manageMenusDesc"),
      icon: ChefHat,
      href: "/menus",
      color: "bg-linear-to-br from-orange-500 to-red-500",
      iconColor: "text-white",
      count: quickActionsData?.menusCount || 0,
    },
    {
      title: t("navigation.recipes"),
      description: t("dashboard.recipesDesc"),
      icon: Calendar,
      href: "/recipes",
      color: "bg-linear-to-br from-blue-500 to-purple-500",
      iconColor: "text-white",
      count: quickActionsData?.recipesCount || 0,
    },
    {
      title: t("navigation.kitchens"),
      description: t("dashboard.kitchensDesc"),
      icon: Users,
      href: "/kitchens",
      color: "bg-linear-to-br from-green-500 to-emerald-500",
      iconColor: "text-white",
      count: quickActionsData?.kitchensCount || 0,
    },
  ];

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Clock":
        return Clock;
      case "Plus":
        return Plus;
      case "TrendingUp":
        return TrendingUp;
      default:
        return Clock;
    }
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <PageHeader
          title={t("dashboard.welcomeBack")}
          subtitle={
            <span className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>{t("dashboard.welcomeSubtitle")}</span>
            </span>
          }
          actions={
            <Button
              onClick={() => router.push("/menus")}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("dashboard.planTodaysMenu")}
            </Button>
          }
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {t("dashboard.quickActions")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              onClick={() => router.push(action.href)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${action.color}`}
                  >
                    <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-2">{action.title}</CardTitle>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
                {action.count > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {action.count} {t("common.items")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {t("dashboard.todaysOverview")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.totalMealsPlanned")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {homeStats?.totalMealsPlanned || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {homeStats?.mealsPlannedChange &&
                homeStats.mealsPlannedChange >= 0
                  ? "+"
                  : ""}
                {homeStats?.mealsPlannedChange || 0}%{" "}
                {t("dashboard.fromYesterday")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.activeRecipes")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {homeStats?.activeRecipes || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {homeStats?.recipesChange && homeStats.recipesChange >= 0
                  ? "+"
                  : ""}
                {homeStats?.recipesChange || 0}% {t("dashboard.fromLastWeek")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.totalCostToday")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₹{homeStats?.totalCostToday || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {homeStats?.costChange && homeStats.costChange >= 0 ? "+" : ""}
                {homeStats?.costChange || 0}% {t("dashboard.fromYesterday")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {t("dashboard.recentActivity")}
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => {
                  const IconComponent = getIconComponent(activity.icon);
                  return (
                    <div
                      key={activity.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {activity.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(new Date(activity.time))}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  {t("dashboard.noRecentActivity")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
