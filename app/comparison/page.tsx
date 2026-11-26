"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Info, Scale, ShieldAlert } from "lucide-react";
import {
  SectionNavigationBar,
  type SectionAnchor,
} from "@/components/motion/ScrollPrimitives";
import {
  ComicPanelReveal,
  ComicPopCallout,
  ImpactBurst,
  MangaSpeedLines,
} from "@/components/motion/AnimeComicMotion";
import { useGameSent } from "@/components/providers/GameSentProvider";
import { CountUpNumber } from "@/components/ui/CountUpNumber";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  DotaArtworkBadge,
  MLBBArtworkBadge,
} from "@/components/ui/AnimeDecoration";

const GameSentimentBarChart = dynamic(
  () =>
    import("@/components/charts/SentimentCharts").then(
      (m) => m.GameSentimentBarChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[270px] animate-pulse rounded-xl border-2 border-[#202020] bg-[#FFFDFC]" />
    ),
  }
);

const SentimentDonutChart = dynamic(
  () =>
    import("@/components/charts/SentimentCharts").then(
      (m) => m.SentimentDonutChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] animate-pulse rounded-xl border-2 border-[#202020] bg-[#FFFDFC]" />
    ),
  }
);

const COMPARISON_SECTIONS: SectionAnchor[] = [
  { id: "sec-games", code: "01", label: "Profil Per Game" },
  { id: "sec-chart", code: "02", label: "Grafik Perbandingan" },
  { id: "sec-interpretation", code: "03", label: "Interpretasi Riset" },
];

export default function ComparisonPage() {
  const { metadata } = useGameSent();
  const [chartMode, setChartMode] = useState<"count" | "percentage">("count");

  const ml = metadata.dataset.games["Mobile Legends"];
  const dota = metadata.dataset.games["Dota 2"];

  const barData = [
    {
      game: "Mobile Legends",
      positive: ml.positive,
      negative: ml.negative,
      positivePct: ml.positivePct,
      negativePct: ml.negativePct,
    },
    {
      game: "Dota 2",
      positive: dota.positive,
      negative: dota.negative,
      positivePct: dota.positivePct,
      negativePct: dota.negativePct,
    },
  ];

  const posGap = Math.abs(dota.positivePct - ml.positivePct).toFixed(2);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Game Comparison"
        tag="KOMPARASI MOBA"
        description="Analisis komparatif sebaran sentimen ulasan pemain antara Dota 2 (Steam) dan Mobile Legends: Bang Bang (Google Play Store) dengan konteks metodologis penelitian."
      />

      <SectionNavigationBar sections={COMPARISON_SECTIONS} />

      {/* 1. Side-by-Side Game Profile Cards — Uncropped Artwork + Crisp High-Contrast Header Strip */}
      <div
        id="sec-games"
        className="grid grid-cols-1 gap-6 scroll-mt-20 lg:grid-cols-2"
      >
        {/* Mobile Legends Card (Blue + Gold Energy Reveal from Left) */}
        <ComicPanelReveal direction="left">
          <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] shadow-[3.5px_3.5px_0px_#202020] overflow-hidden">
            {/* Full Uncropped Artwork Showcase */}
            <div className="relative h-56 sm:h-64 w-full border-b-2 border-[#202020] bg-[#0F172A] overflow-hidden">
              <Image
                src="/images/mlbb-art.jpg"
                alt="Mobile Legends: Bang Bang Reference Artwork"
                fill
                className="object-cover object-[center_18%]"
              />
              <div className="absolute top-3 right-3 z-10">
                <ComicPopCallout text="MOBILE MOBA" tone="mlbb" tilt={2} />
              </div>
            </div>

            {/* Crisp Solid Blue-Gold Title Strip (Zero Contrast Overlap!) */}
            <div className="relative overflow-hidden flex items-center justify-between gap-3 border-b-2 border-[#202020] bg-[#3479D4] px-4 py-3.5 text-white">
              <ImpactBurst
                color="#E8BC55"
                className="absolute -right-6 -bottom-6 w-24 h-24 opacity-25"
              />
              <div className="relative z-10 flex items-center gap-3 min-w-0">
                <MLBBArtworkBadge />
                <div className="min-w-0">
                  <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-white truncate">
                    Mobile Legends: Bang Bang
                  </h2>
                  <p className="text-xs text-white/90 mt-0.5 truncate">
                    Sumber: Google Play Store (label_source: model)
                  </p>
                </div>
              </div>

              <div className="relative z-10 text-right shrink-0">
                <span className="block text-[10px] font-mono font-bold text-[#E8BC55] uppercase">
                  Total Ulasan
                </span>
                <span className="font-display text-2xl font-extrabold text-white">
                  <CountUpNumber value={ml.total} />
                </span>
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border-2 border-[#202020] bg-[#65C98A]/25 p-3 text-center shadow-[1.5px_1.5px_0px_#202020]">
                  <span className="block text-[10px] font-mono font-bold text-[#228448] uppercase">Positif</span>
                  <span className="font-display text-xl font-bold text-[#228448]">
                    <CountUpNumber value={ml.positive} />
                  </span>
                  <span className="block text-xs font-bold text-[#228448] mt-0.5">{ml.positivePct}%</span>
                </div>

                <div className="rounded-lg border-2 border-[#202020] bg-[#FA7777]/25 p-3 text-center shadow-[1.5px_1.5px_0px_#202020]">
                  <span className="block text-[10px] font-mono font-bold text-[#BA2A2A] uppercase">Negatif</span>
                  <span className="font-display text-xl font-bold text-[#BA2A2A]">
                    <CountUpNumber value={ml.negative} />
                  </span>
                  <span className="block text-xs font-bold text-[#BA2A2A] mt-0.5">{ml.negativePct}%</span>
                </div>

                <div className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-3 text-center shadow-[1.5px_1.5px_0px_#202020]">
                  <span className="block text-[10px] font-mono font-bold text-[#666666] uppercase">Rata-rata Kata</span>
                  <span className="font-display text-xl font-bold text-[#171717]">
                    <CountUpNumber value={ml.avgWordCount} decimals={1} />
                  </span>
                  <span className="block text-[11px] text-[#666666] mt-0.5">kata / ulasan</span>
                </div>

                <div className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-3 text-center shadow-[1.5px_1.5px_0px_#202020]">
                  <span className="block text-[10px] font-mono font-bold text-[#666666] uppercase">Rata-rata Karakter</span>
                  <span className="font-display text-xl font-bold text-[#171717]">
                    <CountUpNumber value={ml.avgCharLength} decimals={1} />
                  </span>
                  <span className="block text-[11px] text-[#666666] mt-0.5">karakter</span>
                </div>
              </div>

              <div className="rounded-xl border-2 border-[#202020] bg-[#F7F4EC] p-3">
                <SentimentDonutChart
                  positive={ml.positive}
                  negative={ml.negative}
                  totalLabel="Mobile Legends"
                />
              </div>
            </div>
          </div>
        </ComicPanelReveal>

        {/* Dota 2 Card (Crimson Impact Reveal from Right) */}
        <ComicPanelReveal direction="right" delay={0.08}>
          <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] shadow-[3.5px_3.5px_0px_#202020] overflow-hidden">
            {/* Full Uncropped Artwork Showcase */}
            <div className="relative h-56 sm:h-64 w-full border-b-2 border-[#202020] bg-[#171717] overflow-hidden">
              <Image
                src="/images/dota-art.jpg"
                alt="Dota 2 Reference Artwork"
                fill
                className="object-cover object-[center_20%]"
              />
              <div className="absolute top-3 right-3 z-10">
                <ComicPopCallout text="PC MOBA (STEAM)" tone="dota" tilt={-2} />
              </div>
            </div>

            {/* Crisp Solid Crimson Title Strip */}
            <div className="relative overflow-hidden flex items-center justify-between gap-3 border-b-2 border-[#202020] bg-[#D94B43] px-4 py-3.5 text-white">
              <MangaSpeedLines
                color="#FFFFFF"
                className="absolute inset-0 h-full w-full opacity-35"
              />
              <div className="relative z-10 flex items-center gap-3 min-w-0">
                <DotaArtworkBadge />
                <div className="min-w-0">
                  <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-white truncate">
                    Dota 2
                  </h2>
                  <p className="text-xs text-white/90 mt-0.5 truncate">
                    Sumber: Steam Community (voted_up Steam)
                  </p>
                </div>
              </div>

              <div className="relative z-10 text-right shrink-0">
                <span className="block text-[10px] font-mono font-bold text-[#FFFDFC]/90 uppercase">
                  Total Ulasan
                </span>
                <span className="font-display text-2xl font-extrabold text-white">
                  <CountUpNumber value={dota.total} />
                </span>
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border-2 border-[#202020] bg-[#65C98A]/25 p-3 text-center shadow-[1.5px_1.5px_0px_#202020]">
                  <span className="block text-[10px] font-mono font-bold text-[#228448] uppercase">Positif</span>
                  <span className="font-display text-xl font-bold text-[#228448]">
                    <CountUpNumber value={dota.positive} />
                  </span>
                  <span className="block text-xs font-bold text-[#228448] mt-0.5">{dota.positivePct}%</span>
                </div>

                <div className="rounded-lg border-2 border-[#202020] bg-[#FA7777]/25 p-3 text-center shadow-[1.5px_1.5px_0px_#202020]">
                  <span className="block text-[10px] font-mono font-bold text-[#BA2A2A] uppercase">Negatif</span>
                  <span className="font-display text-xl font-bold text-[#BA2A2A]">
                    <CountUpNumber value={dota.negative} />
                  </span>
                  <span className="block text-xs font-bold text-[#BA2A2A] mt-0.5">{dota.negativePct}%</span>
                </div>

                <div className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-3 text-center shadow-[1.5px_1.5px_0px_#202020]">
                  <span className="block text-[10px] font-mono font-bold text-[#666666] uppercase">Rata-rata Kata</span>
                  <span className="font-display text-xl font-bold text-[#171717]">
                    <CountUpNumber value={dota.avgWordCount} decimals={1} />
                  </span>
                  <span className="block text-[11px] text-[#666666] mt-0.5">kata / ulasan</span>
                </div>

                <div className="rounded-lg border-2 border-[#202020] bg-[#F7F4EC] p-3 text-center shadow-[1.5px_1.5px_0px_#202020]">
                  <span className="block text-[10px] font-mono font-bold text-[#666666] uppercase">Rata-rata Karakter</span>
                  <span className="font-display text-xl font-bold text-[#171717]">
                    <CountUpNumber value={dota.avgCharLength} decimals={1} />
                  </span>
                  <span className="block text-[11px] text-[#666666] mt-0.5">karakter</span>
                </div>
              </div>

              <div className="rounded-xl border-2 border-[#202020] bg-[#F7F4EC] p-3">
                <SentimentDonutChart
                  positive={dota.positive}
                  negative={dota.negative}
                  totalLabel="Dota 2"
                />
              </div>
            </div>
          </div>
        </ComicPanelReveal>
      </div>

      {/* 2. Grouped Comparison Bar Chart */}
      <ComicPanelReveal id="sec-chart" direction="up" className="scroll-mt-20">
        <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020]">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-[#202020]/10">
            <div>
              <h3 className="font-display text-lg font-bold text-[#171717]">
                Grafik Komparasi Sentimen MOBA
              </h3>
              <p className="text-xs text-[#666666]">
                Beralih antara jumlah absolut (ulasan) dan persentase (%)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChartMode("count")}
                className={`rounded-xl border-2 border-[#202020] px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  chartMode === "count"
                    ? "bg-[#A78BFA] text-[#171717] shadow-[2px_2px_0px_#202020]"
                    : "bg-[#FFFDFC] text-[#666666] hover:bg-[#F7F4EC]"
                }`}
              >
                Jumlah Ulasan
              </button>
              <button
                type="button"
                onClick={() => setChartMode("percentage")}
                className={`rounded-xl border-2 border-[#202020] px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  chartMode === "percentage"
                    ? "bg-[#A78BFA] text-[#171717] shadow-[2px_2px_0px_#202020]"
                    : "bg-[#FFFDFC] text-[#666666] hover:bg-[#F7F4EC]"
                }`}
              >
                Persentase (%)
              </button>
            </div>
          </div>

          <div className="mt-4">
            <GameSentimentBarChart data={barData} mode={chartMode} />
          </div>
        </div>
      </ComicPanelReveal>

      {/* 3. Methodological Context & Caution */}
      <ComicPanelReveal id="sec-interpretation" direction="up" className="scroll-mt-20">
        <div className="rounded-xl border-2 border-[#202020] bg-[#FFFDFC] p-5 shadow-[3px_3px_0px_#202020]">
          <div className="flex items-start gap-3 pb-3 border-b-2 border-[#202020]/10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#202020] bg-[#A78BFA] shadow-[2px_2px_0px_#202020]">
              <Scale className="h-5 w-5 text-[#171717]" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[#171717]">
                Konteks Metodologis &amp; Batasan Analisis
              </h3>
              <p className="text-xs text-[#666666]">
                Pedoman interpretasi perbandingan sentimen antar-platform
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border-2 border-[#202020] bg-[#F7F4EC] p-4 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-[#171717]">
                <Info className="h-4 w-4 text-[#8060D8]" />
                Temuan Sebaran Data Aktual
              </div>
              <p className="text-xs text-[#171717] leading-relaxed">
                Pada dataset penelitian sebanyak{" "}
                <strong>{metadata.dataset.totalReviews.toLocaleString("id-ID")}</strong> ulasan
                (Mobile Legends: <strong>{ml.total}</strong>; Dota 2: <strong>{dota.total}</strong>), proporsi sentimen positif Dota 2 tercatat sebesar{" "}
                <strong className="text-[#228448]">{dota.positivePct}%</strong> sedangkan Mobile Legends sebesar{" "}
                <strong className="text-[#228448]">{ml.positivePct}%</strong> (selisih {posGap} poin persen).
              </p>
              <p className="text-xs text-[#171717] leading-relaxed">
                Sentimen negatif mendominasi ulasan Mobile Legends sebesar{" "}
                <strong className="text-[#BA2A2A]">{ml.negativePct}%</strong> ({ml.negative.toLocaleString("id-ID")} ulasan) dibandingkan Dota 2 sebesar{" "}
                <strong className="text-[#BA2A2A]">{dota.negativePct}%</strong> ({dota.negative.toLocaleString("id-ID")} ulasan).
              </p>
            </div>

            <div className="rounded-xl border-2 border-[#202020] bg-[#F5C85B]/25 p-4 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-[#171717]">
                <ShieldAlert className="h-4 w-4 text-[#C89B2B]" />
                Kehati-hatian Pengambilan Kesimpulan
              </div>
              <p className="text-xs text-[#171717] leading-relaxed">
                Persentase sentimen positif yang lebih tinggi pada Dota 2{" "}
                <strong>TIDAK otomatis menandakan bahwa Dota 2 merupakan game yang lebih baik secara objektif</strong>.
              </p>
              <p className="text-xs text-[#171717] leading-relaxed">
                Hasil ini merefleksikan perbedaan ekosistem: Dota 2 dikumpulkan dari platform PC (Steam) di mana ulasan sering kali berupa evaluasi berbobot dari pemain jangka panjang, sedangkan Mobile Legends dikumpulkan dari Google Play Store di mana ulasan mobile rentan dipicu keluhan koneksi, update aplikasi, atau frustrasi sistem gacha/skin.
              </p>
            </div>
          </div>
        </div>
      </ComicPanelReveal>
    </div>
  );
}
