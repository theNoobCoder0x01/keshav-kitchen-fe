"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download } from "lucide-react"

interface ReportItem {
  name: string
  weight: string
  quantity: string
}

interface ReportCardProps {
  title: string
  items: ReportItem[]
  onDownload: () => void
}

export function ReportCard({ title, items, onDownload }: ReportCardProps) {
  return (
    <Card className="bg-white border-[#dbdade]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#4b465c]">{title}</h3>
          <Button
            size="sm"
            variant="outline"
            className="border-[#674af5] text-[#674af5] hover:bg-[#674af5]/10 bg-transparent"
            onClick={onDownload}
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#4b465c] font-medium">{item.name}</p>
                  <p className="text-sm text-[#4b465c]/70">{item.weight}</p>
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
  )
}
