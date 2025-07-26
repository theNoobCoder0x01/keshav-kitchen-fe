"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";

interface ReportItem {
  name: string;
  weight: string;
  quantity: string;
}

interface ReportCardProps {
  title: string;
  items: ReportItem[];
  onDownload: (format: string) => void;
  onAdd: () => void;
  onEdit: (item: ReportItem) => void;
  onDelete: (item: ReportItem) => void;
}

import { useState } from "react";

export function ReportCard({ title, items, onDownload, onAdd, onEdit, onDelete }: ReportCardProps) {
  const [format, setFormat] = useState("xlsx");
  return (
    <Card className="bg-white border-[#dbdade]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#4b465c]">{title}</h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="default" onClick={onAdd}>
              + Add
            </Button>
            <select
              className="mr-2 px-2 py-1 border rounded text-sm"
              value={format}
              onChange={e => setFormat(e.target.value)}
            >
              <option value="xlsx">Excel</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              className="border-[#674af5] text-[#674af5] hover:bg-[#674af5]/10 bg-transparent"
              onClick={() => onDownload(format)}
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {items?.map((item, index) => (
            <div key={index} className="space-y-2 border-b pb-2 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#4b465c] font-medium">{item.name}</p>
                  <p className="text-sm text-[#4b465c]/70">{item.weight}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(item)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(item)}>Delete</Button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#4b465c]/70">Quantity</label>
                <Input
                  defaultValue={item.quantity}
                  className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20 text-sm"
                  readOnly
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
