"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Home, ChefHat, Utensils, ChevronDown, Calendar, Users, Download, Bell } from "lucide-react"

export default function ReportsPage() {
  const tabs = ["Thakorji", "Premvati", "Aarsh", "Mandir", "Prasad"]

  const menuItems = {
    breakfast: Array(6).fill("Idali Sambhar"),
    lunch: Array(6).fill("Idali Sambhar"),
    dinner: Array(6).fill("Idali Sambhar"),
  }

  return (
    <div className="min-h-screen bg-[#f8f7fa]">
      {/* Header */}
      <header className="bg-white border-b border-[#dbdade] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-[#e26b2b]">KESHAV</h1>
              <span className="text-lg font-medium text-[#e26b2b] italic">Kitchen</span>
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
              <AvatarFallback className="bg-[#674af5] text-white text-sm">U</AvatarFallback>
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
                <span>Menu</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-[#674af5] text-white text-xs px-2 py-1">3</Badge>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 text-[#4b465c] hover:bg-[#f8f7fa] rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <ChefHat className="w-5 h-5" />
                <span>Recipe</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </div>

            <div className="flex items-center justify-between p-3 text-[#4b465c] hover:bg-[#f8f7fa] rounded-lg cursor-pointer">
              <div className="flex items-center space-x-3">
                <Utensils className="w-5 h-5" />
                <span>Fix Dish</span>
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
                    <h3 className="text-lg font-semibold text-[#674af5]">Sunday, 20 , Jan 2021</h3>
                    <p className="text-sm text-[#4b465c]/70">Pagan Sud Panam</p>
                  </div>
                </div>
              </Card>

              <div className="flex space-x-4">
                {[
                  { label: "Total", value: "500", icon: Users },
                  { label: "Breakfast", value: "350", icon: Users },
                  { label: "Lunch", value: "200", icon: Users },
                  { label: "Dinner", value: "150", icon: Users },
                ].map((stat, index) => (
                  <Card key={index} className="bg-white border-[#dbdade] p-4 min-w-[120px]">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#00cfe8]/10 rounded-lg flex items-center justify-center">
                        <stat.icon className="w-5 h-5 text-[#00cfe8]" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#4b465c]">{stat.value}</p>
                        <p className="text-sm text-[#4b465c]/70">{stat.label}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-8 border-b border-[#dbdade] mb-6">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    index === 0
                      ? "text-[#674af5] border-[#674af5]"
                      : "text-[#4b465c]/70 border-transparent hover:text-[#4b465c]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Reports Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#674af5]">Menu</h2>
              <Button className="bg-[#674af5] hover:bg-[#674af5]/90 text-white">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            {/* Menu Reports Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Breakfast Report */}
              <Card className="bg-white border-[#dbdade]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#4b465c]">Breakfast</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#674af5] text-[#674af5] hover:bg-[#674af5]/10 bg-transparent"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {menuItems.breakfast.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[#4b465c] font-medium">{item}</p>
                            <p className="text-sm text-[#4b465c]/70">25 Kg</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-[#4b465c]/70">Quantity</label>
                          <Input
                            defaultValue="500 Kg"
                            className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20 text-sm"
                            readOnly
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lunch Report */}
              <Card className="bg-white border-[#dbdade]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#4b465c]">Lunch</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#674af5] text-[#674af5] hover:bg-[#674af5]/10 bg-transparent"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {menuItems.lunch.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[#4b465c] font-medium">{item}</p>
                            <p className="text-sm text-[#4b465c]/70">25 Kg</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-[#4b465c]/70">Quantity</label>
                          <Input
                            defaultValue="500 Kg"
                            className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20 text-sm"
                            readOnly
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dinner Report */}
              <Card className="bg-white border-[#dbdade]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#4b465c]">Dinner</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#674af5] text-[#674af5] hover:bg-[#674af5]/10 bg-transparent"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {menuItems.dinner.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[#4b465c] font-medium">{item}</p>
                            <p className="text-sm text-[#4b465c]/70">25 Kg</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-[#4b465c]/70">Quantity</label>
                          <Input
                            defaultValue="500 Kg"
                            className="border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20 text-sm"
                            readOnly
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
