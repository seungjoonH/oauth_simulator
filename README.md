# OAuth Simulator

OAuth 2.0 **Authorization Code(기밀 클라이언트)**, **Authorization Code + PKCE**, **Implicit** 플로우를 단계별로 따라가며, <br />
브라우저, 개발자 도구 관점에서 요청, 응답, 저장소를 익히기 위한 교육용 웹앱입니다. 

실제 인가 서버와는 연동하지 않으며, 데모용 고정 값으로 동작합니다.

<br />

### 목적

**OAuth 인가, 토큰 교환 등 과정을 이해하기 위한 교육**이 목적입니다. <br />
프로덕션용 인증 라이브러리나 베스트 프랙티스 구현을 그대로 따른다고 보기 어렵습니다.

<br />

### 코드에 관해

이 프로젝트는 **100% 바이브코딩**으로 작성되었습니다. <br />
구조, 재사용, 성능, 접근성 등 **코드 효율성과 품질이 보장되지 않을 수 있습니다.** 참고, 학습용으로 보시면 됩니다.

- **Tech**: Next.js 15, React 19, TypeScript, Tailwind CSS  
- **배포**: Vercel [oauth-simulator.vercel.app](https://oauth-simulator.vercel.app) 

설계, 화면 구조: [docs/design.md](docs/design.md)

<br />

## 주요 기능

### 단계별 탐색

- **플로우 선택**: Authorization Code(기밀), **PKCE**, **Implicit(레거시)** 중 하나를 고릅니다.  
- **단계 목록**: 현재 플로우의 단계가 순서대로 나열되고, 선택한 단계의 **제목, 한 줄 요약, 목적**을 좌측에서 볼 수 있습니다.  
- **이전 / 다음**: 시뮬레이터와 함께 한 단계씩 진행합니다.

<!-- 스크린샷: 좌측 패널(플로우, 단계 목록, 요약) -->
<img width="275" height="152" alt="feature-step-panel" src="https://github.com/user-attachments/assets/73ba1b07-b652-4698-b19a-156dcc1f172c" />

### 시뮬레이터 렌더 영역

- **주소창**: 단계에 맞는 데모 URL(인가 쿼리, 콜백, `#fragment` 등)이 바뀝니다.  
- **페이지 영역**: 랜딩, 로그인, 동의, 콜백, 로딩 문구 등 **클라이언트/인가 쪽 화면을 흉내 낸 UI**가 단계에 따라 바뀝니다. (실제 서버 통신 없음)  
- **확장**: 브라우저 영역만 전체화면으로 키울 수 있습니다.

<!-- 스크린샷: 시뮬레이터 본문(주소창 + 페이지) -->
<img width="793" height="533" alt="feature-simulator-view.png" src="https://github.com/user-attachments/assets/1a7c11ab-0643-4674-9c6d-a7c5a2a81749" />

### 개발자 도구 — Network 탭

- 단계가 진행될수록 **누적된 HTTP 요청 목록**이 표시됩니다.  
- 행을 선택하면 **Headers**, **Payload**, **Preview**, **Response** 등을 볼 수 있고, OAuth에 맞는 **교육용 설명**(파라미터, 응답 필드)이 함께 붙습니다.

<!-- 스크린샷: Network 탭 + 상세(또는 Payload/Response) -->
<img width="946" height="470" alt="feature-devtools-network" src="https://github.com/user-attachments/assets/55069514-c9d9-4033-885a-87790cc7975c" />

### 개발자 도구 — Application 탭

- **Session Storage**, **Local Storage**, **Cookies** 등 브라우저 저장소를 트리로 보여 줍니다.  
- PKCE의 `code_verifier`, `state`, Implicit의 토큰 보관 예시 등 **플로우, 단계에 맞는 데모 키/값**이 채워집니다. 행에 마우스를 올리면 설명 팝업이 뜨는 항목도 있습니다.

<!-- 스크린샷: Application 탭(Storage 트리 + 값) -->
<img width="945" height="334" alt="feature-devtools-application" src="https://github.com/user-attachments/assets/3f1b564f-851c-41ae-abf9-29506dcf8dc2" />

### 흐름 다이어그램

- **리소스 소유자**, **클라이언트**, **인가 서버**, **리소스 서버** 네 역할과, 단계에 해당하는 **요청, 응답 메시지**를 화살표로 연결해 보여 줍니다.  
- 좌측에서 단계를 바꾸면 다이어그램도 같이 갱신됩니다.

<!-- 스크린샷: 4역할 다이어그램 -->
<img width="797" height="271" alt="feature-flow-diagram" src="https://github.com/user-attachments/assets/093fba34-5e3a-4bdd-895a-65464d6162ab" />

### 단계 설명, 요청/응답 본문

- 좌측 패널 하단의 **목적** 문단, **요청 / 응답** 프리뷰(HTTP 블록), 필요 시 **포함 파라미터 표**(이름, 예시 값, 위치, 설명)로 해당 단계를 보강합니다.

<!-- 스크린샷: 목적 + 요청응답 블록 또는 파라미터 표 -->
<img width="546" height="778" alt="feature-step-detail" src="https://github.com/user-attachments/assets/d95d92a6-87cf-41d8-93b5-1aff8485b3fb" />

<br />

## 실행

```bash
npm install
npm run dev
```

기본 포트는 **3310**입니다. 브라우저에서 [http://localhost:3310](http://localhost:3310) 을 엽니다.

```bash
npm run build
npm start
```

프로덕션 서버도 동일하게 **3310** 포트를 사용합니다. 호스팅 환경에서는 플랫폼이 지정하는 `PORT`에 맞게 실행하세요.

```bash
npm run lint
```

<br />

## 사용 방법

### 화면 구성

| 영역 | 설명 |
|------|------|
| **좌측 패널** | 플로우 선택, 단계 목록, 현재 단계 요약, 목적, 이전/다음 |
| **플로우 다이어그램** | 리소스 소유자, 클라이언트, 인가 서버, 리소스 서버 간 메시지 흐름 |
| **브라우저 시뮬레이터** | 주소창, 페이지 영역, **개발자 도구**(Network / Application) |

단계를 진행할 때는 시뮬레이터 안의 **다음 단계로** 등 안내에 맞춰 클릭합니다.

<br />

### 개발자 도구 (시뮬레이터 내부)

Chrome DevTools에 가깝게 모사된 패널에서 플로우별로 다음을 확인할 수 있습니다.

| 탭 | 설명 |
|----|------|
| **Network** | 단계별 누적 요청 목록, 선택 시 Headers / Payload / Preview / Response 및 교육용 설명 |
| **Application** | Session Storage, Local Storage, Cookies 등 데모 데이터 (PKCE `code_verifier` 등) |

도킹 위치(아래, 왼쪽, 오른쪽)는 메뉴(⋮)에서 바꿀 수 있으며, 일반 보기와 전체화면(확장)마다 설정이 따로 저장될 수 있습니다.

<br />

### 주소창, URL

시뮬레이터 상단 주소창은 단계에 맞는 **데모 URL**을 보여 줍니다.  
인가 요청 쿼리, 콜백 `?code=`, `&state=`, Implicit의 `#access_token=…` 등은 여기서 형태를 익히는 용도입니다.

<br />

### 브라우저 시뮬레이터 - 확장

| 동작 | 설명 |
|------|------|
| **개발자 도구** 버튼 | 패널 열기/닫기 |
| **확장** | 브라우저 영역만 전체화면 (Esc 또는 **축소**로 종료) |
| **로컬 스토리지** | 도킹 위치, 패널 비율 등이 `localStorage`에 저장될 수 있음 |

<br />

## 데이터, 보안

- 모든 토큰, `client_secret`, authorization code 등은 **교육용 더미 값**입니다.  
- `.env`로 실제 클라이언트 시크릿을 넣는 구조가 아닙니다.  
- 공개 저장소에 올릴 때도 민감 정보를 추가하지 않도록 주의하세요.

<br />

## 라이선스

[MIT License](LICENSE)를 따릅니다. <br />
교육·학습 목적을 포함해 사용, 수정, 배포가 가능하며, 조건·면책 사항은 저장소 루트의 [`LICENSE`](LICENSE) 파일을 참고하세요.
