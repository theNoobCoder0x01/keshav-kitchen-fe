"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export default function CalendarDemoPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );

  return (
    <DashboardLayout activeMenuItem="menus">
      <PageHeader
        title="Enhanced Calendar Components"
        subtitle="Showcase of all enhanced calendar features, variants, and sizes"
      />

      <div className="space-y-8">
        {/* Size Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Size Variants</CardTitle>
            <CardDescription>
              Different sizes for different use cases - small, medium, and large
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Small Size</h4>
                  <Badge variant="secondary">Compact</Badge>
                </div>
                <EnhancedCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  size="sm"
                  className="border border-border/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Medium Size</h4>
                  <Badge variant="secondary">Default</Badge>
                </div>
                <EnhancedCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  size="md"
                  className="border border-border/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Large Size</h4>
                  <Badge variant="secondary">Prominent</Badge>
                </div>
                <EnhancedCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  size="lg"
                  className="border border-border/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Visual Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Visual Variants</CardTitle>
            <CardDescription>
              Different visual styles for different contexts and designs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Default Variant</h4>
                  <Badge variant="default">Standard</Badge>
                </div>
                <EnhancedCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  variant="default"
                  size="md"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Compact Variant</h4>
                  <Badge variant="secondary">Minimal</Badge>
                </div>
                <EnhancedCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  variant="compact"
                  size="md"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Minimal Variant</h4>
                  <Badge variant="outline">Clean</Badge>
                </div>
                <EnhancedCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  variant="minimal"
                  size="md"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Feature Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Features</CardTitle>
            <CardDescription>
              Showcase of advanced features like week numbers, dropdowns, and
              range selection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">With Week Numbers</h4>
                  <Badge variant="secondary">Week tracking</Badge>
                </div>
                <EnhancedCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  showWeekNumbers={true}
                  size="md"
                  className="border border-border/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Date Range Selection</h4>
                  <Badge variant="secondary">Multi-select</Badge>
                </div>
                <EnhancedCalendar
                  mode="range"
                  selected={{
                    from: selectedDate,
                    to: selectedDate
                      ? new Date(
                          selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000,
                        )
                      : undefined,
                  }}
                  onSelect={(range) => {
                    if (range?.from) setSelectedDate(range.from);
                  }}
                  size="md"
                  className="border border-border/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Multiple Date Selection</h4>
                <Badge variant="secondary">Pick multiple dates</Badge>
              </div>
              <EnhancedCalendar
                mode="multiple"
                selected={selectedDate ? [selectedDate] : []}
                onSelect={(dates) => {
                  if (dates && dates.length > 0) setSelectedDate(dates[0]);
                }}
                size="md"
                className="border border-border/50"
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Dropdown Features */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation Features</CardTitle>
            <CardDescription>
              Enhanced navigation with month and year dropdowns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">
                    With Month/Year Dropdowns
                  </h4>
                  <Badge variant="secondary">Quick navigation</Badge>
                </div>
                <EnhancedCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  showMonthDropdown={true}
                  showYearDropdown={true}
                  size="md"
                  className="border border-border/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Navigation Only</h4>
                  <Badge variant="secondary">Arrow navigation</Badge>
                </div>
                <EnhancedCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  showMonthDropdown={false}
                  showYearDropdown={false}
                  size="md"
                  className="border border-border/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Interactive Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Examples</CardTitle>
            <CardDescription>
              Real-world examples with different configurations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Event Calendar</h4>
                  <Badge variant="default">With events</Badge>
                </div>
                <EnhancedCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  variant="default"
                  size="md"
                  className="border border-border/50"
                  modifiers={{
                    event: (date) => {
                      // Example: Highlight weekends as events
                      return date.getDay() === 0 || date.getDay() === 6;
                    },
                  }}
                  modifiersStyles={{
                    event: {
                      backgroundColor: "hsl(var(--primary) / 0.1)",
                      color: "hsl(var(--primary))",
                      fontWeight: "600",
                    },
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Booking Calendar</h4>
                  <Badge variant="secondary">Availability</Badge>
                </div>
                <EnhancedCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  variant="compact"
                  size="md"
                  className="border border-border/50"
                  disabled={(date) => {
                    // Example: Disable past dates
                    return date < new Date();
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Features Comparison</CardTitle>
            <CardDescription>
              Overview of all enhanced calendar features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Feature</th>
                    <th className="text-left py-2 font-medium">
                      Enhanced Calendar
                    </th>
                    <th className="text-left py-2 font-medium">
                      Original Calendar
                    </th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-border/50">
                    <td className="py-2">Size Variants</td>
                    <td className="py-2 text-green-600">
                      ✓ Small, Medium, Large
                    </td>
                    <td className="py-2 text-muted-foreground">Single size</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Visual Variants</td>
                    <td className="py-2 text-green-600">
                      ✓ Default, Compact, Minimal
                    </td>
                    <td className="py-2 text-muted-foreground">Single style</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Week Numbers</td>
                    <td className="py-2 text-green-600">✓ Optional display</td>
                    <td className="py-2 text-muted-foreground">
                      Not available
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Month/Year Dropdowns</td>
                    <td className="py-2 text-green-600">✓ Quick navigation</td>
                    <td className="py-2 text-muted-foreground">Arrow only</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Enhanced Styling</td>
                    <td className="py-2 text-green-600">✓ Modern design</td>
                    <td className="py-2 text-muted-foreground">
                      Basic styling
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Hover Effects</td>
                    <td className="py-2 text-green-600">✓ Scale animations</td>
                    <td className="py-2 text-muted-foreground">Basic hover</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Focus States</td>
                    <td className="py-2 text-green-600">✓ Enhanced focus</td>
                    <td className="py-2 text-muted-foreground">Basic focus</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Accessibility</td>
                    <td className="py-2 text-green-600">✓ Improved ARIA</td>
                    <td className="py-2 text-muted-foreground">Basic</td>
                  </tr>
                  <tr>
                    <td className="py-2">Dark Mode</td>
                    <td className="py-2 text-green-600">✓ Full support</td>
                    <td className="py-2 text-green-600">✓ Full support</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
