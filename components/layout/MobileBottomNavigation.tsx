"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { BOTTOM_NAV_ITEMS } from "@/components/layout/navigation";

function SmallComicBurst({ shouldReduceMotion }: { shouldReduceMotion: boolean | null }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      initial={shouldReduceMotion ? false : { scale: 0.4, opacity: 0.9 }}
      animate={{ scale: 1.05, opacity: 0.85 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
      }
      className="pointer-events-none absolute -top-1 -right-1 h-3.5 w-3.5 text-[#8060D8]"
    >
      <path
        d="M12 1L14.2 8.5L22 10L14.5 12.8L16 20L11.5 14.5L5 18L8.8 11.8L2 9L9.5 8.2L12 1Z"
        fill="#A78BFA"
        stroke="#202020"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

/**
 * Floating Comic Neo-Brutalist Bottom Navigation (Mobile only < 768px)
 */
export function MobileBottomNavigation() {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Navigasi utama mobile"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pt-1 pb-[calc(0.65rem+env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="pointer-events-auto mx-auto max-w-md rounded-[16px] border-2 border-[#202020] bg-[#FFFDFC] p-1.5 shadow-[3px_3px_0px_#202020]">
        <ul className="grid grid-cols-5 gap-1">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-center transition-transform duration-150 select-none active:translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8060D8] focus-visible:ring-offset-1 ${
                    active
                      ? "text-[#171717]"
                      : "text-[#555555] [@media(hover:hover)]:hover:bg-[#F7F4EC] [@media(hover:hover)]:hover:text-[#171717]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="mobile-bottom-nav-active"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 440, damping: 30 }
                      }
                      className="absolute inset-0 rounded-xl border-2 border-[#202020] bg-[#DDD6FE] shadow-[1.5px_1.5px_0px_#202020]"
                    />
                  )}

                  <span className="relative z-10 flex items-center justify-center">
                    <motion.span
                      animate={
                        shouldReduceMotion
                          ? undefined
                          : { scale: active ? 1.12 : 1, y: active ? -1 : 0 }
                      }
                      transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
                      className="inline-flex"
                    >
                      <Icon
                        className={`h-[18px] w-[18px] ${
                          active ? "stroke-[2.3px] text-[#171717]" : "stroke-[1.9px]"
                        }`}
                      />
                    </motion.span>
                    {active && (
                      <SmallComicBurst
                        key={`burst-${item.href}`}
                        shouldReduceMotion={shouldReduceMotion}
                      />
                    )}
                  </span>

                  <span
                    className={`relative z-10 max-w-full truncate font-display text-[10px] leading-tight tracking-tight ${
                      active ? "font-extrabold text-[#171717]" : "font-semibold"
                    }`}
                  >
                    {item.mobileLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
