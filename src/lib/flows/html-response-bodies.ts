/**
 * 시뮬레이터, 패널에 쓰는 예시 HTTP 본문 (실제 문서 구조에 가깝게)
 * 헤더(200 OK, Content-Type)는 각 flow의 responseBlock 앞줄과 이어 붙임.
 */

export const HTML_HOME_GUEST = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>DemoApp</title>
</head>
<body>
  <header style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e8eaed;background:#fafafa">
    <span style="font-size:1.125rem">DemoApp</span>
    <a href="/login" style="padding:8px 16px;border:1px solid #dadce0;border-radius:8px;color:#1a73e8;text-decoration:none">로그인</a>
  </header>
  <main style="display:flex;min-height:240px;align-items:center;justify-content:center">
    <p style="color:#5f6368">로그인이 필요합니다.</p>
  </main>
</body>
</html>`;

/** 소셜 로그인 랜딩 — 플로우별 &lt;script&gt; 주석만 다름 (동일 화면) */
export function buildLoginSocialPage(scriptCommentLine: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>로그인 - DemoApp</title>
</head>
<body style="margin:0;font-family:system-ui,sans-serif">
  <main style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px">
    <h1 style="font-size:1.5rem;font-weight:400;margin:0 0 8px">DemoApp</h1>
    <p style="color:#5f6368;text-align:center;max-width:20rem;margin:0 0 2rem">간단한 서비스에 오신 것을 환영합니다.</p>
    <button type="button" style="display:inline-flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid #747775;border-radius:4px;background:#fff;cursor:pointer">
      <span>Goggle 계정으로 로그인</span>
    </button>
  </main>
  <script>
${scriptCommentLine}
  </script>
</body>
</html>`;
}

/** Authorization Code + PKCE — verifier, challenge, state */
export const HTML_LOGIN_SOCIAL_PKCE = buildLoginSocialPage(
  `    // PKCE: code_verifier 생성, 보관, code_challenge, state 준비 후 인가 URL로 이동`,
);

/** 기밀 클라이언트 Authorization Code — code_verifier 없음 */
export const HTML_LOGIN_SOCIAL_AUTH_CODE = buildLoginSocialPage(
  `    // Authorization Code: state 저장(CSRF) 후 인가 URL 조합, 리다이렉트 — 토큰은 서버가 code로 교환`,
);

/** Implicit — fragment 토큰, code, PKCE 없음 */
export const HTML_LOGIN_SOCIAL_IMPLICIT = buildLoginSocialPage(
  `    // Implicit: state 저장(CSRF) 후 인가 URL(response_type=token 등) 조합, 리다이렉트`,
);

export const HTML_CALLBACK_CODE_EXCHANGE = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>로그인 처리 중 - DemoApp</title>
</head>
<body style="margin:0;font-family:system-ui,sans-serif;padding:24px">
  <p style="color:#5f6368">인가 코드로 세션을 만드는 중입니다…</p>
  <script>
    (function () {
      var q = new URLSearchParams(window.location.search);
      var code = q.get("code");
      var state = q.get("state");
      // state 검증 후 서버(BFF)에 code 전달 → POST /token
      fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code, state: state }),
      });
    })();
  </script>
</body>
</html>`;

export const HTML_APP_LOGGED_IN = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>마이페이지 - DemoApp</title>
</head>
<body style="margin:0;font-family:system-ui,sans-serif">
  <header style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e8eaed">
    <span>DemoApp</span>
    <button type="button" style="border:1px solid #dadce0;border-radius:8px;padding:8px 12px;background:#fff">로그아웃</button>
  </header>
  <main style="padding:24px">
    <img src="/api/avatar" alt="" width="64" height="64" style="border-radius:50%"/>
    <h2 style="margin:12px 0 4px;font-size:1.25rem">Alice</h2>
    <p style="margin:0;color:#5f6368">user@example.com</p>
  </main>
</body>
</html>`;

/** Implicit 콜백: 서버는 query만 받고, fragment는 브라우저만 읽음 */
export const HTML_CALLBACK_SPA_SHELL = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>DemoApp</title>
</head>
<body>
  <div id="root"></div>
  <script src="/assets/main.js" type="module"></script>
  <!-- 해시(#access_token=…)는 이 요청에 포함되지 않음 -->
</body>
</html>`;

export const HTML_HOME_LOGGED_IN = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>마이페이지 - DemoApp</title>
</head>
<body style="margin:0;font-family:system-ui,sans-serif">
  <header style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e8eaed;background:#fafafa">
    <span>DemoApp</span>
    <button type="button" style="border:1px solid #dadce0;border-radius:8px;padding:8px 12px">로그아웃</button>
  </header>
  <main style="padding:24px">
    <p>안녕하세요, <strong>Alice</strong>님</p>
    <p style="color:#5f6368">user@example.com</p>
  </main>
</body>
</html>`;
