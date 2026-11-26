"use client";

import React from "react";
import { AlertCircle, FileSearch, Loader2, RefreshCw } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { MangaSparkle } from "@/components/ui/AnimeDecoration";

export function EmptyState({
  title = "Belum Ada Data",
  description = "Belum ada data ulasan atau riwayat analisis yang tersedia untuk ditampilkan.",
  actionLabel,
  onAction,
  icon,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#202020]/40 bg-[#FFFDFC] p-8 text-center shadow-[2px_2px_0px_#202020]">
      <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#202020] bg-[#F7F4EC] shadow-[2px_2px_0px_#202020]">
        {icon ?? <FileSearch className="h-7 w-7 text-[#8060D8]" />}
        <MangaSparkle className="absolute -top-1.5 -right-1.5 h-4 w-4 text-[#A78BFA]" />
      </div>

      <h4 className="font-display text-base font-bold text-[#171717]">{title}</h4>
      <p className="mt-1 max-w-sm text-xs text-[#666666] leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-4">
          <PrimaryButton size="sm" onClick={onAction}>
            {actionLabel}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

export function LoadingState({
  title = "Memproses Data...",
  subtitle = "Model machine learning sedang melakukan komputasi di browser.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-8 text-center shadow-[3px_3px_0px_#202020]">
      <div className="relative mb-3 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#202020] bg-[#A78BFA] shadow-[2px_2px_0px_#202020]">
        <Loader2 className="h-6 w-6 text-[#171717] animate-spin" />
      </div>

      <h4 className="font-display text-sm font-bold text-[#171717]">{title}</h4>
      <p className="mt-1 text-xs text-[#666666]">{subtitle}</p>
    </div>
  );
}

export function ErrorState({
  title = "Terjadi Kendala",
  message = "Gagal memproses data atau menjalankan model machine learning.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-8 text-center shadow-[3px_3px_0px_#202020]">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#202020] bg-[#FA7777] shadow-[2px_2px_0px_#202020]">
        <AlertCircle className="h-6 w-6 text-[#171717]" />
      </div>

      <h4 className="font-display text-sm font-bold text-[#171717]">{title}</h4>
      <p className="mt-1 max-w-md text-xs text-[#666666]">{message}</p>

      {onRetry && (
        <div className="mt-4">
          <SecondaryButton size="sm" onClick={onRetry} icon={<RefreshCw className="h-3.5 w-3.5" />}>
            Coba Lagi
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}
