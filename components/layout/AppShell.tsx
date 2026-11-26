"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ComicPageTransition } from "@/components/motion/AnimeComicMotion";
import { MobileBottomNavigation } from "@/components/layout/MobileBottomNavigation";
import { NAV_ITEMS } from "@/components/layout/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  ChevronDown,
  FileText,
  Menu,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useGameSent } from "@/components/providers/GameSentProvider";

function BrandLogoBars() {
  return (
    <div className="flex items-end justify-center gap-1.5 py-1" aria-hidden="true">
      <span className="h-4 w-3 rounded-t border-2 border-[#202020] bg-[#DDD6FE]" />
      <span className="h-6 w-3 rounded-t border-2 border-[#202020] bg-[#C4B5FD]" />
      <span className="h-8 w-3 rounded-t border-2 border-[#202020] bg-[#A78BFA]" />
    </div>
  );
}

function SidebarGamepadArt() {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      className="w-28 h-20 -rotate-12 select-none pointer-events-none"
      aria-hidden="true"
    >
      {/* Gamepad body */}
      <path
        d="M28 24C18 24 10 35 10 48C10 59 17 66 24 66C30 66 34 57 42 54H78C86 57 90 66 96 66C103 66 110 59 110 48C110 35 102 24 92 24H28Z"
        fill="#C4B5FD"
        stroke="#202020"
        strokeWidth="2.5"
      />
      {/* D-pad */}
      <path
        d="M32 34V46M26 40H38"
        stroke="#202020"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Action buttons */}
      <circle cx="84" cy="35" r="2.8" fill="#FFFDFC" stroke="#202020" strokeWidth="1.5" />
      <circle cx="91" cy="41" r="2.8" fill="#A78BFA" stroke="#202020" strokeWidth="1.5" />
      <circle cx="84" cy="47" r="2.8" fill="#FFFDFC" stroke="#202020" strokeWidth="1.5" />
      <circle cx="77" cy="41" r="2.8" fill="#FFFDFC" stroke="#202020" strokeWidth="1.5" />
      {/* Center buttons */}
      <rect x="52" y="39" width="6" height="3" rx="1.5" fill="#202020" />
      <rect x="62" y="39" width="6" height="3" rx="1.5" fill="#202020" />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const {
    modelStatus,
    ensureModelsLoaded,
    activeSession,
    history,
  } = useGameSent();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setStatusMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex h-full flex-col justify-between bg-[#FFFDFC] border-r-2 border-[#202020] overflow-hidden">
      <div>
        {/* Brand Header */}
        <div className="relative flex items-center justify-between px-5 pt-6 pb-5">
          <Link
            href="/dashboard"
            onClick={() => isMobile && setMobileOpen(false)}
            className="flex flex-col items-center w-full text-center group"
          >
            <BrandLogoBars />
            <span className="mt-1.5 font-display text-xl font-extrabold tracking-tight text-[#171717]">
              GameSent
            </span>
            <p className="mt-0.5 text-[11px] font-medium text-[#666666] leading-snug">
              Gaming Sentiment
              <br />
              Research &amp; Analytics
            </p>
          </Link>

          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 rounded-lg border-2 border-[#202020] bg-[#FFFDFC] p-1.5 text-[#171717] shadow-[1.5px_1.5px_0px_#202020]"
              aria-label="Tutup menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="mt-1 space-y-1 px-3.5" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] transition-all duration-150 ${
                  active
                    ? "bg-[#DDD6FE] border-2 border-[#202020] font-bold text-[#171717] shadow-[2px_2px_0px_#202020]"
                    : "border-2 border-transparent font-medium text-[#444444] hover:bg-[#F7F4EC] hover:text-[#171717]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active ? "text-[#171717]" : "text-[#555555] group-hover:text-[#171717]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Anime/Editorial Slogan & Gamepad Art */}
      <div className="relative mt-auto pt-12 overflow-hidden select-none">
        {/* Diagonal Lavender Graphic Wedge */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-44 bg-[#DDD6FE] border-t-2 border-[#202020]"
          style={{
            clipPath: "polygon(0 28%, 100% 0%, 100% 100%, 0% 100%)",
          }}
        />
        {/* Halftone Dots inside wedge */}
        <div
          aria-hidden="true"
          className="absolute right-0 bottom-0 h-32 w-32 opacity-20"
          style={{
            backgroundImage: "radial-gradient(#202020 1.25px, transparent 1.25px)",
            backgroundSize: "7px 7px",
          }}
        />

        <div className="relative z-10 px-5 pt-2 pb-1">
          <p className="font-display text-xs font-extrabold italic tracking-wide uppercase leading-tight text-[#171717]">
            ANALYZE.
            <br />
            UNDERSTAND.
            <br />
            EXPLORE.
          </p>
          <div className="-ml-2 mt-1 -mb-3">
            <SidebarGamepadArt />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen bg-[#F7F4EC] text-[#171717]">
      <div className="relative z-10 flex min-h-screen">
        {/* Desktop Fixed Sidebar (~236px) */}
        <aside className="hidden lg:block w-[236px] shrink-0">
          <div className="sticky top-0 h-screen">{sidebarContent(false)}</div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
              />
              <motion.aside
                initial={shouldReduceMotion ? false : { x: -260 }}
                animate={{ x: 0 }}
                exit={shouldReduceMotion ? undefined : { x: -260 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.22,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="fixed inset-y-0 left-0 z-50 w-[248px] lg:hidden"
              >
                {sidebarContent(true)}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile & Tablet Top Bar (< lg) */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b-2 border-[#202020] bg-[#FFFDFC]/95 px-4 backdrop-blur-md lg:hidden">
            <div className="flex items-center gap-2.5">
              {/* Hamburger drawer button shown on Tablet (md..lg) only; hidden on Mobile (< md) since Mobile uses Bottom Nav */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="hidden md:inline-flex rounded-lg border-2 border-[#202020] bg-[#FFFDFC] p-1.5 text-[#171717] shadow-[2px_2px_0px_#202020]"
                aria-label="Buka navigasi"
              >
                <Menu className="h-4 w-4" />
              </button>
              <Link href="/dashboard" className="flex items-center gap-2 font-display text-base font-extrabold text-[#171717]">
                <span className="flex items-end gap-0.5 md:hidden" aria-hidden="true">
                  <span className="h-2.5 w-1.5 rounded-t border border-[#202020] bg-[#DDD6FE]" />
                  <span className="h-3.5 w-1.5 rounded-t border border-[#202020] bg-[#C4B5FD]" />
                  <span className="h-4.5 w-1.5 rounded-t border border-[#202020] bg-[#A78BFA]" />
                </span>
                <span>GameSent</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/reports"
                aria-label="Reports & Export"
                className={`inline-flex items-center gap-1 rounded-xl border-2 border-[#202020] px-2.5 py-1 text-[11px] font-bold shadow-[2px_2px_0px_#202020] md:hidden ${
                  pathname.startsWith("/reports")
                    ? "bg-[#DDD6FE] text-[#171717]"
                    : "bg-[#FFFDFC] text-[#171717]"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Reports</span>
              </Link>
              <span
                className={`inline-flex items-center gap-1.5 rounded-xl border-2 border-[#202020] px-2.5 py-1 text-[11px] font-bold shadow-[2px_2px_0px_#202020] ${
                  modelStatus.ready
                    ? "bg-[#FFFDFC] text-[#171717]"
                    : modelStatus.error
                    ? "bg-[#FA7777] text-[#171717]"
                    : "bg-[#F5C85B] text-[#171717]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    modelStatus.ready
                      ? "bg-[#65C98A]"
                      : modelStatus.error
                      ? "bg-[#BA2A2A]"
                      : "bg-[#E8BC55] animate-pulse"
                  }`}
                />
                {modelStatus.ready ? "Model Ready" : modelStatus.error ? "Error" : "Loading..."}
              </span>
            </div>
          </header>

          {/* Desktop Floating Top-Right Status Controls */}
          <div className="hidden lg:flex items-center justify-end gap-2.5 px-8 pt-5 pb-1 max-w-[1440px] w-full mx-auto relative z-30">
            {activeSession && (
              <Link
                href="/datasets"
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#202020] bg-[#FFFDFC] px-3 py-1.5 text-xs font-bold text-[#171717] shadow-[2px_2px_0px_#202020] hover:bg-[#DDD6FE] transition-colors"
                title="Sesi dataset tambahan aktif"
              >
                <BarChart3 className="h-3.5 w-3.5 text-[#3479D4]" />
                <span className="max-w-[140px] truncate">
                  Sesi: {activeSession.sessionName}
                </span>
              </Link>
            )}

            {/* Model Ready Dropdown Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStatusMenuOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#202020] bg-[#FFFDFC] px-3.5 py-1.5 text-xs font-bold text-[#171717] shadow-[2px_2px_0px_#202020] hover:bg-[#F7F4EC] transition-all cursor-pointer"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full border border-[#202020] ${
                    modelStatus.ready
                      ? "bg-[#65C98A]"
                      : modelStatus.error
                      ? "bg-[#FA7777]"
                      : "bg-[#F5C85B] animate-pulse"
                  }`}
                />
                <span>
                  {modelStatus.ready
                    ? "Model Ready"
                    : modelStatus.error
                    ? "Model Error"
                    : "Memuat Model..."}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#666666]" />
              </button>

              {statusMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-3.5 text-xs shadow-[4px_4px_0px_#202020] z-50">
                  <div className="flex items-center justify-between border-b border-[#202020]/15 pb-2">
                    <span className="font-bold text-[#171717] flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#228448]" />
                      Local-First ML Engine
                    </span>
                    <span className="font-mono text-[10px] font-bold rounded border border-[#202020] bg-[#65C98A] px-1.5 py-0.5">
                      Client-Only
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-1.5 text-[#666666]">
                    <div className="flex justify-between">
                      <span>TF-IDF Vectorizer</span>
                      <span className="font-mono font-bold text-[#171717]">1.000 fitur</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Multinomial NB</span>
                      <span className="font-mono font-bold text-[#171717]">
                        {modelStatus.ready ? "Aktif (80.5%)" : "Memuat"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>KNN (k=5, cosine)</span>
                      <span className="font-mono font-bold text-[#171717]">
                        {modelStatus.ready ? "Aktif (74.1%)" : "Memuat"}
                      </span>
                    </div>
                    {modelStatus.error && (
                      <button
                        type="button"
                        onClick={() => void ensureModelsLoaded()}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-[#202020] bg-[#FA7777] py-1.5 font-bold text-[#171717]"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Muat Ulang Model
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bell / Recent Activity Quick Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setStatusMenuOpen(false);
                }}
                aria-label="Aktivitas terbaru"
                className="relative flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#202020] bg-[#FFFDFC] text-[#171717] shadow-[2px_2px_0px_#202020] hover:bg-[#F7F4EC] transition-all cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {history.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-[#202020] bg-[#A78BFA] px-1 font-mono text-[9px] font-bold text-[#171717]">
                    {history.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-3.5 text-xs shadow-[4px_4px_0px_#202020] z-50">
                  <div className="flex items-center justify-between border-b border-[#202020]/15 pb-2">
                    <span className="font-bold text-[#171717] flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-[#8060D8]" />
                      Riwayat Analisis Lokal
                    </span>
                    <Link
                      href="/datasets"
                      onClick={() => setNotifOpen(false)}
                      className="text-[11px] font-bold text-[#8060D8] hover:underline"
                    >
                      Lihat Semua
                    </Link>
                  </div>
                  {history.length === 0 ? (
                    <p className="py-3 text-center text-[#666666]">
                      Belum ada riwayat analisis lokal di IndexedDB.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {history.slice(0, 4).map((s) => (
                        <li key={s.id} className="rounded-lg border border-[#202020]/20 bg-[#F7F4EC] p-2">
                          <div className="font-bold text-[#171717] truncate">{s.sessionName}</div>
                          <div className="text-[10px] font-mono text-[#666666]">
                            {s.totalRows} baris • +{s.positiveCount} / -{s.negativeCount}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Body */}
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-8 lg:px-8">
            <ComicPageTransition routeKey={pathname}>
              {children}
            </ComicPageTransition>
          </main>
        </div>
      </div>

      {/* Floating Comic Neo-Brutalist Bottom Navigation (Mobile < 768px) */}
      <MobileBottomNavigation />
    </div>
    </MotionConfig>
  );
}
