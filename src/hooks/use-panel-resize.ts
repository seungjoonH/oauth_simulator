"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

function readStoredNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    if (v == null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(Math.round(value)));
  } catch {
    /* ignore */
  }
}

type Axis = "x" | "y";

/**
 * 픽셀 추적 — 델타+invert 조합으로는 leading/trailing 패널 배치마다 부호가 뒤집혀 재발하기 쉬움.
 *
 * - flexShare: 컨테이너 시작~포인터까지 비율 t∈[0,1]. leading이면 value=t×100, trailing이면 value=(1−t)×100.
 * - leadingEdgePx: 시작선에서 포인터까지 거리(px)를 value로 (트리, 리스트 폭 등).
 */
export type PanelResizePixelTrack =
  | {
      kind: "flexShare";
      getContainerRect: () => DOMRect;
      /** leading: flex-start 쪽 첫 패널 비중 / trailing: flex-end 쪽 마지막 패널 비중 */
      panel: "leading" | "trailing";
    }
  | {
      kind: "leadingEdgePx";
      getContainerRect: () => DOMRect;
      min: number;
      max: number;
    };

/**
 * 드래그로 1차원 크기 조절. pixelTrack이 있으면 항상 컨테이너, 패널 역할 기준으로 절대 위치 계산(재발 방지).
 */
export function usePanelResize(options: {
  axis: Axis;
  /** 초기값 — flex 비율(0–100) 또는 px(leadingEdgePx) */
  initial: number;
  min: number;
  max: number;
  storageKey?: string;
  /** pixelTrack 없을 때만 사용 (레거시, 비권장) */
  invert?: boolean;
  sensitivity?: number;
  pixelTrack?: PanelResizePixelTrack;
}): {
  value: number;
  setValue: (n: number) => void;
  handleProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    role: "separator";
    "aria-orientation": "vertical" | "horizontal";
    "aria-valuenow": number;
  };
  isDragging: boolean;
} {
  const {
    axis,
    initial,
    min,
    max,
    storageKey,
    invert = false,
    sensitivity = 1,
    pixelTrack,
  } = options;
  const [value, setValueState] = useState(() =>
    storageKey ? readStoredNumber(storageKey, initial) : initial,
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startPointer: number; startValue: number } | null>(null);
  const pixelTrackRef = useRef(pixelTrack);
  pixelTrackRef.current = pixelTrack;

  const clamp = useCallback((n: number) => Math.min(max, Math.max(min, n)), [min, max]);

  const setValue = useCallback(
    (n: number) => {
      const c = clamp(n);
      setValueState(c);
      if (storageKey) writeStoredNumber(storageKey, c);
    },
    [clamp, storageKey],
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      const pt = pixelTrackRef.current;
      if (pt) {
        const r = pt.getContainerRect();
        if (pt.kind === "leadingEdgePx") {
          const pos = axis === "y" ? e.clientY - r.top : e.clientX - r.left;
          setValue(pos);
          return;
        }
        const size = Math.max(1, axis === "y" ? r.height : r.width);
        const origin = axis === "y" ? r.top : r.left;
        const pos = (axis === "y" ? e.clientY : e.clientX) - origin;
        const t = Math.min(1, Math.max(0, pos / size));
        const next = pt.panel === "leading" ? t * 100 : (1 - t) * 100;
        setValue(next);
        return;
      }

      const d = dragRef.current;
      if (!d) return;
      const pos = axis === "x" ? e.clientX : e.clientY;
      const raw = pos - d.startPointer;
      const delta = raw * sensitivity * (invert ? -1 : 1);
      setValue(d.startValue + delta);
    };

    const onUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isDragging, axis, setValue, sensitivity, invert]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragRef.current = {
        startPointer: axis === "x" ? e.clientX : e.clientY,
        startValue: value,
      };
      setIsDragging(true);
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [axis, value],
  );

  return {
    value,
    setValue,
    isDragging,
    handleProps: {
      onPointerDown,
      role: "separator" as const,
      "aria-orientation": (axis === "x" ? "vertical" : "horizontal") as "vertical" | "horizontal",
      "aria-valuenow": Math.round(value),
    },
  };
}

/** SSR 안전 — lg(1024px) 이상에서만 3열 리사이즈 사용 */
export function useIsLargeLayout() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(min-width: 1024px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
}
