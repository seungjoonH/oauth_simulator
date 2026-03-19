"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flows } from "@/lib/flows";
import { useIsLargeLayout, usePanelResize } from "@/hooks/use-panel-resize";
import { BrowserSimulator } from "./browser-simulator";
import { FlowDiagram } from "./flow-diagram";
import { StepDetailPanel } from "./step-detail-panel";
import { PanelDivider } from "./panel-divider";

export function LabShell() {
  const [flowIndex, setFlowIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const flow = flows[flowIndex]!;
  const steps = flow.steps;
  const step = steps[stepIndex]!;

  useEffect(() => {
    setStepIndex(0);
  }, [flowIndex]);

  const goPrev = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setStepIndex((i) => Math.min(steps.length - 1, i + 1)),
    [steps.length],
  );

  const directionLabel = useMemo(() => {
    const names: Record<string, string> = {
      owner: "리소스 소유자",
      client: "클라이언트",
      authorization: "인가 서버",
      resource: "리소스 서버",
    };
    return `${names[step.from] ?? step.from} → ${names[step.to] ?? step.to}`;
  }, [step]);

  const isLg = useIsLargeLayout();
  const simFlowColRef = useRef<HTMLDivElement>(null);
  const sidebarResize = usePanelResize({
    axis: "x",
    initial: 312,
    min: 220,
    max: 440,
    storageKey: "oauth-lab-sidebar-w",
  });
  const detailResize = usePanelResize({
    axis: "x",
    initial: 352,
    min: 260,
    max: 560,
    storageKey: "oauth-lab-detail-w",
    invert: true,
  });
  /** 브라우저 시뮬 상단이 가져가는 flex 가중 (나머지는 흐름도) — lg에서 픽셀 추적으로 구분선이 커서를 따름 */
  const simFlowResize = usePanelResize({
    axis: "y",
    initial: 62,
    min: 28,
    max: 82,
    storageKey: "oauth-lab-sim-flow-split",
    sensitivity: 1,
    pixelTrack: isLg
      ? {
          kind: "flexShare",
          getContainerRect: () =>
            simFlowColRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 1, 400),
          panel: "leading",
        }
      : undefined,
  });

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden lg:flex-row">
      <aside
        className="flex max-h-[42vh] shrink-0 flex-col overflow-hidden border-b border-slate-800 bg-slate-950/40 p-4 lg:max-h-none lg:border-b-0"
        style={
          isLg
            ? { width: sidebarResize.value, minWidth: 220, maxWidth: 440, flexShrink: 0 }
            : undefined
        }
      >
        <h1 className="mb-1 shrink-0 text-lg font-semibold tracking-tight text-white">OAuth Flow Lab</h1>

        <div className="mb-3 flex shrink-0 flex-wrap gap-2">
          {flows.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFlowIndex(i)}
              className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                i === flowIndex
                  ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-100"
                  : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
              }`}
            >
              <span className="block">{f.shortLabel}</span>
              <span className="mt-0.5 block font-normal text-[10px] opacity-80">{f.label}</span>
            </button>
          ))}
        </div>

        <p className="mb-2 shrink-0 text-xs leading-relaxed text-slate-500">{flow.description}</p>

        {/* 전체 단계 목록 — 현재 단계 하이라이트, 클릭 시 해당 단계로 이동 */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            전체 단계
          </p>
          <ul className="space-y-1">
            {steps.map((s, i) => {
              const isActive = i === stepIndex;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setStepIndex(i)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      isActive
                        ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-100 ring-1 ring-cyan-500/30"
                        : "border-slate-700/80 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50 hover:text-slate-300"
                    }`}
                  >
                    <span className="mr-2 font-medium tabular-nums text-slate-500">
                      {i + 1}.
                    </span>
                    {s.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-3 shrink-0 rounded-xl border border-slate-700/80 bg-[#0a1222]/80 p-4">
          <div className="mb-2 text-xs font-medium text-cyan-400/90">
            단계 {stepIndex + 1} / {steps.length}
          </div>
          <h2 className="mb-1 text-base font-semibold text-white">{step.title}</h2>
          <p className="mb-2 text-sm text-slate-400">{step.summary}</p>
          <p className="mb-3 text-[11px] text-slate-500">{directionLabel}</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={stepIndex === 0}
              className="flex-1 rounded-lg border border-slate-600 py-2.5 text-sm font-medium text-slate-200 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-800/80"
            >
              이전
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={stepIndex >= steps.length - 1}
              className="flex-1 rounded-lg bg-cyan-600/90 py-2.5 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-cyan-500"
            >
              다음
            </button>
          </div>
        </div>
      </aside>

      {isLg ? (
        <PanelDivider
          direction="vertical"
          isDragging={sidebarResize.isDragging}
          title="사이드바 / 메인 영역 폭 조절"
          {...sidebarResize.handleProps}
          className="bg-slate-800/50"
        />
      ) : null}

      {/* 메인: 왼쪽 시뮬+흐름(넓게) / 오른쪽 요청, 응답 */}
      <main className="ui-scrollbar flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden p-3 lg:flex-row lg:gap-0 lg:p-4">
        {/* 모바일: 요청/응답(order-1) 위 - 데스크톱: 시뮬+흐름(order-1) → 구분선(order-2) → 패널(order-3) DOM 순서 준수 */}
        <div
          ref={simFlowColRef}
          className="order-2 flex min-h-0 w-full min-w-0 flex-1 flex-col gap-0 lg:order-1 lg:min-w-0"
        >
          <section
            className="flex min-h-0 min-w-0 flex-col lg:min-h-0"
            style={
              isLg
                ? { flex: `${simFlowResize.value} 1 0`, minHeight: 140 }
                : { flex: "1 1 55%", minHeight: 200 }
            }
          >
            <h3 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
              브라우저 시뮬레이터
            </h3>
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
              <BrowserSimulator
                step={step}
                flowId={flow.id}
                tokenExchangeMode={flow.ui.tokenExchangeMode}
                onAdvance={goNext}
                onStepBack={goPrev}
                isLastStep={stepIndex >= steps.length - 1}
                onRestart={() => setStepIndex(0)}
              />
            </div>
          </section>

          {isLg ? (
            <PanelDivider
              direction="horizontal"
              isDragging={simFlowResize.isDragging}
              title="시뮬레이터 / 역할, 메시지 흐름 높이 조절"
              {...simFlowResize.handleProps}
            />
          ) : null}

          <section
            className="shrink-0 rounded-xl border border-slate-700/60 bg-slate-950/30 p-3 lg:min-h-0 lg:overflow-y-auto"
            style={
              isLg
                ? { flex: `${100 - simFlowResize.value} 1 0`, minHeight: 96 }
                : undefined
            }
          >
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              역할, 메시지 흐름
            </h3>
            <div className="flex justify-center">
              <FlowDiagram
                steps={steps}
                currentIndex={stepIndex}
                clientDiagramLines={flow.ui.clientDiagramLines}
              />
            </div>
          </section>
        </div>

        {isLg ? (
          <PanelDivider
            direction="vertical"
            isDragging={detailResize.isDragging}
            title="메인 / 요청, 응답 패널 폭 조절"
            {...detailResize.handleProps}
            className="shrink-0 bg-slate-800/50 lg:order-2"
          />
        ) : null}

        {/* 요청/응답/내부동작 */}
        <section
          className="ui-scrollbar order-1 flex min-h-0 w-full shrink-0 flex-col overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-950/30 p-4 lg:order-3"
          style={
            isLg
              ? {
                  width: detailResize.value,
                  minWidth: 260,
                  maxWidth: 560,
                  flexShrink: 0,
                }
              : undefined
          }
        >
          <h3 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
            요청 / 응답 / 내부 동작
          </h3>
          <StepDetailPanel step={step} />
        </section>
      </main>
    </div>
  );
}
