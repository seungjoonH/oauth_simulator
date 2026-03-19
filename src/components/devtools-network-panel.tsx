"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  getNetworkPayloadGuide,
  getNetworkResponseGuide,
  type NetworkDetailGuide,
} from "@/lib/devtools/network-detail-education";
import {
  getCumulativeNetworkLog,
  parseHeaderLines,
  splitMessage,
  tryPrettyJson,
  type NetworkLogEntry,
} from "@/lib/devtools/network-log";
import { usePanelResize } from "@/hooks/use-panel-resize";
import { InlineBoldText } from "./inline-bold-text";
import { PanelDivider } from "./panel-divider";
import {
  RowDetailPopup,
  useRowHoverPopup,
  type PopupLine,
} from "./devtools-row-popup";

type DetailTab = "headers" | "payload" | "preview" | "response";

function networkRowPopupLines(e: NetworkLogEntry): PopupLine[] {
  const reqFirst =
    e.requestBlock
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? "—";
  const resFirst =
    e.responseBlock
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? "—";
  const statusLine = e.pending
    ? "(응답 대기)"
    : [e.status, e.statusText].filter(Boolean).join(" ").trim() || "—";
  return [
    { label: "단계", value: e.stepTitle },
    { label: "Name", value: e.name },
    { label: "Request URL", value: e.requestUrl || "(시뮬레이션 — 없음)" },
    { label: "Method", value: e.method },
    { label: "Status", value: statusLine },
    { label: "Type", value: e.type },
    { label: "Size", value: e.size },
    { label: "요청 (첫 줄)", value: reqFirst },
    { label: "응답 (첫 줄)", value: resFirst },
  ];
}

function DocIcon() {
  return (
    <span className="inline-block w-3.5 shrink-0 text-center text-[10px] text-[#5f6368]" title="document">
      📄
    </span>
  );
}

function FetchIcon() {
  return (
    <span className="inline-block w-3.5 shrink-0 text-center text-[10px] text-[#5f6368]" title="fetch">
      ⇄
    </span>
  );
}

function ScriptIcon() {
  return (
    <span className="inline-block w-3.5 shrink-0 text-center text-[10px] text-[#5f6368]" title="script">
      JS
    </span>
  );
}

function TypeIcon({ type }: { type: string }) {
  if (type === "fetch") return <FetchIcon />;
  if (type === "script") return <ScriptIcon />;
  return <DocIcon />;
}

function Collapsible({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#e8eaed]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1 bg-[#fafafa] px-2 py-1 text-left text-[11px] font-medium text-[#202124] hover:bg-[#f1f3f4]"
      >
        <span className="text-[9px] text-[#5f6368]">{open ? "▼" : "▶"}</span>
        {title}
      </button>
      {open && <div className="bg-white px-2 py-2">{children}</div>}
    </div>
  );
}

function KeyVal({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[minmax(7rem,28%)_1fr] gap-x-2 gap-y-0.5 text-[10px]">
      <span className="shrink-0 text-[#5f6368]">{k}</span>
      <span className="min-w-0 break-all font-mono text-[#202124]">{v}</span>
    </div>
  );
}

function HeadersDetail({ entry }: { entry: NetworkLogEntry }) {
  const { head: reqHead, body: reqBody } = splitMessage(entry.requestBlock);
  const { head: resHead } = splitMessage(entry.responseBlock);
  const reqHeaders = parseHeaderLines(reqHead);
  const resHeaders = parseHeaderLines(resHead);
  const statusLine = resHead.split("\n")[0]?.trim() ?? "";
  const reqFirst = reqHead.split("\n")[0]?.trim() ?? "";

  const remote =
    entry.requestUrl.includes("api.example.com") ? "203.0.113.10:443" : "198.51.100.77:443";

  return (
    <div className="text-[10px]">
      <Collapsible title="General">
        <div className="space-y-1.5">
          <KeyVal k="Request URL" v={entry.requestUrl || "(시뮬레이션 — URL 미구성)"} />
          <KeyVal k="Request Method" v={entry.method} />
          <div className="grid grid-cols-[minmax(7rem,28%)_1fr] gap-x-2">
            <span className="text-[#5f6368]">Status Code</span>
            <span className="flex items-center gap-1 font-mono text-[#202124]">
              {entry.pending ? (
                <span className="text-[#80868b]">(응답 대기)</span>
              ) : (
                <>
                  <span
                    className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                      entry.statusOk ? "bg-[#1e8e3e]" : "bg-[#ea8600]"
                    }`}
                  />
                  {entry.status} {entry.statusText}
                </>
              )}
            </span>
          </div>
          <KeyVal k="Remote Address" v={remote} />
          <KeyVal k="Referrer Policy" v="strict-origin-when-cross-origin" />
        </div>
      </Collapsible>

      <Collapsible title="Request (raw)">
        <pre className="whitespace-pre-wrap break-all font-mono text-[9px] leading-snug text-[#202124]">
          {reqFirst || "(비 HTTP 요청)"}
        </pre>
        {reqHeaders.length > 0 && (
          <dl className="mt-2 space-y-1 border-t border-[#f1f3f4] pt-2">
            {reqHeaders.map((h) => (
              <div key={h.key} className="grid grid-cols-[minmax(6rem,32%)_1fr] gap-1">
                <dt className="text-[#c62828]">{h.key}:</dt>
                <dd className="break-all font-mono text-[#202124]">{h.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {reqBody ? (
          <pre className="mt-2 whitespace-pre-wrap break-all border-t border-[#f1f3f4] pt-2 font-mono text-[9px] text-[#202124]">
            {reqBody}
          </pre>
        ) : null}
      </Collapsible>

      <Collapsible title="Response Headers">
        {statusLine && /^HTTP\//i.test(statusLine) ? (
          <p className="mb-2 font-mono text-[9px] text-[#5f6368]">{statusLine}</p>
        ) : null}
        {resHeaders.length === 0 ? (
          <p className="text-[#80868b]">파싱된 헤더 없음 (본문만 있거나 설명 텍스트입니다)</p>
        ) : (
          <dl className="space-y-1">
            {resHeaders.map((h) => (
              <div key={h.key} className="grid grid-cols-[minmax(6rem,32%)_1fr] gap-1">
                <dt className="text-[#2e7d32]">{h.key}:</dt>
                <dd className="break-all font-mono text-[#202124]">{h.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Collapsible>
    </div>
  );
}

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: "headers", label: "Headers" },
  { id: "payload", label: "Payload" },
  { id: "preview", label: "Preview" },
  { id: "response", label: "Response" },
];

type EduPopupApi = {
  show: (e: MouseEvent<HTMLElement>, title: string, lines: PopupLine[]) => void;
  hide: () => void;
};

function NetworkDetailEduBox({
  guide,
  eduPopup,
  children,
}: {
  guide: NetworkDetailGuide | null;
  eduPopup: EduPopupApi;
  children: React.ReactNode;
}) {
  if (!guide) return <>{children}</>;
  return (
    <div className={`rounded-md p-2 ${guide.boxClass}`}>
      <p className="mb-2 text-[10px] font-medium leading-snug text-[#1a1a1a]">
        <InlineBoldText text={guide.callout} />
      </p>
      <div
        className="cursor-help rounded-sm bg-white/70 px-1 py-1 ring-1 ring-[#dadce0]/80"
        onMouseEnter={(e) => eduPopup.show(e, guide.popupTitle, guide.lines)}
        onMouseLeave={eduPopup.hide}
      >
        {children}
      </div>
    </div>
  );
}

export function DevToolsNetworkPanel({ flowId, stepId }: { flowId: string; stepId: string }) {
  const entries = useMemo(() => getCumulativeNetworkLog(flowId, stepId), [flowId, stepId]);
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("headers");
  /** 플로우, 단계가 바뀌면 목록 마지막(이번 단계에서 새로 쌓인 요청)으로 자동 선택 */
  const prevFlowStepKeyRef = useRef<string>("");
  const rowPopup = useRowHoverPopup();
  const detailEduPopup = useRowHoverPopup();
  const listSplitRef = useRef<HTMLDivElement>(null);
  const listResize = usePanelResize({
    axis: "x",
    initial: 248,
    min: 140,
    max: 400,
    storageKey: "oauth-lab-devtools-network-list-w",
    pixelTrack: {
      kind: "leadingEdgePx",
      getContainerRect: () =>
        listSplitRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 400, 1),
      min: 140,
      max: 400,
    },
  });

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.stepTitle.toLowerCase().includes(q) ||
        e.method.toLowerCase().includes(q),
    );
  }, [entries, filter]);

  useEffect(() => {
    const flowStepKey = `${flowId}:${stepId}`;
    const flowStepAdvanced = prevFlowStepKeyRef.current !== flowStepKey;
    if (flowStepAdvanced) {
      prevFlowStepKeyRef.current = flowStepKey;
    }

    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((prev) => {
      if (flowStepAdvanced) {
        return filtered[filtered.length - 1]!.id;
      }
      if (prev && filtered.some((e) => e.id === prev)) return prev;
      return filtered[filtered.length - 1]!.id;
    });
  }, [filtered, flowId, stepId]);

  const selected = filtered.find((e) => e.id === selectedId) ?? null;
  const { body: reqBody } = selected ? splitMessage(selected.requestBlock) : { body: "" };
  const { body: resBody } = selected ? splitMessage(selected.responseBlock) : { body: "" };
  const preview = resBody ? tryPrettyJson(resBody) : null;
  const payloadGuide = selected ? getNetworkPayloadGuide(flowId, selected.id) : null;
  const responseGuide = selected ? getNetworkResponseGuide(flowId, selected.id) : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e8eaed] px-2 py-1">
        <span className="text-[#5f6368]" title="기록 유지(시뮬)">
          ●
        </span>
        <span className="text-[#5f6368]" title="Clear">
          🚫
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded border border-[#dadce0] bg-white px-2 py-0.5">
          <span className="text-[#5f6368]">🔍</span>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter"
            className="min-w-0 flex-1 bg-transparent text-[11px] text-[#202124] outline-none placeholder:text-[#80868b]"
            aria-label="네트워크 필터"
          />
        </div>
        <span className="shrink-0 tabular-nums text-[#5f6368]">{filtered.length} / {entries.length}</span>
      </div>

      <div ref={listSplitRef} className="flex min-h-0 min-w-0 flex-1">
        <div
          className="ui-scrollbar flex shrink-0 flex-col overflow-auto border-r border-[#d1d1d1]"
          style={{ width: listResize.value, minWidth: 140, maxWidth: 400 }}
        >
          <table className="w-full table-fixed border-collapse text-left text-[10px]">
            <thead>
              <tr className="sticky top-0 border-b border-[#e8eaed] bg-[#fafafa]">
                <th className="w-4 px-0.5 py-1" />
                <th className="min-w-0 truncate px-1 py-1 font-medium">Name</th>
                <th className="w-10 truncate px-0.5 py-1 font-medium">Method</th>
                <th className="w-11 truncate px-0.5 py-1 font-medium">Status</th>
                <th className="w-14 truncate px-0.5 py-1 font-medium">Type</th>
                <th className="w-10 truncate px-0.5 py-1 font-medium">Size</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-6 text-center text-[#80868b]">
                    {entries.length === 0 ? "기록 없음" : "필터와 일치하는 요청 없음"}
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const active = e.id === selectedId;
                  const edu = e.educationExtra ?? [];
                  const popupLines = [...networkRowPopupLines(e), ...edu];
                  return (
                    <tr
                      key={e.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          setSelectedId(e.id);
                        }
                      }}
                      onClick={() => setSelectedId(e.id)}
                      onMouseEnter={(ev) => rowPopup.show(ev, "네트워크 요청", popupLines)}
                      onMouseLeave={rowPopup.hide}
                      className={`cursor-pointer border-b border-[#f1f3f4] ${e.rowClassName ?? ""} ${
                        active ? "ring-2 ring-inset ring-[#1967d2]/30" : "hover:brightness-[0.99]"
                      }`}
                    >
                      <td className="px-0.5 py-0.5 align-middle">
                        <TypeIcon type={e.type} />
                      </td>
                      <td className="truncate px-1 py-0.5 font-mono text-[#1967d2]" title={e.stepTitle}>
                        {e.name}
                      </td>
                      <td className="truncate px-0.5 py-0.5 text-center font-mono text-[#5f6368]">{e.method}</td>
                      <td
                        className={`truncate px-0.5 py-0.5 text-center font-mono ${
                          e.pending ? "text-[#80868b]" : e.statusOk ? "text-[#1e8e3e]" : "text-[#202124]"
                        }`}
                      >
                        {e.status}
                      </td>
                      <td className="truncate px-0.5 py-0.5 text-[#5f6368]">{e.type}</td>
                      <td className="truncate px-0.5 py-0.5 tabular-nums text-[#5f6368]">{e.size}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PanelDivider
          direction="vertical"
          isDragging={listResize.isDragging}
          title="요청 목록 / 상세 폭 조절"
          {...listResize.handleProps}
          className="bg-[#e8eaed]"
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-l border-[#e8eaed]">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-[#80868b]">요청을 선택하세요</div>
          ) : (
            <>
              <div className="flex shrink-0 items-stretch gap-0 border-b border-[#d1d1d1] bg-[#f3f3f3] px-1">
                {DETAIL_TABS.map((t) => {
                  const eduHint =
                    (t.id === "payload" && payloadGuide) || (t.id === "response" && responseGuide);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDetailTab(t.id)}
                      className={`px-2 py-1 text-[11px] transition-colors ${
                        detailTab === t.id
                          ? "border-b-2 border-[#1a73e8] font-medium text-[#202124]"
                          : "text-[#5f6368] hover:text-[#202124]"
                      } ${
                        t.id === "payload" && payloadGuide
                          ? "bg-sky-50/90 ring-1 ring-inset ring-sky-400/45"
                          : ""
                      } ${
                        t.id === "response" && responseGuide
                          ? "bg-violet-50/90 ring-1 ring-inset ring-violet-500/45"
                          : ""
                      }`}
                      title={
                        eduHint
                          ? "이 탭에 단계별 설명, 하이라이트가 있습니다. 영역에 마우스를 올리면 상세 툴팁을 볼 수 있습니다."
                          : undefined
                      }
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <div className="ui-scrollbar min-h-0 flex-1 overflow-auto p-2">
                {detailTab === "headers" && <HeadersDetail entry={selected} />}
                {detailTab === "payload" && (
                  <NetworkDetailEduBox guide={payloadGuide} eduPopup={detailEduPopup}>
                    <pre className="whitespace-pre-wrap break-all font-mono text-[9px] leading-snug text-[#202124]">
                      {reqBody || "(요청 본문 없음 - GET 이거나 시뮬레이션 스크립트 단계입니다)"}
                    </pre>
                  </NetworkDetailEduBox>
                )}
                {detailTab === "preview" && (
                  <>
                    {preview ? (
                      <pre className="whitespace-pre-wrap break-all font-mono text-[9px] leading-snug text-[#202124]">
                        {preview}
                      </pre>
                    ) : (
                      <p className="text-[11px] leading-relaxed text-[#80868b]">
                        <InlineBoldText text="JSON으로 예쁘게 펼칠 수 있는 본문이 없습니다. (HTML, 302 등) **Payload**와 **Response** 탭에서 요청, 응답 원문과 단계별 설명을 확인하세요." />
                      </p>
                    )}
                  </>
                )}
                {detailTab === "response" && (
                  <NetworkDetailEduBox guide={responseGuide} eduPopup={detailEduPopup}>
                    <pre className="whitespace-pre-wrap break-all font-mono text-[9px] leading-snug text-[#202124]">
                      {selected.responseBlock}
                    </pre>
                  </NetworkDetailEduBox>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <RowDetailPopup
        state={rowPopup.popup}
        onEnter={rowPopup.pinOpen}
        onLeave={rowPopup.hide}
      />
      <RowDetailPopup
        state={detailEduPopup.popup}
        onEnter={detailEduPopup.pinOpen}
        onLeave={detailEduPopup.hide}
        zClassName="z-[1020]"
      />
    </div>
  );
}
