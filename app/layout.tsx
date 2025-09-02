import { SessionProviderWrapper } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/contexts/language-context";
import { Noto_Serif_Gujarati } from "next/font/google";
import Head from "next/head";
import type React from "react";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Noto_Serif_Gujarati({ subsets: ["gujarati"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/local/favicon.ico" />
      </Head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProviderWrapper>
            <LanguageProvider>
              {children}
              <Toaster position="top-right" />
            </LanguageProvider>
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
