import type { ConcreteCondition, PublicPricingResult, SelectedPlan, StemWall } from "@/lib/pricing/types";
import type { AddressInput } from "@/lib/validation/schemas";

export type StepId =
  | "intro"
  | "address"
  | "square_footage"
  | "concrete"
  | "steps"
  | "stem_wall"
  | "contact"
  | "results"
  | "confirmation";

export const PROJECT_QUESTION_STEPS: StepId[] = [
  "address",
  "square_footage",
  "concrete",
  "steps",
  "stem_wall",
];

export interface EstimatorAnswers {
  address: AddressInput | null;
  squareFeet: number | null;
  concreteCondition: ConcreteCondition | null;
  stepsPresent: boolean | null;
  stemWall: StemWall | null;
}

/**
 * Contact info is deliberately excluded from persisted state. It is
 * collected immediately before submission and sent straight to the server,
 * so it never needs to live in sessionStorage -- this keeps PII retention
 * in the browser to the minimum necessary.
 */
export interface EstimatorState {
  schemaVersion: number;
  currentStep: StepId;
  answers: EstimatorAnswers;
  formStartedAtMs: number | null;
  estimateId: string | null;
  estimateToken: string | null;
  publicResult: PublicPricingResult | null;
  selectedPlan: SelectedPlan | null;
}

export const STATE_SCHEMA_VERSION = 1;
export const STORAGE_KEY = "ge_estimator_flow_v1";

export const initialAnswers: EstimatorAnswers = {
  address: null,
  squareFeet: null,
  concreteCondition: null,
  stepsPresent: null,
  stemWall: null,
};

export const initialState: EstimatorState = {
  schemaVersion: STATE_SCHEMA_VERSION,
  currentStep: "intro",
  answers: initialAnswers,
  formStartedAtMs: null,
  estimateId: null,
  estimateToken: null,
  publicResult: null,
  selectedPlan: null,
};

export type EstimatorAction =
  | { type: "START" }
  | { type: "GO_TO_STEP"; step: StepId }
  | { type: "SET_ADDRESS"; address: AddressInput }
  | { type: "SET_SQUARE_FEET"; squareFeet: number }
  | { type: "SET_CONCRETE"; concreteCondition: ConcreteCondition }
  | { type: "SET_STEPS_PRESENT"; stepsPresent: boolean }
  | { type: "SET_STEM_WALL"; stemWall: StemWall }
  | { type: "SUBMIT_SUCCESS"; estimateId: string; estimateToken: string; publicResult: PublicPricingResult }
  | { type: "SELECTION_SUCCESS"; plan: SelectedPlan }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: EstimatorState };

const stepOrder: StepId[] = [
  "intro",
  "address",
  "square_footage",
  "concrete",
  "steps",
  "stem_wall",
  "contact",
  "results",
  "confirmation",
];

function nextStep(current: StepId): StepId {
  const index = stepOrder.indexOf(current);
  return stepOrder[Math.min(index + 1, stepOrder.length - 1)];
}

export function estimatorReducer(state: EstimatorState, action: EstimatorAction): EstimatorState {
  switch (action.type) {
    case "START":
      return {
        ...state,
        currentStep: "address",
        formStartedAtMs: state.formStartedAtMs ?? Date.now(),
      };
    case "GO_TO_STEP":
      return { ...state, currentStep: action.step };
    case "SET_ADDRESS":
      return {
        ...state,
        answers: { ...state.answers, address: action.address },
        currentStep: nextStep("address"),
      };
    case "SET_SQUARE_FEET":
      return {
        ...state,
        answers: { ...state.answers, squareFeet: action.squareFeet },
        currentStep: nextStep("square_footage"),
      };
    case "SET_CONCRETE":
      return {
        ...state,
        answers: { ...state.answers, concreteCondition: action.concreteCondition },
        currentStep: nextStep("concrete"),
      };
    case "SET_STEPS_PRESENT":
      return {
        ...state,
        answers: { ...state.answers, stepsPresent: action.stepsPresent },
        currentStep: nextStep("steps"),
      };
    case "SET_STEM_WALL":
      return {
        ...state,
        answers: { ...state.answers, stemWall: action.stemWall },
        currentStep: nextStep("stem_wall"),
      };
    case "SUBMIT_SUCCESS":
      return {
        ...state,
        estimateId: action.estimateId,
        estimateToken: action.estimateToken,
        publicResult: action.publicResult,
        currentStep: "results",
      };
    case "SELECTION_SUCCESS":
      return {
        ...state,
        selectedPlan: action.plan,
        currentStep: "confirmation",
      };
    case "RESET":
      return { ...initialState, formStartedAtMs: Date.now() };
    case "HYDRATE": {
      // Contact info is deliberately never persisted (see EstimatorState
      // doc comment), so a reload that lands on "results" or "confirmation"
      // would otherwise render nothing -- send it back to "contact" so the
      // estimate can be resubmitted instead of showing a blank page.
      if (action.state.currentStep === "results" || action.state.currentStep === "confirmation") {
        return { ...action.state, currentStep: "contact" };
      }
      return action.state;
    }
    default:
      return state;
  }
}

export function serializeState(state: EstimatorState): string {
  return JSON.stringify(state);
}

export function deserializeState(raw: string): EstimatorState | null {
  try {
    const parsed = JSON.parse(raw) as EstimatorState;
    if (parsed.schemaVersion !== STATE_SCHEMA_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}
