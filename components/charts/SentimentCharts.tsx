"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#0D1224",
  border: "1px solid #263149",
  borderRadius: "10px",
  color: "#F1F5F9",
  fontSize: "12px",
  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.6)",
};

export function SentimentDonutChart({
  positive,
  negative,
  totalLabel = "Total Ulasan",
}: {
  positive: number;
  negative: number;
  totalLabel?: string;
}) {
  const total = positive + negative;
  const data = [
    { name: "Positive", value: positive, color: "#22C55E" },
    { name: "Negative", value: negative, color: "#F43F5E" },
  ];

  return (
    <div className="relative h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={68}
            outerRadius={96}
            paddingAngle={3}
            dataKey="value"
            stroke="#080B18"
            strokeWidth={2}
            animationDuration={750}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: "#F1F5F9" }}
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
        <span className="text-[11px] font-medium tracking-wider text-[#94A3B8] uppercase">
          {totalLabel}
        </span>
        <span className="font-mono-num text-2xl font-bold text-[#F1F5F9]">
          {total.toLocaleString("id-ID")}
        </span>
      </div>
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
    Positive: mode === "percentage" ? d.positivePct ?? 0 : d.positive,
    Negative: mode === "percentage" ? d.negativePct ?? 0 : d.negative,
  }));

  return (
    <div className="h-[270px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#263149" vertical={false} />
          <XAxis
            dataKey="game"
            stroke="#94A3B8"
            tick={{ fill: "#F1F5F9", fontSize: 12 }}
            axisLine={{ stroke: "#263149" }}
          />
          <YAxis
            stroke="#94A3B8"
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            axisLine={{ stroke: "#263149" }}
            unit={mode === "percentage" ? "%" : ""}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(139, 92, 246, 0.08)" }}
            formatter={(val: number, name: string) => [
              mode === "percentage"
                ? `${val.toFixed(2)}%`
                : val.toLocaleString("id-ID"),
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#94A3B8" }} />
          <Bar
            dataKey="Positive"
            fill="#22C55E"
            radius={[6, 6, 0, 0]}
            maxBarSize={54}
            animationDuration={750}
          />
          <Bar
            dataKey="Negative"
            fill="#F43F5E"
            radius={[6, 6, 0, 0]}
            maxBarSize={54}
            animationDuration={750}
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
  const data = [
    {
      metric: "Accuracy",
      "Naive Bayes": Number((nb.accuracy * 100).toFixed(2)),
      KNN: Number((knn.accuracy * 100).toFixed(2)),
    },
    {
      metric: "Precision (+)",
      "Naive Bayes": Number((nb.precision * 100).toFixed(2)),
      KNN: Number((knn.precision * 100).toFixed(2)),
    },
    {
      metric: "Recall (+)",
      "Naive Bayes": Number((nb.recall * 100).toFixed(2)),
      KNN: Number((knn.recall * 100).toFixed(2)),
    },
    {
      metric: "F1-Score (+)",
      "Naive Bayes": Number((nb.f1 * 100).toFixed(2)),
      KNN: Number((knn.f1 * 100).toFixed(2)),
    },
  ];

  return (
    <div className="h-[290px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#263149" vertical={false} />
          <XAxis
            dataKey="metric"
            stroke="#94A3B8"
            tick={{ fill: "#F1F5F9", fontSize: 12 }}
            axisLine={{ stroke: "#263149" }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#94A3B8"
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            axisLine={{ stroke: "#263149" }}
            unit="%"
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
            formatter={(val: number, name: string) => [`${val.toFixed(2)}%`, name]}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar
            dataKey="Naive Bayes"
            fill="#8B5CF6"
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
            animationDuration={800}
          />
          <Bar
            dataKey="KNN"
            fill="#22D3EE"
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopTermsBarChart({
  terms,
  color,
}: {
  terms: Array<{ term: string; meanTfidf: number }>;
  color: string;
}) {
  const data = terms.slice(0, 10).map((t) => ({
    term: t.term,
    score: Number((t.meanTfidf * 1000).toFixed(2)),
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 20, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#263149" horizontal={false} />
          <XAxis
            type="number"
            stroke="#94A3B8"
            tick={{ fill: "#94A3B8", fontSize: 11 }}
            axisLine={{ stroke: "#263149" }}
          />
          <YAxis
            type="category"
            dataKey="term"
            width={88}
            stroke="#94A3B8"
            tick={{ fill: "#F1F5F9", fontSize: 11 }}
            axisLine={{ stroke: "#263149" }}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(val: number) => [`${val.toFixed(2)} (×10⁻³)`, "Mean TF-IDF"]}
          />
          <Bar
            dataKey="score"
            fill={color}
            radius={[0, 5, 5, 0]}
            maxBarSize={18}
            animationDuration={750}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
