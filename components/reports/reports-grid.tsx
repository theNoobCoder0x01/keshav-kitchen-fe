import { ReportCard } from "./report-card";

interface ReportsGridProps {
  onDownload: (type: string) => void;
}

export function ReportsGrid({ onDownload }: ReportsGridProps) {
  const reportData = {
    breakfast: Array(6).fill({
      name: "Idali Sambhar",
      weight: "25 Kg",
      quantity: "500 Kg",
    }),
    lunch: Array(6).fill({
      name: "Idali Sambhar",
      weight: "25 Kg",
      quantity: "500 Kg",
    }),
    dinner: Array(6).fill({
      name: "Idali Sambhar",
      weight: "25 Kg",
      quantity: "500 Kg",
    }),
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <ReportCard
        title="Breakfast"
        items={reportData.breakfast}
        onDownload={() => onDownload("breakfast")}
      />
      <ReportCard
        title="Lunch"
        items={reportData.lunch}
        onDownload={() => onDownload("lunch")}
      />
      <ReportCard
        title="Dinner"
        items={reportData.dinner}
        onDownload={() => onDownload("dinner")}
      />
    </div>
  );
}
