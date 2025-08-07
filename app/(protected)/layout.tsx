import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-linear-to-br from-background via-background to-muted/20 overflow-hidden">
      <Header />
      <div className="flex flex-grow overflow-hidden">
        <Sidebar />
        <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] overflow-auto">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
