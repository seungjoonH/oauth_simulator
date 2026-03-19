import type { FlowStep } from "@/lib/flows/types";
import type { PopupLine } from "@/components/devtools-row-popup";
import type { NetworkLogEntry } from "./network-log";

export type NetworkRowAugmentation = {
  rowClassName?: string;
  educationExtra?: PopupLine[];
};

/** 네트워크 목록에서 핵심 요청 행 강조 + hover 시 교육용 설명 추가 */
export function getNetworkRowAugmentation(
  flowId: string,
  step: FlowStep,
  _entry: NetworkLogEntry,
): NetworkRowAugmentation {
  const id = step.id;

  if (flowId === "implicit") {
    if (id === "im-4") {
      return {
        rowClassName: "border-l-[3px] border-l-sky-500 bg-sky-50/70",
        educationExtra: [
          {
            label: "핵심 (Implicit)",
            value:
              "302 Location에 access_token 등이 fragment(# 뒤)로 붙습니다. Referrer, 브라우저 기록, 스크린샷, 악성 확장, XSS에 더 노출되기 쉬워 레거시로 분류됩니다.",
          },
        ],
      };
    }
    if (id === "im-5" || id === "im-6") {
      return {
        rowClassName: "border-l-[3px] border-l-cyan-500 bg-cyan-50/80",
        educationExtra: [
          {
            label: "핵심 (fragment)",
            value:
              "주소창 # 뒤는 HTTP 요청으로 서버에 안 올라갑니다. 대신 URL 전체가 사용자 기기, 히스토리, 로그에 남을 수 있어 토큰 유출면이 넓습니다. POST /token 없이 JS가 바로 토큰을 읽습니다.",
          },
        ],
      };
    }
    if (id === "im-7") {
      return {
        rowClassName: "border-l-[3px] border-l-violet-500 bg-violet-50/70",
        educationExtra: [
          {
            label: "핵심 (API)",
            value: "이미 브라우저에 있는 Bearer 토큰으로 리소스 서버를 호출합니다. CORS, XSS 방어가 중요합니다.",
          },
        ],
      };
    }
  }

  if (flowId === "authorization_code") {
    if (id === "ac-5") {
      return {
        rowClassName: "border-l-[3px] border-l-indigo-500 bg-indigo-50/75",
        educationExtra: [
          {
            label: "핵심 (쿼리의 code)",
            value:
              "일회용 authorization code가 ?code= 로 전달됩니다. 서버 액세스 로그, 프록시에 남을 수 있어 짧은 수명, 일회성이 중요합니다. access_token은 아직 없고, 다음 단계에서만 백엔드가 교환합니다.",
          },
        ],
      };
    }
    if (id === "ac-6") {
      return {
        rowClassName: "border-l-[3px] border-l-sky-600 bg-sky-50/80",
        educationExtra: [
          {
            label: "핵심 (Token)",
            value:
              "기밀 클라이언트는 client_secret으로 자신을 증명하고 code를 access_token으로 바꿉니다. 이 요청은 브라우저가 아니라 서버(백엔드)에서 하는 것이 일반적입니다.",
          },
        ],
      };
    }
    if (id === "ac-7") {
      return {
        rowClassName: "border-l-[3px] border-l-violet-500 bg-violet-50/70",
        educationExtra: [
          {
            label: "핵심 (Resource)",
            value: "발급받은 Bearer access_token으로 사용자 정보 등 보호 리소스를 조회합니다.",
          },
        ],
      };
    }
  }

  if (flowId === "authorization_code_pkce") {
    if (id === "pkce-2") {
      return {
        rowClassName: "border-l-[3px] border-l-amber-500 bg-amber-50/80",
        educationExtra: [
          {
            label: "핵심 (code_challenge)",
            emphasis: "pkce",
            value:
              "브라우저는 code_challenge(공개)만 인가 서버에 넘깁니다. code_verifier(비밀)는 같은 기기, 같은 출처에만 둡니다. 탈취자가 redirect로 code만 가로채도 verifier 없으면 토큰 교환이 불가능합니다.",
          },
        ],
      };
    }
    if (id === "pkce-5") {
      return {
        rowClassName: "border-l-[3px] border-l-indigo-500 bg-indigo-50/75",
        educationExtra: [
          {
            label: "핵심 (쿼리의 code)",
            value:
              "PKCE에서도 code는 쿼리로 옵니다. 단, 이 code만으로는 토큰을 받을 수 없고 반드시 같은 로그인 흐름에서 저장한 code_verifier가 추가로 필요합니다.",
          },
        ],
      };
    }
    if (id === "pkce-6") {
      return {
        rowClassName: "border-l-[3px] border-l-amber-600 bg-amber-50/85",
        educationExtra: [
          {
            label: "핵심 (code_verifier)",
            emphasis: "pkce",
            value:
              "인가 서버는 code_verifier를 해시해 authorize 때 받은 code_challenge와 비교합니다. client_secret 없이도 “이 교환 요청이 처음 인가를 시작한 클라이언트다”를 증명합니다. 공개 SPA에서도 안전한 이유입니다.",
          },
        ],
      };
    }
    if (id === "pkce-7") {
      return {
        rowClassName: "border-l-[3px] border-l-violet-500 bg-violet-50/70",
        educationExtra: [
          {
            label: "핵심 (Resource)",
            value: "Code 플로우와 동일하게 Bearer 토큰으로 API를 호출합니다.",
          },
        ],
      };
    }
  }

  return {};
}
