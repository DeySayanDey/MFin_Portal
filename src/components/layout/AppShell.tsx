"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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
  const router = useRouter();
  const t = useTranslations("auth");
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  useEffect(() => {
    storeAuthUser(user);
    void refreshStoredAuthUser(() => {
      router.replace("/login");
      router.refresh();
    }).catch(() => undefined);
  }, [user, router]);

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
            <div className="app-content-inner">
              {user.passwordExpired ? (
                <p role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {t("passwordExpiredNotice")}
                </p>
              ) : null}
              {children}
            </div>
          </div>
        </main>
        <Footer />
      </div>
      <Toaster />
    </div>
  );
}
