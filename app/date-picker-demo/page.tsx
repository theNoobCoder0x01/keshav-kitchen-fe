"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompactDateSelector } from "@/components/ui/compact-date-selector";
import { DateSelector } from "@/components/ui/date-selector";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export default function DatePickerDemoPage() {
  const [selectedDate1, setSelectedDate1] = useState<Date>(new Date());
  const [selectedDate2, setSelectedDate2] = useState<Date>(new Date());
  const [selectedDate3, setSelectedDate3] = useState<Date>(new Date());
  const [selectedDate4, setSelectedDate4] = useState<Date>(new Date());
  const [selectedDate5, setSelectedDate5] = useState<Date>(new Date());

  return (
    <DashboardLayout activeMenuItem="menus">
      <PageHeader
        title="Date Picker Components"
        subtitle="Showcase of all available date picker variants and their features"
      />

      <div className="space-y-8">
        {/* Enhanced Date Picker Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Date Picker</CardTitle>
            <CardDescription>
              Modern date picker with different variants and enhanced styling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Default Variant</h4>
                <EnhancedDatePicker
                  date={selectedDate1}
                  onDateChange={setSelectedDate1}
                  placeholder="Pick a date"
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Compact Variant</h4>
                <EnhancedDatePicker
                  date={selectedDate2}
                  onDateChange={setSelectedDate2}
                  variant="compact"
                  placeholder="Pick a date"
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Minimal Variant</h4>
                <EnhancedDatePicker
                  date={selectedDate3}
                  onDateChange={setSelectedDate3}
                  variant="minimal"
                  placeholder="Pick a date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Modern Date Picker Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Modern Date Picker</CardTitle>
            <CardDescription>
              Advanced date picker with inline, popover, and compact variants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Popover Variant</h4>
                <ModernDatePicker
                  date={selectedDate4}
                  onDateChange={setSelectedDate4}
                  variant="popover"
                  placeholder="Select date"
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Compact Variant</h4>
                <ModernDatePicker
                  date={selectedDate5}
                  onDateChange={setSelectedDate5}
                  variant="compact"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Inline Variant</h4>
              <ModernDatePicker
                date={selectedDate1}
                onDateChange={setSelectedDate1}
                variant="inline"
                showNavigation={true}
                showToday={true}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Original Components */}
        <Card>
          <CardHeader>
            <CardTitle>Original Components</CardTitle>
            <CardDescription>
              The original date selector components for comparison
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Original Date Selector</h4>
                <DateSelector
                  date={selectedDate2}
                  onDateChange={setSelectedDate2}
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Compact Date Selector</h4>
                <CompactDateSelector
                  date={selectedDate3}
                  onDateChange={setSelectedDate3}
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
              Overview of features available in each date picker variant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Feature</th>
                    <th className="text-left py-2 font-medium">
                      Enhanced Date Picker
                    </th>
                    <th className="text-left py-2 font-medium">
                      Modern Date Picker
                    </th>
                    <th className="text-left py-2 font-medium">
                      Original Components
                    </th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-border/50">
                    <td className="py-2">Multiple Variants</td>
                    <td className="py-2 text-green-600">
                      ✓ Default, Compact, Minimal
                    </td>
                    <td className="py-2 text-green-600">
                      ✓ Inline, Popover, Compact
                    </td>
                    <td className="py-2 text-muted-foreground">
                      Single variant
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Enhanced Calendar</td>
                    <td className="py-2 text-green-600">✓ Modern styling</td>
                    <td className="py-2 text-green-600">✓ Modern styling</td>
                    <td className="py-2 text-muted-foreground">
                      Basic styling
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Navigation Controls</td>
                    <td className="py-2 text-muted-foreground">
                      Calendar only
                    </td>
                    <td className="py-2 text-green-600">
                      ✓ Previous/Next + Today
                    </td>
                    <td className="py-2 text-green-600">✓ Previous/Next</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Today Indicator</td>
                    <td className="py-2 text-green-600">✓ Visual indicator</td>
                    <td className="py-2 text-green-600">✓ Badge + Button</td>
                    <td className="py-2 text-muted-foreground">Basic</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Clear Selection</td>
                    <td className="py-2 text-green-600">✓ Clear button</td>
                    <td className="py-2 text-muted-foreground">No</td>
                    <td className="py-2 text-muted-foreground">No</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Focus States</td>
                    <td className="py-2 text-green-600">✓ Enhanced focus</td>
                    <td className="py-2 text-green-600">✓ Enhanced focus</td>
                    <td className="py-2 text-muted-foreground">Basic</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Hover Effects</td>
                    <td className="py-2 text-green-600">
                      ✓ Smooth transitions
                    </td>
                    <td className="py-2 text-green-600">
                      ✓ Smooth transitions
                    </td>
                    <td className="py-2 text-muted-foreground">Basic</td>
                  </tr>
                  <tr>
                    <td className="py-2">Dark Mode</td>
                    <td className="py-2 text-green-600">✓ Full support</td>
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
