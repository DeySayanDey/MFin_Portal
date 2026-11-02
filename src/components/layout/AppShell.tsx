"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import type { AuthUser } from "@/features/auth/types/auth";
import { refreshStoredAuthUser } from "@/features/auth/services/auth-client";
import { storeAuthUser } from "@/features/auth/utils/auth-user-storage";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/Toaster";

type AppShellProps = {
  children: React.ReactNode;
  user: AuthUser;
};

export function AppShell({ children, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  useEffect(() => {
    storeAuthUser(user);
    void refreshStoredAuthUser();
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  return (
    <div
      className="app-shell bg-background"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
          minWidth: 0,
          minHeight: 0,
          height: "100%",
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} user={user} />
        <main
          ref={mainRef}
          className="scrollbar-thin"
          style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}
        >
          <div className="app-content">
            <div className="app-content-inner">{children}</div>
          </div>
        </main>
        <Footer />
      </div>
      <Toaster />
    </div>
  );
}
