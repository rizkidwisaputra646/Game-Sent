"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Info, Scale, ShieldAlert } from "lucide-react";
import {
  ScrollReveal,
  SectionNavigationBar,
  type SectionAnchor,
} from "@/components/motion/ScrollPrimitives";
import { useGameSent } from "@/components/providers/GameSentProvider";
import { CountUpNumber } from "@/components/ui/CountUpNumber";
import { HudCard } from "@/components/ui/HudCard";

const GameSentimentBarChart = dynamic(
  () =>
    import("@/components/charts/SentimentCharts").then(
      (m) => m.GameSentimentBarChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[270px] animate-pulse rounded-lg bg-[#0D1224]" />
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
      <div className="h-[260px] animate-pulse rounded-lg bg-[#0D1224]" />
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
      <SectionNavigationBar sections={COMPARISON_SECTIONS} />

      {/* Side-by-Side Game Overview Cards (Slide Left & Slide Right) */}
      <div
        id="sec-games"
        className="grid grid-cols-1 gap-6 scroll-mt-20 lg:grid-cols-2"
      >
        <ScrollReveal variant="slide-left">
          <HudCard tone="blue" hudTag="Game A — Mobile MOBA" className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-[#F1F5F9]">
                  Mobile Legends: Bang Bang
                </h2>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Sumber label dataset:{" "}
                  <code className="rounded bg-[#080B18] px-1.5 py-0.5 text-[#93C5FD]">
                    model ({ml.labelSources.model?.toLocaleString("id-ID") ?? ml.total} baris)
                  </code>
                </p>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#94A3B8]">Total Ulasan</div>
                <div className="text-2xl font-bold text-[#F1F5F9]">
                  <CountUpNumber value={ml.total} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 p-3">
                <div className="text-[11px] text-[#86EFAC]">Positif</div>
                <div className="font-mono-num mt-1 text-lg font-bold text-[#22C55E]">
                  <CountUpNumber value={ml.positive} />
                </div>
                <div className="font-mono-num text-[11px] text-[#86EFAC]">
                  {ml.positivePct}%
                </div>
              </div>
              <div className="rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/10 p-3">
                <div className="text-[11px] text-[#FDA4AF]">Negatif</div>
                <div className="font-mono-num mt-1 text-lg font-bold text-[#F43F5E]">
                  <CountUpNumber value={ml.negative} />
                </div>
                <div className="font-mono-num text-[11px] text-[#FDA4AF]">
                  {ml.negativePct}%
                </div>
              </div>
              <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
                <div className="text-[11px] text-[#94A3B8]">Rata-rata Kata</div>
                <div className="font-mono-num mt-1 text-lg font-bold text-[#F1F5F9]">
                  <CountUpNumber value={ml.avgWordCount} decimals={1} />
                </div>
                <div className="text-[10px] text-[#64748B]">kata / ulasan</div>
              </div>
              <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
                <div className="text-[11px] text-[#94A3B8]">Rata-rata Karakter</div>
                <div className="font-mono-num mt-1 text-lg font-bold text-[#F1F5F9]">
                  <CountUpNumber value={ml.avgCharLength} decimals={1} />
                </div>
                <div className="text-[10px] text-[#64748B]">karakter</div>
              </div>
            </div>

            <ScrollReveal variant="clip-reveal" className="mt-4">
              <SentimentDonutChart
                positive={ml.positive}
                negative={ml.negative}
                totalLabel="Mobile Legends"
              />
            </ScrollReveal>
          </HudCard>
        </ScrollReveal>

        <ScrollReveal variant="slide-right">
          <HudCard tone="cyan" hudTag="Game B — PC MOBA (Steam)" className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-[#F1F5F9]">
                  Dota 2
                </h2>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Sumber label dataset:{" "}
                  <code className="rounded bg-[#080B18] px-1.5 py-0.5 text-[#67E8F9]">
                    voted_up Steam (
                    {dota.labelSources["voted_up Steam"]?.toLocaleString("id-ID") ??
                      dota.total}{" "}
                    baris)
                  </code>
                </p>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#94A3B8]">Total Ulasan</div>
                <div className="text-2xl font-bold text-[#F1F5F9]">
                  <CountUpNumber value={dota.total} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 p-3">
                <div className="text-[11px] text-[#86EFAC]">Positif</div>
                <div className="font-mono-num mt-1 text-lg font-bold text-[#22C55E]">
                  <CountUpNumber value={dota.positive} />
                </div>
                <div className="font-mono-num text-[11px] text-[#86EFAC]">
                  {dota.positivePct}%
                </div>
              </div>
              <div className="rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/10 p-3">
                <div className="text-[11px] text-[#FDA4AF]">Negatif</div>
                <div className="font-mono-num mt-1 text-lg font-bold text-[#F43F5E]">
                  <CountUpNumber value={dota.negative} />
                </div>
                <div className="font-mono-num text-[11px] text-[#FDA4AF]">
                  {dota.negativePct}%
                </div>
              </div>
              <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
                <div className="text-[11px] text-[#94A3B8]">Rata-rata Kata</div>
                <div className="font-mono-num mt-1 text-lg font-bold text-[#F1F5F9]">
                  <CountUpNumber value={dota.avgWordCount} decimals={1} />
                </div>
                <div className="text-[10px] text-[#64748B]">kata / ulasan</div>
              </div>
              <div className="rounded-lg border border-[#263149] bg-[#080B18]/80 p-3">
                <div className="text-[11px] text-[#94A3B8]">Rata-rata Karakter</div>
                <div className="font-mono-num mt-1 text-lg font-bold text-[#F1F5F9]">
                  <CountUpNumber value={dota.avgCharLength} decimals={1} />
                </div>
                <div className="text-[10px] text-[#64748B]">karakter</div>
              </div>
            </div>

            <ScrollReveal variant="clip-reveal" className="mt-4">
              <SentimentDonutChart
                positive={dota.positive}
                negative={dota.negative}
                totalLabel="Dota 2"
              />
            </ScrollReveal>
          </HudCard>
        </ScrollReveal>
      </div>

      {/* Grouped Comparison Bar Chart (Fade & Scale Reveal) */}
      <ScrollReveal id="sec-chart" variant="fade-scale" className="scroll-mt-20">
        <HudCard tone="violet" hudTag="Comparative Distribution">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
                Grafik Perbandingan Sentimen Mobile Legends vs Dota 2
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Beralih antara jumlah absolut dan persentase distribusi sentimen
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChartMode("count")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  chartMode === "count"
                    ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#F1F5F9]"
                    : "border-[#263149] bg-[#080B18] text-[#94A3B8]"
                }`}
              >
                Jumlah Ulasan
              </button>
              <button
                type="button"
                onClick={() => setChartMode("percentage")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  chartMode === "percentage"
                    ? "border-[#22D3EE] bg-[#22D3EE]/18 text-[#F1F5F9]"
                    : "border-[#263149] bg-[#080B18] text-[#94A3B8]"
                }`}
              >
                Persentase (%)
              </button>
            </div>
          </div>

          <div className="mt-4">
            <GameSentimentBarChart data={barData} mode={chartMode} />
          </div>
        </HudCard>
      </ScrollReveal>

      {/* Scientific & Objective Interpretation (Fade Up) */}
      <ScrollReveal id="sec-interpretation" variant="fade-up" className="scroll-mt-20">
        <HudCard tone="default" hudTag="Data-Driven Interpretation">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-[#3B82F6]/35 bg-[#3B82F6]/12 p-2.5 text-[#60A5FA]">
              <Scale className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-[#F1F5F9]">
                Interpretasi Statistik Penelitian
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs leading-relaxed text-[#CBD5E1]">
                <div className="rounded-lg border border-[#263149] bg-[#080B18]/75 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#F1F5F9]">
                    <Info className="h-4 w-4 text-[#22D3EE]" />
                    Temuan Distribusi Aktual
                  </div>
                  <p>
                    Pada dataset penelitian sebanyak{" "}
                    <strong className="font-mono-num text-[#F1F5F9]">
                      {metadata.dataset.totalReviews.toLocaleString("id-ID")}
                    </strong>{" "}
                    ulasan yang hampir seimbang secara jumlah (Mobile Legends:{" "}
                    <strong className="font-mono-num">{ml.total}</strong>; Dota 2:{" "}
                    <strong className="font-mono-num">{dota.total}</strong>), proporsi
                    sentimen positif pada Dota 2 tercatat sebesar{" "}
                    <strong className="font-mono-num text-[#22C55E]">
                      {dota.positivePct}%
                    </strong>{" "}
                    sedangkan Mobile Legends sebesar{" "}
                    <strong className="font-mono-num text-[#22C55E]">
                      {ml.positivePct}%
                    </strong>{" "}
                    (selisih <strong className="font-mono-num">{posGap} poin persen</strong>).
                  </p>
                  <p>
                    Sebaliknya, sentimen negatif mendominasi sampel Mobile Legends sebesar{" "}
                    <strong className="font-mono-num text-[#F43F5E]">
                      {ml.negativePct}%
                    </strong>{" "}
                    ({ml.negative.toLocaleString("id-ID")} ulasan) dibandingkan Dota 2
                    sebesar{" "}
                    <strong className="font-mono-num text-[#F43F5E]">
                      {dota.negativePct}%
                    </strong>{" "}
                    ({dota.negative.toLocaleString("id-ID")} ulasan).
                  </p>
                </div>

                <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/6 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#FDE68A]">
                    <ShieldAlert className="h-4 w-4 text-[#F59E0B]" />
                    Batasan &amp; Kehati-hatian Interpretasi
                  </div>
                  <p>
                    Persentase sentimen positif yang lebih tinggi pada satu game{" "}
                    <strong>
                      tidak boleh disimpulkan bahwa satu game lebih baik secara objektif
                    </strong>{" "}
                    dibandingkan game lainnya.
                  </p>
                  <p>
                    Hasil distribusi sangat dipengaruhi oleh komposisi dataset, perbedaan
                    sumber ulasan &amp; metode pelabelan (kolom{" "}
                    <code className="rounded bg-[#080B18] px-1 text-[#F1F5F9]">
                      label_source
                    </code>
                    : Dota 2 berasal dari <code className="text-[#67E8F9]">voted_up Steam</code>{" "}
                    sedangkan Mobile Legends berlabel{" "}
                    <code className="text-[#93C5FD]">model</code>), periode pengumpulan data,
                    serta karakteristik demografi/platform pengguna yang menulis ulasan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </HudCard>
      </ScrollReveal>
    </div>
  );
}
