"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, ChefHat, ChevronDown, Home, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    };

    // Listen for route changes
    handleRouteChange();
  }, [pathname]);

  // Listen for clicks outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const menuButton = document.querySelector("[data-menu-button]");

      if (
        window.innerWidth < 1024 &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        menuButton &&
        !menuButton.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for header menu button clicks
  useEffect(() => {
    const handleMenuToggle = () => {
      setIsOpen(!isOpen);
    };

    const menuButton = document.querySelector("[data-menu-button]");
    if (menuButton) {
      menuButton.addEventListener("click", handleMenuToggle);
      return () => menuButton.removeEventListener("click", handleMenuToggle);
    }
  }, [isOpen]);

  const menuItems = [
    {
      id: "home",
      label: "Dashboard",
      icon: Home,
      href: "/",
      isActive: pathname === "/",
      description: "Overview & quick actions",
      badge: null,
      children: null,
    },
    {
      id: "menus",
      label: "Menus",
      icon: Calendar,
      href: "/menus",
      isActive: pathname === "/menus",
      description: "Manage daily menus",
      badge: null,
      children: null,
    },
    {
      id: "recipe",
      label: "Recipes",
      icon: ChefHat,
      href: "/recipes",
      isActive: pathname === "/recipes",
      description: "Recipe management",
      badge: null,
      children: null,
    },
    {
      id: "kitchens",
      label: "Kitchens",
      icon: Users,
      href: "/kitchens",
      isActive: pathname === "/kitchens",
      description: "Manage kitchen locations",
      badge: null,
      children: null,
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-xs z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-background border-r border-border transform transition-transform duration-300 ease-in-out lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Close Button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-linear-to-br from-[#e26b2b] to-[#ff8c42] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="font-semibold text-foreground">Menu</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Kitchen Management
              </h2>
            </div>

            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsOpen(false)}
              >
                <div
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200",
                    item.isActive
                      ? "bg-linear-to-r from-primary/10 to-primary/5 text-primary shadow-xs border border-primary/10"
                      : "text-foreground hover:bg-muted hover:text-primary"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                        item.isActive
                          ? "bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-md"
                          : "bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary"
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
                            : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {item.children && (
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          item.isActive
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          {/* <div className="p-4 border-t border-border space-y-3">
            <div className="bg-linear-to-r from-primary/5 to-primary/5 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-linear-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Need Help?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Contact support
                  </p>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </aside>
    </>
  );
}
