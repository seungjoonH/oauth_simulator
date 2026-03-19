/**
 * 교육용 데모 값 — 실제 자격 증명이 아님. 형태만 OAuth, Google 스타일에 가깝게 유지.
 * 전역에서 동일 문자열을 쓰면 시뮬레이터, DevTools, 플로우 정의가 일치합니다.
 */

export const DEMO_CODE_VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

/** RFC 7636 Appendix B 예시와 짝 (S256) */
export const DEMO_CODE_CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

/** 불투명 액세스 토큰(가짜) — Implicit fragment, Bearer 헤더 등에 공통 사용 */
export const DEMO_OPAQUE_ACCESS_TOKEN =
  "ya29.a0AfH6SMBxKQ9vR2mL8nB4pH1sT6yUwZeNcDfVgJqMxRyTz0aB3cD5eF7gH9iJkLmNoPqRsTuVw";

/** PKCE 콜백에서 받는 authorization code (가짜) */
export const DEMO_AUTH_CODE_PKCE = "4/0AfJohXm2Pq8Rs5Tu7Vw9Yz_AbCdEfGhIjKlMnOpQrStUvWx";

export const DEMO_REFRESH_TOKEN =
  "1//0hX7vK9mN2pQrStUvWxYz_AbCdEfGhIjKlMnOpQrStUvWx0123456789abcdefghij";

export const DEMO_CLIENT_SECRET = "g0dvJ3mK8nP2qR5sT7uW9yZaBcDeFgHiJkLmNoPqRs";

/** 기밀 클라이언트 Authorization Code 예시 (OAuth 2.0 스펙 예시와 유사) */
export const DEMO_AUTH_CODE_CONFIDENTIAL = "SplxlOBeZQQYbYS6WxSbIA";

export const DEMO_CALLBACK_ORIGIN_PATH = "https://client.example.com/callback";

export const DEMO_IMPLICIT_FRAGMENT =
  `#access_token=${DEMO_OPAQUE_ACCESS_TOKEN}&token_type=Bearer&expires_in=3600&state=xyz123`;

export const DEMO_IMPLICIT_CALLBACK_URL = `${DEMO_CALLBACK_ORIGIN_PATH}${DEMO_IMPLICIT_FRAGMENT}`;
