import { authorizationCodeFlow } from "./authorization-code";
import { implicitFlow } from "./implicit";
import { pkceFlow } from "./pkce";
import type { OAuthFlowDefinition } from "./types";

export const flows: OAuthFlowDefinition[] = [
  authorizationCodeFlow,
  pkceFlow,
  implicitFlow,
];

export const flowById = Object.fromEntries(flows.map((f) => [f.id, f])) as Record<
  string,
  OAuthFlowDefinition
>;

export type { FlowStep, FlowNode, OAuthFlowDefinition } from "./types";
