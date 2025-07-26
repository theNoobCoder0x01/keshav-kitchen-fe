import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/providers/session-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "white",
                border: "1px solid #dbdade",
                color: "#4b465c",
              },
            }}
          />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

export const metadata = {
  generator: "v0.dev",
};
