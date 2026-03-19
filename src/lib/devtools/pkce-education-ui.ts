/**
 * PKCE 교육 UI: 주소창 code_challenge ↔ Session storage code_verifier 연결
 * 과한 앰버, 글로우는 피하고, 스톤 계열로 대비만 살짝 줍니다.
 */

export function pkceVerifierStorageActive(flowId: string, stepId: string): boolean {
  if (flowId !== "authorization_code_pkce") return false;
  const m = stepId.match(/^pkce-(\d+)$/);
  if (!m) return false;
  const n = parseInt(m[1]!, 10);
  return n >= 1 && n <= 5;
}

/** 시뮬 주소창(어두운 배경) — code_challenge 구간 */
export const PKCE_URL_PARAM_HIGHLIGHT =
  "break-all rounded px-0.5 text-slate-100 [box-decoration-break:clone] bg-stone-600/45 ring-1 ring-stone-500/40 ring-offset-1 ring-offset-slate-900";

/** DevTools 왼쪽 트리: Storage → Session storage 경로 표시 */
export const PKCE_DEVTOOLS_ROUTE_STRIPE =
  "border-l-[3px] border-stone-400/55 bg-stone-100/60 pl-1 rounded-r-sm";

/** Session storage 하위 origin(클라이언트 URL) — 선택됨 */
export const PKCE_SESSION_ORIGIN_SELECTED =
  "bg-stone-200/80 font-medium text-stone-800 shadow-[inset_3px_0_0_0_theme(colors.stone.500/0.45)]";

/** Session storage 하위 origin — 비선택(강조 모드일 때) */
export const PKCE_SESSION_ORIGIN_IDLE = "text-stone-700 hover:bg-stone-100/70";

/** code_verifier 테이블 행 */
export const PKCE_SESSION_ROW =
  "bg-stone-100/80 shadow-[inset_3px_0_0_0_theme(colors.stone.400/0.5)]";

/** Network 등 다른 탭에 있을 때 Application 탭으로 유도 (깜빡임 없음) */
export const PKCE_APPLICATION_TAB_HINT =
  "ring-1 ring-stone-400/40 ring-offset-1 ring-offset-[#f3f3f3] rounded-t-[3px]";
