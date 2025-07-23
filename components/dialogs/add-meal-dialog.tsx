"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { getKitchens } from "@/lib/actions/kitchens"
import { createDailyMenu } from "@/lib/actions/menu"
import { getRecipes } from "@/lib/actions/recipes"
import { Plus } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

interface Ingredient {
  name: string
  ghan: string
  quantity: string
  costPerKg: number
}

interface AddMealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mealType: string
  selectedDate: Date
}

export function AddMealDialog({ open, onOpenChange, mealType, selectedDate }: AddMealDialogProps) {
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const [recipes, setRecipes] = useState<any[]>([])
  const [kitchens, setKitchens] = useState<any[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState("")
  const [selectedKitchen, setSelectedKitchen] = useState("")
  const [followRecipe, setFollowRecipe] = useState(true)
  const [ghan, setGhan] = useState("10")
  const [plannedServings, setPlannedServings] = useState("100")
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "Potato", ghan: "5", quantity: "500", costPerKg: 30 },
    { name: "Onion", ghan: "3", quantity: "300", costPerKg: 25 },
  ])

  // Calculations
  const [calculations, setCalculations] = useState({
    perPerson: 100, // grams per person
    perPersonCost: 0,
    oneGhanPersons: 0,
    totalPersons: 0,
  })

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  useEffect(() => {
    calculateValues()
  }, [ghan, ingredients])

  const loadData = async () => {
    try {
      const [recipesData, kitchensData] = await Promise.all([getRecipes(1, 100), getKitchens()])

      setRecipes(recipesData)
      setKitchens(kitchensData)

      // Set default kitchen if user has one
      if (session?.user?.kitchenId) {
        setSelectedKitchen(session.user.kitchenId)
      }
    } catch (error) {
      toast.error("Failed to load data")
    }
  }

  const calculateValues = () => {
    const ghanValue = Number.parseFloat(ghan) || 0
    const totalCost = ingredients.reduce((sum, ingredient) => {
      const qty = Number.parseFloat(ingredient.quantity) || 0
      return sum + (qty * ingredient.costPerKg) / 1000 // cost per gram
    }, 0)

    const totalQuantity = ingredients.reduce((sum, ingredient) => {
      return sum + (Number.parseFloat(ingredient.quantity) || 0)
    }, 0)

    const perPersonCost = totalQuantity > 0 ? (totalCost * 100) / totalQuantity : 0 // cost for 100g
    const oneGhanPersons = totalQuantity > 0 ? Math.floor(totalQuantity / 100) : 0 // persons per 1 ghan
    const totalPersons = oneGhanPersons * ghanValue

    setCalculations({
      perPerson: 100,
      perPersonCost: Math.round(perPersonCost * 100) / 100,
      oneGhanPersons,
      totalPersons,
    })
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", ghan: "5", quantity: "500", costPerKg: 20 }])
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = ingredients.map((ingredient, i) => {
      if (i === index) {
        const newIngredient = { ...ingredient, [field]: value }
        // Auto-calculate quantity based on ghan when ghan changes
        if (field === "ghan") {
          const ghanValue = Number.parseFloat(value as string) || 0
          newIngredient.quantity = (ghanValue * 100).toString() // 100g per ghan unit
        }
        return newIngredient
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
    if (!selectedRecipe || !selectedKitchen) {
      toast.error("Please select a recipe and kitchen")
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("kitchenId", selectedKitchen)
        formData.append("menuDate", selectedDate.toISOString())
        formData.append("mealType", mealType.toUpperCase())
        formData.append("recipeId", selectedRecipe)
        formData.append("plannedServings", plannedServings)
        formData.append("ghanMultiplier", ghan)

        const result = await createDailyMenu(formData)

        if (result.success) {
          toast.success("Menu item added successfully!")
          handleClose()
        } else {
          toast.error(result.error || "Failed to add menu item")
        }
      } catch (error) {
        toast.error("An error occurred")
      }
    })
  }

  const handleClose = () => {
    // Reset form when closing
    setSelectedRecipe("")
    setFollowRecipe(true)
    setGhan("10")
    setPlannedServings("100")
    setIngredients([
      { name: "Potato", ghan: "5", quantity: "500", costPerKg: 30 },
      { name: "Onion", ghan: "3", quantity: "300", costPerKg: 25 },
    ])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#4b465c]">Add {mealType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium text-[#4b465c] mb-2 block">Kitchen</Label>
              <Select value={selectedKitchen} onValueChange={setSelectedKitchen}>
                <SelectTrigger className="border-[#dbdade]">
                  <SelectValue placeholder="Select kitchen" />
                </SelectTrigger>
                <SelectContent>
                  {kitchens.map((kitchen) => (
                    <SelectItem key={kitchen.id} value={kitchen.id}>
                      {kitchen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-medium text-[#4b465c] mb-2 block">Recipe</Label>
              <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
                <SelectTrigger className="border-[#dbdade]">
                  <SelectValue placeholder="Select recipe" />
                </SelectTrigger>
                <SelectContent>
                  {recipes.map((recipe) => (
                    <SelectItem key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Label className="text-base font-medium text-[#4b465c]">Follow Recipe</Label>
            <Switch
              checked={followRecipe}
              onCheckedChange={setFollowRecipe}
              className="data-[state=checked]:bg-[#674af5]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium text-[#4b465c] mb-2 block">Ghan Multiplier</Label>
              <Input
                value={ghan}
                onChange={(e) => setGhan(e.target.value)}
                className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                type="number"
                min="0.1"
                step="0.1"
              />
            </div>

            <div>
              <Label className="text-base font-medium text-[#4b465c] mb-2 block">Planned Servings</Label>
              <Input
                value={plannedServings}
                onChange={(e) => setPlannedServings(e.target.value)}
                className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                type="number"
                min="1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium text-[#4b465c] block">Ingredients</Label>
            {ingredients.map((ingredient, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 items-end">
                <div>
                  <Label className="text-sm font-medium text-[#4b465c] mb-1 block">Name</Label>
                  <Input
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, "name", e.target.value)}
                    placeholder="Ingredient name"
                    className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#4b465c] mb-1 block">1 Ghan (Kg)</Label>
                  <Input
                    value={ingredient.ghan}
                    onChange={(e) => updateIngredient(index, "ghan", e.target.value)}
                    placeholder="5"
                    className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                    type="number"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#4b465c] mb-1 block">Total Qty (g)</Label>
                  <Input
                    value={ingredient.quantity}
                    onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                    placeholder="500"
                    className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                    type="number"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#4b465c] mb-1 block">Cost/Kg (₹)</Label>
                  <Input
                    value={ingredient.costPerKg}
                    onChange={(e) => updateIngredient(index, "costPerKg", Number.parseFloat(e.target.value) || 0)}
                    placeholder="30"
                    className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                    type="number"
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                    className="border-[#ea5455] text-[#ea5455] hover:bg-[#ea5455]/10"
                    disabled={ingredients.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              className="text-[#674af5] hover:bg-[#674af5]/10 p-0 h-auto font-medium"
              onClick={addIngredient}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Ingredients
            </Button>
          </div>

          <div className="bg-[#f8f7fa] p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-[#4b465c]">Per Person</span>
                <span className="text-[#4b465c]">{calculations.perPerson} Gm</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[#4b465c]">Per Person cost</span>
                <span className="text-[#4b465c]">₹{calculations.perPersonCost}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-[#4b465c]">1 Ghan</span>
                <span className="text-[#4b465c]">{calculations.oneGhanPersons} Person</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[#4b465c]">{ghan} Ghan</span>
                <span className="text-[#4b465c]">{calculations.totalPersons} Person</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-[#dbdade] text-[#4b465c] hover:bg-[#f8f7fa] bg-transparent"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#674af5] hover:bg-[#674af5]/90 text-white" disabled={isPending}>
            {isPending ? "Adding..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
