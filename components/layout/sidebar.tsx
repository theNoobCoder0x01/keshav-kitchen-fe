"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  ChefHat, 
  Utensils, 
  Users, 
  BarChart3, 
  Settings,
  X,
  HelpCircle,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeItem?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeItem, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      href: "/",
      isActive: pathname === "/",
      description: "Overview & daily menu",
      badge: "3",
    },
    {
      id: "recipes",
      label: "Recipes",
      icon: ChefHat,
      href: "/recipes",
      isActive: pathname.startsWith("/recipes"),
      description: "Recipe management",
    },
    {
      id: "kitchens",
      label: "Kitchens",
      icon: Utensils,
      href: "/kitchens",
      isActive: pathname === "/kitchens",
      description: "Kitchen locations",
    },
    {
      id: "ingredients",
      label: "Ingredients",
      icon: Users,
      href: "/ingredients",
      isActive: pathname === "/ingredients",
      description: "Ingredient inventory",
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      href: "/reports",
      isActive: pathname === "/reports",
      description: "Analytics & insights",
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r transform transition-all duration-300 ease-in-out lg:transform-none flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-semibold text-foreground">Kitchen</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
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

            {menuItems.map((item) => (
              <Link key={item.id} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 animate-slide-in",
                    item.isActive
                      ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm border border-primary/10"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                        item.isActive
                          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-medium">{item.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <Badge
                        className={cn(
                          "text-xs px-2 py-1 transition-colors",
                          item.isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground",
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
            <Link href="/settings">
              <div className="group flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all duration-200">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
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
        <div className="p-4 border-t">
          <div className="gradient-border rounded-xl">
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Need Help?</p>
                  <p className="text-xs text-muted-foreground">Contact support team</p>
                </div>
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}