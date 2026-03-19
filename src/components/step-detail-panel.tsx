"use client";

import type { FlowStep } from "@/lib/flows/types";
import {
  DEMO_AUTH_CODE_CONFIDENTIAL,
  DEMO_AUTH_CODE_PKCE,
  DEMO_CLIENT_SECRET,
  DEMO_CODE_CHALLENGE,
  DEMO_CODE_VERIFIER,
  DEMO_OPAQUE_ACCESS_TOKEN,
} from "@/lib/flows/demo-tokens";

function InlineCode({ children }: { children: string }) {
  return (
    <code className="rounded bg-slate-900/70 px-1 py-0.5 font-mono text-[0.92em] text-slate-200">
      {children}
    </code>
  );
}

function emphasizeTokens(text: string) {
  const normalized = text;
  const tokens = [
    "client_secret",
    "client_id",
    "redirect_uri",
    "response_type",
    "grant_type",
    "code",
    "state",
    "code_verifier",
    "code_challenge",
    "code_challenge_method",
    "S256",
    "access_token",
    "token_type",
    "expires_in",
    "refresh_token",
    "scope",
    "location.hash",
    "fragment",
  ];
  const re = new RegExp(`\\b(${tokens.map((t) => t.replace(".", "\\.")).join("|")})\\b`, "g");

  const parts: Array<{ t: "text" | "code"; v: string }> = [];
  let last = 0;
  for (const m of normalized.matchAll(re)) {
    const idx = m.index ?? 0;
    const tok = m[0] ?? "";
    if (idx > last) parts.push({ t: "text", v: normalized.slice(last, idx) });
    parts.push({ t: "code", v: tok });
    last = idx + tok.length;
  }
  if (last < normalized.length) parts.push({ t: "text", v: normalized.slice(last) });

  return parts.map((p, i) =>
    p.t === "code" ? <InlineCode key={i}>{p.v}</InlineCode> : <span key={i}>{p.v}</span>,
  );
}

function ParamTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ name: string; value: string; where: string; note?: string; rowClass?: string }>;
}) {
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-slate-700">
      <div className="border-b border-slate-700 bg-slate-900/70 px-3 py-2 text-[11px] font-semibold text-slate-300">
        {title}
      </div>
      <table className="w-full min-w-[520px] table-fixed border-collapse text-left text-xs">
        <colgroup>
          <col className="w-1/4" />
          <col className="w-1/4" />
          <col className="w-1/4" />
          <col className="w-1/4" />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-800/80 bg-[#050a13]">
            <th className="p-2 font-semibold text-slate-300">이름</th>
            <th className="p-2 font-semibold text-slate-300">예시 값</th>
            <th className="p-2 font-semibold text-slate-300">포함 위치</th>
            <th className="p-2 font-semibold text-slate-300">설명</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={`border-b border-slate-800/60 last:border-0 ${r.rowClass ?? ""}`}
            >
              <td className="min-w-0 break-words p-2 align-top text-slate-200">
                <InlineCode>{r.name}</InlineCode>
              </td>
              <td className="min-w-0 break-words p-2 align-top font-mono text-[11px] text-slate-300 [overflow-wrap:anywhere]">
                {r.value}
              </td>
              <td className="min-w-0 break-words p-2 align-top text-slate-400">{r.where}</td>
              <td className="min-w-0 break-words p-2 align-top leading-snug text-slate-400">
                {r.note ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StepDetailPanel({ step }: { step: FlowStep }) {
  const isPkce = step.id.startsWith("pkce-");
  const isCode = step.id.startsWith("ac-");
  const isImplicit = step.id.startsWith("im-");

  const showParamExtras =
    isPkce || (isCode && step.id === "ac-6") || (isImplicit && (step.id === "im-5" || step.id === "im-6"));

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-400/90">
          목적
        </h3>
        <p className="leading-relaxed text-slate-300">{emphasizeTokens(step.purpose)}</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            요청
          </h3>
          <pre className="max-h-[min(28vh,200px)] overflow-auto rounded-lg border border-slate-700/80 bg-[#050a13] p-3 font-mono text-[11px] leading-relaxed text-slate-300">
            {step.requestBlock || "—"}
          </pre>
        </div>
        <div className="min-w-0">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            응답
          </h3>
          <pre className="max-h-[min(28vh,200px)] overflow-auto rounded-lg border border-slate-700/80 bg-[#050a13] p-3 font-mono text-[11px] leading-relaxed text-slate-300">
            {step.responseBlock || "—"}
          </pre>
        </div>

        {showParamExtras && (
          <div className="min-w-0">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              포함 파라미터 (요청/응답 아래)
            </h3>

            {isPkce && step.id === "pkce-1" && (
              <ParamTable
                title="PKCE 생성/보관 (클라이언트 내부)"
                rows={[
                  {
                    name: "code_verifier",
                    value: DEMO_CODE_VERIFIER,
                    where: "클라이언트 로컬 저장",
                    note: "높은 엔트로피 난수. 인가 요청에는 보내지 않음",
                    rowClass: "bg-amber-950/35 ring-1 ring-inset ring-amber-500/25",
                  },
                  {
                    name: "code_challenge",
                    value: DEMO_CODE_CHALLENGE,
                    where: "authorize 쿼리 파라미터",
                    note: "BASE64URL(SHA256(code_verifier))",
                    rowClass: "bg-sky-950/30 ring-1 ring-inset ring-sky-500/20",
                  },
                  {
                    name: "code_challenge_method",
                    value: "S256",
                    where: "authorize 쿼리 파라미터",
                    note: "해시 방식 지정",
                  },
                ]}
              />
            )}

            {isPkce && step.id === "pkce-2" && (
              <ParamTable
                title="authorize 요청에 포함되는 주요 파라미터"
                rows={[
                  { name: "response_type", value: "code", where: "authorize 쿼리", note: "코드 발급 요청" },
                  { name: "client_id", value: "abc123", where: "authorize 쿼리", note: "클라이언트 식별자" },
                  { name: "redirect_uri", value: "https://client.example.com/callback", where: "authorize 쿼리", note: "콜백 주소" },
                  { name: "state", value: "xyz123", where: "authorize 쿼리", note: "CSRF 방지 값" },
                  {
                    name: "code_challenge",
                    value: DEMO_CODE_CHALLENGE,
                    where: "authorize 쿼리",
                    note: "verifier로부터 계산된 값",
                    rowClass: "bg-amber-950/30 ring-1 ring-inset ring-amber-500/20",
                  },
                  { name: "code_challenge_method", value: "S256", where: "authorize 쿼리", note: "해시 방식" },
                ]}
              />
            )}

            {isPkce && step.id === "pkce-6" && (
              <ParamTable
                title="POST /token (PKCE) 바디에 포함되는 값"
                rows={[
                  { name: "grant_type", value: "authorization_code", where: "x-www-form-urlencoded", note: "코드 교환" },
                  {
                    name: "code",
                    value: DEMO_AUTH_CODE_PKCE,
                    where: "x-www-form-urlencoded",
                    note: "콜백으로 받은 값",
                    rowClass: "bg-indigo-950/30",
                  },
                  { name: "redirect_uri", value: "https://client.example.com/callback", where: "x-www-form-urlencoded", note: "authorize 때 사용한 값과 일치 필요" },
                  { name: "client_id", value: "abc123", where: "x-www-form-urlencoded", note: "클라이언트 식별" },
                  {
                    name: "code_verifier",
                    value: DEMO_CODE_VERIFIER,
                    where: "x-www-form-urlencoded",
                    note: "인가 서버가 재계산해 challenge와 비교",
                    rowClass: "bg-amber-950/35 ring-1 ring-inset ring-amber-500/25",
                  },
                ]}
              />
            )}

            {isCode && step.id === "ac-6" && (
              <ParamTable
                title="POST /token (Code) 바디에 포함되는 값"
                rows={[
                  { name: "grant_type", value: "authorization_code", where: "x-www-form-urlencoded", note: "코드 교환" },
                  {
                    name: "code",
                    value: DEMO_AUTH_CODE_CONFIDENTIAL,
                    where: "x-www-form-urlencoded",
                    note: "콜백으로 받은 값",
                    rowClass: "bg-indigo-950/30",
                  },
                  { name: "redirect_uri", value: "https://client.example.com/callback", where: "x-www-form-urlencoded" },
                  { name: "client_id", value: "abc123", where: "x-www-form-urlencoded" },
                  {
                    name: "client_secret",
                    value: DEMO_CLIENT_SECRET,
                    where: "x-www-form-urlencoded",
                    note: "기밀 클라이언트 증명",
                    rowClass: "bg-sky-950/35 ring-1 ring-inset ring-sky-500/25",
                  },
                ]}
              />
            )}

            {isImplicit && (step.id === "im-5" || step.id === "im-6") && (
              <ParamTable
                title="Implicit fragment(#)에 포함되는 값"
                rows={[
                  {
                    name: "access_token",
                    value: DEMO_OPAQUE_ACCESS_TOKEN,
                    where: "URL fragment",
                    note: "서버로 전송되지 않음 — 대신 주소창, 히스토리, 리퍼러 등에 노출되기 쉬움",
                    rowClass: "bg-cyan-950/40 ring-1 ring-inset ring-cyan-500/30",
                  },
                  { name: "token_type", value: "Bearer", where: "URL fragment" },
                  { name: "expires_in", value: "3600", where: "URL fragment" },
                  { name: "state", value: "xyz123", where: "URL fragment", note: "CSRF 방지 값" },
                ]}
              />
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          수신 측 내부 동작
        </h3>
        <ul className="list-inside list-disc space-y-1 text-slate-300">
          {step.internalActions.map((a, i) => (
            <li key={i} className="leading-relaxed">
              {a}
            </li>
          ))}
        </ul>
      </div>

      {step.resourceServerTable && step.resourceServerTable.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-400/90">
            Resource Server 처리 (표)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full min-w-[520px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/80">
                  <th className="p-2 font-semibold text-slate-300">입력에서 추출</th>
                  <th className="p-2 font-semibold text-slate-300">내부 처리</th>
                  <th className="p-2 font-semibold text-slate-300">응답 데이터</th>
                </tr>
              </thead>
              <tbody>
                {step.resourceServerTable.map((row, i) => (
                  <tr key={i} className="border-b border-slate-800/80 last:border-0">
                    <td className="p-2 align-top text-slate-400">{row.input}</td>
                    <td className="p-2 align-top text-slate-400">{row.process}</td>
                    <td className="p-2 align-top text-slate-300">{row.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
