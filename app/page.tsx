"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  ChefHat,
  Clock,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/20 flex items-center justify-center">
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

  const quickActions = [
    {
      title: "Manage Menus",
      description: "Plan and organize daily meals",
      icon: ChefHat,
      href: "/menus",
      color: "bg-gradient-to-br from-orange-500 to-red-500",
      iconColor: "text-white",
    },
    {
      title: "Recipes",
      description: "Browse and manage recipes",
      icon: Calendar,
      href: "/recipes",
      color: "bg-gradient-to-br from-blue-500 to-purple-500",
      iconColor: "text-white",
    },
    {
      title: "Kitchens",
      description: "Manage kitchen locations",
      icon: Users,
      href: "/kitchens",
      color: "bg-gradient-to-br from-green-500 to-emerald-500",
      iconColor: "text-white",
    },
    {
      title: "Ingredients",
      description: "Track inventory and costs",
      icon: BarChart3,
      href: "/ingredients",
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
      iconColor: "text-white",
    },
  ];

  const recentActivity = [
    {
      title: "Menu Updated",
      description: "Breakfast menu for today was modified",
      time: "2 hours ago",
      icon: Clock,
    },
    {
      title: "New Recipe Added",
      description: "Chicken Curry recipe was created",
      time: "4 hours ago",
      icon: Plus,
    },
    {
      title: "Cost Report Generated",
      description: "Weekly cost analysis report ready",
      time: "1 day ago",
      icon: TrendingUp,
    },
  ];

  return (
    <DashboardLayout activeMenuItem="home">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <PageHeader
          title="Welcome back!"
          subtitle={
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Here's what's happening in your kitchen today</span>
            </div>
          }
          actions={
            <Button
              onClick={() => router.push("/menus")}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Plan Today's Menu
            </Button>
          }
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Quick Actions
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Today's Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Meals Planned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">24</div>
              <p className="text-xs text-muted-foreground mt-1">
                +12% from yesterday
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Recipes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">156</div>
              <p className="text-xs text-muted-foreground mt-1">
                +3 new this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cost Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₹2,450</div>
              <p className="text-xs text-muted-foreground mt-1">
                -5% from yesterday
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Recent Activity
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <activity.icon className="w-4 h-4 text-primary" />
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
                      {activity.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
