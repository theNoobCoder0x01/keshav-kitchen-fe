"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportDialog({ open, onOpenChange }: ReportDialogProps) {
  const [selectedKitchens, setSelectedKitchens] = useState<string[]>(["thakorji"])
  const [selectedRecipe, setSelectedRecipe] = useState("chef")

  const kitchens = [
    { id: "thakorji", label: "Thakorji" },
    { id: "premvati", label: "Premvati" },
    { id: "mandir", label: "Mandir" },
    { id: "aarsh", label: "Aarsh" },
  ]

  const handleKitchenChange = (kitchenId: string, checked: boolean) => {
    if (checked) {
      setSelectedKitchens([...selectedKitchens, kitchenId])
    } else {
      setSelectedKitchens(selectedKitchens.filter((id) => id !== kitchenId))
    }
  }

  const handleSubmit = () => {
    console.log("Generating report:", {
      kitchens: selectedKitchens,
      recipe: selectedRecipe,
    })
    onOpenChange(false)
  }

  const handleClose = () => {
    setSelectedKitchens(["thakorji"])
    setSelectedRecipe("chef")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#4b465c]">Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <Label className="text-base font-medium text-[#4b465c] mb-3 block">Kitchen</Label>
            <div className="grid grid-cols-2 gap-4">
              {kitchens.map((kitchen) => (
                <div key={kitchen.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={kitchen.id}
                    checked={selectedKitchens.includes(kitchen.id)}
                    onCheckedChange={(checked) => handleKitchenChange(kitchen.id, checked as boolean)}
                  />
                  <Label htmlFor={kitchen.id} className="text-[#4b465c] cursor-pointer">
                    {kitchen.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-base font-medium text-[#4b465c] mb-2 block">Recipe</Label>
            <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
              <SelectTrigger className="border-[#dbdade]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chef">Chef</SelectItem>
                <SelectItem value="assistant">Assistant</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-[#dbdade] text-[#4b465c] hover:bg-[#f8f7fa] bg-transparent"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#674af5] hover:bg-[#674af5]/90 text-white">
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
