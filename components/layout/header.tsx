"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2 hover:bg-muted"
            onClick={onMenuToggle}
          >
            <Menu className="w-5 h-5 text-foreground" />
          </Button>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#e26b2b] to-[#ff8c42] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm sm:text-base">
                K
              </span>
            </div>
            <div className="hidden sm:flex items-center space-x-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#e26b2b] to-[#ff8c42] bg-clip-text text-transparent">
                KESHAV
              </h1>
              <span className="text-base sm:text-lg font-medium text-[#e26b2b] italic">
                Kitchen
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 hover:bg-muted"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="w-5 h-5 text-foreground" />
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted transition-colors"
            >
              <Bell className="w-5 h-5 text-foreground hover:text-primary transition-colors" />
            </Button>
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-gradient-to-r from-[#ea5455] to-[#ff6b6b] text-white text-xs flex items-center justify-center animate-pulse">
              3
            </Badge>
          </div>

          {/* User Profile */}
          <ProfileDropdown />
        </div>
      </div>

      {/* Mobile Search Bar */}
      {searchOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes, ingredients..."
              className="pl-10 bg-muted/50"
            />
          </div>
        </div>
      )}
    </header>
  );
}
