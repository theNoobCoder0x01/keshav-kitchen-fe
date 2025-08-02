"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  ChefHat, 
  Utensils, 
  Package, 
  BarChart3, 
  Settings,
  X,
  HelpCircle,
  Sparkles,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  activeItem?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeItem, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      href: "/",
      isActive: pathname === "/",
      description: "Overview & daily menu",
      badge: "3",
      color: "primary",
    },
    {
      id: "recipes",
      label: "Recipes",
      icon: ChefHat,
      href: "/recipes",
      isActive: pathname.startsWith("/recipes"),
      description: "Recipe management",
      color: "success",
    },
    {
      id: "kitchens",
      label: "Kitchens",
      icon: Utensils,
      href: "/kitchens",
      isActive: pathname === "/kitchens",
      description: "Kitchen locations",
      color: "warning",
    },
    {
      id: "ingredients",
      label: "Ingredients",
      icon: Package,
      href: "/ingredients",
      isActive: pathname === "/ingredients",
      description: "Ingredient inventory",
      color: "secondary",
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      href: "/reports",
      isActive: pathname === "/reports",
      description: "Analytics & insights",
      color: "primary",
    },
  ];

  const getIconBackgroundColor = (item: any) => {
    if (item.isActive) {
      return "bg-gradient-primary text-primary-foreground shadow-modern-lg";
    }
    
    if (hoveredItem === item.id) {
      switch (item.color) {
        case "success":
          return "bg-gradient-success text-success-foreground";
        case "warning":
          return "bg-yellow-500 text-white";
        case "secondary":
          return "bg-secondary text-secondary-foreground";
        default:
          return "bg-gradient-primary text-primary-foreground";
      }
    }
    
    return "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary";
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-background border-r border-border shadow-modern-lg lg:shadow-none transform transition-all duration-300 ease-in-out lg:transform-none flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center shadow-modern">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-semibold text-foreground">Kitchen</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={onClose} 
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="space-y-2">
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Kitchen Management
              </h2>
            </div>

            {menuItems.map((item, index) => (
              <Link 
                key={item.id} 
                href={item.href} 
                onClick={onClose}
                className="block"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 animate-slide-in relative overflow-hidden",
                    item.isActive
                      ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-modern border border-primary/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:shadow-modern-md",
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  role="menuitem"
                  tabIndex={0}
                  aria-current={item.isActive ? "page" : undefined}
                >
                  {/* Active indicator */}
                  {item.isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-primary rounded-r-full" />
                  )}
                  
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                        getIconBackgroundColor(item)
                      )}
                    >
                      <item.icon className="w-5 h-5 relative z-10" />
                      {/* Subtle shine effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.label}</span>
                        {item.isActive && (
                          <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.badge && (
                      <Badge
                        className={cn(
                          "text-xs px-2 py-1 transition-all duration-300",
                          item.isActive
                            ? "bg-primary text-primary-foreground shadow-modern"
                            : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105",
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Secondary Navigation */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
              System
            </h3>
            <Link href="/settings" onClick={onClose} className="block">
              <div className="group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:shadow-modern-md">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 relative overflow-hidden">
                  <Settings className="w-5 h-5 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">Settings</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    System configuration
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-primary rounded-xl opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative p-4 rounded-xl border border-primary/20 bg-background/50 backdrop-blur-sm hover:shadow-modern-lg transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-modern group-hover:shadow-modern-lg transition-all duration-300 group-hover:scale-105">
                  <HelpCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Need Help?</p>
                  <p className="text-xs text-muted-foreground">Contact support team</p>
                </div>
                <Sparkles className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}