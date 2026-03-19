"use client";

import { useEffect, useRef, useState } from "react";

export type DevtoolsDock = "bottom" | "left" | "right";

/** 예전 단일 키 — 마이그레이션용 */
const DOCK_STORAGE_LEGACY = "oauth-lab-devtools-dock";
/** 브라우저 영역 축소(일반) 시 도킹 기본: 아래 */
const DOCK_STORAGE_COLLAPSED = "oauth-lab-devtools-dock-collapsed";
/** 전체화면 확장 시 도킹 기본: 오른쪽 */
const DOCK_STORAGE_EXPANDED = "oauth-lab-devtools-dock-expanded";

function parseDock(v: string | null): DevtoolsDock | null {
  if (v === "left" || v === "right" || v === "bottom") return v;
  if (v === "undocked") return "bottom";
  return null;
}

/**
 * @param viewportExpanded true = 「확장」전체화면, false = 「축소」일반 임베드
 * - 축소 시 기본 아래, 확장 시 기본 오른쪽 (각각 별도 저장)
 */
export function readDevtoolsDock(viewportExpanded: boolean): DevtoolsDock {
  if (typeof window === "undefined") {
    return viewportExpanded ? "right" : "bottom";
  }
  const key = viewportExpanded ? DOCK_STORAGE_EXPANDED : DOCK_STORAGE_COLLAPSED;
  const fallback = viewportExpanded ? "right" : "bottom";
  try {
    const parsed = parseDock(localStorage.getItem(key));
    if (parsed) return parsed;
    const legacy = parseDock(localStorage.getItem(DOCK_STORAGE_LEGACY));
    if (legacy) return legacy;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function writeDevtoolsDock(d: DevtoolsDock, viewportExpanded: boolean) {
  const key = viewportExpanded ? DOCK_STORAGE_EXPANDED : DOCK_STORAGE_COLLAPSED;
  try {
    localStorage.setItem(key, d);
  } catch {
    /* ignore */
  }
}

function IconDockLeft({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="2.5" y="2.5" width="3.5" height="11" rx="0.5" fill="currentColor" opacity="0.35" stroke="none" />
    </svg>
  );
}

function IconDockBottom({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="2.5" y="10" width="11" height="3.5" rx="0.5" fill="currentColor" opacity="0.35" stroke="none" />
    </svg>
  );
}

function IconDockRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="10" y="2.5" width="3.5" height="11" rx="0.5" fill="currentColor" opacity="0.35" stroke="none" />
    </svg>
  );
}

const OPTIONS: { id: DevtoolsDock; label: string; Icon: typeof IconDockLeft }[] = [
  { id: "left", label: "왼쪽에 도킹", Icon: IconDockLeft },
  { id: "bottom", label: "아래에 도킹", Icon: IconDockBottom },
  { id: "right", label: "오른쪽에 도킹", Icon: IconDockRight },
];

/**
 * Chrome DevTools 스타일 — 탭 줄 오른쪽 ⋮ 메뉴 안의 Dock side (별도 창 없음)
 */
export function DevtoolsDockKebabMenu({
  value,
  onChange,
  viewportExpanded,
}: {
  value: DevtoolsDock;
  onChange: (d: DevtoolsDock) => void;
  /** false=축소(임베드), true=확장(전체화면) — 저장 키 구분 */
  viewportExpanded: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative ml-auto shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded text-[#5f6368] hover:bg-black/[0.06] hover:text-[#202124]"
        title="메뉴"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="개발자 도구 메뉴"
      >
        <span className="select-none text-lg leading-none tracking-tight" aria-hidden>
          ⋮
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+2px)] z-[500] min-w-[220px] rounded-lg border border-[#dadce0] bg-white py-1.5 shadow-lg ring-1 ring-black/5"
        >
          <div className="px-3 pb-1.5 pt-0.5">
            <div className="text-[11px] font-normal text-[#202124]">Dock side</div>
            <div className="mt-1.5 flex items-center justify-end gap-0.5">
              {OPTIONS.map(({ id, label, Icon }) => {
                const active = value === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="menuitem"
                    title={label}
                    onClick={() => {
                      onChange(id);
                      writeDevtoolsDock(id, viewportExpanded);
                      setOpen(false);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                      active
                        ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1967d2]"
                        : "border-transparent text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
