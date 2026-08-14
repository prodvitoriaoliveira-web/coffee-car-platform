"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

type FinChartDatum = { name: string; revenue: number; costs: number };

const SERIES_1 = "#2a78d6"; // Receita
const SERIES_2 = "#eb6834"; // Custos
const GRID = "#e1e0d9";
const AXIS = "#c3c2b7";
const MUTED = "#898781";

export function FinChart({ data }: { data: FinChartDatum[] }) {
  const [hover, setHover] = useState<{ x: number; y: number; label: string; value: number; series: string } | null>(
    null
  );

  if (data.length === 0) {
    return <p className="px-3 py-6 text-center text-sm text-black/40">Sem dados de eventos para o gráfico ainda.</p>;
  }

  const width = 720;
  const height = 260;
  const padding = { top: 12, right: 12, bottom: 32, left: 56 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxValue = Math.max(1, ...data.flatMap((d) => [d.revenue, d.costs]));
  // Eixo Y arredondado pra um número "limpo" acima do maior valor.
  const niceMax = (() => {
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
    const steps = [1, 2, 2.5, 5, 10];
    for (const s of steps) {
      if (maxValue <= s * magnitude) return s * magnitude;
    }
    return 10 * magnitude;
  })();
  const yTicks = [0, niceMax / 4, niceMax / 2, (niceMax * 3) / 4, niceMax];

  const groupWidth = innerW / data.length;
  const barWidth = Math.min(24, groupWidth / 2 - 10);
  const gap = 2;

  const yScale = (v: number) => innerH - (v / niceMax) * innerH;

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs font-medium text-black/60">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SERIES_1 }} />
          Receita
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SERIES_2 }} />
          Custos
        </span>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Gráfico de barras comparando receita e custos por evento"
          className="w-full"
          onMouseLeave={() => setHover(null)}
        >
          <g transform={`translate(${padding.left},${padding.top})`}>
            {yTicks.map((t, i) => (
              <g key={i}>
                <line x1={0} x2={innerW} y1={yScale(t)} y2={yScale(t)} stroke={GRID} strokeWidth={1} />
                <text x={-8} y={yScale(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={MUTED}>
                  {t >= 1000 ? `${(t / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : t.toFixed(0)}
                </text>
              </g>
            ))}
            <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke={AXIS} strokeWidth={1} />

            {data.map((d, i) => {
              const groupX = i * groupWidth;
              const revH = innerH - yScale(d.revenue);
              const costH = innerH - yScale(d.costs);
              const revX = groupX + groupWidth / 2 - barWidth - gap / 2;
              const costX = groupX + groupWidth / 2 + gap / 2;
              const revHovered = hover?.label === d.name && hover.series === "Receita";
              const costHovered = hover?.label === d.name && hover.series === "Custos";
              return (
                <g key={d.name}>
                  <rect
                    x={revX}
                    y={yScale(d.revenue)}
                    width={barWidth}
                    height={revH}
                    rx={4}
                    fill={SERIES_1}
                    opacity={revHovered ? 1 : 0.9}
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setHover({ x: r.left + r.width / 2, y: r.top, label: d.name, value: d.revenue, series: "Receita" });
                    }}
                    onFocus={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setHover({ x: r.left + r.width / 2, y: r.top, label: d.name, value: d.revenue, series: "Receita" });
                    }}
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                  />
                  <rect
                    x={costX}
                    y={yScale(d.costs)}
                    width={barWidth}
                    height={costH}
                    rx={4}
                    fill={SERIES_2}
                    opacity={costHovered ? 1 : 0.9}
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setHover({ x: r.left + r.width / 2, y: r.top, label: d.name, value: d.costs, series: "Custos" });
                    }}
                    onFocus={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setHover({ x: r.left + r.width / 2, y: r.top, label: d.name, value: d.costs, series: "Custos" });
                    }}
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                  />
                  <text
                    x={groupX + groupWidth / 2}
                    y={innerH + 18}
                    textAnchor="middle"
                    fontSize={11}
                    fill={MUTED}
                  >
                    {d.name.length > 12 ? `${d.name.slice(0, 11)}…` : d.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {hover && (
          <div
            className="pointer-events-none fixed z-10 -translate-x-1/2 -translate-y-full rounded-md bg-[var(--brand-dark)] px-2.5 py-1.5 text-xs text-white shadow-lg"
            style={{ left: hover.x, top: hover.y - 8 }}
          >
            <div className="font-semibold">{formatCurrency(hover.value)}</div>
            <div className="text-white/70">
              {hover.series} · {hover.label}
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-black/40">Os mesmos valores estão detalhados na tabela de Eventos abaixo.</p>
    </div>
  );
}
