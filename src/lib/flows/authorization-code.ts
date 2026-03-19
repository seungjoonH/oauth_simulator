import type { OAuthFlowDefinition } from "./types";
import { DEMO_CLIENT_SECRET, DEMO_OPAQUE_ACCESS_TOKEN, DEMO_REFRESH_TOKEN } from "./demo-tokens";
import {
  HTML_APP_LOGGED_IN,
  HTML_CALLBACK_CODE_EXCHANGE,
  HTML_HOME_GUEST,
  HTML_LOGIN_SOCIAL_AUTH_CODE,
} from "./html-response-bodies";

const AUTH_QS =
  "response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcallback&scope=profile%20email&state=xyz123";

export const authorizationCodeFlow: OAuthFlowDefinition = {
  id: "authorization_code",
  label: "Authorization Code Flow",
  shortLabel: "Code",
  description:
    "인가 서버가 내려준 authorization code를, 백엔드가 client_secret과 함께 토큰으로 바꿉니다. 토큰이 브라우저에만 머물지 않아 기밀 클라이언트에 잘 맞습니다.",
  ui: {
    clientBadge: "Client 서버 O",
    clientSubtext: "토큰 교환은 백엔드(SSR, 전통 웹앱). 브라우저만으로는 secret 불가.",
    tokenBadge: "client_secret",
    tokenSubtext: "POST /token 시 기밀 클라이언트 증명",
    tokenExchangeMode: "client_secret",
    clientDiagramLines: ["Client", "서버"],
  },
  steps: [
    {
      id: "ac-0",
      title: "홈",
      summary: "비로그인 사용자가 서비스 첫 화면(/)을 봅니다.",
      purpose:
        "로그인하지 않은 사용자가 클라이언트 앱의 루트 URL(/)을 엽니다. 서버는 200 OK와 함께 로그인으로 이어질 수 있는 비로그인용 HTML을 돌려 줍니다. 사용자가 로그인을 선택하면 로그인 페이지 요청으로 이어집니다.",
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
      id: "ac-1",
      title: "로그인",
      summary: "클라이언트 로그인 페이지가 열리고, 인가 서버로 보낼 요청을 준비합니다.",
      purpose:
        "사용자가 로그인을 선택하면 브라우저가 GET /login을 요청합니다. 서버는 소셜 로그인 등으로 이어지는 로그인 페이지 HTML을 돌려 줍니다. 클라이언트는 곧 브라우저를 인가 서버로 보내기 위해 state(예: CSRF 방지), client_id, redirect_uri, scope 등을 준비해 둡니다. 사용자가 「Goggle 계정으로 로그인」 같은 버튼을 누르면 다음 단계에서 인가 서버로 리다이렉트됩니다.",
      from: "owner",
      to: "client",
      requestBlock: `GET /login HTTP/1.1
Host: client.example.com`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

${HTML_LOGIN_SOCIAL_AUTH_CODE}`,
      internalActions: [
        "클라이언트: state를 세션 등에 저장(CSRF, 요청 매칭)",
        "클라이언트: authorize URL 파라미터(client_id, redirect_uri, scope, response_type=code) 준비",
      ],
      browserUrl: "https://client.example.com/login",
      simulatorView: "client",
      clientScreen: "landing",
    },
    {
      id: "ac-2",
      title: "Authorization 요청 (리다이렉트)",
      summary: "브라우저가 인가 서버의 로그인, 동의 화면으로 이동합니다.",
      purpose:
        "클라이언트가 302 등으로 브라우저를 인가 서버의 /authorize(또는 동등한) URL로 보냅니다. 사용자는 여기서 계정으로 로그인하고, 이후 단계에서 권한 동의를 진행합니다. 인가 서버는 등록된 client_id, redirect_uri인지 확인한 뒤 로그인 UI를 준비합니다.",
      from: "client",
      to: "authorization",
      requestBlock: `HTTP/1.1 302 Found
Location: https://accounts.oauth-lab.example/oauth2/auth?${AUTH_QS}`,
      responseBlock: `브라우저가 Location 으로 이동:

GET /oauth2/auth?${AUTH_QS} HTTP/1.1
Host: accounts.oauth-lab.example`,
      internalActions: [
        "Authorization Server: client_id, redirect_uri 화이트리스트 검증",
        "Authorization Server: 로그인 UI 렌더 준비",
      ],
      browserUrl: `https://accounts.oauth-lab.example/oauth2/auth?${AUTH_QS}`,
      simulatorView: "authorization",
      gogglePhase: "login",
    },
    {
      id: "ac-3",
      title: "Goggle 계정 로그인",
      summary: "인가 서버에서 이메일, 비밀번호 등으로 본인 확인을 합니다.",
      purpose:
        "리소스 소유자(사용자)가 인가 서버 화면에서 계정 자격 증명을 제출합니다. 인가 서버는 이를 검증하고 세션에 로그인 상태를 기록한 뒤, 요청된 scope에 대한 동의 화면으로 넘깁니다.",
      from: "owner",
      to: "authorization",
      requestBlock: `POST /oauth2/login HTTP/1.1
Host: accounts.oauth-lab.example
Content-Type: application/x-www-form-urlencoded

email=user%40example.com&password=••••••••`,
      responseBlock: `HTTP/1.1 302 Found
Location: /oauth2/auth?${AUTH_QS}&step=consent
(세션 쿠키 Set-Cookie)`,
      internalActions: [
        "자격 증명 검증",
        "세션에 로그인 상태 기록",
        "동의 UI로 진행",
      ],
      browserUrl: `https://accounts.oauth-lab.example/oauth2/auth?${AUTH_QS}`,
      simulatorView: "authorization",
      gogglePhase: "login",
    },
    {
      id: "ac-4",
      title: "권한 동의",
      summary: "앱이 요청한 범위(scope)에 동의하면 authorization code가 발급됩니다.",
      purpose:
        "사용자가 표시된 권한(예: 프로필, 이메일)을 확인하고 허용하면, 인가 서버는 동의를 저장하고 짧은 수명의 일회용 authorization code를 생성합니다. 그 code를 redirect_uri로 브라우저를 리다이렉트하면서 쿼리 문자열 등으로 넘깁니다. 아직 access_token은 없으며, code는 다음 단계에서만 토큰과 교환됩니다.",
      from: "owner",
      to: "authorization",
      requestBlock: `(사용자가 「허용」 클릭)

POST /oauth2/consent HTTP/1.1
Host: accounts.oauth-lab.example
Cookie: session=...

scope=profile%20email&approve=1`,
      responseBlock: `HTTP/1.1 302 Found
Location: https://client.example.com/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz123`,
      internalActions: [
        "동의 기록 저장",
        "일회용 authorization code 생성, 저장(redirect_uri, client_id와 바인딩)",
        "code를 쿼리로 콜백 URL에 실어 리다이렉트",
      ],
      browserUrl: `https://accounts.oauth-lab.example/oauth2/auth?${AUTH_QS}`,
      simulatorView: "authorization",
      gogglePhase: "consent",
    },
    {
      id: "ac-5",
      title: "Authorization Code 전달 (콜백)",
      summary: "등록된 콜백 URL로 돌아오며, URL에 code가 붙어 전달됩니다.",
      purpose:
        "브라우저가 redirect_uri(콜백)로 이동합니다. 응답 URL에는 authorization code와 앞서 보낸 state가 포함되는 경우가 많습니다. 클라이언트(또는 프론트의 핸들러)는 state가 자신이 저장한 값과 같은지 확인한 뒤 code를 꺼내, 서버가 토큰 엔드포인트로 교환 요청을 할 수 있게 합니다.",
      from: "authorization",
      to: "client",
      requestBlock: `GET /callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz123 HTTP/1.1
Host: client.example.com`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

${HTML_CALLBACK_CODE_EXCHANGE}`,
      internalActions: [
        "Client: state가 세션 값과 일치하는지 검증",
        "Client: code 추출 후 서버 측에서 POST /token 호출",
      ],
      browserUrl:
        "https://client.example.com/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz123",
      simulatorView: "client",
      clientScreen: "callback",
      callbackVariant: "code",
    },
    {
      id: "ac-6",
      title: "Token 교환",
      summary: "백엔드가 code와 client_secret으로 토큰 엔드포인트에 요청합니다.",
      purpose:
        "브라우저에 노출되면 안 되는 client_secret을 아는 서버가 POST /token(또는 동등한) 요청으로 code를 access_token(및 필요 시 refresh_token)으로 바꿉니다. 인가 서버는 code가 한 번만 쓰이도록 소모하고, client_id, redirect_uri, secret이 등록 정보와 맞는지 검증합니다.",
      from: "client",
      to: "authorization",
      requestBlock: `POST /token HTTP/1.1
Host: accounts.oauth-lab.example
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
code=SplxlOBeZQQYbYS6WxSbIA
redirect_uri=https://client.example.com/callback
client_id=abc123
client_secret=${DEMO_CLIENT_SECRET}`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "${DEMO_OPAQUE_ACCESS_TOKEN}",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "${DEMO_REFRESH_TOKEN}"
}`,
      internalActions: [
        "code 일회성 소모(재사용 거부)",
        "client_secret, redirect_uri, code 매칭 검증",
        "access_token, refresh_token 발급",
      ],
      browserUrl:
        "https://client.example.com/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz123",
      simulatorView: "hidden",
    },
    {
      id: "ac-7",
      title: "Resource Server API",
      summary: "발급받은 액세스 토큰으로 보호된 API를 호출합니다.",
      purpose:
        "클라이언트가 Authorization: Bearer … 헤더에 access_token을 실어 리소스 서버(예: 사용자 정보 API)를 호출합니다. 리소스 서버는 토큰의 유효성, 만료, audience, scope를 검사한 뒤, 허용된 데이터만 JSON 등으로 돌려 줍니다.",
      from: "client",
      to: "resource",
      requestBlock: `GET /userinfo HTTP/1.1
Host: api.example.com
Authorization: Bearer ${DEMO_OPAQUE_ACCESS_TOKEN}`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "12345",
  "email": "user@example.com",
  "name": "Alice"
}`,
      internalActions: [
        "Authorization 헤더에서 Bearer 토큰 추출",
        "토큰 서명, 만료, audience 검증",
        "scope에 profile/email 포함 시 해당 필드 반환",
      ],
      browserUrl:
        "https://client.example.com/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz123",
      simulatorView: "hidden",
      resourceServerTable: [
        {
          input: "`Authorization: Bearer` + 불투명 access_token (데모 문자열)",
          process: "JWT 서명 검증 또는 introspection, `scope`에 profile, email 확인",
          output: "`id` ← 내부 user id, `email` ← 계정 이메일, `name` ← 표시 이름",
        },
      ],
    },
    {
      id: "ac-8",
      title: "DemoApp에서 프로필 사용",
      summary: "로그인이 완료된 뒤 앱이 사용자 정보를 화면에 보여 줍니다.",
      purpose:
        "사용자가 앱의 보호된 페이지(예: /app)로 들어오면, 서버는 세션이나 서버 측에 보관한 토큰을 사용해 API에서 받은 프로필, 이메일 등을 HTML에 넣어 응답합니다. 사용자 입장에서는 동의한 정보가 앱 안에 표시되는 단계입니다.",
      from: "client",
      to: "client",
      requestBlock: `GET /app HTTP/1.1
Host: client.example.com
Cookie: session=...`,
      responseBlock: `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

${HTML_APP_LOGGED_IN}`,
      internalActions: [
        "프로필, 이메일 scope로 받은 데이터를 화면에 표시",
      ],
      browserUrl: "https://client.example.com/app",
      simulatorView: "client",
      clientScreen: "app",
    },
  ],
};
