"use client";

import { Bell, Search, Settings, User, LogOut, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b transition-all duration-300",
      "bg-background/80 backdrop-blur-xl",
      isScrolled 
        ? "shadow-modern-md border-border/50" 
        : "shadow-modern border-border/30"
    )}>
      <div className="container-modern">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "lg:hidden transition-all duration-200",
                sidebarOpen && "bg-primary/10 text-primary"
              )}
              onClick={onMenuToggle}
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-modern-lg transition-all duration-300 group-hover:shadow-modern-xl group-hover:scale-105">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <div className="absolute inset-0 bg-gradient-primary rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-lg" />
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <h1 className="text-2xl font-bold text-gradient">KESHAV</h1>
                <span className="text-lg font-medium text-secondary italic">Kitchen</span>
              </div>
            </div>
          </div>

          {/* Center Section - Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <SearchInput
              placeholder="Search recipes, ingredients..."
              variant="filled"
              className="w-full"
            />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "md:hidden transition-all duration-200",
                searchOpen && "bg-primary/10 text-primary"
              )}
              onClick={toggleSearch}
              aria-label="Toggle search"
            >
              {searchOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative group"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-error text-error-foreground text-xs flex items-center justify-center animate-pulse border-2 border-background">
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full p-0 hover:scale-105 transition-transform duration-200"
                  aria-label="User menu"
                >
                  <Avatar className="h-10 w-10 border-2 border-primary/20 transition-all duration-200 hover:border-primary/40">
                    <AvatarImage 
                      src={session?.user?.image || "/placeholder.svg?height=40&width=40"}
                      alt={session?.user?.name || "User avatar"}
                    />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                      {session?.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 animate-scale-in shadow-modern-xl" 
                align="end" 
                forceMount
              >
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={session?.user?.image || "/placeholder.svg?height=32&width=32"}
                          alt={session?.user?.name || "User avatar"}
                        />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-medium">
                          {session?.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {session?.user?.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session?.user?.email}
                        </p>
                      </div>
                    </div>
                    {(session?.user?.role || session?.user?.kitchenName) && (
                      <div className="flex items-center gap-2 pt-1">
                        {session?.user?.role && (
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {session.user.role}
                          </Badge>
                        )}
                        {session?.user?.kitchenName && (
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {session.user.kitchenName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer group">
                  <User className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer group">
                  <Settings className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-error focus:text-error group"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {searchOpen && (
          <div className="md:hidden pb-4 animate-slide-up">
            <SearchInput
              placeholder="Search recipes, ingredients..."
              variant="filled"
              className="w-full"
              autoFocus
            />
          </div>
        )}
      </div>
    </header>
  );
}