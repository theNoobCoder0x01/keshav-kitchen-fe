import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function QuickActionsSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <Skeleton className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StatsOverviewSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function RecentActivitySkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-6 w-36 mb-4" />
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="w-full">
      {/* Header Section Skeleton */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <QuickActionsSkeleton />

      {/* Stats Overview Skeleton */}
      <StatsOverviewSkeleton />

      {/* Recent Activity Skeleton */}
      <RecentActivitySkeleton />
    </div>
  );
}
