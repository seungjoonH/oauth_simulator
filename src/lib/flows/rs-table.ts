import type { ResourceServerRow } from "./types";

export const defaultResourceServerTable: ResourceServerRow[] = [
  {
    input:
      "Authorization 헤더에서 Bearer 토큰 문자열 추출; JWT인 경우 payload의 sub, scope 클레임",
    process:
      "토큰 서명, 만료 검증(또는 인가 서버 introspection), 요청된 scope(profile, email) 보유 여부 확인, user_id로 DB 조회",
    output:
      "id ← 내부 user id, email ← 계정 이메일, name ← 표시 이름",
  },
];
