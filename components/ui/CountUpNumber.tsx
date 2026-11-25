"use client";

import React, { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

interface CountUpNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  durationMs?: number;
  className?: string;
}

export function CountUpNumber({
  value,
  decimals = 0,
  suffix = "",
  durationMs = 950,
  className = "",
}: CountUpNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.25 });
  const [displayValue, setDisplayValue] = useState<number>(value);

  useEffect(() => {
    if (shouldReduceMotion || !isInView) {
      setDisplayValue(value);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, durationMs, shouldReduceMotion, isInView]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString("id-ID");

  return (
    <span ref={ref} className={`font-mono-num ${className}`}>
      {formatted}
      {suffix}
    </span>
  );
}
