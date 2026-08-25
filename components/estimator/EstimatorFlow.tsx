"use client";

import { useEffect, useRef, useState } from "react";
import { useEstimatorFlow } from "@/components/estimator/useEstimatorFlow";
import { ProgressBar } from "@/components/estimator/ProgressBar";
import { STEP_HEADING_ID } from "@/components/estimator/StepHeading";
import { IntroStep } from "@/components/estimator/steps/IntroStep";
import { AddressStep } from "@/components/estimator/steps/AddressStep";
import { SquareFootageStep } from "@/components/estimator/steps/SquareFootageStep";
import { ConcreteStep } from "@/components/estimator/steps/ConcreteStep";
import { StepsStep } from "@/components/estimator/steps/StepsStep";
import { StemWallStep } from "@/components/estimator/steps/StemWallStep";
import { ContactStep } from "@/components/estimator/steps/ContactStep";
import { ResultsView } from "@/components/results/ResultsView";
import { ThankYouView } from "@/components/results/ThankYouView";
import { analytics, initAnalytics } from "@/lib/analytics/adapter";
import { captureAndPersistAttribution, setEmbedContext } from "@/lib/analytics/attribution";
import type { ContactInput } from "@/lib/validation/schemas";
import type { PublicPricingResult, SelectedPlan } from "@/lib/pricing/types";

export interface EstimatorFlowProps {
  embedMode?: boolean;
  parentOrigin?: string;
}

interface EstimateResponse {
  estimateId: string;
  estimateToken: string;
  result: PublicPricingResult;
  leadDelivery: { delivered: boolean };
}

export function EstimatorFlow({ embedMode = false, parentOrigin = "" }: EstimatorFlowProps) {
  const { state, dispatch } = useEstimatorFlow();
  const [contact, setContact] = useState<ContactInput | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    initAnalytics(embedMode);
    captureAndPersistAttribution();
    if (embedMode) setEmbedContext(true, parentOrigin);
    if (!viewedRef.current) {
      viewedRef.current = true;
      analytics.viewed();
    }
  }, [embedMode, parentOrigin]);

  // Move focus to the current step's heading after every transition and
  // announce it -- see StepHeading for why this alone satisfies a11y here.
  useEffect(() => {
    const heading = document.getElementById(STEP_HEADING_ID);
    heading?.focus();
  }, [state.currentStep]);

  useEffect(() => {
    if (state.currentStep === "results" && state.estimateId) {
      analytics.resultsViewed(state.estimateId);
    }
  }, [state.currentStep, state.estimateId]);

  async function handleContactSubmit(data: ContactInput, honeypot: string) {
    if (
      !state.answers.address ||
      state.answers.squareFeet === null ||
      !state.answers.concreteCondition ||
      state.answers.stepsPresent === null ||
      !state.answers.stemWall
    ) {
      setSubmitError("Please complete every question before continuing.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    analytics.contactSubmitted();

    try {
      const attribution = captureAndPersistAttribution();
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: state.answers.address,
          squareFeet: state.answers.squareFeet,
          concreteCondition: state.answers.concreteCondition,
          stepsPresent: state.answers.stepsPresent,
          stemWall: state.answers.stemWall,
          contact: data,
          attribution,
          consentDisclosureVersion: "corporate-2026-08",
          honeypot,
          formStartedAtMs: state.formStartedAtMs ?? Date.now(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSubmitError(
          body?.message ??
            "We couldn't calculate your estimate right now. Please try again, or call us directly.",
        );
        setSubmitting(false);
        return;
      }

      const body = (await res.json()) as EstimateResponse;
      setContact(data);
      dispatch({
        type: "SUBMIT_SUCCESS",
        estimateId: body.estimateId,
        estimateToken: body.estimateToken,
        publicResult: body.result,
      });
      analytics.leadCreated(body.estimateId, crypto.randomUUID());
    } catch {
      setSubmitError("Something went wrong. Please try again, or call us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditAnswers() {
    dispatch({ type: "GO_TO_STEP", step: "address" });
  }

  function handleSelected(plan: SelectedPlan) {
    dispatch({ type: "SELECTION_SUCCESS", plan });
  }

  function handleCallClickOnConfirmation() {
    if (state.estimateId) {
      analytics.callClicked(state.estimateId, state.selectedPlan ?? "");
    }
  }

  const showProgress =
    state.currentStep !== "intro" &&
    state.currentStep !== "results" &&
    state.currentStep !== "confirmation";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      {showProgress ? <ProgressBar currentStep={state.currentStep} /> : null}

      {state.currentStep === "intro" && (
        <IntroStep onStart={() => dispatch({ type: "START" })} />
      )}

      {state.currentStep === "address" && (
        <AddressStep
          initialValue={state.answers.address}
          onNext={(address) => dispatch({ type: "SET_ADDRESS", address })}
          onBack={() => dispatch({ type: "GO_TO_STEP", step: "intro" })}
        />
      )}

      {state.currentStep === "square_footage" && (
        <SquareFootageStep
          initialValue={state.answers.squareFeet}
          onNext={(squareFeet) => dispatch({ type: "SET_SQUARE_FEET", squareFeet })}
          onBack={() => dispatch({ type: "GO_TO_STEP", step: "address" })}
        />
      )}

      {state.currentStep === "concrete" && (
        <ConcreteStep
          initialValue={state.answers.concreteCondition}
          onNext={(concreteCondition) => {
            analytics.questionCompleted(3, "concrete");
            dispatch({ type: "SET_CONCRETE", concreteCondition });
          }}
          onBack={() => dispatch({ type: "GO_TO_STEP", step: "square_footage" })}
        />
      )}

      {state.currentStep === "steps" && (
        <StepsStep
          initialValue={state.answers.stepsPresent}
          onNext={(stepsPresent) => dispatch({ type: "SET_STEPS_PRESENT", stepsPresent })}
          onBack={() => dispatch({ type: "GO_TO_STEP", step: "concrete" })}
        />
      )}

      {state.currentStep === "stem_wall" && (
        <StemWallStep
          initialValue={state.answers.stemWall}
          onNext={(stemWall) => dispatch({ type: "SET_STEM_WALL", stemWall })}
          onBack={() => dispatch({ type: "GO_TO_STEP", step: "steps" })}
        />
      )}

      {state.currentStep === "contact" && (
        <ContactStep
          initialValue={contact}
          submitting={submitting}
          submitError={submitError}
          onSubmit={handleContactSubmit}
          onBack={() => dispatch({ type: "GO_TO_STEP", step: "stem_wall" })}
        />
      )}

      {state.currentStep === "results" &&
        state.publicResult &&
        state.estimateId &&
        state.estimateToken &&
        state.answers.address &&
        state.answers.squareFeet !== null &&
        state.answers.concreteCondition &&
        state.answers.stepsPresent !== null &&
        state.answers.stemWall &&
        contact && (
          <ResultsView
            publicResult={state.publicResult}
            estimateId={state.estimateId}
            estimateToken={state.estimateToken}
            address={state.answers.address}
            squareFeet={state.answers.squareFeet}
            concreteCondition={state.answers.concreteCondition}
            stepsPresent={state.answers.stepsPresent}
            stemWall={state.answers.stemWall}
            contact={contact}
            onEditAnswers={handleEditAnswers}
            onSelected={handleSelected}
          />
        )}

      {state.currentStep === "confirmation" &&
        state.publicResult &&
        state.estimateId &&
        state.selectedPlan &&
        contact && (
          <ThankYouView
            selectedPlan={state.selectedPlan}
            publicResult={state.publicResult}
            contact={contact}
            estimateId={state.estimateId}
            onBackToResults={() => dispatch({ type: "GO_TO_STEP", step: "results" })}
            onCallClick={handleCallClickOnConfirmation}
          />
        )}
    </div>
  );
}
