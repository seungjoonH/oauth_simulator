"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flowById } from "@/lib/flows";
import { DEMO_CODE_VERIFIER, DEMO_OPAQUE_ACCESS_TOKEN } from "@/lib/flows/demo-tokens";
import {
  PKCE_APPLICATION_TAB_HINT,
  PKCE_DEVTOOLS_ROUTE_STRIPE,
  PKCE_SESSION_ORIGIN_IDLE,
  PKCE_SESSION_ORIGIN_SELECTED,
  PKCE_SESSION_ROW,
  pkceVerifierStorageActive,
} from "@/lib/devtools/pkce-education-ui";
import { getCumulativeNetworkLog } from "@/lib/devtools/network-log";
import { usePanelResize } from "@/hooks/use-panel-resize";
import { DevToolsNetworkPanel } from "./devtools-network-panel";
import { PanelDivider } from "./panel-divider";
import { DevtoolsDockKebabMenu, type DevtoolsDock } from "./devtools-dock-menu";
import {
  RowDetailPopup,
  useRowHoverPopup,
  type PopupLine,
} from "./devtools-row-popup";

const CLIENT = "https://client.example.com";
const AUTH = "https://accounts.oauth-lab.example";

type TreeId =
  | "session-client"
  | "local-client"
  | "cookies-client"
  | "cookies-auth";

function stepNum(stepId: string, prefix: string): number {
  const m = stepId.match(new RegExp(`^${prefix}-(\\d+)$`));
  return m ? parseInt(m[1]!, 10) : 0;
}

function sessionKeyValues(flowId: string, stepId: string): Array<{ key: string; value: string }> {
  if (flowId === "authorization_code_pkce") {
    const n = stepNum(stepId, "pkce");
    if (n >= 1 && n <= 5) {
      return [
        { key: "code_verifier", value: DEMO_CODE_VERIFIER },
        { key: "oauth_state", value: "xyz123" },
      ];
    }
    return [];
  }
  if (flowId === "authorization_code") {
    const n = stepNum(stepId, "ac");
    if (n >= 1 && n <= 5) {
      return [{ key: "oauth_state", value: "xyz123" }];
    }
    return [];
  }
  if (flowId === "implicit") {
    const n = stepNum(stepId, "im");
    if (n >= 6) {
      return [{ key: "at", value: DEMO_OPAQUE_ACCESS_TOKEN }];
    }
    return [];
  }
  return [];
}

function localKeyValues(_flowId: string, _stepId: string): Array<{ key: string; value: string }> {
  return [];
}

type CookieRow = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: string;
  size: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
};

function prevStepId(flowId: string, stepId: string): string | null {
  const flow = flowById[flowId];
  if (!flow) return null;
  const idx = flow.steps.findIndex((s) => s.id === stepId);
  if (idx <= 0) return null;
  return flow.steps[idx - 1]!.id;
}

function hasNewStorageKeys(
  prevRows: Array<{ key: string }>,
  currRows: Array<{ key: string }>,
): boolean {
  const prev = new Set(prevRows.map((r) => r.key));
  return currRows.some((r) => !prev.has(r.key));
}

function hasNewCookies(prev: CookieRow[], curr: CookieRow[]): boolean {
  const prevNames = new Set(prev.map((c) => c.name));
  return curr.some((c) => !prevNames.has(c.name));
}

function cookiesForOrigin(
  flowId: string,
  stepId: string,
  origin: "client" | "auth",
): CookieRow[] {
  if (origin === "client") {
    const rows: CookieRow[] = [
      {
        name: "__next_hmr_refresh_hash__",
        value: "f4e2a1b9c8d7e6f543210abcdef0123456789 (Next.js dev HMR)",
        domain: ".client.example.com",
        path: "/",
        expires: "Session",
        size: 24,
        httpOnly: false,
        secure: true,
        sameSite: "Lax",
      },
    ];
    if (flowId === "authorization_code_pkce" && stepNum(stepId, "pkce") >= 1) {
      rows.push({
        name: "pkce_demo",
        value: "1",
        domain: ".client.example.com",
        path: "/",
        expires: "Session",
        size: 8,
        httpOnly: false,
        secure: true,
        sameSite: "Strict",
      });
    }
    return rows;
  }
  const nPkce = flowId === "authorization_code_pkce" ? stepNum(stepId, "pkce") : 0;
  const nAc = flowId === "authorization_code" ? stepNum(stepId, "ac") : 0;
  const nIm = flowId === "implicit" ? stepNum(stepId, "im") : 0;
  const onAuth =
    (nPkce >= 2 && nPkce <= 5) || (nAc >= 2 && nAc <= 5) || (nIm >= 2 && nIm <= 5);
  if (!onAuth) return [];
  return [
    {
      name: "oauth_session",
      value: "sess_a1b2c3d4e5f678901234567890abcdef",
      domain: ".accounts.oauth-lab.example",
      path: "/oauth2",
      expires: "Session",
      size: 18,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ];
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span className="inline-block w-3 text-[9px] text-[#5f6368]">{open ? "▼" : "▶"}</span>
  );
}

/** 이전 단계 대비 이번 단계에서 해당 저장소에 새 키, 쿠키가 생김 (탭 클릭으로 없애지 않음) — 인라인으로 텍스트 바로 뒤에 붙음 */
function StorageNewDot({ title }: { title?: string }) {
  return (
    <span
      className="pointer-events-auto inline-block size-[4px] shrink-0 rounded-full bg-red-500 align-middle shadow-[0_0_2px_rgba(239,68,68,0.55)] ring-1 ring-white/90"
      title={title ?? "이전 단계 대비 이 단계에서 새 항목이 추가됨"}
      aria-label="새 항목 추가됨"
    />
  );
}

function sessionStorageRowAugment(
  flowId: string,
  key: string,
): { rowClass: string; extra: PopupLine[] } | null {
  if (flowId === "authorization_code_pkce" && key === "code_verifier") {
    return {
      rowClass: PKCE_SESSION_ROW,
      extra: [
        {
          label: "역할 (PKCE)",
          emphasis: "pkce",
          value:
            "로그인 시작 시 만든 비밀 값입니다. 인가 URL에는 code_challenge(해시)만 나가고 verifier는 이 탭, 이 출처에만 남습니다.",
        },
        {
          label: "왜 공개 클라이언트에 안전?",
          emphasis: "pkce",
          value:
            "나중에 ?code=만 탈취당해도, 토큰 endpoint는 code_verifier 없이는 토큰을 주지 않습니다. 서버는 저장해 둔 challenge와 verifier 해시를 비교합니다.",
        },
      ],
    };
  }
  if (key === "oauth_state") {
    return {
      rowClass: "bg-slate-100/90",
      extra: [
        {
          label: "역할",
          roleCallout: true,
          value:
            "인가 서버로 보내기 직전에 만든 표식(state)을 서버, 세션에 잠깐 적어 두었다가, 콜백 URL에 실려 돌아온 값과 **똑같은지** 맞춰 봅니다. 같으면 ‘지금 이 탭에서 시작한 그 로그인’이고, 다르면 엉뚱한 요청일 수 있어 무시합니다(CSRF 완화).",
        },
      ],
    };
  }
  if (flowId === "implicit" && key === "at") {
    return {
      rowClass: "bg-cyan-50",
      extra: [
        {
          label: "역할 (Implicit)",
          roleCallout: true,
          value:
            "fragment에서 읽은 access_token을 임시 보관한 값입니다(데모). 실제로는 메모리 보관, 짧은 수명이 권장되며, XSS 시 탈취 위험이 큽니다.",
        },
        {
          label: "위험",
          value:
            "Implicit는 토큰이 주소, 히스토리에 남기 쉬워 레거시입니다. 가능하면 Authorization Code + PKCE를 쓰는 편이 안전합니다.",
        },
      ],
    };
  }
  return null;
}

function cookieRowAugment(name: string): { rowClass: string; extra: PopupLine[] } | null {
  if (name === "oauth_session") {
    return {
      rowClass: "bg-emerald-50/90",
      extra: [
        {
          label: "역할",
          roleCallout: true,
          value: "인가 서버 로그인, 동의 세션. HttpOnly라 JS에서 읽을 수 없고, 브라우저가 인가 도메인 요청에 자동으로 붙입니다.",
        },
      ],
    };
  }
  if (name === "pkce_demo") {
    return {
      rowClass: "bg-stone-50/90",
      extra: [
        {
          label: "역할 (시뮬)",
          roleCallout: true,
          value: "PKCE 단계에서 클라이언트 측에 데모용으로 심은 쿠키입니다. 실제 구현에서는 sessionStorage 등에 verifier를 두는 경우가 많습니다.",
        },
      ],
    };
  }
  return null;
}

function cookiePopupLines(c: CookieRow): PopupLine[] {
  return [
    { label: "Name", value: c.name },
    { label: "Value", value: c.value },
    { label: "Domain", value: c.domain },
    { label: "Path", value: c.path },
    { label: "Expires / Max-Age", value: c.expires },
    { label: "Size", value: String(c.size) },
    { label: "HttpOnly", value: c.httpOnly ? "Yes" : "No" },
    { label: "Secure", value: c.secure ? "Yes" : "No" },
    { label: "SameSite", value: c.sameSite },
  ];
}

export function BrowserApplicationDevtools({
  flowId,
  stepId,
  devtoolsDock,
  onDevtoolsDockChange,
  viewportExpanded = false,
}: {
  flowId: string;
  stepId: string;
  devtoolsDock?: DevtoolsDock;
  onDevtoolsDockChange?: (d: DevtoolsDock) => void;
  /** false=축소(임베드), true=확장(전체화면) — 도킹 메뉴 저장 구분 */
  viewportExpanded?: boolean;
}) {
  const [openApp, setOpenApp] = useState(true);
  const [openStorage, setOpenStorage] = useState(true);
  const [openSs, setOpenSs] = useState(true);
  const [openLs, setOpenLs] = useState(true);
  const [openCk, setOpenCk] = useState(true);
  const [selected, setSelected] = useState<TreeId>("session-client");
  const [topTab, setTopTab] = useState<"application" | "network">("application");
  const rowPopup = useRowHoverPopup();
  const appSplitRef = useRef<HTMLDivElement>(null);
  const appTreeResize = usePanelResize({
    axis: "x",
    initial: 200,
    /** Application 왼쪽 트리 폭(px) — 더 좁게, 넓게 */
    min: 88,
    max: 560,
    storageKey: "oauth-lab-devtools-app-tree-w",
    pixelTrack: {
      kind: "leadingEdgePx",
      getContainerRect: () =>
        appSplitRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 400, 1),
      min: 88,
      max: 560,
    },
  });

  const sessionRows = useMemo(() => sessionKeyValues(flowId, stepId), [flowId, stepId]);
  const localRows = useMemo(() => localKeyValues(flowId, stepId), [flowId, stepId]);
  const cookiesClient = useMemo(() => cookiesForOrigin(flowId, stepId, "client"), [flowId, stepId]);
  const cookiesAuth = useMemo(() => cookiesForOrigin(flowId, stepId, "auth"), [flowId, stepId]);

  const prevId = useMemo(() => prevStepId(flowId, stepId), [flowId, stepId]);
  const sessionNewThisStep = useMemo(() => {
    if (!prevId) return false;
    return hasNewStorageKeys(sessionKeyValues(flowId, prevId), sessionKeyValues(flowId, stepId));
  }, [flowId, stepId, prevId]);
  const localNewThisStep = useMemo(() => {
    if (!prevId) return false;
    return hasNewStorageKeys(localKeyValues(flowId, prevId), localKeyValues(flowId, stepId));
  }, [flowId, stepId, prevId]);
  const cookiesClientNewThisStep = useMemo(() => {
    if (!prevId) return false;
    return hasNewCookies(cookiesForOrigin(flowId, prevId, "client"), cookiesForOrigin(flowId, stepId, "client"));
  }, [flowId, stepId, prevId]);
  const cookiesAuthNewThisStep = useMemo(() => {
    if (!prevId) return false;
    return hasNewCookies(cookiesForOrigin(flowId, prevId, "auth"), cookiesForOrigin(flowId, stepId, "auth"));
  }, [flowId, stepId, prevId]);
  const cookiesSectionNewThisStep = cookiesClientNewThisStep || cookiesAuthNewThisStep;
  const applicationTabAnyNew =
    localNewThisStep || sessionNewThisStep || cookiesSectionNewThisStep;

  const networkNewThisStep = useMemo(() => {
    if (!prevId) return false;
    return (
      getCumulativeNetworkLog(flowId, stepId).length >
      getCumulativeNetworkLog(flowId, prevId).length
    );
  }, [flowId, stepId, prevId]);

  const pkceVerifierRoute = useMemo(
    () => pkceVerifierStorageActive(flowId, stepId),
    [flowId, stepId],
  );

  useEffect(() => {
    if (!pkceVerifierRoute) return;
    setOpenApp(true);
    setOpenStorage(true);
    setOpenSs(true);
    setSelected("session-client");
  }, [flowId, stepId, pkceVerifierRoute]);

  const tabs: { id: "elements" | "console" | "sources" | "network" | "performance" | "application"; label: string; enabled: boolean }[] = [
    { id: "elements", label: "Elements", enabled: false },
    { id: "console", label: "Console", enabled: false },
    { id: "sources", label: "Sources", enabled: false },
    { id: "network", label: "Network", enabled: true },
    { id: "performance", label: "Performance", enabled: false },
    { id: "application", label: "Application", enabled: true },
  ];

  return (
    <div
      className="flex h-full min-h-0 w-full flex-1 shrink-0 flex-col border-t border-[#d1d1d1] bg-white text-[11px] leading-tight text-[#202124] [font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif]"
    >
      <div className="flex h-7 shrink-0 items-end border-b border-[#d1d1d1] bg-[#f3f3f3] pl-1 pr-0">
        <div className="flex min-w-0 flex-1 items-end gap-0 overflow-x-auto">
          {tabs.map((t) => {
            const active =
              (t.id === "application" && topTab === "application") || (t.id === "network" && topTab === "network");
            const dotApplication = t.id === "application" && applicationTabAnyNew;
            const dotNetwork = t.id === "network" && networkNewThisStep;
            const pkceApplicationNudge =
              t.id === "application" && pkceVerifierRoute && topTab !== "application";
            return (
              <button
                key={t.id}
                type="button"
                disabled={!t.enabled}
                onClick={() => {
                  if (t.id === "network") setTopTab("network");
                  if (t.id === "application") setTopTab("application");
                }}
                className={`shrink-0 px-2 pb-0.5 pt-1 text-[11px] ${
                  pkceApplicationNudge ? `${PKCE_APPLICATION_TAB_HINT} ` : ""
                }${
                  active
                    ? "border-b-2 border-[#1a73e8] font-medium text-[#202124]"
                    : t.enabled
                      ? "text-[#5f6368] hover:text-[#202124]"
                      : "cursor-default text-[#5f6368] opacity-50"
                }`}
              >
                <span
                  className={`inline-flex items-center gap-0.5 pr-1 ${dotApplication || dotNetwork ? "pt-0.5" : ""}`}
                >
                  {t.label}
                  {dotApplication ? (
                    <StorageNewDot title="Application 패널: Storage에 이전 단계 대비 새 항목" />
                  ) : null}
                  {dotNetwork ? (
                    <StorageNewDot title="Network: 이 단계에서 새 요청이 로그에 추가됨" />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        {devtoolsDock != null && onDevtoolsDockChange != null ? (
          <DevtoolsDockKebabMenu
            value={devtoolsDock}
            onChange={onDevtoolsDockChange}
            viewportExpanded={viewportExpanded}
          />
        ) : null}
      </div>

      {topTab === "network" ? (
        <DevToolsNetworkPanel flowId={flowId} stepId={stepId} />
      ) : (
      <div ref={appSplitRef} className="flex min-h-0 min-w-0 flex-1">
        <div
          className="ui-scrollbar shrink-0 overflow-y-auto border-r border-[#d1d1d1] bg-[#f3f3f3] py-1 pl-1 pr-2.5"
          style={{ width: appTreeResize.value, minWidth: 88, maxWidth: 560 }}
        >
          <button
            type="button"
            className={`flex w-full items-center gap-0.5 py-0.5 text-left hover:bg-black/[0.04] ${
              pkceVerifierRoute && topTab === "application" ? PKCE_DEVTOOLS_ROUTE_STRIPE : ""
            }`}
            onClick={() => setOpenApp((o) => !o)}
          >
            <Chevron open={openApp} />
            <span className="font-medium">Application</span>
          </button>
          {openApp && (
            <div className="ml-3 border-l border-[#e0e0e0] pl-1">
              <div className="py-0.5 pl-1 text-[#5f6368]">Manifest</div>
              <div className="py-0.5 pl-1 text-[#5f6368]">Service workers</div>
            </div>
          )}

          <button
            type="button"
            className={`mt-1 flex w-full items-center gap-0.5 py-0.5 text-left hover:bg-black/[0.04] ${
              pkceVerifierRoute ? PKCE_DEVTOOLS_ROUTE_STRIPE : ""
            }`}
            onClick={() => setOpenStorage((o) => !o)}
          >
            <Chevron open={openStorage} />
            <span className="font-medium">Storage</span>
          </button>
          {openStorage && (
            <div className="ml-3 space-y-0.5 border-l border-[#e0e0e0] pl-1">
              <button
                type="button"
                className="flex w-full items-center gap-0.5 py-0.5 text-left hover:bg-black/[0.04]"
                onClick={() => setOpenLs((o) => !o)}
              >
                <Chevron open={openLs} />
                <span className="inline-flex items-center gap-0.5 pr-1.5">
                  Local storage
                  {localNewThisStep ? <StorageNewDot title="Local storage에 이전 단계 대비 새 키 추가" /> : null}
                </span>
              </button>
              {openLs && (
                <div className="ml-3">
                  <button
                    type="button"
                    onClick={() => setSelected("local-client")}
                    className={`w-full truncate py-0.5 pl-2 text-left ${
                      selected === "local-client"
                        ? "bg-[#e8f0fe] font-medium text-[#1967d2]"
                        : "text-[#5f6368] hover:bg-black/[0.04]"
                    }`}
                  >
                    {CLIENT}
                  </button>
                </div>
              )}

              <button
                type="button"
                className={`flex w-full items-center gap-0.5 py-0.5 text-left hover:bg-black/[0.04] ${
                  pkceVerifierRoute ? PKCE_DEVTOOLS_ROUTE_STRIPE : ""
                }`}
                onClick={() => setOpenSs((o) => !o)}
              >
                <Chevron open={openSs} />
                <span className="inline-flex items-center gap-0.5 pr-1.5">
                  Session storage
                  {sessionNewThisStep ? <StorageNewDot title="Session storage에 이전 단계 대비 새 키 추가" /> : null}
                </span>
              </button>
              {openSs && (
                <div className="ml-3">
                  <button
                    type="button"
                    onClick={() => setSelected("session-client")}
                    className={`w-full truncate py-0.5 pl-2 text-left ${
                      selected === "session-client"
                        ? pkceVerifierRoute
                          ? PKCE_SESSION_ORIGIN_SELECTED
                          : "bg-[#e8f0fe] font-medium text-[#1967d2]"
                        : pkceVerifierRoute
                          ? PKCE_SESSION_ORIGIN_IDLE
                          : "text-[#5f6368] hover:bg-black/[0.04]"
                    }`}
                  >
                    {CLIENT}
                  </button>
                </div>
              )}

              <button
                type="button"
                className="flex w-full items-center gap-0.5 py-0.5 text-left hover:bg-black/[0.04]"
                onClick={() => setOpenCk((o) => !o)}
              >
                <Chevron open={openCk} />
                <span className="inline-flex items-center gap-0.5 pr-1.5">
                  Cookies
                  {cookiesSectionNewThisStep ? (
                    <StorageNewDot title="Cookies에 이전 단계 대비 새 쿠키 추가(하위 출처 참고)" />
                  ) : null}
                </span>
              </button>
              {openCk && (
                <div className="ml-3 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setSelected("cookies-client")}
                    className={`grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-0.5 py-0.5 pl-2 pr-2 text-left ${
                      selected === "cookies-client"
                        ? "bg-[#e8f0fe] font-medium text-[#1967d2]"
                        : "text-[#5f6368] hover:bg-black/[0.04]"
                    }`}
                  >
                    <span className="min-w-0 truncate">{CLIENT}</span>
                    {cookiesClientNewThisStep ? <StorageNewDot title="이 출처에 새 쿠키" /> : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected("cookies-auth")}
                    className={`grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-0.5 py-0.5 pl-2 pr-2 text-left ${
                      selected === "cookies-auth"
                        ? "bg-[#e8f0fe] font-medium text-[#1967d2]"
                        : "text-[#5f6368] hover:bg-black/[0.04]"
                    }`}
                  >
                    <span className="min-w-0 truncate">{AUTH}</span>
                    {cookiesAuthNewThisStep ? <StorageNewDot title="이 출처에 새 쿠키" /> : null}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <PanelDivider
          direction="vertical"
          isDragging={appTreeResize.isDragging}
          title="Application 트리 / 상세 폭 조절"
          {...appTreeResize.handleProps}
          className="bg-[#e8eaed]"
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
          {pkceVerifierRoute && topTab === "application" && selected === "session-client" ? (
            <div className="shrink-0 border-b border-stone-300/70 bg-stone-100/80 px-2 py-2 text-[10px] leading-snug text-stone-700">
              <span className="font-semibold tracking-tight text-stone-800">PKCE — 여기서 확인</span>
              <span className="mt-1 block font-medium text-stone-700">
                왼쪽 트리{" "}
                <span className="rounded bg-white/90 px-1 py-0.5 font-medium text-stone-800 ring-1 ring-stone-200/80">
                  Storage
                </span>
                <span className="mx-0.5 text-stone-500">→</span>
                <span className="rounded bg-white/90 px-1 py-0.5 font-medium text-stone-800 ring-1 ring-stone-200/80">
                  Session storage
                </span>
                <span className="mx-0.5 text-stone-500">→</span>
                <span className="rounded bg-white/90 px-1 py-0.5 font-mono text-[9px] font-medium text-stone-800 ring-1 ring-stone-200/80">
                  {CLIENT}
                </span>
              </span>
              <span className="mt-1.5 block border-t border-stone-200/90 pt-1.5 text-[9px] text-stone-600">
                주소창의 <strong className="font-medium text-stone-800">code_challenge</strong>와 짝인{" "}
                <strong className="font-mono font-medium text-stone-800">code_verifier</strong>가 아래 표에 있습니다. 행에
                마우스를 올리면 설명이 뜹니다.
              </span>
            </div>
          ) : null}
          <div className="flex shrink-0 items-center gap-2 border-b border-[#e8eaed] px-2 py-1">
            <span className="text-[#5f6368]" title="Refresh">
              ↻
            </span>
            <div className="flex flex-1 items-center gap-1 rounded border border-[#dadce0] bg-white px-2 py-0.5">
              <span className="text-[#5f6368]">🔍</span>
              <span className="text-[#80868b]">Filter</span>
            </div>
            <span className="text-[#5f6368]">✕</span>
          </div>

          <div className="ui-scrollbar min-h-0 flex-1 overflow-auto">
            {(selected === "session-client" || selected === "local-client") && (
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="sticky top-0 border-b border-[#e8eaed] bg-[#fafafa]">
                    <th className="w-[7.5rem] max-w-[7.5rem] border-r border-[#e8eaed] px-2 py-1 font-medium">
                      Key
                    </th>
                    <th className="min-w-0 px-2 py-1 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected === "session-client" ? sessionRows : localRows).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-2 py-4 text-center text-[#5f6368]">
                        No data present
                      </td>
                    </tr>
                  ) : (
                    (selected === "session-client" ? sessionRows : localRows).map((r) => {
                      const aug =
                        selected === "session-client"
                          ? sessionStorageRowAugment(flowId, r.key)
                          : null;
                      const pkceVerifierRow =
                        flowId === "authorization_code_pkce" && r.key === "code_verifier";
                      const lines: PopupLine[] = [
                        {
                          label: "Key",
                          value: r.key,
                          ...(pkceVerifierRow ? { emphasis: "pkce" as const } : {}),
                        },
                        {
                          label: "Value",
                          value: r.value,
                          ...(pkceVerifierRow ? { emphasis: "pkce" as const } : {}),
                        },
                        ...(aug?.extra ?? []),
                      ];
                      return (
                      <tr
                        key={r.key}
                        className={`cursor-default border-b border-[#f1f3f4] hover:brightness-[0.99] ${aug?.rowClass ?? ""}`}
                        onMouseEnter={(e) =>
                          rowPopup.show(e, selected === "session-client" ? "Session storage" : "Local storage", lines)
                        }
                        onMouseLeave={rowPopup.hide}
                      >
                        <td className="w-[7.5rem] max-w-[7.5rem] truncate border-r border-[#e8eaed] px-2 py-1 align-top font-mono text-[#1967d2]">
                          {r.key}
                        </td>
                        <td className="min-w-0 truncate px-2 py-1 font-mono text-[11px] text-[#202124]">
                          {r.value}
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            )}

            {(selected === "cookies-client" || selected === "cookies-auth") && (
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="sticky top-0 border-b border-[#e8eaed] bg-[#fafafa] text-[10px]">
                    <th className="border-r border-[#e8eaed] px-1.5 py-1 font-medium">Name</th>
                    <th className="border-r border-[#e8eaed] px-1.5 py-1 font-medium">Value</th>
                    <th className="border-r border-[#e8eaed] px-1.5 py-1 font-medium">Domain</th>
                    <th className="border-r border-[#e8eaed] px-1.5 py-1 font-medium">Path</th>
                    <th className="border-r border-[#e8eaed] px-1.5 py-1 font-medium">Expires</th>
                    <th className="border-r border-[#e8eaed] px-1.5 py-1 font-medium">Size</th>
                    <th className="border-r border-[#e8eaed] px-1.5 py-1 font-medium">HttpOnly</th>
                    <th className="border-r border-[#e8eaed] px-1.5 py-1 font-medium">Secure</th>
                    <th className="px-1.5 py-1 font-medium">SameSite</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected === "cookies-client" ? cookiesClient : cookiesAuth).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-2 py-4 text-center text-[#5f6368]">
                        No cookies for this origin at this step
                      </td>
                    </tr>
                  ) : (
                    (selected === "cookies-client" ? cookiesClient : cookiesAuth).map((c) => {
                      const cAug = cookieRowAugment(c.name);
                      const cLines = [...cookiePopupLines(c), ...(cAug?.extra ?? [])];
                      return (
                      <tr
                        key={c.name}
                        className={`cursor-default border-b border-[#f1f3f4] hover:brightness-[0.99] ${cAug?.rowClass ?? ""}`}
                        onMouseEnter={(e) =>
                          rowPopup.show(
                            e,
                            selected === "cookies-client" ? "Cookie (client)" : "Cookie (auth)",
                            cLines,
                          )
                        }
                        onMouseLeave={rowPopup.hide}
                      >
                        <td className="max-w-[80px] truncate border-r border-[#e8eaed] px-1.5 py-1 font-mono">
                          {c.name}
                        </td>
                        <td className="max-w-[100px] truncate border-r border-[#e8eaed] px-1.5 py-1 font-mono text-[10px]">
                          {c.value}
                        </td>
                        <td className="truncate border-r border-[#e8eaed] px-1.5 py-1">{c.domain}</td>
                        <td className="border-r border-[#e8eaed] px-1.5 py-1">{c.path}</td>
                        <td className="truncate border-r border-[#e8eaed] px-1.5 py-1">{c.expires}</td>
                        <td className="border-r border-[#e8eaed] px-1.5 py-1 tabular-nums">{c.size}</td>
                        <td className="border-r border-[#e8eaed] px-1.5 py-1 text-center">
                          {c.httpOnly ? "✓" : ""}
                        </td>
                        <td className="border-r border-[#e8eaed] px-1.5 py-1 text-center">
                          {c.secure ? "✓" : ""}
                        </td>
                        <td className="px-1.5 py-1">{c.sameSite}</td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      )}

      <RowDetailPopup
        state={rowPopup.popup}
        onEnter={rowPopup.pinOpen}
        onLeave={rowPopup.hide}
      />
    </div>
  );
}
