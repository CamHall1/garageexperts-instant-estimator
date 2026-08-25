"use client";

import { useEffect, useReducer, useRef } from "react";
import {
  deserializeState,
  estimatorReducer,
  initialState,
  serializeState,
  STORAGE_KEY,
  type EstimatorState,
} from "@/lib/estimator/state";

export function useEstimatorFlow() {
  const [state, dispatch] = useReducer(estimatorReducer, initialState);
  const hydrated = useRef(false);

  // Hydrate once on mount from sessionStorage (client-only).
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const restored = deserializeState(raw);
        if (restored) {
          dispatch({ type: "HYDRATE", state: restored as EstimatorState });
        }
      }
    } catch {
      // sessionStorage unavailable -- continue with a fresh in-memory flow.
    }
  }, []);

  // Persist project answers/progress after every change.
  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, serializeState(state));
    } catch {
      // Best-effort only; never block the flow on storage failures.
    }
  }, [state]);

  return { state, dispatch };
}
