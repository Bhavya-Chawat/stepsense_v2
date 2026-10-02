import { useRef, useEffect } from 'react';
import type { FsrReading } from '@stepsense/types';
import { COLORS } from '@stepsense/design-tokens';

interface PressureSurface3DProps {
  reading?: FsrReading | null;
  width?: number;
  height?: number;
  footSide?: 'left' | 'right';
  showLabels?: boolean;
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

function footZ(nx: number, ny: number): number {
  let z = 4;
  z += 14 * Math.exp(-((nx - 0.50) ** 2 + (ny - 0.86) ** 2) / 0.010);
  z += 8  * Math.exp(-((nx - 0.38) ** 2 * 3 + (ny - 0.30) ** 2 * 3) / 0.012);
  z += 7  * Math.exp(-((nx - 0.62) ** 2 * 3 + (ny - 0.30) ** 2 * 3) / 0.012);
  z += 4  * Math.exp(-((nx - 0.46) ** 2 * 5 + (ny - 0.09) ** 2 * 5) / 0.006);
  z -= 2.5 * Math.exp(-((nx - 0.54) ** 2 * 2 + (ny - 0.51) ** 2 * 1.5) / 0.014);
  return Math.max(0.5, z);
}

const CSCALE: [number, string][] = [
  [0.00, "#f8fafc"], // Slate 50 (no pressure)
  [0.20, "#2bbbd7"], // Light Teal
  [0.40, "#218dae"], // Primary Teal
  [0.60, "#fce59a"], // Light Yellow
  [0.80, "#ffd758"], // Primary Yellow
  [1.00, "#ef4444"], // Red (High pressure)
];

function build3D(vals: Record<string, number>, W = 32, H = 46, footSide: 'left' | 'right') {
  const x: number[][] = [], y: number[][] = [],
        z: (number | null)[][] = [], sc: (number | null)[][] = [];
  for (let row = 0; row < H; row++) {
    const xr: number[] = [], yr: number[] = [],
          zr: (number | null)[] = [], scr: (number | null)[] = [];
    for (let col = 0; col < W; col++) {
      let nx = col / (W - 1);
      const ny = row / (H - 1);
      
      const realNx = footSide === 'left' ? 1 - nx : nx;
      
      xr.push(realNx); yr.push(ny);
      if (insideFoot(nx, ny)) { 
        zr.push(footZ(nx, ny)); 
        scr.push(idwPressure(nx, ny, vals)); 
      }
      else { 
        zr.push(null); 
        scr.push(null); 
      }
    }
    x.push(xr); y.push(yr); z.push(zr); sc.push(scr);
  }
  return { x, y, z, sc };
}

export function PressureSurface3D({
  reading,
  width = 240,
  height = 500,
  footSide = 'right',
  showLabels = true,
}: PressureSurface3DProps) {
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

      const { x, y, z, sc } = build3D(values, 32, 46, footSide);
      const tc = "#64748b"; // slate-500

      const trace = {
        type: "surface", x, y, z, surfacecolor: sc, colorscale: CSCALE, cmin: 0, cmax: 4095,
        showscale: false, // Hide gradient bar in 3D since it's in 2D
        lighting: { ambient: 0.65, diffuse: 0.85, roughness: 0.35, specular: 0.4, fresnel: 0.25 },
        lightposition: { x: 1000, y: 500, z: 2000 },
        contours: { x: { show: false }, y: { show: false }, z: { show: false } },
        hovertemplate: "Pressure: %{surfacecolor:.0f}<extra></extra>",
      };
      
      const layout = {
        paper_bgcolor: "rgba(0,0,0,0)",
        scene: {
          bgcolor: "rgba(0,0,0,0)",
          camera: { eye: { x: footSide === 'left' ? 0.9 : -0.9, y: -2.0, z: 1.5 }, center: { x: 0, y: 0, z: -0.1 }, up: { x: 0, y: 0, z: 1 } },
          xaxis: { visible: false, showgrid: false, showbackground: false },
          yaxis: { visible: false, showgrid: false, showbackground: false },
          zaxis: { visible: false, showgrid: false, showbackground: false },
          aspectmode: "manual" as const, aspectratio: { x: 0.65, y: 1.5, z: 0.38 },
        },
        margin: { l: 0, r: 0, t: 0, b: 0 }, autosize: true,
      };
      
      (Plotly as any).react(ref.current, [trace] as never, layout as never, {
        responsive: true, displaylogo: false,
        modeBarButtonsToRemove: ["resetCameraDefault3d", "hoverClosest3d"],
        displayModeBar: true,
      } as never);
    });
    return () => { dead = true; };
  }, [reading, footSide]);

  return (
    <div className="flex flex-col items-center select-none bg-slate-50/50 rounded-xl border border-slate-200 shadow-none-none p-4 w-full h-full">
      <div ref={ref} className="w-full" style={{ height: height - 40 }} />
      <span className="text-[11px] font-semibold text-slate-500 mt-2 uppercase tracking-widest text-center w-full block">
        3D Topography ({footSide})
      </span>
    </div>
  );
}
