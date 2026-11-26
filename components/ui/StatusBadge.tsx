"use client";

import React from "react";
import { ThumbsDown, ThumbsUp, Cpu, Sparkles } from "lucide-react";

export function SentimentBadge({
  sentiment,
  size = "sm",
}: {
  sentiment: "positive" | "negative" | string;
  size?: "xs" | "sm" | "md";
}) {
  const norm = sentiment.toLowerCase();
  const isPos = norm === "positive";
  const isNeg = norm === "negative";

  const sizeClasses = {
    xs: "px-2 py-0.5 text-[11px]",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  }[size];

  if (isPos) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-md border-2 border-[#202020] bg-[#65C98A] text-[#171717] shadow-[2px_2px_0px_#202020] ${sizeClasses}`}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        Positif
      </span>
    );
  }

  if (isNeg) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-md border-2 border-[#202020] bg-[#FA7777] text-[#171717] shadow-[2px_2px_0px_#202020] ${sizeClasses}`}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        Negatif
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border-2 border-[#202020] bg-white text-[#171717] shadow-[2px_2px_0px_#202020] ${sizeClasses}`}
    >
      {sentiment}
    </span>
  );
}

export function GameBadge({
  game,
  size = "sm",
}: {
  game: "Dota 2" | "Mobile Legends" | string;
  size?: "xs" | "sm" | "md";
}) {
  const isDota = game.toLowerCase().includes("dota");
  const sizeClasses = {
    xs: "px-2 py-0.5 text-[11px]",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  }[size];

  if (isDota) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-md border-2 border-[#202020] bg-[#D94B43] text-white shadow-[2px_2px_0px_#202020] ${sizeClasses}`}
      >
        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
        Dota 2
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-md border-2 border-[#202020] bg-[#3479D4] text-white shadow-[2px_2px_0px_#202020] ${sizeClasses}`}
    >
      <span className="h-2 w-2 rounded-full bg-[#E8BC55] animate-pulse" />
      Mobile Legends
    </span>
  );
}

export function AlgorithmBadge({
  algorithm,
  size = "sm",
}: {
  algorithm: "naive_bayes" | "knn" | string;
  size?: "xs" | "sm";
}) {
  const isNB = algorithm === "naive_bayes";
  const sizeClasses = size === "xs" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  if (isNB) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-md border-2 border-[#202020] bg-[#A78BFA] text-[#171717] shadow-[2px_2px_0px_#202020] ${sizeClasses}`}
      >
        <Sparkles className="h-3.5 w-3.5 text-[#171717]" />
        Multinomial Naive Bayes
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-md border-2 border-[#202020] bg-[#E8BC55] text-[#171717] shadow-[2px_2px_0px_#202020] ${sizeClasses}`}
    >
      <Cpu className="h-3.5 w-3.5 text-[#171717]" />
      KNN (k=5, cosine)
    </span>
  );
}

export function StatusPill({
  label,
  variant = "neutral",
}: {
  label: string;
  variant?: "neutral" | "primary" | "positive" | "warning" | "dota" | "mlbb";
}) {
  const variantStyles = {
    neutral: "bg-white text-[#171717]",
    primary: "bg-[#A78BFA] text-[#171717]",
    positive: "bg-[#65C98A] text-[#171717]",
    warning: "bg-[#F5C85B] text-[#171717]",
    dota: "bg-[#D94B43] text-white",
    mlbb: "bg-[#3479D4] text-white",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono-num text-[11px] font-bold uppercase tracking-wider rounded-md border-1.5 border-[#202020] px-2 py-0.5 shadow-[1.5px_1.5px_0px_#202020] ${variantStyles}`}
    >
      {label}
    </span>
  );
}
