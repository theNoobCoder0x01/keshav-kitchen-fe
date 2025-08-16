"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getHomeStats() {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        totalMealsPlanned: 0,
        activeRecipes: 0,
        totalCostToday: 0,
        mealsPlannedChange: 0,
        recipesChange: 0,
        costChange: 0,
      };
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const whereClause: any = {};

    // If user is not admin, filter by their kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId) {
      whereClause.kitchenId = session.user.kitchenId;
    }

    // Get today's data
    const [todayMenus, todayIngredients] = await Promise.all([
      prisma.menu.aggregate({
        where: {
          ...whereClause,
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        _sum: {
          servings: true,
        },
      }),
      prisma.menuIngredient.aggregate({
        where: {
          menu: {
            ...whereClause,
            date: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        },
        _sum: {
          costPerUnit: true,
        },
      }),
    ]);

    // Get yesterday's data for comparison
    const [yesterdayMenus, yesterdayIngredients] = await Promise.all([
      prisma.menu.aggregate({
        where: {
          ...whereClause,
          date: {
            gte: startOfYesterday,
            lte: endOfYesterday,
          },
        },
        _sum: {
          servings: true,
        },
      }),
      prisma.menuIngredient.aggregate({
        where: {
          menu: {
            ...whereClause,
            date: {
              gte: startOfYesterday,
              lte: endOfYesterday,
            },
          },
        },
        _sum: {
          costPerUnit: true,
        },
      }),
    ]);

    // Get total recipes count
    const totalRecipes = await prisma.recipe.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    const totalRecipesLastWeek = await prisma.recipe.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000), // 8-14 days ago
          lt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const totalMealsPlanned = todayMenus._sum.servings || 0;
    const totalMealsYesterday = yesterdayMenus._sum.servings || 0;
    const totalCostToday = todayIngredients._sum.costPerUnit || 0;
    const totalCostYesterday = yesterdayIngredients._sum.costPerUnit || 0;

    // Calculate changes
    const mealsPlannedChange =
      totalMealsYesterday > 0
        ? ((totalMealsPlanned - totalMealsYesterday) / totalMealsYesterday) *
          100
        : 0;

    const recipesChange =
      totalRecipesLastWeek > 0
        ? ((totalRecipes - totalRecipesLastWeek) / totalRecipesLastWeek) * 100
        : 0;

    const costChange =
      totalCostYesterday > 0
        ? ((totalCostToday - totalCostYesterday) / totalCostYesterday) * 100
        : 0;

    return {
      totalMealsPlanned,
      activeRecipes: totalRecipes,
      totalCostToday: Math.round(totalCostToday),
      mealsPlannedChange: Math.round(mealsPlannedChange),
      recipesChange: Math.round(recipesChange),
      costChange: Math.round(costChange),
    };
  } catch (error) {
    console.error("Get home stats error:", error);
    return {
      totalMealsPlanned: 0,
      activeRecipes: 0,
      totalCostToday: 0,
      mealsPlannedChange: 0,
      recipesChange: 0,
      costChange: 0,
    };
  }
}

export async function getRecentActivity() {
  try {
    const session = await auth();

    if (!session?.user) {
      return [];
    }

    const whereClause: any = {};

    // If user is not admin, filter by their kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId) {
      whereClause.kitchenId = session.user.kitchenId;
    }

    // Get recent menus, recipes, and reports
    const [recentMenus, recentRecipes, recentReports] = await Promise.all([
      prisma.menu.findMany({
        where: whereClause,
        include: {
          recipe: {
            select: {
              name: true,
            },
          },
          kitchen: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      }),
      prisma.recipe.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
      prisma.report.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    const activities: any[] = [];

    // Add menu activities
    recentMenus.forEach((menu) => {
      activities.push({
        id: menu.id,
        type: "menu",
        title: "Menu Updated",
        description: `${menu.recipe.name} for ${menu.mealType.toLowerCase()}`,
        time: menu.updatedAt,
        icon: "Clock",
      });
    });

    // Add recipe activities
    recentRecipes.forEach((recipe) => {
      activities.push({
        id: recipe.id,
        type: "recipe",
        title: "New Recipe Added",
        description: recipe.name,
        time: recipe.createdAt,
        icon: "Plus",
      });
    });

    // Add report activities
    recentReports.forEach((report) => {
      activities.push({
        id: report.id,
        type: "report",
        title: "Report Generated",
        description: `Visitor count: ${report.visitorCount}, Meals: ${report.mealsCounted}`,
        time: report.createdAt,
        icon: "TrendingUp",
      });
    });

    // Sort by time and take the most recent 10
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  } catch (error) {
    console.error("Get recent activity error:", error);
    return [];
  }
}

export async function getQuickActionsData() {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        menusCount: 0,
        recipesCount: 0,
        kitchensCount: 0,
        ingredientsCount: 0,
      };
    }

    const whereClause: any = {};

    // If user is not admin, filter by their kitchen
    if (session.user.role !== "ADMIN" && session.user.kitchenId) {
      whereClause.kitchenId = session.user.kitchenId;
    }

    const [menusCount, recipesCount, kitchensCount, ingredientsCount] =
      await Promise.all([
        prisma.menu.count({
          where: {
            ...whereClause,
            date: {
              gte: new Date(),
            },
          },
        }),
        prisma.recipe.count({
          where: whereClause,
        }),
        prisma.kitchen.count({
          where:
            session.user.role === "ADMIN"
              ? {}
              : {
                  id: session.user.kitchenId,
                },
        }),
        prisma.ingredient.count({
          where: {
            recipe: whereClause,
          },
        }),
      ]);

    return {
      menusCount,
      recipesCount,
      kitchensCount,
      ingredientsCount,
    };
  } catch (error) {
    console.error("Get quick actions data error:", error);
    return {
      menusCount: 0,
      recipesCount: 0,
      kitchensCount: 0,
      ingredientsCount: 0,
    };
  }
}
