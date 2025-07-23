"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DateSelector } from "@/components/ui/date-selector";
import { StatsGrid } from "@/components/ui/stats-grid";
import { TabNavigation } from "@/components/ui/tab-navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsGrid } from "@/components/reports/reports-grid";
import { Button } from "@/components/ui/button";
import { Users, Download } from "lucide-react";
import { useState } from "react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const tabs = ["Thakorji", "Premvati", "Aarsh", "Mandir", "Prasad"];

  const statsData = [
    {
      label: "Total Served",
      value: "500",
      icon: Users,
      iconColor: "#00cfe8",
      trend: { value: 15, isPositive: true },
    },
    {
      label: "Breakfast",
      value: "350",
      icon: Users,
      iconColor: "#28c76f",
      trend: { value: 8, isPositive: true },
    },
    {
      label: "Lunch",
      value: "200",
      icon: Users,
      iconColor: "#ff9f43",
      trend: { value: 12, isPositive: true },
    },
    {
      label: "Dinner",
      value: "150",
      icon: Users,
      iconColor: "#ea5455",
      trend: { value: 5, isPositive: false },
    },
  ];

  const handleDownload = (type: string) => {
    console.log(`Downloading ${type} report`);
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    console.log(`Switched to tab: ${tabs[index]}`);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    console.log(`Reports date changed to: ${date.toDateString()}`);
  };

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <PageHeader
          title="Reports & Analytics"
          subtitle="Track performance and generate detailed reports"
          actions={
            <Button
              className="bg-gradient-to-r from-[#674af5] to-[#856ef7] hover:from-[#674af5]/90 hover:to-[#856ef7]/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => handleDownload("all")}
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          }
        />
      </div>

      {/* Date and Stats Section */}
      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 mb-6">
          <div className="xl:col-span-2">
            <DateSelector
              date={selectedDate}
              onDateChange={handleDateChange}
              className="h-full min-h-[120px]"
            />
          </div>
          <div className="xl:col-span-3">
            <StatsGrid stats={statsData} />
          </div>
        </div>
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Reports Section */}
      <div className="space-y-6">
        <ReportsGrid onDownload={handleDownload} />
      </div>
    </DashboardLayout>
  );
}
