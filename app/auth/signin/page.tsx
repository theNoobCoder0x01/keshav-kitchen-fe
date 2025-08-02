"use client";

import type React from "react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, ChefHat, Lock, Mail, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials", {
          description: "Please check your email and password and try again.",
        });
      } else {
        toast.success("Welcome back!", {
          description: "You have been signed in successfully.",
        });
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      toast.error("Something went wrong", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("admin@kitchen.com");
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
      
      <div className="w-full max-w-md animate-fade-in relative z-10">
        <Card className="shadow-modern-xl border-0 bg-background/95 backdrop-blur-sm" variant="elevated">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Brand Logo with enhanced styling */}
            <div className="relative mx-auto group">
              <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-modern-lg group-hover:shadow-modern-xl transition-all duration-300 group-hover:scale-105">
                <ChefHat className="w-10 h-10 text-primary-foreground" />
              </div>
              <div className="absolute inset-0 bg-gradient-primary rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-lg" />
            </div>

            <div className="space-y-4">
              <div className="relative">
                <h1 className="text-3xl font-bold text-gradient">KESHAV</h1>
                <p className="text-lg font-medium text-secondary italic">Kitchen</p>
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-8 text-xs px-2 py-1 animate-pulse"
                >
                  v2.0
                </Badge>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Sign in to your kitchen management account
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="pl-10 h-11 border-border/50 focus:border-primary transition-all duration-200"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="pl-10 pr-10 h-11 border-border/50 focus:border-primary transition-all duration-200"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full shadow-modern-lg hover:shadow-modern-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <Separator className="my-6" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>
            </div>

            {/* Enhanced Demo Credentials */}
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20" variant="outlined">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Demo Credentials
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fillDemoCredentials}
                    className="text-xs hover:bg-primary/10"
                  >
                    Auto-fill
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Email:</span>
                    <code className="text-sm text-foreground bg-background/60 px-2 py-1 rounded border">
                      admin@kitchen.com
                    </code>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Password:</span>
                    <code className="text-sm text-foreground bg-background/60 px-2 py-1 rounded border">
                      admin123
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer Links */}
            <div className="text-center space-y-4 pt-4">
              <div className="flex justify-center gap-6 text-xs">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  Support
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                © 2024 Keshav Kitchen. All rights reserved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}