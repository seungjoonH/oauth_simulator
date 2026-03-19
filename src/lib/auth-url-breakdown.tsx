/** 쿼리, fragment 값 표시용 — 잘못된 % 시퀀스는 원문 유지 */
export function safeDecodeURIComponent(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
}

const PARAM_HINTS: Record<string, string> = {
  response_type: "인가 응답 형태 (code=코드 부여, token, id_token=Implicit 등)",
  client_id: "등록된 클라이언트(앱) 식별자",
  redirect_uri: "인가 후 브라우저를 돌려보낼 URI (등록 값과 정확히 일치해야 함)",
  scope: "요청하는 권한 범위(공백 구분)",
  state: "CSRF 방지, 요청 연결용 임의 문자열",
  nonce: "OpenID Connect: 토큰 재전송(replay) 완화",
  prompt: "로그인, 동의 UI 힌트 (login, consent 등)",
  access_type: "오프라인용 refresh_token 힌트 등 (offline 등)",
  login_hint: "로그인 화면에 미리 넣을 식별자 힌트",
  code_challenge: "PKCE: 공개 챌린지 (code_verifier를 해시, BASE64URL)",
  code_challenge_method: "PKCE 해시 알고리즘 (보통 S256)",
  code: "일회용 인가 코드 (토큰과 교환)",
  error: "오류 코드",
  error_description: "오류 설명",
  access_token: "액세스 토큰 (Implicit, fragment에 붙는 경우 취약)",
  token_type: "토큰 종류 (보통 Bearer)",
  expires_in: "액세스 토큰 유효 시간(초)",
  id_token: "OpenID ID 토큰 (JWT)",
  refresh_token: "새 액세스 토큰 발급용 리프레시 토큰(오프라인, 장기 세션)",
};

function hintForKey(key: string): string | undefined {
  return PARAM_HINTS[key.toLowerCase()];
}

function parseFragmentParams(hash: string): [string, string][] {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!h || !h.includes("=")) return [];
  return h.split("&").map((pair) => {
    const eq = pair.indexOf("=");
    if (eq === -1) return [pair, ""];
    return [pair.slice(0, eq), pair.slice(eq + 1)];
  });
}

/**
 * 인가, 콜백 URL을 읽기 쉬운 줄 단위로 분해 (값은 디코딩, # 뒤는 주석 스타일 힌트)
 */
export function AuthUrlBreakdownContent({ url }: { url: string }) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return (
      <p className="whitespace-pre-wrap break-all text-[10px] text-slate-300">{url}</p>
    );
  }

  const originPath = `${parsed.origin}${parsed.pathname}`;
  const pairs: [string, string][] = [];
  parsed.searchParams.forEach((v, k) => {
    pairs.push([k, v]);
  });

  const fragPairs = parseFragmentParams(parsed.hash);

  return (
    <div className="space-y-0.5 text-left font-mono text-[9px] leading-relaxed">
      <div className="break-all text-slate-100">{originPath}</div>

      {pairs.length > 0 ? (
        <div className="mt-1 space-y-0.5 border-t border-slate-700/80 pt-1.5">
          {pairs.map(([key, rawVal], i) => {
            const dec = safeDecodeURIComponent(rawVal);
            const hint = hintForKey(key);
            const lead = i === 0 ? "?" : "&";
            const k = key.toLowerCase();
            const pkceParam = k === "code_challenge" || k === "code_challenge_method";
            return (
              <div key={`q-${key}-${i}`} className="break-all pl-1">
                <span className="text-cyan-400/90">{lead}</span>
                <span className="text-slate-200">{key}=</span>
                {pkceParam ? (
                  <span className="rounded bg-amber-950/55 px-0.5 font-medium text-amber-100 ring-1 ring-amber-500/70">
                    {dec}
                  </span>
                ) : (
                  <span className="text-emerald-200/85">{dec}</span>
                )}
                {hint ? (
                  <span
                    className={`ml-2 font-sans text-[8px] font-normal ${
                      pkceParam ? "text-amber-200/80" : "text-slate-500"
                    }`}
                  >
                    # {hint}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {fragPairs.length > 0 ? (
        <div className="mt-1 space-y-0.5 border-t border-violet-900/40 pt-1.5">
          <div className="font-sans text-[8px] font-medium text-violet-300/90"># fragment (브라우저만, 서버로 안 감)</div>
          {fragPairs.map(([key, rawVal], i) => {
            const dec = safeDecodeURIComponent(rawVal);
            const hint = hintForKey(key);
            const lead = i === 0 ? "#" : "&";
            return (
              <div key={`f-${key}-${i}`} className="break-all pl-1">
                <span className="text-violet-400/90">{lead}</span>
                <span className="text-slate-200">{key}=</span>
                <span className="text-amber-200/80">{dec}</span>
                {hint ? (
                  <span className="ml-2 font-sans text-[8px] font-normal text-slate-500"># {hint}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : parsed.hash ? (
        <div className="mt-1 break-all border-t border-slate-700/80 pt-1.5 text-slate-400">{parsed.hash}</div>
      ) : null}
    </div>
  );
}
