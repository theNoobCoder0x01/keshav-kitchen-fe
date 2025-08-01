"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  ChefHat,
  ChevronDown,
  Calendar,
  Users,
  ShoppingCart,
  DollarSign,
  Plus,
  Mail,
  Eye,
  MoreHorizontal,
  Bell,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

export default function RecipesPage() {
  const [addRecipeDialog, setAddRecipeDialog] = useState(false);
  const [ingredients, setIngredients] = useState([
    { name: "Potato", quantity: "5 Kg" },
  ]);

  const recipes = Array(6).fill({
    name: "Idali Sambhar",
    type: "Breakfast",
    issuedDate: "09 May 2022",
  });

  return (
    <div className="min-h-screen bg-[#f8f7fa]">
      {/* Header */}
      <header className="bg-white border-b border-[#dbdade] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-[#e26b2b]">KESHAV</h1>
              <span className="text-lg font-medium text-[#e26b2b] italic">
                Kitchen
              </span>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="w-5 h-5 text-[#4b465c]" />
              <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 bg-[#ea5455] text-white text-xs flex items-center justify-center">
                1
              </Badge>
            </div>
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback className="bg-[#674af5] text-white text-sm">
                U
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-[#dbdade] min-h-screen">
          <nav className="p-4 space-y-2">
            <div className="flex items-center justify-between p-3 text-[#4b465c] hover:bg-[#f8f7fa] rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-[#674af5] text-white text-xs px-2 py-1">
                  3
                </Badge>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 text-[#674af5] bg-[#674af5]/10 rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <ChefHat className="w-5 h-5" />
                <span>Recipe</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Date and Stats Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <Card className="bg-white border-[#dbdade] p-4 min-w-[280px]">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-[#674af5]" />
                  <div>
                    <h3 className="text-lg font-semibold text-[#674af5]">
                      Sunday, 20 , Jan 2021
                    </h3>
                    <p className="text-sm text-[#4b465c]/70">Pagan Sud Panam</p>
                  </div>
                </div>
              </Card>

              <div className="flex space-x-4">
                <Card className="bg-white border-[#dbdade] p-4 min-w-[140px]">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#00cfe8]/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#00cfe8]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#4b465c]">700</p>
                      <p className="text-sm text-[#4b465c]/70">Visitors</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white border-[#dbdade] p-4 min-w-[140px]">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#ea5455]/10 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-[#ea5455]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#4b465c]">
                        1.423k
                      </p>
                      <p className="text-sm text-[#4b465c]/70">Products</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white border-[#dbdade] p-4 min-w-[140px]">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#28c76f]/10 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-[#28c76f]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#4b465c]">₹9745</p>
                      <p className="text-sm text-[#4b465c]/70">Revenue</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Recipes Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#674af5]">Recipes</h2>
              <Dialog open={addRecipeDialog} onOpenChange={setAddRecipeDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#674af5] hover:bg-[#674af5]/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Recipe
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-[#4b465c]">
                      Add New Recipe
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div>
                      <Label className="text-base font-medium text-[#4b465c] mb-2 block">
                        Recipe Name
                      </Label>
                      <Input
                        defaultValue="Poha"
                        placeholder="Enter recipe name"
                        className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-base font-medium text-[#4b465c] mb-2 block">
                          Recipe Type
                        </Label>
                        <Select defaultValue="breakfast">
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
                        <Label className="text-base font-medium text-[#4b465c] mb-2 block">
                          Recipe
                        </Label>
                        <Select defaultValue="poha">
                          <SelectTrigger className="border-[#dbdade]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="poha">Poha</SelectItem>
                            <SelectItem value="upma">Upma</SelectItem>
                            <SelectItem value="paratha">Paratha</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium text-[#4b465c]">
                        Ingredients
                      </Label>
                      {ingredients.map((ingredient, index) => (
                        <div key={index} className="grid grid-cols-2 gap-4">
                          <Input
                            defaultValue={ingredient.name}
                            placeholder="Ingredient name"
                            className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                          />
                          <div className="flex items-center space-x-2">
                            <Input
                              defaultValue={ingredient.quantity}
                              placeholder="Quantity"
                              className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                            />
                            <span className="text-sm text-[#4b465c]/70 whitespace-nowrap">
                              Quantity
                            </span>
                          </div>
                        </div>
                      ))}

                      <Button
                        variant="ghost"
                        className="text-[#674af5] hover:bg-[#674af5]/10 p-0 h-auto font-medium"
                        onClick={() =>
                          setIngredients([
                            ...ingredients,
                            { name: "", quantity: "" },
                          ])
                        }
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Ingredients
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setAddRecipeDialog(false)}
                      className="border-[#dbdade] text-[#4b465c] hover:bg-[#f8f7fa] bg-transparent"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setAddRecipeDialog(false)}
                      className="bg-[#674af5] hover:bg-[#674af5]/90 text-white"
                    >
                      Save
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Recipes Table */}
            <Card className="bg-white border-[#dbdade]">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#dbdade]">
                      <TableHead className="text-[#4b465c] font-semibold py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span>NAME</span>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-[#4b465c] font-semibold py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span>TYPE</span>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-[#4b465c] font-semibold py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span>ISSUED DATE</span>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-[#4b465c] font-semibold py-4 px-6">
                        ACTIONS
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipes.map((recipe, index) => (
                      <TableRow
                        key={index}
                        className="border-[#dbdade] hover:bg-[#f8f7fa]"
                      >
                        <TableCell className="py-4 px-6 text-[#4b465c]">
                          {recipe.name}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-[#4b465c]">
                          {recipe.type}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-[#4b465c]">
                          {recipe.issuedDate}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-8 h-8 p-0 text-[#4b465c] hover:bg-[#f8f7fa]"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-8 h-8 p-0 text-[#4b465c] hover:bg-[#f8f7fa]"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-8 h-8 p-0 text-[#4b465c] hover:bg-[#f8f7fa]"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#dbdade]">
                  <p className="text-sm text-[#4b465c]/70">
                    Showing 1 to 10 of 100 entries
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#dbdade] text-[#4b465c] hover:bg-[#f8f7fa] bg-transparent"
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#674af5] hover:bg-[#674af5]/90 text-white w-8 h-8 p-0"
                    >
                      1
                    </Button>
                    {[2, 3, 4, 5].map((page) => (
                      <Button
                        key={page}
                        variant="outline"
                        size="sm"
                        className="border-[#dbdade] text-[#4b465c] hover:bg-[#f8f7fa] bg-transparent w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#dbdade] text-[#4b465c] hover:bg-[#f8f7fa] bg-transparent"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
