"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { GameBadge, SentimentBadge } from "@/components/ui/StatusBadge";
import { SecondaryButton } from "@/components/ui/Buttons";

export interface ReviewRowItem {
  id: string | number;
  game?: string;
  review: string;
  label: "positive" | "negative" | string;
  labelSource?: string;
  predicted?: string;
  confidence?: number;
}

export function DataTable({
  rows,
  pageSize = 15,
  showGame = true,
  showPrediction = false,
  searchTerm = "",
  onSearchChange,
}: {
  rows: ReviewRowItem[];
  pageSize?: number;
  showGame?: boolean;
  showPrediction?: boolean;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(rows.length / pageSize) || 1;

  const currentRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-3">
      {/* Search Bar if handler provided */}
      {onSearchChange && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari kata kunci dalam ulasan..."
            className="w-full rounded-xl border-2 border-[#202020] bg-[#FFFDFC] pl-10 pr-4 py-2 text-sm text-[#171717] placeholder:text-[#666666] shadow-[2px_2px_0px_#202020] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
          />
        </div>
      )}

      {/* Table Box */}
      <div className="overflow-x-auto rounded-xl border-2 border-[#202020] bg-[#FFFDFC] shadow-[3px_3px_0px_#202020]">
        <table className="w-full border-collapse text-left text-sm text-[#171717]">
          <thead>
            <tr className="border-b-2 border-[#202020] bg-[#F7F4EC] text-xs font-bold text-[#171717] uppercase tracking-wider font-mono">
              <th className="py-3 px-4 w-16">No / ID</th>
              {showGame && <th className="py-3 px-4 w-36">Game</th>}
              <th className="py-3 px-4">Teks Ulasan</th>
              <th className="py-3 px-4 w-32">Sentimen</th>
              {showPrediction && <th className="py-3 px-4 w-36">Prediksi Model</th>}
            </tr>
          </thead>
          <tbody className="divide-y border-[#202020]/15">
            {currentRows.length === 0 ? (
              <tr>
                <td
                  colSpan={showGame && showPrediction ? 5 : showGame || showPrediction ? 4 : 3}
                  className="py-10 text-center text-sm text-[#666666]"
                >
                  Tidak ada data yang cocok dengan kriteria filter saat ini.
                </td>
              </tr>
            ) : (
              currentRows.map((row, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <tr
                    key={row.id ?? idx}
                    className="hover:bg-[#F7F4EC]/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono-num text-xs text-[#666666] font-semibold align-top">
                      #{row.id ?? globalIndex}
                    </td>

                    {showGame && (
                      <td className="py-3 px-4 align-top">
                        {row.game ? (
                          <GameBadge game={row.game} size="xs" />
                        ) : (
                          <span className="text-xs text-[#666666]">—</span>
                        )}
                      </td>
                    )}

                    <td className="py-3 px-4 text-xs sm:text-sm text-[#171717] leading-relaxed max-w-xl">
                      {row.review}
                    </td>

                    <td className="py-3 px-4 align-top">
                      <SentimentBadge sentiment={row.label} size="xs" />
                    </td>

                    {showPrediction && (
                      <td className="py-3 px-4 align-top space-y-1">
                        {row.predicted ? (
                          <>
                            <SentimentBadge sentiment={row.predicted} size="xs" />
                            {typeof row.confidence === "number" && (
                              <div className="text-[10px] font-mono text-[#666666]">
                                Conf: {(row.confidence * 100).toFixed(1)}%
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-[#666666]">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#666666]">
        <div>
          Menampilkan baris{" "}
          <strong className="text-[#171717]">
            {rows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </strong>{" "}
          sampai{" "}
          <strong className="text-[#171717]">
            {Math.min(currentPage * pageSize, rows.length)}
          </strong>{" "}
          dari <strong className="text-[#171717]">{rows.length.toLocaleString("id-ID")}</strong> ulasan
        </div>

        <div className="flex items-center gap-2">
          <SecondaryButton
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            Sebelumnya
          </SecondaryButton>

          <span className="px-2 font-mono font-bold text-xs text-[#171717]">
            {currentPage} / {totalPages}
          </span>

          <SecondaryButton
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            icon={<ChevronRight className="h-4 w-4" />}
          >
            Berikutnya
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
