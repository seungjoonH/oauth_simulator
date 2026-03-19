import { flowById } from "@/lib/flows";
import type { FlowStep } from "@/lib/flows/types";
import { getNetworkRowAugmentation } from "./network-row-education";

export type NetworkLogEntry = {
  id: string;
  stepTitle: string;
  name: string;
  method: string;
  status: string;
  statusText: string;
  statusOk: boolean;
  pending: boolean;
  type: string;
  size: string;
  requestUrl: string;
  requestBlock: string;
  responseBlock: string;
  /** 핵심 요청 행 배경, 테두리 (교육용) */
  rowClassName?: string;
  /** hover 팝업에 덧붙일 설명 */
  educationExtra?: Array<{ label: string; value: string }>;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} kB`;
}

function responseBodyByteLength(responseBlock: string): number {
  const idx = responseBlock.indexOf("\n\n");
  const body = idx >= 0 ? responseBlock.slice(idx + 2) : responseBlock;
  return new TextEncoder().encode(body).length;
}

/** Skip annotation / comment lines */
function meaningfulRequestLines(requestBlock: string): string[] {
  return requestBlock.split("\n").filter((raw) => {
    const line = raw.trim();
    if (!line) return false;
    if (line.startsWith("(") || line.startsWith("※") || line.startsWith("//")) return false;
    return true;
  });
}

function extractMethodPath(requestBlock: string): { method: string; path: string } | null {
  for (const line of meaningfulRequestLines(requestBlock)) {
    if (line.startsWith("HTTP/")) return null;
    const m = line.match(/^(GET|POST|PUT|DELETE|HEAD)\s+(\S+)/i);
    if (m) return { method: m[1]!.toUpperCase(), path: m[2]! };
  }
  return null;
}

function extractRedirectFromRequest(requestBlock: string): string | null {
  const lines = meaningfulRequestLines(requestBlock);
  const first = lines[0];
  if (!first?.match(/^HTTP\/1\.1\s+302/i)) return null;
  const m = requestBlock.match(/Location:\s*([^\s\r\n]+)/im);
  return m ? m[1]!.trim() : null;
}

function buildRequestUrl(step: FlowStep, path: string): string {
  const hostLine = step.requestBlock.split("\n").find((l) => l.trim().toLowerCase().startsWith("host:"));
  const host = hostLine ? hostLine.split(":").slice(1).join(":").trim() : "client.example.com";
  const fromRequest =
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : `https://${host}${path.startsWith("/") ? path : `/${path}`}`;

  /** 주소창은 콜백인데 실제 패킷은 토큰/API인 단계 — Request URL은 HTTP 블록 기준 */
  if (step.simulatorView === "hidden") {
    return fromRequest;
  }

  if (step.browserUrl) return step.browserUrl;
  return fromRequest;
}

function shortNameFromPath(path: string): string {
  const noQuery = path.split("?")[0] ?? path;
  if (noQuery === "/" || noQuery === "") return "/";
  const parts = noQuery.split("/").filter(Boolean);
  const last = parts[parts.length - 1] ?? noQuery;
  const withQuery = path.length > 48 ? `${path.slice(0, 44)}…` : path;
  if (path.includes("?")) return withQuery.length > 48 ? `${path.slice(0, 44)}…` : path;
  return last.length > 36 ? `${last.slice(0, 33)}…` : last;
}

function isClientScriptStep(step: FlowStep): boolean {
  if (extractMethodPath(step.requestBlock)) return false;
  const b = step.requestBlock;
  return (
    b.includes("URLSearchParams") ||
    b.includes("sessionStorage") ||
    b.includes("location.hash") ||
    /^\s*\/\//.test(b) ||
    (b.includes("const ") && b.includes("window."))
  );
}

function inferResourceType(step: FlowStep, method: string, pathOrUrl: string): string {
  const blob = `${step.requestBlock}\n${pathOrUrl}`.toLowerCase();
  if (isClientScriptStep(step)) return "script";
  if (blob.includes("/token") && method === "POST") return "fetch";
  if (blob.includes("userinfo") || blob.includes("api.example.com")) return "fetch";
  if (method === "—") return "other";
  return "document";
}

function parseHttpStatus(requestBlock: string, responseBlock: string): {
  code: string;
  text: string;
  ok: boolean;
  pending: boolean;
} {
  if (/아직 응답 없음|응답 없음/.test(responseBlock)) {
    return { code: "(pending)", text: "", ok: false, pending: true };
  }
  for (const block of [responseBlock, requestBlock]) {
    for (const raw of block.split("\n")) {
      const line = raw.trim();
      const m = line.match(/^HTTP\/[\d.]+\s+(\d+)\s*(.*)$/i);
      if (m) {
        const code = m[1]!;
        const text = (m[2] ?? "").trim();
        const n = parseInt(code, 10);
        const ok = !Number.isNaN(n) && n >= 200 && n < 400;
        return { code, text, ok, pending: false };
      }
    }
  }
  return { code: "—", text: "", ok: false, pending: false };
}

export function flowStepToNetworkEntry(step: FlowStep): NetworkLogEntry {
  const mp = extractMethodPath(step.requestBlock);
  const redirectUrl = extractRedirectFromRequest(step.requestBlock);

  let method: string;
  let pathForName: string;
  let requestUrl: string;

  if (isClientScriptStep(step)) {
    method = "—";
    pathForName = step.title;
    requestUrl = step.browserUrl || "";
  } else if (mp) {
    method = mp.method;
    pathForName = mp.path;
    requestUrl = buildRequestUrl(step, mp.path);
  } else if (redirectUrl) {
    method = "GET";
    try {
      const u = new URL(redirectUrl);
      pathForName = u.pathname + u.search;
      requestUrl = redirectUrl;
    } catch {
      pathForName = redirectUrl;
      requestUrl = redirectUrl;
    }
  } else if (step.browserUrl) {
    try {
      const u = new URL(step.browserUrl);
      method = "GET";
      pathForName = u.pathname + u.search;
      requestUrl = step.browserUrl;
    } catch {
      method = "—";
      pathForName = step.id;
      requestUrl = step.browserUrl;
    }
  } else {
    method = "—";
    pathForName = step.title.slice(0, 40);
    requestUrl = "";
  }

  const name = shortNameFromPath(pathForName);
  const st = parseHttpStatus(step.requestBlock, step.responseBlock);
  const pending = st.pending;
  const bodyLen = pending ? 0 : responseBodyByteLength(step.responseBlock);

  const type = inferResourceType(step, method, pathForName);

  return {
    id: step.id,
    stepTitle: step.title,
    name,
    method,
    status: st.code,
    statusText: st.text,
    statusOk: st.ok,
    pending,
    type,
    size: pending ? "0 B" : formatBytes(bodyLen),
    requestUrl,
    requestBlock: step.requestBlock,
    responseBlock: step.responseBlock,
  };
}

/** 현재 단계까지의 HTTP 교환 목록 (이전 단계 요청이 누적됨). */
export function getCumulativeNetworkLog(flowId: string, stepId: string): NetworkLogEntry[] {
  const flow = flowById[flowId];
  if (!flow) return [];
  const idx = flow.steps.findIndex((s) => s.id === stepId);
  const end = idx >= 0 ? idx : flow.steps.length - 1;
  return flow.steps.slice(0, end + 1).map((step) => {
    const base = flowStepToNetworkEntry(step);
    const aug = getNetworkRowAugmentation(flowId, step, base);
    return { ...base, ...aug };
  });
}

export function splitMessage(block: string): { head: string; body: string } {
  const idx = block.indexOf("\n\n");
  if (idx < 0) return { head: block.trimEnd(), body: "" };
  return { head: block.slice(0, idx).trimEnd(), body: block.slice(idx + 2).trimEnd() };
}

export function parseHeaderLines(head: string): Array<{ key: string; value: string }> {
  const lines = head.split("\n");
  const out: Array<{ key: string; value: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (i === 0 && /^HTTP\/[\d.]+/i.test(line)) continue;
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (m) out.push({ key: m[1]!, value: m[2]! });
  }
  return out;
}

export function tryPrettyJson(text: string): string | null {
  const t = text.trim();
  if (!t.startsWith("{") && !t.startsWith("[")) return null;
  try {
    return JSON.stringify(JSON.parse(t), null, 2);
  } catch {
    return null;
  }
}
