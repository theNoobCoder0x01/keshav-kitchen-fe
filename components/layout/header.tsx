"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileDropdown } from "@/components/ui/profile-dropdown";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTranslations } from "@/hooks/use-translations";
import { Menu, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function Header() {
  const { t } = useTranslations();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xs border-b border-border px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2 hover:bg-muted"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-menu-button
          >
            <Menu className="w-5 h-5 text-foreground" />
          </Button>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-[#e26b2b] to-[#ff8c42] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm sm:text-base">
                K
              </span>
            </div>
            <div className="hidden sm:flex items-center space-x-1 h-15">
              <Image
                src="/prod/logo.svg"
                alt="Keshav Kitchen"
                width="20"
                height="10"
                className="w-auto h-full"
              />
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

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
              placeholder={t("common.searchPlaceholder")}
              className="pl-10 bg-muted/50"
            />
          </div>
        </div>
      )}
    </header>
  );
}
