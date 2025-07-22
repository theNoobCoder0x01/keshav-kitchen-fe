"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Home, ChefHat, Utensils, ChevronDown, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeItem?: string
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ activeItem, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      id: "menu",
      label: "Menu",
      icon: Home,
      badge: "3",
      href: "/",
      isActive: pathname === "/",
      description: "Manage daily menus",
    },
    {
      id: "recipe",
      label: "Recipes",
      icon: ChefHat,
      href: "/recipes",
      isActive: pathname === "/recipes",
      description: "Recipe management",
    },
    {
      id: "reports",
      label: "Reports",
      icon: Utensils,
      href: "/reports",
      isActive: pathname === "/reports",
      description: "Analytics & reports",
    },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#dbdade] transform transition-transform duration-300 ease-in-out lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Close Button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#dbdade]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#e26b2b] to-[#ff8c42] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="font-semibold text-[#4b465c]">Menu</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-[#4b465c]/60 uppercase tracking-wider mb-3 px-3">
                Kitchen Management
              </h2>
            </div>

            {menuItems.map((item) => (
              <Link key={item.id} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200",
                    item.isActive
                      ? "bg-gradient-to-r from-[#674af5]/10 to-[#856ef7]/5 text-[#674af5] shadow-sm border border-[#674af5]/10"
                      : "text-[#4b465c] hover:bg-[#f8f7fa] hover:text-[#674af5]",
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                        item.isActive
                          ? "bg-gradient-to-br from-[#674af5] to-[#856ef7] text-white shadow-md"
                          : "bg-[#f8f7fa] text-[#4b465c] group-hover:bg-[#674af5]/10 group-hover:text-[#674af5]",
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-medium">{item.label}</span>
                      <p className="text-xs text-[#4b465c]/60 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <Badge
                        className={cn(
                          "text-xs px-2 py-1 transition-colors",
                          item.isActive
                            ? "bg-[#674af5] text-white"
                            : "bg-[#e0e7ff] text-[#674af5] group-hover:bg-[#674af5] group-hover:text-white",
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        item.isActive ? "text-[#674af5]" : "text-[#4b465c]/40",
                      )}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[#dbdade]">
            <div className="bg-gradient-to-r from-[#674af5]/5 to-[#856ef7]/5 rounded-xl p-4 border border-[#674af5]/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#674af5] to-[#856ef7] rounded-lg flex items-center justify-center">
                  <ChefHat className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#4b465c]">Need Help?</p>
                  <p className="text-xs text-[#4b465c]/60">Contact support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
