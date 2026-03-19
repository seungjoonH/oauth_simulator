export type FlowNode = "owner" | "client" | "authorization" | "resource";

export type SimulatorView = "client" | "authorization" | "hidden";

export type GogglePhase = "login" | "consent";

export type ClientSimulatorScreen = "landing" | "callback" | "app";

export interface ResourceServerRow {
  input: string;
  process: string;
  output: string;
}

export interface FlowStep {
  id: string;
  title: string;
  summary: string;
  purpose: string;
  from: FlowNode;
  to: FlowNode;
  requestBlock: string;
  responseBlock: string;
  internalActions: string[];
  browserUrl: string;
  simulatorView: SimulatorView;
  gogglePhase?: GogglePhase;
  clientScreen?: ClientSimulatorScreen;
  callbackVariant?: "code" | "implicit";
  resourceServerTable?: ResourceServerRow[];
}

/** 가시적 구분용: Client 역할, 토큰 획득 방식 */
export type FlowTokenExchangeMode = "client_secret" | "pkce_verifier" | "implicit_fragment";

export interface FlowUiProfile {
  /** 예: Client 서버 / SPA, 공개 클라 */
  clientBadge: string;
  clientSubtext: string;
  /** 예: client_secret / code_verifier / fragment */
  tokenBadge: string;
  tokenSubtext: string;
  tokenExchangeMode: FlowTokenExchangeMode;
  /** 흐름도 Client 박스 라벨 (1~2줄) */
  clientDiagramLines: string[];
}

export interface OAuthFlowDefinition {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  /** 브라우저, 다이어그램에서 Code / PKCE / Implicit 구분 */
  ui: FlowUiProfile;
  steps: FlowStep[];
}
