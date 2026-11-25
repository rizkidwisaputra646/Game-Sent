"use client";

import React from "react";
import { ThumbsDown, ThumbsUp, Cpu, Sparkles } from "lucide-react";

export function SentimentBadge({
  sentiment,
  size = "sm",
}: {
  sentiment: "positive" | "negative" | string;
  size?: "xs" | "sm";
}) {
  const norm = sentiment.toLowerCase();
  const isPos = norm === "positive";
  const isNeg = norm === "negative";
  const pad = size === "xs" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  if (isPos) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border border-[#22C55E]/35 bg-[#22C55E]/12 font-medium text-[#22C55E] ${pad}`}
      >
        <ThumbsUp className="h-3 w-3" />
        Positive
      </span>
    );
  }
  if (isNeg) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border border-[#F43F5E]/35 bg-[#F43F5E]/12 font-medium text-[#F43F5E] ${pad}`}
      >
        <ThumbsDown className="h-3 w-3" />
        Negative
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-[#263149] bg-[#0D1224] font-medium text-[#94A3B8] ${pad}`}
    >
      {sentiment}
    </span>
  );
}

export function AlgorithmBadge({ algorithm }: { algorithm: "naive_bayes" | "knn" }) {
  if (algorithm === "naive_bayes") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-2.5 py-1 text-xs font-medium text-[#C4B5FD]">
        <Sparkles className="h-3 w-3 text-[#8B5CF6]" />
        Multinomial Naive Bayes
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#22D3EE]/40 bg-[#22D3EE]/12 px-2.5 py-1 text-xs font-medium text-[#67E8F9]">
      <Cpu className="h-3 w-3 text-[#22D3EE]" />
      KNN (k=5, cosine)
    </span>
  );
}
