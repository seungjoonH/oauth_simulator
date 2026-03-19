"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { FlowStep, FlowTokenExchangeMode } from "@/lib/flows/types";
import { AuthUrlBreakdownContent } from "@/lib/auth-url-breakdown";
import { flowById } from "@/lib/flows";
import { PKCE_URL_PARAM_HIGHLIGHT } from "@/lib/devtools/pkce-education-ui";
import { usePanelResize } from "@/hooks/use-panel-resize";
import { BrowserApplicationDevtools } from "./browser-application-devtools";
import { readDevtoolsDock, type DevtoolsDock } from "./devtools-dock-menu";
import { PanelDivider } from "./panel-divider";

const CLIENT_LOGIN_URL = "https://client.example.com/login";

/** 유효 클릭 — 이 안을 누르면 잘못된 클릭 유도 없음 */
const SIM_ACT = { "data-sim-action": "" } as const;
/** 현재 단계에서 눌러야 할 곳(잘못 클릭 시 펄스) */
const SIM_PRI = { "data-sim-action": "", "data-sim-primary": "" } as const;

/** 시뮬 내부 「다음 단계로」— 링크 스타일 대신 명확한 버튼 */
const SIM_ADVANCE_BTN =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-[#1558b0] bg-[#1a73e8] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-[transform,background-color,border-color] hover:bg-[#1765cc] hover:border-[#1765cc] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

function findVisiblePrimary(container: Element): HTMLElement | null {
  for (const el of container.querySelectorAll("[data-sim-primary]")) {
    if (!(el instanceof HTMLElement)) continue;
    if (el instanceof HTMLButtonElement && el.disabled) continue;
    const st = getComputedStyle(el);
    if (st.display === "none" || st.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 && r.height < 2) continue;
    return el;
  }
  return null;
}

const G_LOGO = (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 sm:h-6 sm:w-6">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

function SimulatorAddressBar({ url, flowId }: { url: string; flowId: string }) {
  const hashIdx = url.indexOf("#");
  if (hashIdx !== -1 && url.includes("access_token")) {
    const base = url.slice(0, hashIdx);
    const frag = url.slice(hashIdx);
    return (
      <span className="min-w-0">
        <span className="text-slate-500">{base}</span>
        <span className="break-all rounded px-0.5 text-sky-100 [box-decoration-break:clone] bg-gradient-to-r from-sky-600/35 to-cyan-600/30">
          {frag}
        </span>
      </span>
    );
  }

  const pkceCh = url.match(/([?&])(code_challenge=[^&]+)/);
  if (pkceCh && flowId === "authorization_code_pkce") {
    const param = pkceCh[2]!;
    const i = url.indexOf(param);
    return (
      <span className="min-w-0">
        <span className="text-slate-500">{url.slice(0, i)}</span>
        <span className={PKCE_URL_PARAM_HIGHLIGHT}>{param}</span>
        <span className="text-slate-500">{url.slice(i + param.length)}</span>
      </span>
    );
  }

  const codeM = url.match(/([?&])(code=[^&#]+)/);
  if (codeM && !url.includes("access_token")) {
    const param = codeM[2]!;
    const i = url.indexOf(param);
    const isPkce = flowId === "authorization_code_pkce";
    return (
      <span className="min-w-0">
        <span className="text-slate-500">{url.slice(0, i)}</span>
        <span className="break-all rounded px-0.5 text-violet-100 [box-decoration-break:clone] bg-violet-600/35">
          {param}
        </span>
        <span className="text-slate-500">{url.slice(i + param.length)}</span>
      </span>
    );
  }

  return <span className="truncate">{url}</span>;
}

function goggleGSmall() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

type SimMode =
  | "mypage-guest"
  | "client-login-sequence"
  | "client-landing"
  | "landing-pressed"
  | "auth-transition"
  | "login-type-next"
  | "consent-transition"
  | "consent-only"
  | "callback-transition"
  | "callback-code"
  | "callback-implicit"
  | "client-app"
  | "hidden-token-transition"
  | "hidden-token"
  | "hidden-success-transition"
  | "hidden-success"
  | "hidden-profile"
  | "hidden-generic";

/** 1, 2단계 Client 랜딩 — 패딩, 타이포 동일 (단계 경계가 끊기지 않게) */
const CLIENT_LANDING_WRAP =
  "flex h-full min-h-0 flex-col items-center justify-center bg-white px-4 py-6 [font-family:var(--font-roboto),var(--font-noto-kr),Helvetica,Arial,sans-serif]";
const CLIENT_LANDING_TITLE = "mb-2 text-2xl font-normal tracking-tight text-[#202124]";
const CLIENT_LANDING_SUB =
  "mb-8 max-w-xs text-center text-sm font-normal leading-normal text-[#5f6368]";
const GOGGLE_BTN_BASE =
  "inline-flex h-10 w-full max-w-[min(100%,280px)] items-center justify-center gap-3 rounded border px-3 pl-3 transition-all duration-200 [font-family:var(--font-roboto),var(--font-noto-kr),Helvetica,Arial,sans-serif]";
const GOGGLE_BTN_LABEL = "truncate text-left text-[14px] font-medium leading-none tracking-[0.25px] text-[#1f1f1f]";

/** 비로그인 마이페이지 — 헤더 [DemoApp] [로그인]. allowClickWhenPressed: 버튼이 선택된 스타일이어도 클릭 허용(한 번 더 누르면 다음 단계) */
function MyPageGuestView({
  onLoginClick,
  loginButtonPressed = false,
  allowClickWhenPressed = false,
}: {
  onLoginClick: () => void;
  loginButtonPressed?: boolean;
  /** true면 선택된 스타일이어도 클릭으로 다음 단계 진행 가능 */
  allowClickWhenPressed?: boolean;
}) {
  const loginBtnClass = loginButtonPressed
    ? `scale-[0.98] rounded-lg border border-[#5f6368] bg-[#f1f3f4] px-4 py-2 text-sm font-medium text-[#1a73e8] shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)] ${
        allowClickWhenPressed ? "cursor-pointer hover:brightness-[0.98]" : "cursor-default"
      }`
    : "cursor-pointer rounded-lg border border-[#dadce0] bg-white px-4 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#f8f9fa]";
  return (
    <div className="flex h-full min-h-0 flex-col bg-white [font-family:var(--font-roboto),var(--font-noto-kr),Helvetica,Arial,sans-serif]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#e8eaed] bg-[#fafafa] px-4 py-3">
        <span className="text-lg font-normal tracking-tight text-[#202124]">DemoApp</span>
        <button
          type="button"
          onClick={() => onLoginClick()}
          disabled={loginButtonPressed && !allowClickWhenPressed}
          className={loginBtnClass}
          {...SIM_PRI}
        >
          로그인
        </button>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <p className="text-center text-sm text-[#5f6368]">로그인이 필요합니다.</p>
      </div>
    </div>
  );
}

/** 홈(0단계): 잠시 후 로그인 버튼이 선택된 상태로 표시. 사용자가 누르거나, 선택된 뒤 다시 누르면 다음 단계 */
function HomeStepIdleThenPressView({ onAdvance }: { onAdvance: () => void }) {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (pressed) return;
    const t = window.setTimeout(() => setPressed(true), 880);
    return () => clearTimeout(t);
  }, [pressed]);

  const handleLogin = useCallback(() => {
    if (!pressed) setPressed(true);
    else onAdvance();
  }, [pressed, onAdvance]);

  return (
    <MyPageGuestView
      onLoginClick={handleLogin}
      loginButtonPressed={pressed}
      allowClickWhenPressed
    />
  );
}

function ClientLandingFrame({
  buttonPressed,
  onButtonClick,
  buttonDisabled,
  interactiveWhenPressed,
  footer,
}: {
  buttonPressed: boolean;
  onButtonClick?: () => void;
  buttonDisabled?: boolean;
  /** 선택된 스타일이어도 클릭 허용(다음 단계 진행) */
  interactiveWhenPressed?: boolean;
  footer?: ReactNode;
}) {
  const isDisabled =
    !onButtonClick ||
    (Boolean(buttonDisabled) && !(interactiveWhenPressed && buttonPressed));
  const btnClass = `${GOGGLE_BTN_BASE} ${
    buttonPressed
      ? `scale-[0.96] border-[#5f6368] bg-[#f1f3f4] shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)] brightness-[0.97] ${
          interactiveWhenPressed ? "cursor-pointer hover:brightness-[0.96]" : ""
        }`
      : "border-[#747775] bg-white shadow-sm"
  } ${!buttonDisabled && !buttonPressed ? "hover:shadow-md" : ""}`;

  return (
    <div className={CLIENT_LANDING_WRAP}>
      <div className={CLIENT_LANDING_TITLE}>DemoApp</div>
      <p className={CLIENT_LANDING_SUB}>간단한 서비스에 오신 것을 환영합니다.</p>
      <button
        type="button"
        disabled={isDisabled}
        onClick={onButtonClick}
        className={btnClass}
        {...(!isDisabled ? SIM_PRI : {})}
      >
        {goggleGSmall()}
        <span className={GOGGLE_BTN_LABEL}>Goggle 계정으로 로그인</span>
      </button>
      {footer}
    </div>
  );
}

/** Goggle 로그인 카드 영역 — 3단계 끝, 4단계 시작 동일 레이아웃 */
const GOGGLE_LOGIN_PAGE_WRAP =
  "flex h-full min-h-0 flex-col items-center justify-center overflow-auto bg-[#f0f2f5] px-4 py-6";

function labStepIndex(stepId: string): number {
  const m = stepId.match(/^(?:pkce|ac|im)-(\d+)$/);
  return m ? parseInt(m[1]!, 10) : -1;
}

/**
 * 단계 모델 (플로우 공통, 0…8):
 * 0 홈 — 자동으로 로그인 버튼 강조 후, 클릭으로 다음 단계
 * 1 로그인 — /login 전환, 소셜 버튼 시퀀스(클릭으로 진행)
 * 2~ — 인가, 동의, 콜백 등 (step 정의와 동일 순서)
 */
function modeForStep(step: FlowStep): SimMode {
  const id = step.id;
  const n = labStepIndex(id);
  const isIm = id.startsWith("im-");

  if (n === 0) return "mypage-guest";
  if (n === 1) return "client-login-sequence";
  if (n === 2) return "auth-transition";
  if (n === 3) return "login-type-next";
  if (n === 4) return "consent-transition";
  if (n === 5) return isIm ? "callback-implicit" : "callback-transition";
  if (n === 6) return isIm ? "callback-implicit" : "hidden-token-transition";
  if (n === 7) return isIm ? "hidden-profile" : "hidden-success-transition";
  if (n === 8) return "client-app";

  if (step.simulatorView === "client" && step.clientScreen === "app") return "client-app";
  if (step.simulatorView === "client" && step.clientScreen === "callback" && step.callbackVariant === "code")
    return "callback-code";
  if (step.simulatorView === "client" && step.clientScreen === "callback" && step.callbackVariant === "implicit")
    return "callback-implicit";
  if (step.simulatorView !== "hidden") return "hidden-generic";
  return "hidden-generic";
}

function LandingPressed({ onAdvance }: { onAdvance: () => void }) {
  const [pressed, setPressed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPressed(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <ClientLandingFrame
      buttonPressed={pressed}
      onButtonClick={onAdvance}
    />
  );
}

/** 단계「로그인」: 헤더 로그인 탭 → 손 뗌 → 로딩 → /login → 소셜 버튼 선택 표시(클릭으로 단계 진행, 소셜 버튼은 한 번 더 누르면 다음 단계) */
function ClientLoginPageSequenceView({
  flowId,
  setBarUrl,
  onAdvance,
}: {
  flowId: string;
  setBarUrl: (u: string) => void;
  onAdvance: () => void;
}) {
  type Phase = "header-pressed" | "header-released" | "nav-loading" | "landing" | "landing-idle" | "goggle-pressed";
  const [phase, setPhase] = useState<Phase>("header-pressed");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    setBarUrl("https://client.example.com/");
  }, [setBarUrl]);

  useEffect(() => {
    if (phase !== "header-pressed") return;
    const id = window.setTimeout(() => setPhase("header-released"), 220);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "header-released") return;
    const id = window.setTimeout(() => {
      setPhase("nav-loading");
      setBarUrl(CLIENT_LOGIN_URL);
    }, 380);
    return () => clearTimeout(id);
  }, [phase, setBarUrl]);

  useEffect(() => {
    if (phase !== "nav-loading") return;
    const id = window.setTimeout(() => setPhase("landing"), 750);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "landing") return;
    const id = window.setTimeout(() => setPhase("landing-idle"), 650);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "landing-idle") return;
    const id = window.setTimeout(() => setPhase("goggle-pressed"), 620);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "nav-loading") setBarUrl(CLIENT_LOGIN_URL);
  }, [phase, setBarUrl]);

  const onHeaderClick = useCallback(() => {
    setPhase((p) => {
      if (p === "header-pressed") return "header-released";
      if (p === "header-released") return "nav-loading";
      return p;
    });
  }, []);

  const handleGoggleButton = useCallback(() => {
    const p = phaseRef.current;
    if (p === "goggle-pressed") onAdvance();
    else if (p === "landing" || p === "landing-idle") setPhase("goggle-pressed");
  }, [onAdvance]);

  if (phase === "nav-loading") {
    return (
      <div className={`${CLIENT_LANDING_WRAP} gap-4 bg-[#f0f2f5]`}>
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
        <p className="text-sm font-normal text-[#5f6368]">로그인 페이지로 이동하는 중…</p>
      </div>
    );
  }

  if (phase === "landing" || phase === "landing-idle" || phase === "goggle-pressed") {
    return (
      <div className="flex h-full min-h-0 flex-col bg-[#f0f2f5]">
        <ClientLandingFrame
          buttonPressed={phase === "goggle-pressed"}
          buttonDisabled={false}
          interactiveWhenPressed
          onButtonClick={handleGoggleButton}
        />
      </div>
    );
  }

  return (
    <MyPageGuestView
      allowClickWhenPressed
      onLoginClick={onHeaderClick}
      loginButtonPressed={phase === "header-pressed"}
    />
  );
}

/** 인가 서버 로그인 전환: 클라이언트 카드 → 로딩 → Goggle 로그인 카드; 이메일 행 클릭으로 단계 종료(한 번 더 클릭 시 다음 단계) */
function AuthTransitionView({
  authUrl,
  setBarUrl,
  onAdvance,
}: {
  authUrl: string;
  setBarUrl: (u: string) => void;
  onAdvance: () => void;
}) {
  type Phase = "pressed" | "released" | "loading" | "login";
  const [phase, setPhase] = useState<Phase>("pressed");
  const [emailRowEmphasisPressed, setEmailRowEmphasisPressed] = useState(false);

  useEffect(() => {
    setBarUrl(CLIENT_LOGIN_URL);
    const t1 = setTimeout(() => setPhase("released"), 100);
    const t2 = setTimeout(() => {
      setPhase("loading");
      setBarUrl(authUrl);
    }, 450);
    const t3 = setTimeout(() => setPhase("login"), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [authUrl, setBarUrl]);

  useEffect(() => {
    if (phase !== "login") {
      setEmailRowEmphasisPressed(false);
      return;
    }
    const t = setTimeout(() => setEmailRowEmphasisPressed(true), 720);
    return () => clearTimeout(t);
  }, [phase]);

  const handleEmailClick = useCallback(() => {
    setEmailRowEmphasisPressed((prev) => {
      if (!prev) return true;
      queueMicrotask(onAdvance);
      return prev;
    });
  }, [onAdvance]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f0f2f5]">
      {phase === "pressed" || phase === "released" ? (
        <ClientLandingFrame
          buttonPressed={phase === "pressed"}
          buttonDisabled
        />
      ) : phase === "loading" ? (
        <div className={`${CLIENT_LANDING_WRAP} gap-4`}>
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
          <p className="text-sm font-normal text-[#5f6368]">Goggle로 이동하는 중…</p>
        </div>
      ) : (
        <div className={GOGGLE_LOGIN_PAGE_WRAP}>
          <LoginCard
            email=""
            showTypewriter={false}
            nextPressed={false}
            nextDisabled
            onNextClick={() => {}}
            onEmailFieldClick={handleEmailClick}
            emailRowEmphasisPressed={emailRowEmphasisPressed}
            variant="full"
          />
        </div>
      )}
    </div>
  );
}

function LoginCard({
  email,
  showTypewriter,
  nextPressed,
  nextDisabled,
  interactiveNextWhenPressed,
  onNextClick,
  onEmailFieldClick,
  onTypingComplete,
  emailRowEmphasisPressed,
  variant,
}: {
  email: string;
  showTypewriter: boolean;
  nextPressed: boolean;
  /** true면 다음 버튼 비활성(타이핑 중, 전환 구간 등) */
  nextDisabled: boolean;
  /** true면 「다음」이 선택된 스타일이어도 클릭 가능(다음 단계) */
  interactiveNextWhenPressed?: boolean;
  onNextClick: () => void;
  /** 2단계: 이메일 영역 클릭 시 3단계로 */
  onEmailFieldClick?: () => void;
  /** 3단계: 자동 입력 완료 시 */
  onTypingComplete?: () => void;
  /** 이메일 행 선택 강조(인가 로그인 카드에서 단계 전환용) */
  emailRowEmphasisPressed?: boolean;
  variant: "full";
}) {
  const full = "user@example.com";
  const [value, setValue] = useState(showTypewriter ? "" : email);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingDoneRef = useRef(false);
  const onTypingCompleteRef = useRef(onTypingComplete);
  onTypingCompleteRef.current = onTypingComplete;

  useEffect(() => {
    typingDoneRef.current = false;
    if (!showTypewriter) {
      setValue(email);
      return;
    }
    setValue("");
    let i = 0;
    const t0 = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        i += 1;
        setValue(full.slice(0, i));
        if (i >= full.length && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          if (!typingDoneRef.current) {
            typingDoneRef.current = true;
            onTypingCompleteRef.current?.();
          }
        }
      }, 100);
    }, 400);
    return () => {
      clearTimeout(t0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showTypewriter, email]);

  const emailClickToAdvance = Boolean(onEmailFieldClick) && !showTypewriter && value === "";
  const emailAdvanceOnce = useRef(false);
  const inputBorderClass = emailClickToAdvance
    ? "border-[#dadce0] ring-0 hover:border-[#1a73e8]/50"
    : "border-[#1a73e8] ring-1 ring-[#1a73e8]/25";
  const emailFieldBoxClass = `${inputBorderClass} ${
    emailRowEmphasisPressed ? "scale-[0.99] shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]" : ""
  }`;

  const handleEmailAreaClick = () => {
    if (!emailClickToAdvance || emailAdvanceOnce.current) return;
    emailAdvanceOnce.current = true;
    onEmailFieldClick?.();
  };

  const nextInteractive = !nextDisabled && !nextPressed;
  const nextClass = nextPressed
    ? "scale-[0.96] bg-[#1558b0] shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]"
    : nextDisabled
      ? "cursor-not-allowed bg-[#dadce0] text-[#80868b] hover:bg-[#dadce0]"
      : "bg-[#1a73e8] hover:bg-[#1765cc]";

  return (
    <div
      className="w-full max-w-[400px] rounded-2xl border border-[#dadce0] bg-white px-8 py-7 shadow-sm [font-family:var(--font-roboto),var(--font-noto-kr),Helvetica,Arial,sans-serif]"
    >
      <div className="mb-4 flex items-center gap-3">
        {G_LOGO}
        <span className="text-base font-normal text-[#5f6368]">Goggle 계정으로 로그인</span>
      </div>
      <h1 className="mb-1 text-2xl font-normal tracking-tight text-[#202124]">
        로그인
      </h1>
      <a href="#" className="mb-4 inline-block text-sm text-[#1a73e8] hover:underline" onClick={(e) => e.preventDefault()}>
        client.example.com(으)로 이동
      </a>
      <div className="mb-4">
        {emailClickToAdvance ? (
          <button
            type="button"
            className="w-full cursor-pointer rounded-lg text-left"
            onClick={handleEmailAreaClick}
            aria-label="이메일 입력란 — 클릭하여 다음 단계로"
            {...SIM_PRI}
          >
            <span className="mb-1 block text-xs font-medium text-[#5f6368]">이메일 또는 휴대전화</span>
            <div
              className={`min-h-[42px] w-full rounded border bg-white px-3 py-2 text-left text-sm ${emailFieldBoxClass}`}
            >
              <span className="text-[#80868b]">클릭하여 입력</span>
            </div>
          </button>
        ) : (
          <>
            <label className="mb-1 block text-xs font-medium text-[#5f6368]">이메일 또는 휴대전화</label>
            <div
              className={`min-h-[42px] w-full rounded border bg-white px-3 py-2 font-mono text-sm text-[#202124] ${emailRowEmphasisPressed ? `${inputBorderClass} scale-[0.99] shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]` : inputBorderClass}`}
            >
              {value}
            </div>
          </>
        )}
        <a href="#" className="mt-1.5 inline-block text-sm text-[#1a73e8] hover:underline" onClick={(e) => e.preventDefault()}>
          이메일을 잊으셨나요?
        </a>
      </div>
      <div className="flex items-center justify-between">
        <a href="#" className="text-sm text-[#1a73e8] hover:underline" onClick={(e) => e.preventDefault()}>
          계정 만들기
        </a>
        <button
          type="button"
          disabled={nextDisabled || (nextPressed && !interactiveNextWhenPressed)}
          onClick={() => onNextClick()}
          className={`rounded-md px-5 py-2 text-sm font-medium transition-all duration-200 ${nextPressed ? "text-white" : nextDisabled ? "" : "text-white"} ${nextClass}`}
          {...(!(nextDisabled || (nextPressed && !interactiveNextWhenPressed)) ? SIM_PRI : {})}
        >
          다음
        </button>
      </div>
    </div>
  );
}

/** Goggle 로그인: 이메일 타이핑 완료 후 잠시 뒤 「다음」이 선택된 상태로 표시. 클릭 또는 재클릭으로 다음 단계 */
function LoginTypeNextAutoEndView({ onAdvance }: { onAdvance: () => void }) {
  const [typingComplete, setTypingComplete] = useState(false);
  const [nextPressed, setNextPressed] = useState(false);

  useEffect(() => {
    if (!typingComplete || nextPressed) return;
    const t = setTimeout(() => setNextPressed(true), 480);
    return () => clearTimeout(t);
  }, [typingComplete, nextPressed]);

  const onNextClick = useCallback(() => {
    if (!nextPressed) setNextPressed(true);
    else onAdvance();
  }, [nextPressed, onAdvance]);

  return (
    <div className={GOGGLE_LOGIN_PAGE_WRAP}>
      <LoginCard
        email=""
        showTypewriter
        nextPressed={nextPressed}
        nextDisabled={!typingComplete}
        interactiveNextWhenPressed
        onTypingComplete={() => setTypingComplete(true)}
        onNextClick={onNextClick}
        variant="full"
      />
    </div>
  );
}

/** 동의: 로그인 카드에서 「다음」 해제 → 로딩 → 동의 화면 → 「허용」 선택 표시. 허용을 다시 누르면 다음 단계 */
function ConsentTransitionView({ onAdvance }: { onAdvance: () => void }) {
  type Phase = "next-pressed" | "next-released" | "loading" | "consent";
  const [phase, setPhase] = useState<Phase>("next-pressed");
  const [consentAllowPressed, setConsentAllowPressed] = useState(false);

  useEffect(() => {
    if (phase !== "next-pressed") return;
    const id = window.setTimeout(() => setPhase("next-released"), 120);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "next-released") return;
    const id = window.setTimeout(() => setPhase("loading"), 400);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "loading") return;
    const id = window.setTimeout(() => setPhase("consent"), 800);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "consent") {
      setConsentAllowPressed(false);
      return;
    }
    const t = window.setTimeout(() => setConsentAllowPressed(true), 720);
    return () => clearTimeout(t);
  }, [phase]);

  const onConsentLoginNextClick = useCallback(() => {
    setPhase((p) => {
      if (p === "next-pressed") return "next-released";
      if (p === "next-released") return "loading";
      return p;
    });
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto bg-[#f0f2f5]">
      {phase === "next-pressed" || phase === "next-released" ? (
        <div className={GOGGLE_LOGIN_PAGE_WRAP}>
          <LoginCard
            email="user@example.com"
            showTypewriter={false}
            nextPressed={phase === "next-pressed"}
            nextDisabled={false}
            interactiveNextWhenPressed
            onNextClick={onConsentLoginNextClick}
            variant="full"
          />
        </div>
      ) : phase === "loading" ? (
        <div className={`${GOGGLE_LOGIN_PAGE_WRAP} bg-white`}>
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
          <p className="text-sm font-normal text-[#5f6368]">권한 확인 화면으로 이동 중…</p>
        </div>
      ) : (
        <div className={`${GOGGLE_LOGIN_PAGE_WRAP} py-4`}>
          <ConsentCompact
            allowPressed={consentAllowPressed}
            onAllow={() => {}}
            onAllowPressedAgain={onAdvance}
          />
        </div>
      )}
    </div>
  );
}

/** 허용 클릭 시 짧은 딜레이 후 onAllow. 외부에서 이미 선택된 상태면 재클릭 시 onAllowPressedAgain */
function ConsentCompact({
  onAllow,
  allowPressed: allowPressedProp,
  onAllowPressedAgain,
}: {
  onAllow: () => void;
  /** 외부에서 선택된 상태로 표시(전환 단계용) */
  allowPressed?: boolean;
  /** 이미 선택된 상태에서 재클릭 시 다음 단계 */
  onAllowPressedAgain?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const allowPressed = allowPressedProp ?? pressed;
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
  }, []);

  const handleAllow = () => {
    if (allowPressedProp && onAllowPressedAgain) {
      onAllowPressedAgain();
      return;
    }
    if (allowPressed) return;
    setPressed(true);
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      onAllow();
    }, 280);
  };

  return (
    <div
      className="w-full max-w-[380px] rounded-xl border border-[#dadce0] bg-white px-5 py-4 shadow-sm [font-family:var(--font-roboto),var(--font-noto-kr),Helvetica,Arial,sans-serif]"
      style={{ color: "#202124" }}
    >
      <div className="mb-3 flex items-center gap-2">
        {G_LOGO}
        <div className="min-w-0 leading-tight">
          <div className="text-[11px] text-[#5f6368]">Goggle 계정</div>
          <div className="truncate text-sm font-medium">user@example.com</div>
        </div>
      </div>
      <h2 className="mb-2 text-base font-normal leading-snug">DemoApp이 다음에 액세스하려 합니다</h2>
      <p className="mb-3 text-xs text-[#5f6368]">허용 시 아래 정보를 DemoApp에서 사용할 수 있습니다.</p>
      <ul className="mb-4 space-y-2">
        <li className="flex items-center gap-2 rounded-lg border border-[#e8eaed] bg-[#f8f9fa] px-3 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-xs">👤</span>
          <div className="min-w-0 text-xs">
            <span className="font-medium text-[#202124]">프로필</span>
            <span className="text-[#5f6368]"> (이름, 사진 profile)</span>
          </div>
        </li>
        <li className="flex items-center gap-2 rounded-lg border border-[#e8eaed] bg-[#f8f9fa] px-3 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-xs">✉</span>
          <div className="min-w-0 text-xs">
            <span className="font-medium text-[#202124]">이메일</span>
            <span className="text-[#5f6368]"> (주소 email)</span>
          </div>
        </li>
      </ul>
      <div className="flex justify-end gap-2 border-t border-[#e8eaed] pt-3">
        <button type="button" className="rounded-md px-3 py-1.5 text-sm font-medium text-[#1a73e8] hover:bg-[#e8f0fe]">
          취소
        </button>
        <button
          type="button"
          onClick={handleAllow}
          disabled={allowPressed && !(allowPressedProp && onAllowPressedAgain)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium text-white transition-all duration-200 ${
            allowPressed
              ? "scale-[0.96] cursor-default bg-[#1558b0] shadow-[inset_0_2px_6px_rgba(0,0,0,0.2)]"
              : "bg-[#1a73e8] hover:bg-[#1765cc]"
          }`}
          {...(!(allowPressed && !(allowPressedProp && onAllowPressedAgain)) ? SIM_PRI : {})}
        >
          허용
        </button>
      </div>
    </div>
  );
}

/** 콜백 전환: 동의 화면에서 허용 해제 → 로딩 → 콜백 URL 화면 */
function CallbackTransitionView({ onAdvance }: { onAdvance: () => void }) {
  type Phase = "allow-pressed" | "allow-released" | "loading" | "callback";
  const [phase, setPhase] = useState<Phase>("allow-pressed");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("allow-released"), 120);
    const t2 = setTimeout(() => setPhase("loading"), 500);
    const t3 = setTimeout(() => setPhase("callback"), 1300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto bg-[#f0f2f5]">
      {phase === "allow-pressed" || phase === "allow-released" ? (
        <div className={`${GOGGLE_LOGIN_PAGE_WRAP} py-4`}>
          <ConsentCompact onAllow={() => {}} allowPressed={phase === "allow-pressed"} />
        </div>
      ) : phase === "loading" ? (
        <div className={`${GOGGLE_LOGIN_PAGE_WRAP} bg-white`}>
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
          <p className="text-sm font-normal text-[#5f6368]">DemoApp으로 이동하는 중…</p>
        </div>
      ) : (
        <BackendCommunicationView
          caption="인가 서버에서 액세스 토큰을 받아오는 중…"
          onAdvance={onAdvance}
        />
      )}
    </div>
  );
}

/** 8단계: 로그인 완료 후 마이페이지(대시보드형). 로그아웃 시 onRestart로 1단계로 */
function ClientAppView({
  onAdvance,
  hideAdvance,
  onRestart,
}: {
  onAdvance: () => void;
  hideAdvance?: boolean;
  onRestart?: () => void;
}) {
  const rowBtn =
    "flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-3 text-left text-sm text-[#202124] transition-colors hover:border-[#e8eaed] hover:bg-[#f8f9fa]";
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f1f3f4] [font-family:var(--font-roboto),var(--font-noto-kr),Helvetica,Arial,sans-serif]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#dadce0] bg-white px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="text-lg font-medium tracking-tight text-[#202124]">DemoApp</span>
          <span className="hidden text-xs text-[#80868b] sm:inline">마이페이지</span>
        </div>
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="shrink-0 rounded-lg border border-[#dadce0] bg-white px-3.5 py-2 text-sm font-medium text-[#5f6368] hover:bg-[#f8f9fa]"
            {...(hideAdvance ? SIM_PRI : SIM_ACT)}
          >
            로그아웃
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto max-w-lg">
          <h1 className="text-[22px] font-medium tracking-tight text-[#202124]">내 계정</h1>
          <p className="mt-1 text-sm text-[#5f6368]">프로필과 보안 설정을 한곳에서 관리합니다.</p>

          <section className="mt-6 overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
            <div className="border-b border-[#f1f3f4] bg-[#fafafa] px-4 py-2.5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#80868b]">
                기본 정보
              </h2>
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="mx-auto flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d2e3fc] to-[#aecbfa] text-2xl font-semibold text-[#1967d2] shadow-inner ring-2 ring-white sm:mx-0">
                  A
                </div>
                <div className="min-w-0 flex-1 space-y-0">
                  <div className="flex flex-col gap-1 border-b border-[#f1f3f4] py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="text-xs font-medium text-[#80868b]">이름</span>
                    <span className="text-sm font-medium text-[#202124] sm:text-right">Alice</span>
                  </div>
                  <div className="flex flex-col gap-1 border-b border-[#f1f3f4] py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="text-xs font-medium text-[#80868b]">이메일</span>
                    <span className="break-all text-sm text-[#202124] sm:text-right">
                      user@example.com
                    </span>
                  </div>
                  <div className="pt-3">
                    <p className="rounded-lg bg-[#e8f0fe]/60 px-3 py-2.5 text-xs leading-relaxed text-[#5f6368]">
                      <span className="font-medium text-[#1967d2]">OAuth</span> 로그인 시 동의한 프로필, 이메일을
                      DemoApp이 표시합니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-3 text-sm font-medium text-[#1a73e8] hover:underline"
                    onClick={(e) => e.preventDefault()}
                  >
                    프로필 수정
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
            <div className="border-b border-[#f1f3f4] bg-[#fafafa] px-4 py-2.5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#80868b]">
                계정 / 보안
              </h2>
            </div>
            <div className="divide-y divide-[#f1f3f4] px-1 py-1">
              <button type="button" className={rowBtn} onClick={(e) => e.preventDefault()}>
                <span>비밀번호 변경</span>
                <span className="text-[#80868b]">›</span>
              </button>
              <button type="button" className={rowBtn} onClick={(e) => e.preventDefault()}>
                <span>2단계 인증</span>
                <span className="text-xs text-[#80868b]">설정 안 됨 (데모)</span>
              </button>
            </div>
          </section>

          <section className="mt-4 overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
            <div className="border-b border-[#f1f3f4] bg-[#fafafa] px-4 py-2.5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#80868b]">
                연동된 계정
              </h2>
            </div>
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow ring-1 ring-[#e8eaed]">
                {goggleGSmall()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#202124]">Goggle</p>
                <p className="text-xs text-[#5f6368]">로그인에 사용 중</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#e6f4ea] px-2.5 py-0.5 text-[11px] font-medium text-[#137333]">
                연동됨
              </span>
            </div>
            <div className="border-t border-[#f1f3f4] px-1 py-1">
              <button type="button" className={rowBtn} onClick={(e) => e.preventDefault()}>
                <span>연동 서비스 관리</span>
                <span className="text-[#80868b]">›</span>
              </button>
            </div>
          </section>

          {!hideAdvance && (
            <div className="mt-8 flex justify-center pb-4">
              <button type="button" onClick={onAdvance} className={SIM_ADVANCE_BTN} {...SIM_PRI}>
                다음 단계로
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** 토큰 교환, userinfo 등: 다이어그램 없이 진행 상태 문구만 */
function BackendCommunicationView({ caption, onAdvance }: { caption: string; onAdvance: () => void }) {
  return (
    <FullHeightDemo>
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-8">
        <div
          className="h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent"
          aria-hidden
        />
        <p className="max-w-[min(100%,20rem)] text-center text-sm font-medium leading-snug text-[#202124]">
          {caption}
        </p>
        <button type="button" onClick={onAdvance} className={SIM_ADVANCE_BTN} {...SIM_PRI}>
          다음 단계로
        </button>
      </div>
    </FullHeightDemo>
  );
}

function FullHeightDemo({ children }: { children: ReactNode }) {
  return <div className="flex h-full min-h-0 flex-col bg-white [font-family:var(--font-roboto),var(--font-noto-kr),Helvetica,Arial,sans-serif]">{children}</div>;
}

/** Implicit 콜백: 진행 상태만 표시 — 상세는 주소창, 개발자 도구 */
function CallbackImplicitView({ caption, onAdvance }: { caption: string; onAdvance: () => void }) {
  return (
    <FullHeightDemo>
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-8">
        <div
          className="h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent"
          aria-hidden
        />
        <p className="max-w-[min(100%,20rem)] text-center text-sm font-medium leading-snug text-[#202124]">
          {caption}
        </p>
        <button type="button" onClick={onAdvance} className={SIM_ADVANCE_BTN} {...SIM_PRI}>
          다음 단계로
        </button>
      </div>
    </FullHeightDemo>
  );
}


function HiddenSuccessView({
  onAdvance,
  hideAdvance,
}: {
  onAdvance: () => void;
  hideAdvance?: boolean;
}) {
  const [checkDrawn, setCheckDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setCheckDrawn(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <FullHeightDemo>
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
        <div
          className={`oauth-check-circle ${checkDrawn ? "oauth-check-circle--drawn" : ""}`}
          aria-hidden
        >
          <span className="oauth-check-icon" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-[#202124]">로그인 완료</p>
          <p className="mt-1 text-sm text-[#5f6368]">user@example.com</p>
        </div>
        <p className="max-w-xs text-center text-xs text-[#5f6368]">DemoApp에 오신 것을 환영합니다.</p>
        {!hideAdvance && (
          <button type="button" onClick={onAdvance} className={SIM_ADVANCE_BTN} {...SIM_PRI}>
            다음 단계로
          </button>
        )}
      </div>
    </FullHeightDemo>
  );
}

/** 7단계 진입: 로딩 → 로그인 완료 화면 */
function SuccessTransitionView({
  onAdvance,
  hideAdvance,
}: {
  onAdvance: () => void;
  hideAdvance?: boolean;
}) {
  const [phase, setPhase] = useState<"loading" | "success">("loading");
  useEffect(() => {
    const t = setTimeout(() => setPhase("success"), 600);
    return () => clearTimeout(t);
  }, []);
  if (phase === "loading") {
    return (
      <FullHeightDemo>
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
          <p className="max-w-[min(100%,20rem)] text-center text-sm font-medium leading-snug text-[#202124]">
            로그인을 마무리하고 프로필을 불러오는 중…
          </p>
        </div>
      </FullHeightDemo>
    );
  }
  return <HiddenSuccessView onAdvance={onAdvance} hideAdvance={hideAdvance} />;
}

function HiddenProfileView({
  browserUrl,
  onAdvance,
  hideAdvance,
}: {
  browserUrl: string;
  onAdvance: () => void;
  hideAdvance?: boolean;
}) {
  return (
    <FullHeightDemo>
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 bg-[#fafafa] px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#5f6368]">창에 보이는 주소</p>
          <p className="truncate font-mono text-[10px] text-[#202124]">{browserUrl}</p>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f0fe] text-2xl font-medium text-[#1a73e8]">
            A
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-[#202124]">Alice</p>
            <p className="text-sm text-[#5f6368]">user@example.com</p>
          </div>
          {!hideAdvance && (
            <button type="button" onClick={onAdvance} className={SIM_ADVANCE_BTN} {...SIM_PRI}>
              다음 단계로
            </button>
          )}
        </div>
      </div>
    </FullHeightDemo>
  );
}

function HiddenGenericView({ step }: { step: FlowStep }) {
  return (
    <FullHeightDemo>
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 bg-[#fafafa] px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#5f6368]">창에 보이는 주소</p>
          <p className="truncate font-mono text-[10px] text-[#202124]">{step.browserUrl}</p>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
          <p className="text-sm font-medium text-[#334155]">브라우저 밖 통신</p>
        </div>
      </div>
    </FullHeightDemo>
  );
}

function SimulatorStepBody({
  mode,
  step,
  flowId,
  tokenExchange,
  onAdvance,
  isLastStep,
  onRestart,
  setBarUrlStable,
}: {
  mode: SimMode;
  step: FlowStep;
  flowId: string;
  tokenExchange: "client_secret" | "pkce_verifier";
  onAdvance: () => void;
  isLastStep: boolean;
  onRestart?: () => void;
  setBarUrlStable: (u: string) => void;
}) {
  const onMisclick = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement | null;
    if (!t) return;
    if (t.closest("[data-sim-action]")) return;
    const primary = findVisiblePrimary(e.currentTarget);
    if (!primary) return;
    primary.classList.remove("sim-nudge-pulse");
    void primary.offsetWidth;
    primary.classList.add("sim-nudge-pulse");
    window.setTimeout(() => primary.classList.remove("sim-nudge-pulse"), 1500);
  }, []);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col" onPointerDownCapture={onMisclick}>
      {mode === "mypage-guest" && <HomeStepIdleThenPressView onAdvance={onAdvance} />}

      {mode === "client-login-sequence" && (
        <ClientLoginPageSequenceView flowId={flowId} setBarUrl={setBarUrlStable} onAdvance={onAdvance} />
      )}

      {mode === "client-landing" && <LandingPressed onAdvance={onAdvance} />}

      {mode === "auth-transition" && (
        <AuthTransitionView authUrl={step.browserUrl} setBarUrl={setBarUrlStable} onAdvance={onAdvance} />
      )}

      {mode === "login-type-next" && <LoginTypeNextAutoEndView onAdvance={onAdvance} />}

      {mode === "consent-transition" && <ConsentTransitionView onAdvance={onAdvance} />}

      {mode === "consent-only" && (
        <div
          className="flex h-full min-h-0 flex-col items-center justify-center overflow-auto px-3 py-3"
          style={{ background: "#f0f2f5" }}
        >
          <ConsentCompact onAllow={onAdvance} />
        </div>
      )}

      {mode === "callback-transition" && <CallbackTransitionView onAdvance={onAdvance} />}

      {mode === "client-app" && (
        <ClientAppView
          onAdvance={onAdvance}
          hideAdvance={isLastStep}
          onRestart={isLastStep ? onRestart : undefined}
        />
      )}

      {mode === "callback-code" && (
        <BackendCommunicationView
          caption="인가 서버에서 액세스 토큰을 받아오는 중…"
          onAdvance={onAdvance}
        />
      )}

      {mode === "callback-implicit" && (
        <CallbackImplicitView
          caption={
            step.id === "im-6"
              ? "주소(#)에서 토큰을 읽어 앱에 반영하는 중…"
              : "콜백 페이지를 여는 중…"
          }
          onAdvance={onAdvance}
        />
      )}

      {mode === "hidden-token-transition" && (
        <BackendCommunicationView
          caption="리소스 서버에서 사용자 프로필을 가져오는 중…"
          onAdvance={onAdvance}
        />
      )}

      {mode === "hidden-success-transition" && (
        <SuccessTransitionView onAdvance={onAdvance} hideAdvance={isLastStep} />
      )}

      {mode === "hidden-profile" && (
        <HiddenProfileView
          browserUrl={step.browserUrl}
          onAdvance={onAdvance}
          hideAdvance={isLastStep}
        />
      )}

      {mode === "hidden-generic" && <HiddenGenericView step={step} />}
    </div>
  );
}

const ACTOR_LABELS: Record<string, string> = {
  owner: "리소스 소유자",
  client: "클라이언트",
  authorization: "인가 서버",
  resource: "리소스 서버",
};

export function BrowserSimulator({
  step,
  onAdvance,
  onStepBack,
  isLastStep = false,
  onRestart,
  tokenExchangeMode,
  flowId,
}: {
  step: FlowStep;
  onAdvance: () => void;
  /** 전체화면 확장 시 플로팅 카드의 「이전」— 미전달 시 해당 버튼 숨김 */
  onStepBack?: () => void;
  isLastStep?: boolean;
  onRestart?: () => void;
  tokenExchangeMode: FlowTokenExchangeMode;
  flowId: string;
}) {
  const tokenExchange: "client_secret" | "pkce_verifier" =
    tokenExchangeMode === "pkce_verifier" ? "pkce_verifier" : "client_secret";
  const [barUrl, setBarUrl] = useState(step.browserUrl);
  const [viewportExpanded, setViewportExpanded] = useState(false);
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);
  const [devtoolsDock, setDevtoolsDock] = useState<DevtoolsDock>(() => readDevtoolsDock(false));
  const devtoolsSplitColRef = useRef<HTMLDivElement>(null);
  /** 개발자 도구가 차지하는 세로 flex 비중 (나머지는 페이지 영역). 하단 도킹 시 픽셀 추적으로 구분선이 커서를 따름 */
  const devtoolsResize = usePanelResize({
    axis: "y",
    initial: 36,
    /** 하단 도킹: 개발자 도구 세로 비중(%) — 더 얇게, 더 크게 조절 가능 */
    min: 8,
    max: 85,
    storageKey: "oauth-lab-browser-devtools-split",
    pixelTrack:
      devtoolsOpen && devtoolsDock === "bottom"
        ? {
            kind: "flexShare",
            getContainerRect: () =>
              devtoolsSplitColRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 1, 400),
            panel: "trailing",
          }
        : undefined,
  });
  /** 좌, 우: 구분선 기준 leading=왼쪽 DevTools, trailing=오른쪽 DevTools — 픽셀 비율로 부호 혼동 제거 */
  const devtoolsSidePixel =
    devtoolsOpen && devtoolsDock === "left"
      ? ({
          kind: "flexShare" as const,
          getContainerRect: () =>
            devtoolsSplitColRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 400, 1),
          panel: "leading" as const,
        })
      : devtoolsOpen && devtoolsDock === "right"
        ? ({
            kind: "flexShare" as const,
            getContainerRect: () =>
              devtoolsSplitColRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 400, 1),
            panel: "trailing" as const,
          })
        : undefined;

  const devtoolsSideResize = usePanelResize({
    axis: "x",
    initial: 34,
    /** 좌, 우 도킹: 개발자 도구 가로 비중(%) — 양쪽 여유를 넓힘 */
    min: 12,
    max: 72,
    storageKey: "oauth-lab-devtools-side-split",
    pixelTrack: devtoolsSidePixel,
  });
  /** 전체화면 시 플로팅 단계 카드 이동(px). 기준: left, bottom 고정 + translate */
  const [expandedFloatOffset, setExpandedFloatOffset] = useState({ x: 0, y: 0 });
  const expandedFloatPanelRef = useRef<HTMLDivElement>(null);
  const expandedFloatDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const mode = modeForStep(step);

  const expandedStepHint = useMemo(() => {
    const flow = flowById[flowId];
    if (!flow) return null;
    const idx = flow.steps.findIndex((s) => s.id === step.id);
    if (idx < 0) return null;
    const directionLabel = `${ACTOR_LABELS[step.from] ?? step.from} → ${ACTOR_LABELS[step.to] ?? step.to}`;
    return {
      index: idx + 1,
      total: flow.steps.length,
      title: step.title,
      summary: step.summary,
      directionLabel,
      isFirst: idx === 0,
    };
  }, [flowId, step.from, step.id, step.summary, step.title, step.to]);

  /** 확장, 축소 전환 시 해당 모드에 저장된 도킹(기본: 확장=오른쪽, 축소=아래)으로 복원 */
  useEffect(() => {
    setDevtoolsDock(readDevtoolsDock(viewportExpanded));
  }, [viewportExpanded]);

  useEffect(() => {
    const idx = labStepIndex(step.id);
    // 1: 클라이언트 로그인 시퀀스가 주소창 제어 / 2: AuthTransitionView가 /login → 인가 URL로 제어
    if (idx === 1 || idx === 2) return;
    setBarUrl(step.browserUrl);
  }, [step.id, step.browserUrl]);

  const setBarUrlStable = useCallback((u: string) => {
    setBarUrl(u);
  }, []);

  const safeAdvance = useCallback(() => {
    onAdvance();
  }, [onAdvance]);

  useEffect(() => {
    if (!viewportExpanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewportExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [viewportExpanded]);

  useEffect(() => {
    if (viewportExpanded) setExpandedFloatOffset({ x: 0, y: 0 });
  }, [viewportExpanded]);

  const clampExpandedFloatToViewport = useCallback(() => {
    const el = expandedFloatPanelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 8;
    setExpandedFloatOffset((prev) => {
      let x = prev.x;
      let y = prev.y;
      let left = r.left;
      let right = r.right;
      let top = r.top;
      let bottom = r.bottom;
      if (left < pad) {
        x += pad - left;
      }
      if (right > window.innerWidth - pad) {
        x += window.innerWidth - pad - right;
      }
      if (top < pad) {
        y += pad - top;
      }
      if (bottom > window.innerHeight - pad) {
        y += window.innerHeight - pad - bottom;
      }
      return { x, y };
    });
  }, []);

  useEffect(() => {
    if (!viewportExpanded) return;
    const onResize = () => clampExpandedFloatToViewport();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [viewportExpanded, clampExpandedFloatToViewport]);

  const onExpandedFloatPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    expandedFloatDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: expandedFloatOffset.x,
      origY: expandedFloatOffset.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [expandedFloatOffset.x, expandedFloatOffset.y]);

  const onExpandedFloatPointerMove = useCallback((e: React.PointerEvent) => {
    const d = expandedFloatDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    setExpandedFloatOffset({
      x: d.origX + (e.clientX - d.startX),
      y: d.origY + (e.clientY - d.startY),
    });
  }, []);

  const onExpandedFloatPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = expandedFloatDragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      expandedFloatDragRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      requestAnimationFrame(() => clampExpandedFloatToViewport());
    },
    [clampExpandedFloatToViewport],
  );

  const shellClass =
    "flex min-h-0 flex-col overflow-hidden bg-[#0b1220] " +
    (viewportExpanded
      ? "fixed inset-0 z-[300] h-[100dvh] w-full rounded-none border-0 shadow-none"
      : "h-full rounded-xl border border-slate-700 shadow-lg");

  const simulatorInner = (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-700/80 bg-[#0a1222] px-3 py-2">
        <div className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <div className="group/urlbar relative min-w-0 flex-1 cursor-default">
          <div className="truncate rounded-md bg-slate-900/90 px-2 py-1 font-mono text-[10px] text-slate-300">
            <SimulatorAddressBar url={barUrl} flowId={flowId} />
          </div>
          <div
            className="pointer-events-none invisible absolute left-0 right-0 top-[calc(100%+6px)] z-[280] max-h-[min(72vh,440px)] w-[min(calc(100vw-24px),520px)] max-w-[520px] overflow-y-auto rounded-lg border border-slate-600/90 bg-slate-950/[0.98] p-3 opacity-0 shadow-2xl ring-1 ring-cyan-500/20 transition-opacity duration-150 sm:left-0 sm:right-auto sm:w-[min(520px,calc(100vw-48px))] group-hover/urlbar:pointer-events-auto group-hover/urlbar:visible group-hover/urlbar:opacity-100"
            role="tooltip"
          >
            <p className="mb-2 font-sans text-[9px] font-medium tracking-wide text-slate-400">
              URL 구조 (값 URL 디코딩 - # 뒤는 파라미터 설명)
            </p>
            <AuthUrlBreakdownContent url={barUrl} />
          </div>
        </div>
        {viewportExpanded ? (
          <button
            type="button"
            onClick={() => setViewportExpanded(false)}
            className="shrink-0 rounded-md border border-amber-500/50 bg-amber-950/40 px-2.5 py-1 text-[10px] font-medium text-amber-100 hover:bg-amber-900/50"
            title="전체화면 종료 (Esc)"
          >
            축소
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setViewportExpanded(true)}
            className="shrink-0 rounded-md border border-slate-600 px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:border-slate-500 hover:bg-slate-800/80 hover:text-white"
            title="브라우저 영역만 전체화면"
          >
            확장
          </button>
        )}
        <button
          type="button"
          onClick={() => setDevtoolsOpen((o) => !o)}
          className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors ${
            devtoolsOpen
              ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-200"
              : "border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300"
          }`}
        >
          개발자 도구
        </button>
      </div>

      <div
        ref={devtoolsSplitColRef}
        className={`flex min-h-0 min-w-0 flex-1 overflow-hidden ${
          devtoolsOpen && devtoolsDock !== "bottom" ? "flex-row" : "flex-col"
        }`}
      >
        {!devtoolsOpen ? (
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden" style={{ flex: "1 1 auto", minHeight: 0 }}>
            <SimulatorStepBody
              mode={mode}
              step={step}
              flowId={flowId}
              tokenExchange={tokenExchange}
              onAdvance={safeAdvance}
              isLastStep={isLastStep}
              onRestart={onRestart}
              setBarUrlStable={setBarUrlStable}
            />
          </div>
        ) : devtoolsDock === "left" ? (
          <>
            <div
              className="flex min-h-0 min-w-0 flex-col overflow-hidden"
              style={{ flex: `${devtoolsSideResize.value} 1 0`, minWidth: 140 }}
            >
              <BrowserApplicationDevtools
                flowId={flowId}
                stepId={step.id}
                devtoolsDock={devtoolsDock}
                onDevtoolsDockChange={setDevtoolsDock}
                viewportExpanded={viewportExpanded}
              />
            </div>
            <PanelDivider
              direction="vertical"
              isDragging={devtoolsSideResize.isDragging}
              title="개발자 도구 / 페이지 너비 조절"
              {...devtoolsSideResize.handleProps}
              className="border-[#334155] bg-[#0f172a]/90"
            />
            <div
              className="min-h-0 min-w-0 flex-1 overflow-hidden"
              style={{ flex: `${100 - devtoolsSideResize.value} 1 0`, minHeight: 56 }}
            >
              <SimulatorStepBody
                mode={mode}
                step={step}
                flowId={flowId}
                tokenExchange={tokenExchange}
                onAdvance={safeAdvance}
                isLastStep={isLastStep}
                onRestart={onRestart}
                setBarUrlStable={setBarUrlStable}
              />
            </div>
          </>
        ) : devtoolsDock === "right" ? (
          <>
            <div
              className="min-h-0 min-w-0 flex-1 overflow-hidden"
              style={{ flex: `${100 - devtoolsSideResize.value} 1 0`, minHeight: 56 }}
            >
              <SimulatorStepBody
                mode={mode}
                step={step}
                flowId={flowId}
                tokenExchange={tokenExchange}
                onAdvance={safeAdvance}
                isLastStep={isLastStep}
                onRestart={onRestart}
                setBarUrlStable={setBarUrlStable}
              />
            </div>
            <PanelDivider
              direction="vertical"
              isDragging={devtoolsSideResize.isDragging}
              title="페이지 / 개발자 도구 너비 조절"
              {...devtoolsSideResize.handleProps}
              className="border-[#334155] bg-[#0f172a]/90"
            />
            <div
              className="flex min-h-0 min-w-0 flex-col overflow-hidden"
              style={{ flex: `${devtoolsSideResize.value} 1 0`, minWidth: 140 }}
            >
              <BrowserApplicationDevtools
                flowId={flowId}
                stepId={step.id}
                devtoolsDock={devtoolsDock}
                onDevtoolsDockChange={setDevtoolsDock}
                viewportExpanded={viewportExpanded}
              />
            </div>
          </>
        ) : (
          <>
            <div
              className="min-h-0 min-w-0 overflow-hidden"
              style={{ flex: `${100 - devtoolsResize.value} 1 0`, minHeight: 56 }}
            >
              <SimulatorStepBody
                mode={mode}
                step={step}
                flowId={flowId}
                tokenExchange={tokenExchange}
                onAdvance={safeAdvance}
                isLastStep={isLastStep}
                onRestart={onRestart}
                setBarUrlStable={setBarUrlStable}
              />
            </div>
            <PanelDivider
              direction="horizontal"
              isDragging={devtoolsResize.isDragging}
              title="브라우저 콘텐츠 / 개발자 도구 높이 조절"
              {...devtoolsResize.handleProps}
              className="border-[#334155] bg-[#0f172a]/90"
            />
            <div
              className="flex min-h-0 w-full flex-col overflow-hidden"
              style={{ flex: `${devtoolsResize.value} 1 0`, minHeight: 72 }}
            >
              <BrowserApplicationDevtools
                flowId={flowId}
                stepId={step.id}
                devtoolsDock={devtoolsDock}
                onDevtoolsDockChange={setDevtoolsDock}
                viewportExpanded={viewportExpanded}
              />
            </div>
          </>
        )}
      </div>
    </>
  );

  const expandedFloatingStep =
    viewportExpanded && expandedStepHint ? (
      <div
        ref={expandedFloatPanelRef}
        className="fixed left-4 z-[320] w-[min(calc(100vw-32px),360px)] max-w-[min(calc(100vw-32px),360px)] sm:left-5"
        style={{
          bottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
          transform: `translate(${expandedFloatOffset.x}px, ${expandedFloatOffset.y}px)`,
        }}
        role="region"
        aria-label={`현재 단계 ${expandedStepHint.index}번째, ${expandedStepHint.title}`}
      >
        <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-[#0a1222]/95 text-left shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-sm">
          <div
            role="button"
            tabIndex={0}
            aria-label="단계 패널 위치 — 드래그하여 이동"
            className="flex cursor-grab items-center gap-2 border-b border-slate-700/70 bg-slate-900/50 px-3 py-2 select-none active:cursor-grabbing touch-none"
            onPointerDown={onExpandedFloatPointerDown}
            onPointerMove={onExpandedFloatPointerMove}
            onPointerUp={onExpandedFloatPointerUp}
            onPointerCancel={onExpandedFloatPointerUp}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setExpandedFloatOffset((p) => ({ ...p, x: p.x - 8 }));
              if (e.key === "ArrowRight") setExpandedFloatOffset((p) => ({ ...p, x: p.x + 8 }));
              if (e.key === "ArrowUp") setExpandedFloatOffset((p) => ({ ...p, y: p.y - 8 }));
              if (e.key === "ArrowDown") setExpandedFloatOffset((p) => ({ ...p, y: p.y + 8 }));
            }}
          >
            <span className="text-[10px] font-bold tracking-tight text-slate-500" aria-hidden>
              ⠿
            </span>
            <span className="flex-1 text-right text-[10px] font-semibold text-cyan-400/90">
              다음 단계로
            </span>
          </div>
          <div className="px-4 py-3">
          <p className="text-xs font-medium text-cyan-400/90">
            단계 {expandedStepHint.index} / {expandedStepHint.total}
          </p>
          <h2 className="mb-1 mt-2 text-base font-semibold text-white">{expandedStepHint.title}</h2>
          <p className="mb-2 text-sm leading-snug text-slate-400">{expandedStepHint.summary}</p>
          <p className="mb-3 text-[11px] text-slate-500">{expandedStepHint.directionLabel}</p>
          {onStepBack != null ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onStepBack}
                disabled={expandedStepHint.isFirst}
                className="flex-1 rounded-lg border border-slate-600 py-2.5 text-sm font-medium text-slate-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-800/80"
              >
                이전
              </button>
              <button
                type="button"
                onClick={onAdvance}
                disabled={isLastStep}
                className="flex-1 rounded-lg bg-cyan-600/90 py-2.5 text-sm font-medium text-slate-950 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-cyan-500"
              >
                다음
              </button>
            </div>
          ) : null}
          </div>
        </div>
      </div>
    ) : null;

  const portalNode = (
    <>
      <div className={shellClass}>{simulatorInner}</div>
      {expandedFloatingStep}
    </>
  );

  if (viewportExpanded && typeof document !== "undefined") {
    return (
      <>
        <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600/80 bg-slate-950/50 px-4 text-center">
          <p className="text-xs leading-relaxed text-slate-400">
            브라우저 시뮬레이터가 전체 화면으로 열려 있습니다.
          </p>
          <button
            type="button"
            onClick={() => setViewportExpanded(false)}
            className="text-sm font-medium text-cyan-400 underline-offset-2 hover:underline"
          >
            전체화면에서 나가기
          </button>
        </div>
        {createPortal(portalNode, document.body)}
      </>
    );
  }

  return <div className={shellClass}>{simulatorInner}</div>;
}
