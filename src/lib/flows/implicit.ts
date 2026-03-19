import type { OAuthFlowDefinition } from "./types";
import {
  DEMO_IMPLICIT_CALLBACK_URL,
  DEMO_OPAQUE_ACCESS_TOKEN,
} from "./demo-tokens";
import {
  HTML_CALLBACK_SPA_SHELL,
  HTML_HOME_GUEST,
  HTML_HOME_LOGGED_IN,
  HTML_LOGIN_SOCIAL_IMPLICIT,
} from "./html-response-bodies";

const AUTH_IMPLICIT =
  "response_type=token&client_id=abc123&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcallback&scope=profile%20email&state=xyz123";

export const implicitFlow: OAuthFlowDefinition = {
  id: "implicit",
  label: "Implicit Flow",
  shortLabel: "Implicit",
  description:
    "authorization code 없이, 인가 응답에서 곧바로 access_token을 받습니다. 토큰은 URL의 fragment(# 뒤)에만 실려 서버 로그에 안 남도록 설계된 면이 있으나, 오늘날에는 보안, 호환 이유로 Code+PKCE가 권장됩니다.",
  ui: {
    clientBadge: "Client = 브라우저 앱",
    clientSubtext: "OAuth Client는 있음(앱 식별). 토큰 교환용 서버 호출은 없음.",
    tokenBadge: "# fragment",
    tokenSubtext: "POST /token 없음 - access_token이 주소 # 뒤로만 전달",
    tokenExchangeMode: "implicit_fragment",
    clientDiagramLines: ["Client", "브라우저"],
  },
  steps: [
    {
      id: "im-0",
      title: "홈",
      summary: "비로그인 사용자가 서비스 첫 화면(/)을 봅니다.",
      purpose:
        "Implicit 플로우도 일반적으로 클라이언트 루트(/)에서 시작합니다. 서버는 비로그인 HTML을 반환하고, 사용자가 로그인을 선택하면 로그인 페이지로 이어집니다.",
      from: "owner",
      to: "client",
      requestBlock: `GET / HTTP/1.1
Host: client.example.com`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

${HTML_HOME_GUEST}`,
      internalActions: ["비로그인용 HTML 응답", "사용자가 로그인을 선택하면 /login 등으로 이동"],
      browserUrl: "https://client.example.com/",
      simulatorView: "client",
      clientScreen: "landing",
    },
    {
      id: "im-1",
      title: "로그인",
      summary: "로그인 페이지에서 Implicit용 인가 URL(response_type=token)을 준비합니다.",
      purpose:
        "GET /login으로 클라이언트 로그인 페이지가 열립니다. Implicit에서는 code 대신 토큰을 바로 받기 위해, 곧 사용할 인가 요청에 response_type=token과 state 등을 포함해 둡니다. 사용자가 소셜 로그인을 진행하면 다음 단계에서 인가 서버로 이동합니다.",
      from: "owner",
      to: "client",
      requestBlock: `GET /login HTTP/1.1
Host: client.example.com`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

${HTML_LOGIN_SOCIAL_IMPLICIT}`,
      internalActions: [
        "state 저장(CSRF, 요청 매칭)",
        "authorize URL에 response_type=token, client_id, redirect_uri, scope 구성",
      ],
      browserUrl: "https://client.example.com/login",
      simulatorView: "client",
      clientScreen: "landing",
    },
    {
      id: "im-2",
      title: "Authorization 요청 (Implicit)",
      summary: "response_type=token으로 인가 서버 로그인, 동의 화면으로 갑니다.",
      purpose:
        "브라우저가 인가 서버로 리다이렉트될 때 response_type=token을 쓰면, 인가 서버는 code 없이 최종적으로 access_token을 fragment(# 뒤)에 실어 콜백으로 보낼 수 있습니다. (서버가 Location 헤더의 fragment를 다루는 방식은 구현에 따릅니다.) redirect_uri는 반드시 등록된 값과 일치해야 합니다.",
      from: "client",
      to: "authorization",
      requestBlock: `HTTP/1.1 302 Found
Location: https://accounts.oauth-lab.example/oauth2/auth?${AUTH_IMPLICIT}`,
      responseBlock: `GET /oauth2/auth?${AUTH_IMPLICIT} HTTP/1.1
Host: accounts.oauth-lab.example`,
      internalActions: [
        "Implicit는 public client에서 흔함 — redirect_uri 검증 필수",
        "token 응답을 fragment로 줄 준비",
      ],
      browserUrl: `https://accounts.oauth-lab.example/oauth2/auth?${AUTH_IMPLICIT}`,
      simulatorView: "authorization",
      gogglePhase: "login",
    },
    {
      id: "im-3",
      title: "Goggle 계정 로그인",
      summary: "인가 서버에서 계정으로 로그인합니다.",
      purpose:
        "사용자가 인가 서버에서 자격 증명을 제출해 본인임을 확인합니다. Code, PKCE와 마찬가지로 로그인에 성공하면 동의 화면으로 이어집니다.",
      from: "owner",
      to: "authorization",
      requestBlock: `POST /oauth2/login HTTP/1.1
Host: accounts.oauth-lab.example
Content-Type: application/x-www-form-urlencoded

email=user%40example.com&password=••••••••`,
      responseBlock: `HTTP/1.1 302 Found
Location: /oauth2/auth?${AUTH_IMPLICIT}&step=consent
(세션 쿠키 Set-Cookie)`,
      internalActions: [
        "자격 증명 검증",
        "세션에 로그인 상태 기록",
        "동의 UI로 진행",
      ],
      browserUrl: `https://accounts.oauth-lab.example/oauth2/auth?${AUTH_IMPLICIT}`,
      simulatorView: "authorization",
      gogglePhase: "login",
    },
    {
      id: "im-4",
      title: "권한 동의 (Implicit)",
      summary: "동의 후 access_token이 URL fragment에 실려 콜백으로 돌아갑니다.",
      purpose:
        "사용자가 권한을 허용하면 인가 서버는 code를 거치지 않고 access_token(및 token_type, expires_in, state 등)을 발급해 redirect_uri로 보냅니다. 토큰은 보통 주소의 # 뒤(fragment)에만 있어, 일반적인 HTTP 서버 액세스 로그에는 찍히지 않습니다. 대신 브라우저, 히스토리, 스크린샷, XSS 등 다른 경로로 노출될 수 있어 현재는 권장 플로우가 아닙니다.",
      from: "owner",
      to: "authorization",
      requestBlock: `(사용자가 「허용」 클릭)

POST /oauth2/consent HTTP/1.1
Host: accounts.oauth-lab.example`,
      responseBlock: `HTTP/1.1 302 Found
Location: ${DEMO_IMPLICIT_CALLBACK_URL}

※ 토큰은 # 뒤(fragment)에만 있음`,
      internalActions: [
        "자격 증명, 동의 검증",
        "access_token 즉시 발급",
        "Location 헤더에 fragment 포함",
      ],
      browserUrl: `https://accounts.oauth-lab.example/oauth2/auth?${AUTH_IMPLICIT}`,
      simulatorView: "authorization",
      gogglePhase: "consent",
    },
    {
      id: "im-5",
      title: "콜백 (fragment에 토큰)",
      summary: "콜백 페이지가 열리고, 주소창 hash에 토큰 파라미터가 붙습니다.",
      purpose:
        "리다이렉트 결과로 브라우저는 /callback 같은 URL을 로드하며, 전체 주소에는 #access_token=… 등이 붙습니다. HTTP 요청의 path, query만 서버로 가므로 fragment는 서버가 읽지 못하고, 클라이언트 측 스크립트가 파싱합니다.",
      from: "authorization",
      to: "client",
      requestBlock: `GET /callback HTTP/1.1
Host: client.example.com
(브라우저만 document.location.hash 로 # 이후 읽음)`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

${HTML_CALLBACK_SPA_SHELL}`,
      internalActions: [
        "서버는 /callback 본문만 제공; hash는 서버에 전송되지 않음",
      ],
      browserUrl: DEMO_IMPLICIT_CALLBACK_URL,
      simulatorView: "client",
      clientScreen: "callback",
      callbackVariant: "implicit",
    },
    {
      id: "im-6",
      title: "클라이언트(JS) — hash 파싱, 토큰 보관",
      summary: "JavaScript가 hash에서 토큰을 읽어 저장합니다. 별도의 POST /token 단계는 없습니다.",
      purpose:
        "싱글 페이지 앱 등은 window.location.hash를 파싱해 access_token과 state를 꺼냅니다. state를 세션 시작 시 저장한 값과 비교한 뒤, 토큰을 메모리나 sessionStorage 등에 둡니다. Authorization Code 플로우처럼 백엔드가 code를 토큰으로 바꾸는 단계는 없습니다.",
      from: "client",
      to: "client",
      requestBlock: `// 브라우저 내 JavaScript (예시)
const params = new URLSearchParams(window.location.hash.slice(1));
const accessToken = params.get("access_token");
const state = params.get("state");
sessionStorage.setItem("at", accessToken);
window.history.replaceState(null, "", "/app");`,
      responseBlock: `(메모리/ sessionStorage 에 토큰 보관)

⚠ POST /token 요청은 이 플로우에 없음`,
      internalActions: [
        "state 검증(CSRF)",
        "access_token 메모리 권장; XSS 시 탈취 위험",
        "refresh_token 일반적으로 없음",
      ],
      browserUrl: DEMO_IMPLICIT_CALLBACK_URL,
      simulatorView: "client",
      clientScreen: "callback",
      callbackVariant: "implicit",
    },
    {
      id: "im-7",
      title: "Resource Server API",
      summary: "브라우저가 보유한 토큰으로 API를 호출합니다.",
      purpose:
        "클라이언트가 Authorization: Bearer 헤더에 access_token을 실어 리소스 서버를 호출합니다. 토큰이 브라우저에 있으므로 CORS 설정, XSS 완화, 토큰 보관 위치가 보안에 큰 영향을 줍니다.",
      from: "client",
      to: "resource",
      requestBlock: `GET /userinfo HTTP/1.1
Host: api.example.com
Authorization: Bearer ${DEMO_OPAQUE_ACCESS_TOKEN}`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "id": "12345",
  "email": "user@example.com",
  "name": "Alice"
}`,
      internalActions: ["Bearer 추출, 검증", "scope 기반 필드 반환"],
      browserUrl: DEMO_IMPLICIT_CALLBACK_URL,
      simulatorView: "hidden",
      resourceServerTable: [
        {
          input: "`Authorization: Bearer` + 불투명 토큰 (데모)",
          process: "JWT 검증 또는 introspection, scope 확인",
          output: "`id`, `email`, `name`",
        },
      ],
    },
    {
      id: "im-8",
      title: "앱 화면 (마이페이지)",
      summary: "로그인된 사용자에게 앱 홈, 마이페이지를 보여 줍니다.",
      purpose:
        "사용자가 다시 루트(/) 등으로 이동하면, 클라이언트는 저장한 토큰으로 API를 호출하거나 세션 쿠키와 함께 서버 렌더링된 로그인 UI를 받아 표시합니다. Implicit는 토큰이 프론트에 머무는 경우가 많아 이후 세션 설계가 구현마다 달라질 수 있습니다.",
      from: "client",
      to: "client",
      requestBlock: `GET / HTTP/1.1
Host: client.example.com`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

${HTML_HOME_LOGGED_IN}`,
      internalActions: ["프론트가 보유한 토큰으로 API 호출 후 렌더"],
      browserUrl: "https://client.example.com/",
      simulatorView: "client",
      clientScreen: "app",
    },
  ],
};
