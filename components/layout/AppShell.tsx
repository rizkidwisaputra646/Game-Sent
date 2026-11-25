"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  FileSpreadsheet,
  GitCompareArrows,
  LayoutDashboard,
  Menu,
  Radar,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useGameSent } from "@/components/providers/GameSentProvider";

interface NavItem {
  href: string;
  label: string;
  shortTag: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    shortTag: "CMD-01",
    icon: LayoutDashboard,
  },
  {
    href: "/models",
    label: "Model & Evaluation",
    shortTag: "ML-02",
    icon: Cpu,
  },
  {
    href: "/analyzer",
    label: "Sentiment Analyzer",
    shortTag: "INF-03",
    icon: Radar,
  },
  {
    href: "/datasets",
    label: "Dataset Explorer",
    shortTag: "DAT-04",
    icon: Database,
  },
  {
    href: "/comparison",
    label: "Game Comparison",
    shortTag: "CMP-05",
    icon: GitCompareArrows,
  },
  {
    href: "/reports",
    label: "Reports & Export",
    shortTag: "EXP-06",
    icon: FileSpreadsheet,
  },
];

function BrandEmblem() {
  return (
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#8B5CF6]/45 bg-gradient-to-br from-[#8B5CF6]/25 via-[#3B82F6]/20 to-[#22D3EE]/20 shadow-[0_0_18px_rgba(139,92,246,0.28)]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5 text-[#22D3EE]"
        aria-hidden="true"
      >
        <path
          d="M12 2L20 6.5V17.5L12 22L4 17.5V6.5L12 2Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M8.5 13.5L10.8 10.2L13.4 12.6L15.8 9"
          stroke="#8B5CF6"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="15.8" cy="9" r="1.4" fill="#22D3EE" />
      </svg>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const {
    modelStatus,
    ensureModelsLoaded,
    activeSession,
    preferences,
    updatePreferences,
    history,
  } = useGameSent();

  const [mobileOpen, setMobileOpen] = useState(false);

  // Scroll progression effects (strictly on HUD progress bar & decorative background layers)
  const { scrollY, scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });
  const gridParallaxY = useTransform(scrollY, [0, 1400], [0, -28]);
  const glowTopY = useTransform(scrollY, [0, 1400], [0, 36]);
  const glowBottomOpacity = useTransform(scrollYProgress, [0, 1], [0.08, 0.2]);

  // Consistent scroll restoration on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  const currentNav =
    NAV_ITEMS.find((item) => pathname.startsWith(item.href)) ?? NAV_ITEMS[0];

  const collapsed = preferences.sidebarCollapsed;
  const accentIsCyan = preferences.commandThemeAccent === "cyan";

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex h-full flex-col justify-between bg-[#0D1224]/95 border-r border-[#263149]">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#263149] px-4">
          <Link
            href="/dashboard"
            onClick={() => isMobile && setMobileOpen(false)}
            className="flex items-center gap-3 overflow-hidden"
          >
            <BrandEmblem />
            {(!collapsed || isMobile) && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-base font-bold tracking-tight text-[#F1F5F9]">
                    GameSent
                  </span>
                  <span className="rounded border border-[#22D3EE]/35 bg-[#22D3EE]/10 px-1.5 py-0.5 font-mono-num text-[9px] font-semibold text-[#22D3EE]">
                    v2.0
                  </span>
                </div>
                <p className="truncate text-[11px] text-[#94A3B8]">
                  Esports Sentiment HUD
                </p>
              </div>
            )}
          </Link>

          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-[#263149] p-1.5 text-[#94A3B8] hover:text-[#F1F5F9]"
              aria-label="Tutup menu"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => updatePreferences({ sidebarCollapsed: !collapsed })}
              className="hidden lg:flex rounded-md border border-[#263149] bg-[#11182B] p-1 text-[#94A3B8] transition hover:border-[#8B5CF6]/50 hover:text-[#F1F5F9]"
              aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 space-y-1.5 px-3" aria-label="Navigasi utama">
          {(!collapsed || isMobile) && (
            <div className="px-2 pb-1.5 font-mono-num text-[10px] font-semibold tracking-[0.18em] text-[#64748B] uppercase">
              Command Modules
            </div>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? accentIsCyan
                      ? "border border-[#22D3EE]/45 bg-gradient-to-r from-[#22D3EE]/15 via-[#3B82F6]/10 to-transparent text-[#F1F5F9] shadow-[0_0_20px_-8px_rgba(34,211,238,0.5)]"
                      : "border border-[#8B5CF6]/45 bg-gradient-to-r from-[#8B5CF6]/18 via-[#3B82F6]/10 to-transparent text-[#F1F5F9] shadow-[0_0_20px_-8px_rgba(139,92,246,0.55)]"
                    : "border border-transparent text-[#94A3B8] hover:border-[#263149] hover:bg-[#11182B]/70 hover:text-[#F1F5F9]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId={isMobile ? "sidebar-rail-mobile" : "sidebar-rail-desktop"}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.24,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`absolute top-2 bottom-2 left-0 w-[3px] rounded-r ${
                      accentIsCyan ? "bg-[#22D3EE]" : "bg-[#8B5CF6]"
                    }`}
                  />
                )}
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active
                      ? accentIsCyan
                        ? "text-[#22D3EE]"
                        : "text-[#A78BFA]"
                      : "text-[#94A3B8] group-hover:text-[#22D3EE]"
                  }`}
                />
                {(!collapsed || isMobile) && (
                  <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    <span className="font-mono-num text-[10px] text-[#64748B]">
                      {item.shortTag}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Telemetry Box */}
      <div className="border-t border-[#263149] p-3">
        {!collapsed || isMobile ? (
          <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3 text-xs">
            <div className="flex items-center justify-between text-[#94A3B8]">
              <span className="flex items-center gap-1.5 font-mono-num text-[10px] uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5 text-[#22C55E]" />
                Local-First Engine
              </span>
              <span className="font-mono-num text-[10px] text-[#22D3EE]">
                No DB
              </span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-[#94A3B8]">
              <div className="flex justify-between">
                <span>Artefak Model</span>
                <span className="font-mono-num text-[#F1F5F9]">
                  {modelStatus.ready
                    ? "3/3 Aktif"
                    : modelStatus.loading
                    ? "Memuat..."
                    : "Error"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Riwayat IndexedDB</span>
                <span className="font-mono-num text-[#F1F5F9]">
                  {history.length} sesi
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Local-First Engine">
            <ShieldCheck className="h-5 w-5 text-[#22C55E]" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#080B18] text-[#F1F5F9]">
      {/* Ambient Futuristic Command Background with subtle decorative parallax */}
      <motion.div
        aria-hidden
        style={shouldReduceMotion ? undefined : { y: gridParallaxY }}
        className="pointer-events-none fixed -inset-y-10 inset-x-0 cyber-grid-bg opacity-70 will-change-transform"
      />
      <motion.div
        aria-hidden
        style={
          shouldReduceMotion
            ? { background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)" }
            : {
                y: glowTopY,
                background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
              }
        }
        className="pointer-events-none fixed -top-40 left-1/4 h-[520px] w-[620px] rounded-full will-change-transform"
      />
      <motion.div
        aria-hidden
        style={
          shouldReduceMotion
            ? {
                opacity: 0.14,
                background: "radial-gradient(circle, rgba(59,130,246,0.9) 0%, transparent 70%)",
              }
            : {
                opacity: glowBottomOpacity,
                background: "radial-gradient(circle, rgba(59,130,246,0.9) 0%, transparent 70%)",
              }
        }
        className="pointer-events-none fixed -right-16 -bottom-16 h-[480px] w-[580px] rounded-full"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 hud-scanline"
      />

      <div className="relative z-10 flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:block shrink-0 transition-all duration-200 ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          <div className="sticky top-0 h-screen">{sidebarContent(false)}</div>
        </aside>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
              />
              <motion.aside
                initial={shouldReduceMotion ? false : { x: -280 }}
                animate={{ x: 0 }}
                exit={shouldReduceMotion ? undefined : { x: -280 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.24,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
              >
                {sidebarContent(true)}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Command Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[#263149] bg-[#080B18]/88 px-4 backdrop-blur-md sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-[#263149] bg-[#11182B] p-2 text-[#94A3B8] hover:text-[#F1F5F9] lg:hidden"
                aria-label="Buka navigasi"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline font-mono-num text-[11px] text-[#22D3EE]">
                    [{currentNav.shortTag}]
                  </span>
                  <h1 className="truncate font-display text-base font-semibold text-[#F1F5F9] sm:text-lg">
                    {currentNav.label}
                  </h1>
                </div>
                <p className="hidden truncate text-xs text-[#94A3B8] sm:block">
                  Platform Riset Sentimen Mobile Legends &amp; Dota 2 — TF-IDF •
                  Multinomial NB • KNN
                </p>
              </div>
            </div>

            {/* Right Status Indicators */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {activeSession && (
                <Link
                  href="/datasets"
                  className="hidden md:flex items-center gap-1.5 rounded-full border border-[#3B82F6]/40 bg-[#3B82F6]/12 px-3 py-1 text-xs text-[#93C5FD] transition hover:border-[#3B82F6]"
                  title="Sesi dataset tambahan aktif (terpisah dari dataset penelitian)"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="max-w-[140px] truncate">
                    Sesi: {activeSession.sessionName}
                  </span>
                </Link>
              )}

              {/* Model Status Pill */}
              <div
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                  modelStatus.ready
                    ? "border-[#22C55E]/35 bg-[#22C55E]/10 text-[#22C55E]"
                    : modelStatus.error
                    ? "border-[#F43F5E]/40 bg-[#F43F5E]/10 text-[#F43F5E]"
                    : "border-[#22D3EE]/35 bg-[#22D3EE]/10 text-[#22D3EE]"
                }`}
              >
                <Activity
                  className={`h-3.5 w-3.5 ${
                    modelStatus.loading ? "animate-pulse" : ""
                  }`}
                />
                <span className="hidden sm:inline">
                  {modelStatus.ready
                    ? "Model Ready"
                    : modelStatus.error
                    ? "Model Error"
                    : "Loading ML..."}
                </span>
                {modelStatus.error && (
                  <button
                    type="button"
                    onClick={() => void ensureModelsLoaded()}
                    className="ml-1 rounded p-0.5 hover:bg-[#F43F5E]/20"
                    title="Muat ulang artefak model"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Accent Toggle */}
              <button
                type="button"
                onClick={() =>
                  updatePreferences({
                    commandThemeAccent: accentIsCyan ? "violet" : "cyan",
                  })
                }
                className="flex items-center gap-1.5 rounded-lg border border-[#263149] bg-[#11182B] px-2.5 py-1.5 text-xs text-[#94A3B8] transition hover:border-[#8B5CF6]/50 hover:text-[#F1F5F9]"
                title="Ubah aksen HUD (tersimpan di LocalStorage)"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    accentIsCyan ? "bg-[#22D3EE]" : "bg-[#8B5CF6]"
                  }`}
                />
                <span className="hidden md:inline font-mono-num text-[11px]">
                  {accentIsCyan ? "CYAN" : "VIOLET"}
                </span>
              </button>
            </div>

            {/* Scroll Progression Indicator */}
            <motion.div
              aria-hidden
              style={
                shouldReduceMotion
                  ? { scaleX: 0 }
                  : { scaleX: smoothProgress, transformOrigin: "0% 50%" }
              }
              className="pointer-events-none absolute right-0 bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#8B5CF6] via-[#3B82F6] to-[#22D3EE]"
            />
          </header>

          {/* Page Container */}
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">
            <motion.div
              key={pathname}
              initial={shouldReduceMotion ? false : { opacity: 0.92, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
