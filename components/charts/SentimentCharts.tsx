"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#FFFDFC",
  border: "2px solid #202020",
  borderRadius: "10px",
  color: "#171717",
  fontSize: "12px",
  fontWeight: "600",
  boxShadow: "3px 3px 0px #202020",
  padding: "8px 12px",
};

export function SentimentDonutChart({
  positive,
  negative,
  totalLabel = "Total Ulasan",
  centerHighlight = "count",
}: {
  positive: number;
  negative: number;
  totalLabel?: string;
  centerHighlight?: "count" | "positivePct";
}) {
  const total = positive + negative;
  const posPct = total > 0 ? (positive / total) * 100 : 0;
  const data = [
    { name: "Positif", value: positive, color: "#65C98A" },
    { name: "Negatif", value: negative, color: "#FA7777" },
  ];

  return (
    <div className="relative h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={2}
            dataKey="value"
            stroke="#FFFDFC"
            strokeWidth={2}
            animationDuration={650}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: "#171717" }}
            formatter={(val: number, name: string) => [
              `${val.toLocaleString("id-ID")} (${
                total > 0 ? ((val / total) * 100).toFixed(2) : "0.00"
              }%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerHighlight === "positivePct" ? (
          <>
            <span className="font-display text-2xl font-extrabold text-[#171717]">
              {posPct.toFixed(1)}%
            </span>
            <span className="text-[11px] font-semibold text-[#666666]">
              {totalLabel}
            </span>
          </>
        ) : (
          <>
            <span className="font-mono-num text-[10px] font-bold tracking-wider text-[#666666] uppercase">
              {totalLabel}
            </span>
            <span className="font-display text-2xl font-extrabold text-[#171717]">
              {total.toLocaleString("id-ID")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Clean 3-bar / 4-bar rounded-top column chart for Dashboard Model Performance
 */
export function DashboardModelPerfChart({
  items,
}: {
  items: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}) {
  const data = items.map((i) => ({
    name: i.name,
    value: +i.value.toFixed(1),
    color: i.color,
    label: `${i.value.toFixed(1)}%`,
  }));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 12, left: -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D3" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#666666"
            tick={{ fill: "#171717", fontSize: 11, fontWeight: 600 }}
            axisLine={{ stroke: "#D4CFC0", strokeWidth: 1 }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            stroke="#666666"
            tick={{ fill: "#666666", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(167, 139, 250, 0.1)" }}
            formatter={(val: number) => [`${val.toFixed(2)}%`, "Skor Evaluasi"]}
          />
          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
            maxBarSize={64}
            animationDuration={650}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
            <LabelList
              dataKey="label"
              position="top"
              style={{
                fill: "#171717",
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "var(--font-space-grotesk)",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GameSentimentBarChart({
  data,
  mode = "count",
}: {
  data: Array<{
    game: string;
    positive: number;
    negative: number;
    positivePct?: number;
    negativePct?: number;
  }>;
  mode?: "count" | "percentage";
}) {
  const chartData = data.map((d) => ({
    game: d.game,
    Positif: mode === "percentage" ? d.positivePct ?? 0 : d.positive,
    Negatif: mode === "percentage" ? d.negativePct ?? 0 : d.negative,
  }));

  return (
    <div className="h-[270px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DEC9" vertical={false} />
          <XAxis
            dataKey="game"
            stroke="#171717"
            tick={{ fill: "#171717", fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: "#202020", strokeWidth: 1.5 }}
          />
          <YAxis
            stroke="#666666"
            tick={{ fill: "#666666", fontSize: 11 }}
            axisLine={{ stroke: "#202020", strokeWidth: 1.5 }}
            unit={mode === "percentage" ? "%" : ""}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(167, 139, 250, 0.15)" }}
            formatter={(val: number, name: string) => [
              mode === "percentage"
                ? `${val.toFixed(2)}%`
                : val.toLocaleString("id-ID"),
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#171717", fontWeight: 600, paddingTop: "8px" }}
          />
          <Bar
            dataKey="Positif"
            fill="#65C98A"
            stroke="#202020"
            strokeWidth={1.5}
            radius={[6, 6, 0, 0]}
            maxBarSize={52}
            animationDuration={650}
          />
          <Bar
            dataKey="Negatif"
            fill="#FA7777"
            stroke="#202020"
            strokeWidth={1.5}
            radius={[6, 6, 0, 0]}
            maxBarSize={52}
            animationDuration={650}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ModelComparisonBarChart({
  nb,
  knn,
}: {
  nb: { accuracy: number; precision: number; recall: number; f1: number };
  knn: { accuracy: number; precision: number; recall: number; f1: number };
}) {
  const chartData = [
    {
      metric: "Akurasi",
      "Multinomial NB": +(nb.accuracy * 100).toFixed(2),
      KNN: +(knn.accuracy * 100).toFixed(2),
    },
    {
      metric: "Precision",
      "Multinomial NB": +(nb.precision * 100).toFixed(2),
      KNN: +(knn.precision * 100).toFixed(2),
    },
    {
      metric: "Recall",
      "Multinomial NB": +(nb.recall * 100).toFixed(2),
      KNN: +(knn.recall * 100).toFixed(2),
    },
    {
      metric: "F1-Score",
      "Multinomial NB": +(nb.f1 * 100).toFixed(2),
      KNN: +(knn.f1 * 100).toFixed(2),
    },
  ];

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DEC9" vertical={false} />
          <XAxis
            dataKey="metric"
            stroke="#171717"
            tick={{ fill: "#171717", fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: "#202020", strokeWidth: 1.5 }}
          />
          <YAxis
            domain={[60, 100]}
            stroke="#666666"
            tick={{ fill: "#666666", fontSize: 11 }}
            axisLine={{ stroke: "#202020", strokeWidth: 1.5 }}
            unit="%"
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(167, 139, 250, 0.15)" }}
            formatter={(val: number) => [`${val.toFixed(2)}%`]}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#171717", fontWeight: 600, paddingTop: "8px" }}
          />
          <Bar
            dataKey="Multinomial NB"
            fill="#A78BFA"
            stroke="#202020"
            strokeWidth={1.5}
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
            animationDuration={650}
          />
          <Bar
            dataKey="KNN"
            fill="#E8BC55"
            stroke="#202020"
            strokeWidth={1.5}
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
            animationDuration={650}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopTermsBarChart({
  terms,
  accent = "#A78BFA",
}: {
  terms: Array<{ term: string; meanTfidf: number }>;
  accent?: string;
}) {
  const chartData = terms.slice(0, 8).map((t) => ({
    term: t.term,
    TFIDF: +(t.meanTfidf * 100).toFixed(2),
  }));

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 8, right: 24, left: 24, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DEC9" horizontal={false} />
          <XAxis
            type="number"
            stroke="#666666"
            tick={{ fill: "#666666", fontSize: 11 }}
            axisLine={{ stroke: "#202020", strokeWidth: 1.5 }}
          />
          <YAxis
            type="category"
            dataKey="term"
            stroke="#171717"
            tick={{ fill: "#171717", fontSize: 12, fontWeight: 600 }}
            axisLine={{ stroke: "#202020", strokeWidth: 1.5 }}
            width={70}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(val: number) => [`${val.toFixed(2)} (x100)`, "Mean TF-IDF"]}
          />
          <Bar
            dataKey="TFIDF"
            fill={accent}
            stroke="#202020"
            strokeWidth={1.5}
            radius={[0, 6, 6, 0]}
            maxBarSize={22}
            animationDuration={650}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
