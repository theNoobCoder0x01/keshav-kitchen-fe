"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import { useState } from "react"

interface Ingredient {
  name: string
  quantity: string
  unit: string
}

interface AddRecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddRecipeDialog({ open, onOpenChange }: AddRecipeDialogProps) {
  const [recipeName, setRecipeName] = useState("Poha")
  const [recipeType, setRecipeType] = useState("breakfast")
  const [selectedRecipe, setSelectedRecipe] = useState("poha")
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: "Potato", quantity: "5", unit: "Kg" }])

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "Kg" }])
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = ingredients.map((ingredient, i) => {
      if (i === index) {
        return { ...ingredient, [field]: value }
      }
      return ingredient
    })
    setIngredients(updated)
  }

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = () => {
    // Validate form
    if (!recipeName.trim()) {
      alert("Please enter a recipe name")
      return
    }

    if (ingredients.some((ing) => !ing.name.trim() || !ing.quantity.trim())) {
      alert("Please fill in all ingredient details")
      return
    }

    console.log("Submitting recipe:", {
      recipeName,
      recipeType,
      selectedRecipe,
      ingredients,
    })

    handleClose()
  }

  const handleClose = () => {
    // Reset form
    setRecipeName("Poha")
    setRecipeType("breakfast")
    setSelectedRecipe("poha")
    setIngredients([{ name: "Potato", quantity: "5", unit: "Kg" }])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#4b465c]">Add New Recipe</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <Label className="text-base font-medium text-[#4b465c] mb-2 block">Recipe Name</Label>
            <Input
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="Enter recipe name"
              className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium text-[#4b465c] mb-2 block">Recipe Type</Label>
              <Select value={recipeType} onValueChange={setRecipeType}>
                <SelectTrigger className="border-[#dbdade]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-medium text-[#4b465c] mb-2 block">Recipe</Label>
              <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
                <SelectTrigger className="border-[#dbdade]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poha">Poha</SelectItem>
                  <SelectItem value="upma">Upma</SelectItem>
                  <SelectItem value="paratha">Paratha</SelectItem>
                  <SelectItem value="idli">Idli Sambhar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium text-[#4b465c]">Ingredients</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[#674af5] hover:bg-[#674af5]/10 h-auto p-2"
                onClick={addIngredient}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Ingredients
              </Button>
            </div>

            {ingredients.map((ingredient, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Label className="text-sm font-medium text-[#4b465c] mb-1 block">Ingredients</Label>
                  <Input
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, "name", e.target.value)}
                    placeholder="Ingredient name"
                    className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                  />
                </div>
                <div className="col-span-4">
                  <Label className="text-sm font-medium text-[#4b465c] mb-1 block">Quantity</Label>
                  <Input
                    value={ingredient.quantity}
                    onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                    placeholder="5"
                    className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                    type="number"
                    step="0.1"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-[#4b465c] mb-1 block">Unit</Label>
                  <Select value={ingredient.unit} onValueChange={(value) => updateIngredient(index, "unit", value)}>
                    <SelectTrigger className="border-[#dbdade] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kg">Kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="pcs">pcs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                    className="w-8 h-8 p-0 text-[#ea5455] hover:bg-[#ea5455]/10"
                    disabled={ingredients.length === 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
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
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
