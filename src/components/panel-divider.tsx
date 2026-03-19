"use client";

import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  direction: "vertical" | "horizontal";
  isDragging?: boolean;
  /** 네이티브 툴팁 */
  title?: string;
};

/** 접근 가능한 패널 구분선 — 드래그로 인접 패널 비율 조절 */
export function PanelDivider({
  direction,
  isDragging,
  className = "",
  ...rest
}: Props) {
  const isCol = direction === "vertical";
  return (
    <div
      {...rest}
      className={[
        "group shrink-0 touch-none select-none",
        isCol
          ? "w-1.5 cursor-col-resize border-x border-transparent hover:border-cyan-500/35"
          : "h-1.5 cursor-row-resize border-y border-transparent hover:border-cyan-500/35",
        isDragging ? "border-cyan-500/50 bg-cyan-500/20" : "bg-slate-700/40 hover:bg-cyan-500/15",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "mx-auto block rounded-full bg-slate-500/80 opacity-0 transition-opacity group-hover:opacity-100",
          isCol ? "my-6 h-8 w-0.5" : "mx-auto mt-0.5 h-0.5 w-8",
          isDragging ? "opacity-100 bg-cyan-400" : "",
        ].join(" ")}
        aria-hidden
      />
    </div>
  );
}
