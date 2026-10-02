import { useRef, useEffect } from 'react';
import type { FsrReading } from '@stepsense/types';
import { COLORS } from '@stepsense/design-tokens';

interface PressureHeatmap2DProps {
  reading?: FsrReading | null;
  width?: number;
  height?: number;
  footSide?: 'left' | 'right';
  showLabels?: boolean;
  showGradientBar?: boolean;
  refreshRate?: string;
}

// ── Zone geometry ─────────────────────────────────────────────────────────────
const ZONES = [
  { id: "s1_big_toe", nx: 0.475, ny: 0.09, label: "Big Toe" },
  { id: "s2_second_toe", nx: 0.575, ny: 0.13, label: "2nd Toe" },
  { id: "s3_ball_in", nx: 0.38,  ny: 0.28, label: "Ball-In" },
  { id: "s4_ball_out", nx: 0.62,  ny: 0.28, label: "Ball-Out" },
  { id: "s5_midfoot", nx: 0.50,  ny: 0.51, label: "Midfoot" },
  { id: "s6_heel", nx: 0.50,  ny: 0.85, label: "Heel" },
] as const;

// ── Foot silhouette ───────────────────────────────────────────────────────────
function insideFoot(nx: number, ny: number): boolean {
  if (ny < 0.07) return Math.pow((nx - 0.50) / 0.18, 2) + Math.pow((ny - 0.07) / 0.07, 2) <= 1;
  if (ny < 0.25) return Math.abs(nx - 0.50) <= 0.16 + ((ny - 0.07) / 0.18) * 0.14;
  if (ny < 0.44) return Math.abs(nx - 0.50) <= 0.31;
  if (ny < 0.62) {
    const t = (ny - 0.44) / 0.18;
    return nx >= 0.50 - (0.31 - t * 0.07) && nx <= 0.50 + (0.31 - t * 0.07) - Math.sin(t * Math.PI) * 0.07;
  }
  if (ny < 0.79) return Math.abs(nx - 0.50) <= 0.24 + ((ny - 0.62) / 0.17) * 0.04;
  return Math.pow((nx - 0.50) / 0.28, 2) + Math.pow((ny - 0.88) / 0.17, 2) <= 1.0;
}

function idwPressure(nx: number, ny: number, vals: Record<string, number>): number {
  let ws = 0, wt = 0;
  for (const z of ZONES) {
    const d2 = (nx - z.nx) ** 2 + (ny - z.ny) ** 2;
    const w = d2 < 1e-9 ? 1e10 : 1 / d2;
    ws += w * (vals[z.id] ?? 0); wt += w;
  }
  return wt > 0 ? ws / wt : 0;
}

const CSCALE: [number, string][] = [
  [0.00, "#f8fafc"], // Slate 50 (no pressure)
  [0.20, "#2bbbd7"], // Light Teal
  [0.40, "#218dae"], // Primary Teal
  [0.60, "#fce59a"], // Light Yellow
  [0.80, "#ffd758"], // Primary Yellow
  [1.00, "#ef4444"], // Red (High pressure)
];

function build2DGrid(vals: Record<string, number>, W = 26, H = 38): (number | null)[][] {
  const rows: (number | null)[][] = [];
  for (let row = H - 1; row >= 0; row--) {
    const r: (number | null)[] = [];
    for (let col = 0; col < W; col++) {
      const nx = col / (W - 1), ny = row / (H - 1);
      r.push(insideFoot(nx, ny) ? idwPressure(nx, ny, vals) : null);
    }
    rows.push(r);
  }
  return rows;
}

export function PressureHeatmap2D({
  reading,
  width = 240,
  height = 500,
  footSide = 'right',
  showLabels = true,
  showGradientBar = true,
  refreshRate,
}: PressureHeatmap2DProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let dead = false;
    import("plotly.js-dist-min").then((Plotly) => {
      if (dead || !ref.current) return;
      
      const values: Record<string, number> = reading ? {
        s1_big_toe: reading.s1_big_toe,
        s2_second_toe: reading.s2_second_toe,
        s3_ball_in: reading.s3_ball_in,
        s4_ball_out: reading.s4_ball_out,
        s5_midfoot: reading.s5_midfoot,
        s6_heel: reading.s6_heel,
      } : {};

      const grid = build2DGrid(values, 26, 38);
      const gc = "rgba(0,0,0,0.05)";
      const tc = "#64748b"; // slate-500
      const W = 26, H = 38;
      
      // Flip X for left foot
      let xVals = Array.from({ length: W }, (_, i) => i / (W - 1));
      if (footSide === 'left') {
        xVals = xVals.reverse();
      }
      
      const yVals = Array.from({ length: H }, (_, i) => (H - 1 - i) / (H - 1));
      
      const oxL: number[] = [], oyL: number[] = [], oxR: number[] = [], oyR: number[] = [];
      for (let i = 0; i <= 300; i++) {
        const ny = i / 300;
        let lx = -1, rx = -1;
        for (let ci = 0; ci <= 260; ci++) {
          const nx = ci / 260;
          if (insideFoot(nx, ny)) { if (lx < 0) lx = nx; rx = nx; }
        }
        if (lx >= 0) { 
          // Apply flip if left foot
          const realLx = footSide === 'left' ? 1 - rx : lx;
          const realRx = footSide === 'left' ? 1 - lx : rx;
          oxL.push(realLx); oyL.push(ny); oxR.push(realRx); oyR.push(ny); 
        }
      }
      const outX = [...oxL, ...oxR.reverse(), oxL[0]];
      const outY = [...oyL, ...oyR.reverse(), oyL[0]];
      
      const traces = [
        { 
          type: "heatmap", z: grid, x: xVals, y: yVals, colorscale: CSCALE,
          zmin: 0, zmax: 4095, showscale: showGradientBar,
          colorbar: { title: { text: "", font: { size: 9, color: tc } }, tickfont: { size: 8, color: tc }, thickness: 10, len: 0.85, x: 1.02 },
          xgap: 0.5, ygap: 0.5, hovertemplate: "Pressure: %{z:.0f}<extra></extra>" 
        },
        { 
          type: "scatter", x: outX, y: outY, mode: "lines",
          line: { color: COLORS.inkPrimary, width: 2 },
          showlegend: false, hoverinfo: "none" 
        }
      ];

      if (showLabels) {
        ZONES.forEach(z => {
          const actualNx = footSide === 'left' ? 1 - z.nx : z.nx;
          traces.push({
            type: "scatter", x: [actualNx], y: [z.ny], mode: "markers+text",
            marker: { color: "white", size: 6, symbol: "circle", line: { color: COLORS.inkPrimary, width: 1.5 } },
            text: [z.label], textposition: "top center" as const,
            textfont: { size: 9, color: COLORS.inkPrimary, weight: "bold" }, showlegend: false,
            hovertemplate: `${z.label}: ${(values[z.id] ?? 0).toFixed(0)}<extra></extra>`,
          } as any);
        });
      }

      const layout = {
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
        margin: { l: 10, r: showGradientBar ? 50 : 10, t: 10, b: 10 },
        xaxis: { showgrid: true, gridcolor: gc, gridwidth: 1, zeroline: false, showticklabels: false, range: [-0.04, 1.04] },
        yaxis: { showgrid: true, gridcolor: gc, gridwidth: 1, zeroline: false, showticklabels: false, range: [-0.04, 1.04], scaleanchor: "x", scaleratio: 1.5 },
        autosize: true,
      };
      
      (Plotly as any).react(ref.current, traces as never, layout as never, { displayModeBar: false, responsive: true });
    });
    return () => { dead = true; };
  }, [reading, footSide, showLabels, showGradientBar]);

  return (
    <div className="flex flex-col items-center select-none bg-white rounded-xl border border-slate-200 shadow-none-none p-4 w-full h-full relative">
      {refreshRate && (
        <div className="flex items-center space-x-1 absolute top-4 left-4 z-10">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider">LIVE SENSOR {refreshRate}</span>
        </div>
      )}
      <div ref={ref} className="w-full" style={{ height: height - 40 }} />
      <span className="text-[11px] font-semibold text-slate-500 mt-2 uppercase tracking-widest text-center w-full block">
        {footSide} Foot Map
      </span>
    </div>
  );
}
