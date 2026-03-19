import type { OAuthFlowDefinition } from "./types";
import {
  DEMO_AUTH_CODE_PKCE,
  DEMO_CODE_CHALLENGE,
  DEMO_CODE_VERIFIER,
  DEMO_OPAQUE_ACCESS_TOKEN,
} from "./demo-tokens";
import {
  HTML_APP_LOGGED_IN,
  HTML_CALLBACK_CODE_EXCHANGE,
  HTML_HOME_GUEST,
  HTML_LOGIN_SOCIAL_PKCE,
} from "./html-response-bodies";

const AUTH_QS_PKCE =
  `response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcallback&scope=profile%20email&state=xyz123&code_challenge=${DEMO_CODE_CHALLENGE}&code_challenge_method=S256`;

export const pkceFlow: OAuthFlowDefinition = {
  id: "authorization_code_pkce",
  label: "Authorization Code + PKCE",
  shortLabel: "PKCE",
  description:
    "client_secret 대신 PKCE로, 브라우저에만 두는 code_verifier와 공개되는 code_challenge의 짝을 맞춥니다. 모바일, SPA처럼 비밀을 서버에 숨기기 어려운 공개 클라이언트에 적합합니다.",
  ui: {
    clientBadge: "SPA, 공개 클라",
    clientSubtext: "브라우저 중심. secret 대신 PKCE(code_verifier)로 증명.",
    tokenBadge: "code_verifier",
    tokenSubtext: "POST /token 시 code_challenge와 짝인 verifier 제출",
    tokenExchangeMode: "pkce_verifier",
    clientDiagramLines: ["Client", "SPA, PKCE"],
  },
  steps: [
    {
      id: "pkce-0",
      title: "홈",
      summary: "비로그인 사용자가 서비스 첫 화면(/)을 봅니다.",
      purpose:
        "로그인하지 않은 사용자가 클라이언트 앱의 루트 URL(/)을 엽니다. 서버는 200 OK와 함께 비로그인용 HTML을 돌려 줍니다. 사용자가 로그인을 선택하면 로그인 페이지로 이어집니다.",
      from: "owner",
      to: "client",
      requestBlock: `GET / HTTP/1.1
Host: client.example.com`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

${HTML_HOME_GUEST}`,
      internalActions: [
        "(선택) 기존 세션, 쿠키 전달",
        "비로그인 상태용 HTML 응답",
        "사용자가 로그인을 선택하면 /login 등으로 이동",
      ],
      browserUrl: "https://client.example.com/",
      simulatorView: "client",
      clientScreen: "landing",
    },
    {
      id: "pkce-1",
      title: "로그인",
      summary: "로그인 페이지에서 PKCE용 verifier, challenge를 만들고, 인가 요청을 준비합니다.",
      purpose:
        "사용자가 로그인을 선택하면 브라우저가 GET /login을 요청하고, 클라이언트는 소셜 로그인으로 이어지는 페이지를 돌려 줍니다. PKCE에서는 이 단계에서 code_verifier(비밀)를 생성해 브라우저 쪽 저장소 등에 두고, 인가 URL에는 그 해시인 code_challenge(S256 등)만 넣습니다. state도 함께 준비해 CSRF에 대비합니다. 사용자가 소셜 로그인을 진행하면 다음 단계에서 인가 서버로 리다이렉트됩니다.",
      from: "owner",
      to: "client",
      requestBlock: `GET /login HTTP/1.1
Host: client.example.com`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

${HTML_LOGIN_SOCIAL_PKCE}`,
      internalActions: [
        "code_verifier 생성(충분한 엔트로피의 랜덤 문자열)",
        "code_challenge = BASE64URL(SHA256(code_verifier)) (method=S256)",
        "state 저장, 전달(CSRF, 요청 매칭)",
        "(선택) 돌아올 URL 등 부가 정보 보존",
      ],
      browserUrl: "https://client.example.com/login",
      simulatorView: "client",
      clientScreen: "landing",
    },
    {
      id: "pkce-2",
      title: "Authorization 요청 (PKCE)",
      summary: "code_challenge를 실은 인가 URL로 브라우저를 보냅니다.",
      purpose:
        "클라이언트가 브라우저를 인가 서버로 리다이렉트할 때, URL에 code_challenge와 code_challenge_method(S256)를 포함합니다. 인가 서버는 이 challenge를 나중에 토큰 교환 때 제출되는 code_verifier와 대조할 수 있도록 저장합니다. code_verifier 자체는 네트워크로 보내지 않으므로, 나중에 authorization code만 탈취당해도 토큰을 받기 어렵습니다.",
      from: "client",
      to: "authorization",
      requestBlock: `HTTP/1.1 302 Found
Location: https://accounts.oauth-lab.example/oauth2/auth?${AUTH_QS_PKCE}`,
      responseBlock: `GET /oauth2/auth?${AUTH_QS_PKCE} HTTP/1.1
Host: accounts.oauth-lab.example`,
      internalActions: [
        "client_id, redirect_uri 검증",
        "code_challenge, method(S256) 저장(code와 짝지을 때 사용)",
      ],
      browserUrl: `https://accounts.oauth-lab.example/oauth2/auth?${AUTH_QS_PKCE}`,
      simulatorView: "authorization",
      gogglePhase: "login",
    },
    {
      id: "pkce-3",
      title: "Goggle 계정 로그인",
      summary: "인가 서버에서 계정으로 로그인합니다.",
      purpose:
        "사용자가 인가 서버 화면에서 자격 증명을 제출해 본인임을 확인합니다. 검증이 끝나면 인가 서버는 세션을 맺고, 요청된 scope에 대한 동의 화면으로 넘깁니다.",
      from: "owner",
      to: "authorization",
      requestBlock: `POST /oauth2/login (자격 증명)`,
      responseBlock: `302 → 동의 단계`,
      internalActions: ["자격 증명 검증", "세션 설정"],
      browserUrl: `https://accounts.oauth-lab.example/oauth2/auth?${AUTH_QS_PKCE}`,
      simulatorView: "authorization",
      gogglePhase: "login",
    },
    {
      id: "pkce-4",
      title: "권한 동의",
      summary: "동의 후 authorization code가 콜백으로 전달됩니다.",
      purpose:
        "사용자가 요청된 권한에 동의하면 인가 서버는 동의를 저장하고, PKCE challenge와 연결된 일회용 authorization code를 만듭니다. 브라우저는 redirect_uri로 리다이렉트되며 URL에 code와 state가 붙습니다. 토큰으로 바꾸려면 이후 단계에서 같은 흐름의 code_verifier가 반드시 필요합니다.",
      from: "owner",
      to: "authorization",
      requestBlock: `POST /oauth2/consent (허용)`,
      responseBlock: `302 Location: https://client.example.com/callback?code=${DEMO_AUTH_CODE_PKCE}&state=xyz123`,
      internalActions: [
        "code 생성 시 PKCE code_challenge 연계 저장",
        "redirect_uri로 code 전달",
      ],
      browserUrl: `https://accounts.oauth-lab.example/oauth2/auth?${AUTH_QS_PKCE}`,
      simulatorView: "authorization",
      gogglePhase: "consent",
    },
    {
      id: "pkce-5",
      title: "콜백 (code)",
      summary: "콜백 URL에 담긴 code를 앱이 받습니다.",
      purpose:
        "인가 서버가 보낸 리다이렉트로 브라우저가 클라이언트의 콜백 주소로 돌아옵니다. 앱은 state가 일치하는지 확인하고 code를 읽은 뒤, 저장해 둔 code_verifier와 함께 토큰 엔드포인트에 POST 요청을 보냅니다(client_secret 없이 PKCE만으로 증명).",
      from: "authorization",
      to: "client",
      requestBlock: `GET /callback?code=${DEMO_AUTH_CODE_PKCE}&state=xyz123 HTTP/1.1
Host: client.example.com`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

${HTML_CALLBACK_CODE_EXCHANGE}`,
      internalActions: ["state 검증", "code, code_verifier로 토큰 요청"],
      browserUrl: `https://client.example.com/callback?code=${DEMO_AUTH_CODE_PKCE}&state=xyz123`,
      simulatorView: "client",
      clientScreen: "callback",
      callbackVariant: "code",
    },
    {
      id: "pkce-6",
      title: "Token 교환 (PKCE)",
      summary: "code와 code_verifier로 access_token을 받습니다.",
      purpose:
        "공개 클라이언트는 client_secret 대신 code_verifier를 토큰 요청 본문에 넣습니다. 인가 서버는 authorize 단계에 저장한 code_challenge와, 제출된 code_verifier의 S256 해시가 같은지 확인합니다. 일치하고 code가 유효할 때만 access_token을 발급합니다.",
      from: "client",
      to: "authorization",
      requestBlock: `POST /token HTTP/1.1
Host: accounts.oauth-lab.example
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
code=${DEMO_AUTH_CODE_PKCE}
redirect_uri=https://client.example.com/callback
client_id=abc123
code_verifier=${DEMO_CODE_VERIFIER}`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "${DEMO_OPAQUE_ACCESS_TOKEN}",
  "token_type": "Bearer",
  "expires_in": 3600
}`,
      internalActions: [
        "SHA256(code_verifier)를 code_challenge와 비교(S256)",
        "일치 시에만 토큰 발급",
      ],
      browserUrl: `https://client.example.com/callback?code=${DEMO_AUTH_CODE_PKCE}&state=xyz123`,
      simulatorView: "hidden",
    },
    {
      id: "pkce-7",
      title: "Resource Server API",
      summary: "액세스 토큰으로 보호된 API를 호출합니다.",
      purpose:
        "발급받은 Bearer access_token으로 리소스 서버의 API(예: /userinfo)를 호출합니다. 서버는 토큰과 scope를 검증한 뒤 허용된 사용자 데이터를 반환합니다. Authorization Code 플로우와 이후 단계는 동일합니다.",
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
      internalActions: ["토큰 검증", "리소스 반환"],
      browserUrl: `https://client.example.com/callback?code=${DEMO_AUTH_CODE_PKCE}&state=xyz123`,
      simulatorView: "hidden",
      resourceServerTable: [
        {
          input: "Bearer 토큰",
          process: "검증, scope 확인",
          output: "id, email, name",
        },
      ],
    },
    {
      id: "pkce-8",
      title: "DemoApp에서 프로필 사용",
      summary: "로그인 완료 후 앱에서 프로필 정보를 보여 줍니다.",
      purpose:
        "사용자가 앱의 로그인 후 화면(예: /app)에 들어오면, 클라이언트는 토큰으로 받은 프로필, 이메일 등을 UI에 반영합니다. 사용자는 동의한 범위 안에서만 정보가 쓰인다는 흐름이 마무리됩니다.",
      from: "client",
      to: "client",
      requestBlock: `GET /app HTTP/1.1
Host: client.example.com
Cookie: session=...`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

${HTML_APP_LOGGED_IN}`,
      internalActions: ["프로필, 이메일 데이터를 화면에 표시"],
      browserUrl: "https://client.example.com/app",
      simulatorView: "client",
      clientScreen: "app",
    },
  ],
};
