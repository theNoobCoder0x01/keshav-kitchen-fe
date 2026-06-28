"use client";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

import {
  DailyMenuSection,
  type DailyMenuRowDescriptor,
} from "@/components/menu/daily-menu-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompactDateSelector } from "@/components/ui/compact-date-selector";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TabNavigation,
  TabNavigationSkeleton,
} from "@/components/ui/tab-navigation";
import { useTithi } from "@/hooks/use-tithi";
import { useTranslations } from "@/hooks/use-translations";
import { fetchKitchens } from "@/lib/api/kitchens";
import { fetchMealPersonCounts } from "@/lib/api/meal-person-counts";
import { fetchMenuComponents } from "@/lib/api/menu-components";
import { fetchMenus } from "@/lib/api/menus";
import { fetchPremises } from "@/lib/api/premises";
import { fetchAllRecipesForDropdown } from "@/lib/api/recipes";
import { DailyMenuProvider } from "@/lib/contexts/daily-menu-context";
import type { Kitchen } from "@/types/kitchens";
import type { MenuComponentApiItem } from "@/types/menu-components";
import { MealTypeEnum, type MealType } from "@/types/menus";
import type { RecipeApiItem } from "@/types/recipes";

const MEAL_TYPES: MealType[] = [
  MealTypeEnum.BREAKFAST,
  MealTypeEnum.LUNCH,
  MealTypeEnum.DINNER,
  MealTypeEnum.SNACK,
];

export default function DailyMenuBuilderPage() {
  const { t } = useTranslations();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [premises, setPremises] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [recipes, setRecipes] = useState<RecipeApiItem[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [defaultKitchenId, setDefaultKitchenId] = useState("");

  const [menus, setMenus] = useState<any[]>([]);
  const [menuComponents, setMenuComponents] = useState<MenuComponentApiItem[]>(
    [],
  );
  const [personCountsByMealType, setPersonCountsByMealType] = useState<
    Record<string, Record<string, number>>
  >({});
  const [adHocByMealType, setAdHocByMealType] = useState<
    Record<string, string[]>
  >({});

  const [loadingPremises, setLoadingPremises] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  const tithiInfo = useTithi(selectedDate);
  const premiseId: string | undefined = premises[activeTab]?.id;
  const userId: string | undefined = session?.user?.id;

  // Load premises + shared lookup data (recipes, kitchens) once.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [premisesData, kitchensData, recipesData] = await Promise.all([
          fetchPremises(),
          fetchKitchens(),
          fetchAllRecipesForDropdown(),
        ]);
        if (cancelled) return;
        setPremises(premisesData);
        setKitchens(kitchensData);
        setRecipes(recipesData);
        if (kitchensData.length > 0) {
          setDefaultKitchenId((prev) => prev || kitchensData[0].id);
        }
      } catch (error) {
        if (!cancelled) toast.error(t("dailyMenu.loadError"));
      } finally {
        if (!cancelled) setLoadingPremises(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // `t` is intentionally excluded: useTranslations returns a new function each
    // render, so depending on it would re-run this fetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDayData = useCallback(async () => {
    if (!premiseId) return;
    setLoadingData(true);
    try {
      const [menusData, componentsData, personCountsData] = await Promise.all([
        fetchMenus({ premiseId, epochMs: selectedDate.getTime() }),
        fetchMenuComponents(premiseId, {}),
        fetchMealPersonCounts(premiseId, { epochMs: selectedDate.getTime() }),
      ]);
      setMenus(menusData);
      setMenuComponents(componentsData);
      setPersonCountsByMealType(
        personCountsData.reduce(
          (acc: Record<string, Record<string, number>>, row: any) => {
            acc[row.mealType] = {
              ...(acc[row.mealType] || {}),
              [row.personTypeId]: row.count,
            };
            return acc;
          },
          {},
        ),
      );
      setAdHocByMealType({});
    } catch (error) {
      toast.error(t("dailyMenu.loadError"));
    } finally {
      setLoadingData(false);
    }
    // `t` excluded on purpose (new identity each render). See note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [premiseId, selectedDate]);

  useEffect(() => {
    if (premiseId) loadDayData();
  }, [premiseId, loadDayData]);

  // Refetch just the menu list (used after a deletion) without clearing the
  // shared lookup data or person counts.
  const reloadMenus = useCallback(async () => {
    if (!premiseId) return;
    try {
      const data = await fetchMenus({
        premiseId,
        epochMs: selectedDate.getTime(),
      });
      setMenus(data);
    } catch {
      /* non-fatal */
    }
  }, [premiseId, selectedDate]);

  const removeAdHocPlaceholder = useCallback((rowKey: string) => {
    if (!rowKey.startsWith("adhoc:")) return;
    setAdHocByMealType((prev) => {
      const next: Record<string, string[]> = {};
      for (const mt of Object.keys(prev)) {
        next[mt] = prev[mt].filter((key) => key !== rowKey);
      }
      return next;
    });
  }, []);

  // After a row's first create, drop its local placeholder (the saved menu now
  // arrives from the server) and refetch so slot/ad-hoc rows reconcile.
  const handleRowCreated = useCallback(
    (rowKey: string) => {
      removeAdHocPlaceholder(rowKey);
      void reloadMenus();
    },
    [removeAdHocPlaceholder, reloadMenus],
  );

  const handleRowDeleted = useCallback(
    (rowKey: string, menuId: string | null) => {
      removeAdHocPlaceholder(rowKey);
      // Only refetch when something was actually persisted server-side.
      if (menuId) void reloadMenus();
    },
    [removeAdHocPlaceholder, reloadMenus],
  );

  const handleAddAdHoc = useCallback((mealType: MealType) => {
    setAdHocByMealType((prev) => ({
      ...prev,
      [mealType]: [...(prev[mealType] || []), `adhoc:${uuidv4()}`],
    }));
  }, []);

  const rowsByMealType = useMemo(() => {
    const result: Record<string, DailyMenuRowDescriptor[]> = {};
    for (const mealType of MEAL_TYPES) {
      const components = menuComponents
        .filter((component) => component.mealType === mealType)
        .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      const mealMenus = menus.filter((menu) => menu.mealType === mealType);

      const slotRows: DailyMenuRowDescriptor[] = components.map((component) => {
        const menu = mealMenus.find((m) => m.menuComponentId === component.id);
        return {
          rowKey: `slot:${component.id}:${menu?.id ?? "empty"}`,
          categoryLabel: component.label,
          menuComponentId: component.id,
          menuComponent: component,
          initialMenu: menu ?? null,
        };
      });

      const adHocMenuRows: DailyMenuRowDescriptor[] = mealMenus
        .filter((menu) => !menu.menuComponentId)
        .map((menu) => ({
          rowKey: `menu:${menu.id}`,
          categoryLabel: "",
          initialMenu: menu,
        }));

      const placeholderRows: DailyMenuRowDescriptor[] = (
        adHocByMealType[mealType] || []
      ).map((rowKey) => ({ rowKey, categoryLabel: "", initialMenu: null }));

      result[mealType] = [...slotRows, ...adHocMenuRows, ...placeholderRows];
    }
    return result;
  }, [menuComponents, menus, adHocByMealType]);

  const contextValue = useMemo(
    () => ({
      recipes,
      kitchens,
      premiseId: premiseId ?? "",
      selectedDate,
      userId: userId ?? "",
      defaultKitchenId,
      personCountsByMealType,
    }),
    [
      recipes,
      kitchens,
      premiseId,
      selectedDate,
      userId,
      defaultKitchenId,
      personCountsByMealType,
    ],
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title={t("dailyMenu.title")}
        subtitle={t("dailyMenu.subtitle")}
        actions={
          <div className="flex items-center gap-3">
            <CompactDateSelector
              date={selectedDate}
              onDateChange={setSelectedDate}
              className="w-auto"
            />
            <Button variant="outline" asChild>
              <Link href="/menus">
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t("dailyMenu.backToDashboard")}
              </Link>
            </Button>
          </div>
        }
      />

      {/* PDF-style day banner */}
      <Card className="border-border bg-card/60">
        <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
          <h2 className="text-lg font-bold text-primary">
            {premises[activeTab]?.name ?? t("dailyMenu.title")}
          </h2>
          <p className="text-sm font-medium text-foreground">
            {selectedDate.toLocaleDateString(undefined, {
              weekday: "long",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          {tithiInfo.tithi ? (
            <p className="text-sm text-muted-foreground">{tithiInfo.tithi}</p>
          ) : null}
        </CardContent>
      </Card>

      {loadingPremises ? (
        <TabNavigationSkeleton tabCount={4} />
      ) : premises.length === 0 ? (
        <Card className="p-4">
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="flex items-center gap-2 text-xl text-muted-foreground">
              <AlertTriangle className="h-7 w-7" />
              {t("menus.noPremisesFound")}
            </p>
            <Button onClick={() => router.push("/premises")}>
              {t("menus.managePremises")}
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <TabNavigation
            tabs={premises.map((premise) => premise.name)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Day-level default kitchen */}
          <div className="flex flex-col gap-1 sm:max-w-xs">
            <Label className="text-sm font-medium text-foreground">
              {t("dailyMenu.defaultKitchen")}
            </Label>
            <Select value={defaultKitchenId} onValueChange={setDefaultKitchenId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("meals.selectKitchen")} />
              </SelectTrigger>
              <SelectContent searchable>
                {kitchens.map((kitchen) => (
                  <SelectItem key={kitchen.id} value={kitchen.id}>
                    {kitchen.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("dailyMenu.defaultKitchenHint")}
            </p>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : (
            <DailyMenuProvider value={contextValue}>
              <div className="flex flex-col gap-4">
                {MEAL_TYPES.map((mealType) => (
                  <DailyMenuSection
                    key={mealType}
                    mealType={mealType}
                    title={t(`dailyMenu.period.${mealType}`)}
                    rows={rowsByMealType[mealType] || []}
                    onRowCreated={handleRowCreated}
                    onRowDeleted={handleRowDeleted}
                    onAddAdHoc={() => handleAddAdHoc(mealType)}
                  />
                ))}
              </div>
            </DailyMenuProvider>
          )}
        </>
      )}
    </div>
  );
}
