/**
 * The postMessage contract between the /embed child page and a parent
 * landing page. Shared by app/embed, public/embed.js's source, and any
 * analytics forwarding so both sides always agree on message shape.
 */

export const EMBED_NAMESPACE = "garageexperts-estimator";
export const EMBED_PROTOCOL_VERSION = 1;

export type ChildToParentType =
  | "ready"
  | "resize"
  | "progress"
  | "lead"
  | "selection"
  | "call_click"
  | "complete"
  | "error";

export type ParentToChildType = "init" | "reset";

export interface EmbedEnvelope<TType extends string = string, TPayload = unknown> {
  namespace: typeof EMBED_NAMESPACE;
  version: typeof EMBED_PROTOCOL_VERSION;
  type: TType;
  event_id: string;
  payload: TPayload;
}

export interface ReadyPayload {
  version: number;
  route: string;
}
export interface ResizePayload {
  height: number;
}
export interface ProgressPayload {
  step: number;
  stepKey: string;
}
export interface LeadPayload {
  estimateId: string;
  analyticsEventId: string;
}
export interface SelectionPayload {
  estimateId: string;
  plan: string;
  analyticsEventId: string;
}
export interface CallClickPayload {
  estimateId: string;
  selectedPlan: string;
}
export interface CompletePayload {
  estimateId: string;
  completionType: "results_viewed" | "selection_made" | "all_options_requested";
}
export interface ErrorPayload {
  code: string;
}

export interface InitPayload {
  attribution?: Record<string, string | boolean>;
  parentOrigin?: string;
  prefilledAddress?: string;
}
export interface ResetPayload {
  confirm: boolean;
}

export function createEnvelope<TType extends string, TPayload>(
  type: TType,
  payload: TPayload,
): EmbedEnvelope<TType, TPayload> {
  return {
    namespace: EMBED_NAMESPACE,
    version: EMBED_PROTOCOL_VERSION,
    type,
    event_id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()),
    payload,
  };
}

export function isEmbedEnvelope(data: unknown): data is EmbedEnvelope {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;
  return (
    candidate.namespace === EMBED_NAMESPACE &&
    candidate.version === EMBED_PROTOCOL_VERSION &&
    typeof candidate.type === "string"
  );
}

export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.includes(origin);
}
