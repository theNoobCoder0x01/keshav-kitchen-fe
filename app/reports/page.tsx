"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DateSelector } from "@/components/ui/date-selector";
import { StatsGrid } from "@/components/ui/stats-grid";
import { TabNavigation } from "@/components/ui/tab-navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsGrid } from "@/components/reports/reports-grid";
import { Button } from "@/components/ui/button";
import { Users, Download } from "lucide-react";
import { useState, useEffect } from "react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const tabs = ["Thakorji", "Premvati", "Aarsh", "Mandir", "Prasad"];

  const [statsData, setStatsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const { fetchStats } = await import('@/lib/api/stats');
        const stats = await fetchStats();
        setStatsData(stats);
      } catch (err: any) {
        setError('Failed to load stats data.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const handleDownload = async (type: string, format: string = "xlsx") => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/reports/download?type=${type}&date=${dateStr}&format=${format}`);
      if (!response.ok) throw new Error('Failed to download report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${dateStr}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      import('sonner').then(({ toast }) => toast.success('Report downloaded!'));
    } catch (err) {
      import('sonner').then(({ toast }) => toast.error('Failed to download report.'));
    }
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
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
