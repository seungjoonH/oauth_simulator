"use client";

import type { FlowNode } from "@/lib/flows/types";
import type { FlowStep } from "@/lib/flows/types";

const BOX_HW = 26;
const BOX_HH = 10;
const NODES: Record<
  FlowNode,
  { cx: number; cy: number; hw: number; hh: number; lines: string[] }
> = {
  owner: { cx: 110, cy: 20, hw: BOX_HW, hh: BOX_HH, lines: ["Resource", "Owner"] },
  client: { cx: 30, cy: 70, hw: BOX_HW, hh: BOX_HH, lines: ["Client"] },
  authorization: {
    cx: 110,
    cy: 70,
    hw: BOX_HW,
    hh: BOX_HH,
    lines: ["Auth Server"],
  },
  resource: { cx: 190, cy: 70, hw: BOX_HW, hh: BOX_HH, lines: ["Resource", "Server"] },
};

function unit(ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const L = Math.hypot(dx, dy) || 1;
  return [dx / L, dy / L] as const;
}

function rayExit(
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  ux: number,
  uy: number,
): [number, number] {
  const ts: number[] = [];
  if (ux > 1e-9) ts.push(hw / ux);
  else if (ux < -1e-9) ts.push(-hw / ux);
  if (uy > 1e-9) ts.push(hh / uy);
  else if (uy < -1e-9) ts.push(-hh / uy);
  const t = Math.min(...ts.filter((x) => x > 0));
  return [cx + t * ux, cy + t * uy];
}

function edgeBetween(
  from: FlowNode,
  to: FlowNode,
  trim = 2,
): { x1: number; y1: number; x2: number; y2: number } {
  const A = NODES[from];
  const B = NODES[to];
  const [ux, uy] = unit(A.cx, A.cy, B.cx, B.cy);
  const [vx, vy] = unit(B.cx, B.cy, A.cx, A.cy);
  let x1 = rayExit(A.cx, A.cy, A.hw, A.hh, ux, uy)[0];
  let y1 = rayExit(A.cx, A.cy, A.hw, A.hh, ux, uy)[1];
  let x2 = rayExit(B.cx, B.cy, B.hw, B.hh, vx, vy)[0];
  let y2 = rayExit(B.cx, B.cy, B.hw, B.hh, vx, vy)[1];
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  x2 -= (trim * (x2 - x1)) / len;
  y2 -= (trim * (y2 - y1)) / len;
  return { x1, y1, x2, y2 };
}

function edgeKey(from: FlowNode, to: FlowNode, idx: number) {
  return `${from}-${to}-${idx}`;
}

export function FlowDiagram({
  steps,
  currentIndex,
  clientDiagramLines,
}: {
  steps: FlowStep[];
  currentIndex: number;
  /** Client 노드 라벨 (플로우별: 서버 / SPA, PKCE / 브라우저) */
  clientDiagramLines: string[];
}) {
  const pastEdges: { from: FlowNode; to: FlowNode; i: number }[] = [];
  for (let i = 0; i < currentIndex; i++) {
    pastEdges.push({ from: steps[i]!.from, to: steps[i]!.to, i: i });
  }
  const current = steps[currentIndex];
  const activeFrom = current?.from;
  const activeTo = current?.to;

  return (
    <svg
      viewBox="0 0 220 96"
      className="h-full w-full max-h-[200px]"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <marker
          id="arrowDim"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
        >
          <path d="M0,0 L5,2.5 L0,5 Z" fill="rgba(34, 211, 238, 0.35)" />
        </marker>
        <marker
          id="arrowActive"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
        >
          <path d="M0,0 L5,2.5 L0,5 Z" fill="rgb(34, 211, 238)" />
        </marker>
      </defs>

      {pastEdges.map(({ from, to, i }) => {
        if (from === to) {
          const cx = NODES[from].cx;
          const cy = NODES[from].cy - NODES[from].hh - 4;
          return (
            <path
              key={edgeKey(from, to, i)}
              d={`M ${cx - 10} ${cy} A 10 10 0 1 1 ${cx + 10} ${cy}`}
              fill="none"
              stroke="rgba(34, 211, 238, 0.28)"
              strokeWidth="0.9"
              markerEnd="url(#arrowDim)"
            />
          );
        }
        const { x1, y1, x2, y2 } = edgeBetween(from, to, 2);
        return (
          <line
            key={edgeKey(from, to, i)}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(34, 211, 238, 0.28)"
            strokeWidth="0.85"
            markerEnd="url(#arrowDim)"
          />
        );
      })}

      {current &&
        (activeFrom === activeTo && activeFrom ? (
          (() => {
            const n = NODES[activeFrom];
            const cy = n.cy - n.hh - 4;
            return (
              <path
                d={`M ${n.cx - 10} ${cy} A 10 10 0 1 1 ${n.cx + 10} ${cy}`}
                fill="none"
                stroke="rgb(34, 211, 238)"
                strokeWidth="1.1"
                markerEnd="url(#arrowActive)"
              />
            );
          })()
        ) : (
          (() => {
            const { x1, y1, x2, y2 } = edgeBetween(activeFrom!, activeTo!, 2);
            return (
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgb(34, 211, 238)"
                strokeWidth="1.1"
                markerEnd="url(#arrowActive)"
              />
            );
          })()
        ))}

      {(Object.keys(NODES) as FlowNode[]).map((id) => {
        const n = NODES[id];
        const lines = id === "client" ? clientDiagramLines : n.lines;
        const active = id === activeFrom || id === activeTo;
        const x = n.cx - n.hw;
        const y = n.cy - n.hh;
        const w = n.hw * 2;
        const h = n.hh * 2;
        return (
          <g key={id}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={4}
              fill={active ? "rgba(6, 78, 95, 0.45)" : "rgba(15, 23, 42, 0.92)"}
              stroke={active ? "rgba(34, 211, 238, 0.75)" : "rgba(100, 116, 139, 0.85)"}
              strokeWidth={active ? 1.2 : 0.9}
            />
            {lines.map((line, i) => (
              <text
                key={i}
                x={n.cx}
                y={n.cy + (lines.length === 1 ? 3 : -2 + i * 9)}
                textAnchor="middle"
                fill="#e2e8f0"
                style={{
                  fontSize: lines.length > 2 ? 5 : lines.some((l) => l.length > 8) ? 5.5 : 6,
                  fontWeight: 600,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
