import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, Shield, Twitter } from "lucide-react";

export default function Component() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#f8f7fa] via-[#e1dbfd] to-[#674af5]/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-xs">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Brand Logo */}
          <div className="mx-auto w-16 h-16 bg-linear-to-br from-[#674af5] to-[#856ef7] rounded-2xl flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-[#4b465c]">
              Subscribe to Our Newsletter
            </CardTitle>
            <CardDescription className="text-[#4b465c]/70 text-base">
              Get the latest updates, exclusive content, and insider tips
              delivered straight to your inbox.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Social Sign-up Options */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-11 border-[#dbdade] hover:bg-[#f8f7fa] bg-transparent"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
              <Button
                variant="outline"
                className="h-11 border-[#dbdade] hover:bg-[#f8f7fa] bg-transparent"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-[#dbdade]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#4b465c]/60">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>

          {/* Email Form */}
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#4b465c] font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="h-11 border-[#dbdade] focus:border-[#674af5] focus:ring-[#674af5]/20"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-linear-to-r from-[#674af5] to-[#856ef7] hover:from-[#674af5]/90 hover:to-[#856ef7]/90 text-white font-medium"
            >
              Subscribe Now
            </Button>
          </form>

          {/* Additional Links */}
          <div className="text-center space-y-3">
            <div className="flex justify-center space-x-4 text-sm">
              <a
                href="#"
                className="text-[#4b465c]/60 hover:text-[#674af5] transition-colors"
              >
                Terms
              </a>
              <span className="text-[#dbdade]">•</span>
              <a
                href="#"
                className="text-[#4b465c]/60 hover:text-[#674af5] transition-colors"
              >
                Privacy
              </a>
              <span className="text-[#dbdade]">•</span>
              <a
                href="#"
                className="text-[#4b465c]/60 hover:text-[#674af5] transition-colors"
              >
                Help
              </a>
            </div>

            {/* Trust Indicator */}
            <div className="flex items-center justify-center space-x-2 text-sm text-[#4b465c]/60">
              <Shield className="w-4 h-4" />
              <span>We respect your privacy. Unsubscribe at any time.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
