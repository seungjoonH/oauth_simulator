import type { PopupLine } from "@/components/devtools-row-popup";

export type NetworkDetailGuide = {
  /** 상단 요약 (항상 표시) */
  callout: string;
  /** 본문 영역 테두리, 배경 */
  boxClass: string;
  popupTitle: string;
  lines: PopupLine[];
};

/** Payload 탭 — 선택된 요청(step id)별 교육 */
export function getNetworkPayloadGuide(flowId: string, entryStepId: string): NetworkDetailGuide | null {
  if (flowId === "authorization_code") {
    if (entryStepId === "ac-0") {
      return {
        callout: "일반 페이지 로드입니다. 본문 없음.",
        boxClass: "border-l-[3px] border-l-slate-400 bg-slate-50/50",
        popupTitle: "Payload — 클라이언트 홈 (Code)",
        lines: [
          {
            label: "참고",
            value: "OAuth 파라미터는 아직 없습니다. 로그인, 인가는 이후 단계입니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-1") {
      return {
        callout: "로그인 페이지 GET. 본문 없음.",
        boxClass: "border-l-[3px] border-l-slate-400 bg-slate-50/50",
        popupTitle: "Payload — 로그인 페이지 (Code)",
        lines: [
          {
            label: "이후",
            value: "보통 **state**와 인가 URL을 여기서 준비합니다. 버튼 클릭 후 인가 서버로 리다이렉트됩니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-2") {
      return {
        callout: "인가 서버로 보내는 리다이렉트. 본문 없음.",
        boxClass: "border-l-[3px] border-l-sky-500 bg-sky-50/40",
        popupTitle: "Payload — 인가로 이동 (Code)",
        lines: [
          {
            label: "쿼리",
            value:
              "**client_id**, **redirect_uri**, **scope**, **response_type=code**는 **Location** URL에 붙습니다. POST 본문이 아닙니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-3") {
      return {
        callout: "인가 서버 **계정** 로그인 폼입니다.",
        boxClass: "border-l-[3px] border-l-rose-500/90 bg-rose-50/45",
        popupTitle: "Payload — 인가 서버 로그인 (Code)",
        lines: [
          {
            label: "주의",
            value:
              "사용자 비밀번호 전송 단계입니다. OAuth **client_secret**(앱 비밀)과는 **완전히 별개**입니다.",
          },
          {
            label: "이후",
            value: "검증되면 동의 화면 → **일회용 code** 발급으로 이어집니다. 아직 **access_token**은 없습니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-4") {
      return {
        callout: "권한 동의(허용) POST.",
        boxClass: "border-l-[3px] border-l-emerald-600 bg-emerald-50/45",
        popupTitle: "Payload — 권한 동의 (Code)",
        lines: [
          {
            label: "이후",
            value: "승인되면 서버가 **일회용 authorization code**를 만들고, **redirect_uri**로 브라우저를 보냅니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-5") {
      return {
        callout: "콜백 GET. 본문 없음 — **code**는 URL에만 있습니다.",
        boxClass: "border-l-[3px] border-l-indigo-500 bg-indigo-50/40",
        popupTitle: "Payload — 콜백 (Authorization Code)",
        lines: [
          {
            label: "code",
            value:
              "**일회용**입니다. **access_token**이 아니며, 짧은 수명, **한 번만** 토큰 엔드포인트에 씁니다. URL, 로그에 남을 수 있어 주의합니다.",
          },
          {
            label: "state",
            value: "시작할 때 저장한 값과 같은지 비교하면 **위조된 콜백**(CSRF)을 줄일 수 있습니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-6") {
      return {
        callout: "**code** → **access_token** 으로 바꾸는 POST 본문입니다.",
        boxClass: "border-l-[3px] border-l-sky-600 bg-sky-50/50",
        popupTitle: "Payload — Token (Authorization Code)",
        lines: [
          {
            label: "grant_type",
            value: "**authorization_code** — 지금 하려는 일이 “코드 교환”임을 나타냅니다.",
          },
          {
            label: "client_secret",
            value:
              "**브라우저에 두면 안 되는** 값입니다. 보통 **서버**만 알고, 여기서 “등록된 기밀 클라이언트”임을 증명합니다.",
          },
          {
            label: "redirect_uri",
            value: "인가 요청 때와 **완전히 동일**해야 합니다. 다르면 **code**가 거절됩니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-7") {
      return {
        callout: "API 호출 GET. 본문 없음.",
        boxClass: "border-l-[3px] border-l-violet-500 bg-violet-50/40",
        popupTitle: "Payload — Resource API",
        lines: [
          {
            label: "토큰",
            value: "**Authorization: Bearer …** 는 **Headers** 탭에서 확인하세요.",
          },
        ],
      };
    }
    if (entryStepId === "ac-8") {
      return {
        callout: "로그인 후 앱 화면. 본문 없음.",
        boxClass: "border-l-[3px] border-l-indigo-400 bg-indigo-50/35",
        popupTitle: "Payload — 앱 화면 (Code)",
        lines: [
          {
            label: "Cookie",
            value: "데모의 **session=…** 처럼, 로그인 상태는 쿠키, 세션으로 이어지는 경우가 많습니다.",
          },
        ],
      };
    }
  }

  if (flowId === "authorization_code_pkce") {
    if (entryStepId === "pkce-0") {
      return {
        callout: "일반 페이지 로드. 본문 없음.",
        boxClass: "border-l-[3px] border-l-slate-400 bg-slate-50/50",
        popupTitle: "Payload — 클라이언트 홈 (PKCE)",
        lines: [
          {
            label: "참고",
            value: "**PKCE**는 **/login** 이후에 **verifier**, **challenge**가 준비됩니다.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-1") {
      return {
        callout: "로그인 페이지 GET. 본문 없음.",
        boxClass: "border-l-[3px] border-l-stone-400/45 bg-stone-50/90",
        popupTitle: "Payload — 로그인 페이지 (PKCE)",
        lines: [
          {
            label: "PKCE",
            emphasis: "pkce",
            value:
              "**code_verifier**는 저장소에만 두고, 네트워크에는 **code_challenge**(해시)만 **인가 URL**에 실립니다.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-2") {
      return {
        callout: "인가 서버로 리다이렉트. 본문 없음.",
        boxClass: "border-l-[3px] border-l-stone-400/50 bg-stone-50/90",
        popupTitle: "Payload — 인가 URL (PKCE)",
        lines: [
          {
            label: "확인",
            emphasis: "pkce",
            value: "**code_challenge**, **code_challenge_method=S256** 가 쿼리에 있는지 보세요.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-3") {
      return {
        callout: "인가 서버 로그인(데모는 요약).",
        boxClass: "border-l-[3px] border-l-rose-500/90 bg-rose-50/45",
        popupTitle: "Payload — 인가 서버 로그인 (PKCE)",
        lines: [
          {
            label: "참고",
            emphasis: "pkce",
            value: "실제로는 **이메일/비밀번호** 폼 POST가 이어집니다. **challenge**는 이미 인가 요청에 붙어 있습니다.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-4") {
      return {
        callout: "권한 동의(데모는 요약).",
        boxClass: "border-l-[3px] border-l-emerald-600 bg-emerald-50/45",
        popupTitle: "Payload — 권한 동의 (PKCE)",
        lines: [
          {
            label: "핵심",
            emphasis: "pkce",
            value: "**code**는 저장된 **code_challenge**와 짝입니다. **verifier** 없으면 토큰으로 못 바꿉니다.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-5") {
      return {
        callout: "콜백 GET. **code**는 URL에만 — **verifier**는 저장소.",
        boxClass: "border-l-[3px] border-l-indigo-500 bg-indigo-50/40",
        popupTitle: "Payload — 콜백 (PKCE)",
        lines: [
          {
            label: "verifier",
            emphasis: "pkce",
            value: "네트워크에 안 나옵니다. **Application → Session storage** 등에서만 봅니다.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-6") {
      return {
        callout: "**code** + **code_verifier** 로 토큰 요청 (**client_secret** 없음).",
        boxClass: "border-l-[3px] border-l-stone-500/40 bg-stone-100/85",
        popupTitle: "Payload — Token (PKCE)",
        lines: [
          {
            label: "code_verifier",
            emphasis: "pkce",
            value:
              "**code**만 탈취당해도 **verifier** 없으면 이 요청을 재현하기 어렵습니다. 서버는 **challenge**와 해시를 맞춥니다.",
          },
          {
            label: "왜 PKCE?",
            emphasis: "pkce",
            value: "브라우저 앱은 **secret**을 숨기기 어려워, “**처음 인가를 연 클라이언트**”임을 이렇게 증명합니다.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-7") {
      return {
        callout: "API GET. 본문 없음.",
        boxClass: "border-l-[3px] border-l-violet-500 bg-violet-50/40",
        popupTitle: "Payload — Resource API (PKCE)",
        lines: [
          {
            label: "토큰",
            value: "**Authorization: Bearer** 는 **Headers** 탭.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-8") {
      return {
        callout: "로그인 후 앱 화면. 본문 없음.",
        boxClass: "border-l-[3px] border-l-indigo-400 bg-indigo-50/35",
        popupTitle: "Payload — 앱 화면 (PKCE)",
        lines: [
          {
            label: "정리",
            emphasis: "pkce",
            value: "**secret** 없이 **code + verifier**로 토큰까지 온 **공개 클라이언트** 전형 흐름입니다.",
          },
        ],
      };
    }
  }

  if (flowId === "implicit") {
    if (entryStepId === "im-0") {
      return {
        callout: "일반 페이지 로드. 본문 없음.",
        boxClass: "border-l-[3px] border-l-slate-400 bg-slate-50/50",
        popupTitle: "Payload — 클라이언트 홈 (Implicit)",
        lines: [
          {
            label: "Implicit",
            value: "**response_type=token** 은 **인가 URL** 단계에서 붙습니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-1") {
      return {
        callout: "로그인 페이지 GET. 본문 없음.",
        boxClass: "border-l-[3px] border-l-slate-400 bg-slate-50/50",
        popupTitle: "Payload — 로그인 페이지 (Implicit)",
        lines: [
          {
            label: "차이",
            value: "**code**, **POST /token** 없이, 토큰이 **# 뒤**로만 옵니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-2") {
      return {
        callout: "인가 서버로 리다이렉트. 본문 없음.",
        boxClass: "border-l-[3px] border-l-orange-500/90 bg-orange-50/40",
        popupTitle: "Payload — 인가 요청 (Implicit)",
        lines: [
          {
            label: "토큰",
            value: "성공 시 **302 Location**의 **#** 뒤에 **access_token** 등이 붙는 식이 흔합니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-3") {
      return {
        callout: "인가 서버 **계정** 로그인 폼.",
        boxClass: "border-l-[3px] border-l-rose-500/90 bg-rose-50/45",
        popupTitle: "Payload — 인가 서버 로그인 (Implicit)",
        lines: [
          {
            label: "이후",
            value: "동의 후 **code 없이** 바로 토큰을 **fragment**로 넘깁니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-4") {
      return {
        callout: "동의(허용) POST.",
        boxClass: "border-l-[3px] border-l-sky-500 bg-sky-50/45",
        popupTitle: "Payload — 동의 (Implicit)",
        lines: [
          {
            label: "Implicit",
            value: "**authorization code** 단계 없음. **Location #** 에 토큰이 붙습니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-5") {
      return {
        callout: "콜백 GET. 본문 없음 — 토큰은 **주소 #**.",
        boxClass: "border-l-[3px] border-l-cyan-600 bg-cyan-50/45",
        popupTitle: "Payload — 콜백 (Implicit)",
        lines: [
          {
            label: "주의",
            value: "서버는 **hash**를 못 읽는 경우가 많습니다. **주소창, 히스토리, XSS** 노출은 여전히 위험입니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-6") {
      return {
        callout: "브라우저 **JS** 예시(실제 HTTP 본문 아님). **POST /token** 없음.",
        boxClass: "border-l-[3px] border-l-cyan-600 bg-cyan-50/50",
        popupTitle: "Payload — 클라이언트 스크립트 (Implicit)",
        lines: [
          {
            label: "흐름",
            value: "**hash**에서 **access_token**을 읽어 저장합니다. **Code 플로우**처럼 서버 교환 단계가 없습니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-7") {
      return {
        callout: "API GET. 본문 없음.",
        boxClass: "border-l-[3px] border-l-violet-500 bg-violet-50/40",
        popupTitle: "Payload — Resource API (Implicit)",
        lines: [
          {
            label: "토큰",
            value: "**Headers** 탭의 **Authorization: Bearer**.",
          },
        ],
      };
    }
    if (entryStepId === "im-8") {
      return {
        callout: "로그인 후 앱 화면. 본문 없음.",
        boxClass: "border-l-[3px] border-l-indigo-400 bg-indigo-50/35",
        popupTitle: "Payload — 앱 화면 (Implicit)",
        lines: [
          {
            label: "권장",
            value: "신규 앱은 **Authorization Code + PKCE**가 일반적입니다.",
          },
        ],
      };
    }
  }

  return null;
}

/** Preview 탭 — JSON, 비JSON 공통 안내 */
export function getNetworkPreviewGuide(flowId: string, entryStepId: string): NetworkDetailGuide | null {
  if (flowId === "authorization_code") {
    if (entryStepId === "ac-0") {
      return {
        callout: "홈 화면 HTML입니다.",
        boxClass: "border-l-[3px] border-l-slate-400 bg-slate-50/50",
        popupTitle: "Preview — 홈 HTML (Code)",
        lines: [
          {
            label: "다음",
            value: "로그인으로 이어지면 **/login** 요청이 다음 행에 쌓입니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-1") {
      return {
        callout: "로그인 페이지 HTML입니다.",
        boxClass: "border-l-[3px] border-l-slate-400 bg-slate-50/50",
        popupTitle: "Preview — 로그인 페이지 (Code)",
        lines: [
          {
            label: "참고",
            value: "**state**, 인가 URL은 보통 여기서 준비합니다. 인가 서버로 가는 건 **다음 행**입니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-2") {
      return {
        callout: "302 — 인가 서버로 보냅니다.",
        boxClass: "border-l-[3px] border-l-sky-500 bg-sky-50/40",
        popupTitle: "Preview — 리다이렉트 (Code)",
        lines: [
          {
            label: "보려면",
            value: "**Response** 탭에서 **Location** 쿼리에 **response_type=code** 등이 붙었는지 확인하세요.",
          },
        ],
      };
    }
    if (entryStepId === "ac-3") {
      return {
        callout: "로그인 후 동의 화면으로 넘어가는 302.",
        boxClass: "border-l-[3px] border-l-rose-500/85 bg-rose-50/40",
        popupTitle: "Preview — 로그인 응답 (Code)",
        lines: [
          {
            label: "세션",
            value: "**Set-Cookie**가 있으면 이후 동의, **code** 발급까지 같은 브라우저 세션으로 이어집니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-4") {
      return {
        callout: "동의 후 **code**가 붙은 리다이렉트입니다.",
        boxClass: "border-l-[3px] border-l-emerald-600 bg-emerald-50/45",
        popupTitle: "Preview — 동의 후 리다이렉트 (Code)",
        lines: [
          {
            label: "핵심",
            value: "**Location**의 `?code=…&state=…` 가 인가 결과입니다. JSON 본문이 아닙니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-5") {
      return {
        callout: "콜백 HTML입니다. **아직 access_token 없음.**",
        boxClass: "border-l-[3px] border-l-indigo-500 bg-indigo-50/40",
        popupTitle: "Preview — 콜백 응답 (Authorization Code)",
        lines: [
          {
            label: "정리",
            value:
              "**일회용 code**는 브라우저 **주소(URL)**에만 있습니다. 앱이 읽은 뒤 **서버**가 **POST /token**으로 **access_token**을 받습니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-6") {
      return {
        callout: "**code**를 **access_token**(등)으로 바꾼 JSON입니다.",
        boxClass: "border-l-[3px] border-l-sky-600 bg-sky-50/50",
        popupTitle: "Preview — Token 응답 (Authorization Code)",
        lines: [
          {
            label: "access_token",
            value:
              "API 호출에 쓰는 값입니다. 이 시점에서 **code**는 서버 쪽에서 소모된 상태인 경우가 많습니다.",
          },
          {
            label: "token_type",
            value: "보통 **Bearer** — `Authorization: Bearer <토큰>`",
          },
          {
            label: "refresh_token",
            value: "있으면 **access_token** 갱신에 씁니다. **브라우저 저장**은 XSS 등과 트레이드오프입니다.",
          },
          {
            label: "expires_in",
            value: "**access_token** 만료까지 남은 시간(초)입니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-7") {
      return {
        callout: "로그인 사용자 정보 JSON.",
        boxClass: "border-l-[3px] border-l-violet-500 bg-violet-50/40",
        popupTitle: "Preview — Userinfo (Authorization Code)",
        lines: [
          {
            label: "검증",
            value: "서버가 **Bearer** 토큰, **scope**를 검사한 뒤 허용된 필드만 내려줍니다.",
          },
        ],
      };
    }
    if (entryStepId === "ac-8") {
      return {
        callout: "로그인 후 앱 화면 HTML입니다.",
        boxClass: "border-l-[3px] border-l-indigo-400 bg-indigo-50/35",
        popupTitle: "Preview — 앱 화면 (Code)",
        lines: [
          {
            label: "참고",
            value: "표시 데이터는 **userinfo** 등 API 결과를 붙인 경우가 많습니다.",
          },
        ],
      };
    }
  }

  if (flowId === "authorization_code_pkce") {
    if (entryStepId === "pkce-0") {
      return {
        callout: "홈 화면 HTML입니다.",
        boxClass: "border-l-[3px] border-l-slate-400 bg-slate-50/50",
        popupTitle: "Preview — 홈 HTML (PKCE)",
        lines: [
          { label: "다음", value: "**verifier**, **challenge**는 **/login** 이후에 준비됩니다." },
        ],
      };
    }
    if (entryStepId === "pkce-1") {
      return {
        callout: "로그인 페이지 HTML입니다.",
        boxClass: "border-l-[3px] border-l-stone-400/45 bg-stone-50/90",
        popupTitle: "Preview — 로그인 페이지 (PKCE)",
        lines: [
          {
            label: "Application",
            emphasis: "pkce",
            value: "**Session storage**의 **code_verifier**가 나중 **POST /token** Payload와 짝입니다.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-2") {
      return {
        callout: "302 — 인가 URL로 이동.",
        boxClass: "border-l-[3px] border-l-stone-400/50 bg-stone-50/90",
        popupTitle: "Preview — 인가 리다이렉트 (PKCE)",
        lines: [
          {
            label: "PKCE",
            emphasis: "pkce",
            value: "**challenge**만 노출되고, **verifier** 원문은 저장소에만 둡니다.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-3") {
      return {
        callout: "로그인 후 동의로 넘어가는 302(데모 요약).",
        boxClass: "border-l-[3px] border-l-rose-500/85 bg-rose-50/40",
        popupTitle: "Preview — 로그인 응답 (PKCE)",
        lines: [
          { label: "세션", value: "**Set-Cookie**로 이후 **동의, code**까지 이어집니다." },
        ],
      };
    }
    if (entryStepId === "pkce-4") {
      return {
        callout: "동의 후 **code** 리다이렉트.",
        boxClass: "border-l-[3px] border-l-emerald-600 bg-emerald-50/45",
        popupTitle: "Preview — 동의 후 (PKCE)",
        lines: [
          {
            label: "PKCE",
            emphasis: "pkce",
            value: "이 **code**는 아까 보낸 **code_challenge**와 서버 안에서 짝입니다.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-5") {
      return {
        callout: "콜백 HTML. **토큰은 다음 행 POST /token**.",
        boxClass: "border-l-[3px] border-l-indigo-500 bg-indigo-50/40",
        popupTitle: "Preview — 콜백 (PKCE)",
        lines: [
          {
            label: "필수",
            emphasis: "pkce",
            value: "**code**만으로는 부족합니다. 같은 흐름의 **code_verifier**가 있어야 교환됩니다.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-6") {
      return {
        callout: "**verifier** 검증 후 받은 토큰 JSON입니다.",
        boxClass: "border-l-[3px] border-l-stone-500/40 bg-stone-100/85",
        popupTitle: "Preview — Token 응답 (PKCE)",
        lines: [
          {
            label: "access_token",
            emphasis: "pkce",
            value: "**client_secret** 없이 **공개 클라이언트**가 받는 전형적인 결과입니다.",
          },
          {
            label: "refresh_token",
            value: "있을 수도, 없을 수도 있습니다. **SPA**는 보관 위치가 중요합니다.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-7") {
      return {
        callout: "사용자 정보 JSON.",
        boxClass: "border-l-[3px] border-l-violet-500 bg-violet-50/40",
        popupTitle: "Preview — Userinfo (PKCE)",
        lines: [
          {
            label: "scope",
            value: "동의한 범위 안의 필드만 내려옵니다.",
          },
        ],
      };
    }
    if (entryStepId === "pkce-8") {
      return {
        callout: "로그인 후 앱 화면 HTML입니다.",
        boxClass: "border-l-[3px] border-l-indigo-400 bg-indigo-50/35",
        popupTitle: "Preview — 앱 화면 (PKCE)",
        lines: [
          {
            label: "끝",
            emphasis: "pkce",
            value: "**secret** 없이 **code + verifier**로 토큰까지 온 흐름이 마무리된 상태입니다.",
          },
        ],
      };
    }
  }

  if (flowId === "implicit") {
    if (entryStepId === "im-0") {
      return {
        callout: "홈 화면 HTML입니다.",
        boxClass: "border-l-[3px] border-l-slate-400 bg-slate-50/50",
        popupTitle: "Preview — 홈 HTML (Implicit)",
        lines: [{ label: "다음", value: "**response_type=token** 은 인가 단계에서 붙습니다." }],
      };
    }
    if (entryStepId === "im-1") {
      return {
        callout: "로그인 페이지 HTML입니다.",
        boxClass: "border-l-[3px] border-l-slate-400 bg-slate-50/50",
        popupTitle: "Preview — 로그인 페이지 (Implicit)",
        lines: [
          {
            label: "Implicit",
            value: "**POST /token** 없이 **hash**로 토큰을 받는 흐름입니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-2") {
      return {
        callout: "302 — 인가 화면으로 이동.",
        boxClass: "border-l-[3px] border-l-orange-500/90 bg-orange-50/40",
        popupTitle: "Preview — 인가 리다이렉트 (Implicit)",
        lines: [
          {
            label: "주의",
            value: "**#** 뒤 토큰은 서버 로그에 안 남을 수 있어도, **브라우저, XSS** 노출은 남습니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-3") {
      return {
        callout: "로그인 후 동의로 넘어가는 302.",
        boxClass: "border-l-[3px] border-l-rose-500/85 bg-rose-50/40",
        popupTitle: "Preview — 로그인 응답 (Implicit)",
        lines: [
          { label: "세션", value: "**동의, 토큰**까지 세션이 유지되어야 합니다." },
        ],
      };
    }
    if (entryStepId === "im-4") {
      return {
        callout: "동의 후 **Location #** 에 토큰이 붙는 302.",
        boxClass: "border-l-[3px] border-l-sky-500 bg-sky-50/45",
        popupTitle: "Preview — 리다이렉트 (Implicit)",
        lines: [
          {
            label: "핵심",
            value: "**Response** 탭에서 **Location** 전체( **#** 포함)를 보는 편이 안전합니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-5") {
      return {
        callout: "콜백 HTML. **access_token** 은 **주소 #**.",
        boxClass: "border-l-[3px] border-l-cyan-600 bg-cyan-50/45",
        popupTitle: "Preview — 콜백 HTML (Implicit)",
        lines: [
          {
            label: "서버",
            value: "GET **/callback** 본문만으로는 토큰이 안 보입니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-6") {
      return {
        callout: "시뮬 안내 문구. 토큰은 **hash**에서 이미 읽었다고 가정.",
        boxClass: "border-l-[3px] border-l-cyan-600 bg-cyan-50/45",
        popupTitle: "Preview — 스크립트 이후 (Implicit)",
        lines: [
          {
            label: "정리",
            value: "인가 서버가 **토큰 JSON**을 내려주는 단계는 없습니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-7") {
      return {
        callout: "사용자 정보 JSON.",
        boxClass: "border-l-[3px] border-l-violet-500 bg-violet-50/40",
        popupTitle: "Preview — Userinfo (Implicit)",
        lines: [
          {
            label: "보안",
            value: "토큰이 **프론트**에 있으면 **CORS, XSS** 부담이 큽니다.",
          },
        ],
      };
    }
    if (entryStepId === "im-8") {
      return {
        callout: "로그인 후 앱 화면 HTML입니다.",
        boxClass: "border-l-[3px] border-l-indigo-400 bg-indigo-50/35",
        popupTitle: "Preview — 앱 화면 (Implicit)",
        lines: [
          {
            label: "권장",
            value: "새 프로젝트는 **Authorization Code + PKCE**.",
          },
        ],
      };
    }
  }

  return null;
}

/** Response 탭 hover — 핵심 단계에서만 한 줄 덧붙임 (나머지는 Preview와 동일 줄) */
function networkResponseExtraLines(entryStepId: string): PopupLine[] {
  if (
    ["ac-2", "ac-3", "ac-4", "pkce-2", "pkce-3", "pkce-4", "im-2", "im-3"].includes(entryStepId)
  ) {
    return [
      {
        label: "이 탭에서",
        value: "302면 **Location**으로 어디로 가는지 보세요. 세션은 **Set-Cookie**로 이어지는 경우가 많습니다.",
      },
    ];
  }
  if (entryStepId === "ac-5" || entryStepId === "pkce-5") {
    return [
      {
        label: "code",
        value: "**일회용 authorization code**는 브라우저 주소 `?code=…`에 있습니다. 아래 HTML 본문과는 별개입니다.",
      },
    ];
  }
  if (entryStepId === "ac-6") {
    return [
      {
        label: "토큰 교환 결과",
        value:
          "백엔드가 **code** + **client_secret**(및 redirect_uri 등)을 보낸 뒤 받은 응답입니다. **access_token**으로 리소스 API를 호출합니다.",
      },
    ];
  }
  if (entryStepId === "pkce-6") {
    return [
      {
        label: "토큰 교환 결과",
        value:
          "**code** + **code_verifier**로 받은 JSON입니다. 브라우저 앱은 **client_secret** 없이 이렇게 토큰을 받습니다.",
      },
    ];
  }
  if (entryStepId === "im-4" || entryStepId === "im-5") {
    return [
      {
        label: "Implicit",
        value: "토큰은 보통 **Location** URL의 **# 뒤(fragment)**에만 붙습니다. 서버 액세스 로그에는 안 찍히는 경우가 많습니다.",
      },
    ];
  }
  return [];
}

/**
 * Response 탭 — Preview와 같은 짧은 콜아웃, hover에만 단계별 보조 설명.
 */
export function getNetworkResponseGuide(flowId: string, entryStepId: string): NetworkDetailGuide | null {
  const preview = getNetworkPreviewGuide(flowId, entryStepId);
  if (!preview) return null;
  const extra = networkResponseExtraLines(entryStepId);
  return {
    ...preview,
    popupTitle: preview.popupTitle.replace(/^Preview/, "Response"),
    callout: preview.callout,
    boxClass: "border-l-[3px] border-l-violet-600 bg-violet-50/42",
    lines: extra.length > 0 ? [...extra, ...preview.lines] : preview.lines,
  };
}
