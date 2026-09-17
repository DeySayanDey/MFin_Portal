"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const authRoutes = ["/login", "/register", "/forgot-password"];

function isAuthRoute(pathname: string) {
  return authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isAuthRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="app-content min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            <div className="app-content-inner">{children}</div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
