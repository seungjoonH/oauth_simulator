"use client";

import { useCallback, useRef, useState, type MouseEvent } from "react";
import { InlineBoldText } from "./inline-bold-text";

export type PopupLine = {
  label: string;
  value: string;
  /** PKCE verifier/challenge 교육 — 팝업 라벨, 본문을 앰버 톤으로 강조 */
  emphasis?: "pkce";
  /** 쿠키, 저장소 등 「역할」 교육 문구 — 에메랄드 콜아웃으로 구분 */
  roleCallout?: true;
};

export type RowPopupState = {
  top: number;
  left: number;
  title: string;
  lines: PopupLine[];
};

/** Chrome DevTools Application/Network 스타일에 맞춘 밝은 툴팁 */
export function RowDetailPopup({
  state,
  onEnter,
  onLeave,
  zClassName = "z-[1000]",
}: {
  state: RowPopupState | null;
  onEnter: () => void;
  onLeave: () => void;
  /** 겹침 시 상위 툴팁용 (예: z-[1020]) */
  zClassName?: string;
}) {
  if (!state) return null;
  const pkceEdu = state.lines.some((l) => l.emphasis === "pkce");
  return (
    <div
      role="tooltip"
      className={`pointer-events-auto fixed max-h-[min(50vh,280px)] w-[min(calc(100vw-16px),320px)] overflow-y-auto rounded-md p-2.5 text-[10px] leading-snug shadow-[0_2px_12px_rgba(60,64,67,0.12)] ${zClassName} ${
        pkceEdu
          ? "border border-stone-300/90 bg-[#fafaf9] text-stone-800"
          : "border border-[#dadce0] bg-white text-[#202124]"
      }`}
      style={{ top: state.top, left: state.left }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <p
        className={`mb-1.5 border-b pb-1 font-semibold ${
          pkceEdu ? "border-stone-200 text-stone-800" : "border-[#e8eaed] text-[#202124]"
        }`}
      >
        <InlineBoldText
          text={state.title}
          strongClassName={pkceEdu ? "font-bold text-stone-900" : "font-bold text-[#202124]"}
        />
      </p>
      <dl className="space-y-1.5">
        {state.lines.map((line, i) => {
          const isPkce = line.emphasis === "pkce";
          const isRoleCallout = line.roleCallout === true;
          const roleExtra = isRoleCallout
            ? (line.label.match(/^역할\s*(?:\(([^)]+)\))?\s*$/)?.[1]?.trim() ?? "")
            : "";
          const valueStrongClass = isPkce
            ? "font-semibold text-stone-800"
            : isRoleCallout
              ? "font-semibold text-emerald-950"
              : "font-semibold text-[#202124]";
          return (
            <div
              key={i}
              className={
                isRoleCallout
                  ? "mt-2.5 rounded-md border border-emerald-200/70 bg-emerald-50/40 py-2.5 pl-3 pr-2.5 shadow-sm"
                  : undefined
              }
            >
              <dt
                className={
                  isPkce
                    ? "font-semibold text-stone-700"
                    : isRoleCallout
                      ? "flex flex-wrap items-center gap-1.5 text-[11px] font-bold tracking-tight text-emerald-800"
                      : "text-[#5f6368]"
                }
              >
                {isRoleCallout ? (
                  <>
                    <span className="inline-flex shrink-0 items-center rounded bg-emerald-700/85 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-white">
                      역할
                    </span>
                    {roleExtra ? (
                      <span className="text-[10px] font-semibold text-emerald-900/90">({roleExtra})</span>
                    ) : null}
                  </>
                ) : (
                  line.label
                )}
              </dt>
              <dd
                className={
                  isPkce
                    ? "mt-0.5 break-all rounded border border-stone-200 bg-white px-1.5 py-1 font-mono text-[9px] text-stone-800"
                    : isRoleCallout
                      ? "mt-1.5 text-[10px] font-medium leading-relaxed tracking-tight text-emerald-900/95"
                      : "break-all font-mono text-[9px] text-[#202124]"
                }
              >
                <InlineBoldText text={line.value} strongClassName={valueStrongClass} />
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export function useRowHoverPopup() {
  const [popup, setPopup] = useState<RowPopupState | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => setPopup(null), 150);
  }, [clearHideTimer]);

  const show = useCallback(
    (e: MouseEvent<HTMLElement>, title: string, lines: PopupLine[]) => {
      clearHideTimer();
      const row = e.currentTarget;
      const r = row.getBoundingClientRect();
      const panelW = 320;
      const margin = 8;
      let left = r.left;
      if (left + panelW > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - panelW - margin);
      }
      const top = r.bottom + 4;
      setPopup({ top, left, title, lines });
    },
    [clearHideTimer],
  );

  const pinOpen = useCallback(() => {
    clearHideTimer();
  }, [clearHideTimer]);

  return { popup, show, hide, pinOpen };
}
