"use client";

import { useEffect, useRef, useState } from "react";
import { EstimatorFlow } from "@/components/estimator/EstimatorFlow";
import { getPublicEmbedAllowedOrigins } from "@/lib/env";
import {
  createEnvelope,
  isEmbedEnvelope,
  isOriginAllowed,
  type InitPayload,
} from "@/lib/embed/protocol";

const RESIZE_DEBOUNCE_MS = 120;
const MIN_HEIGHT_PX = 480;

export function EmbedShell() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [parentOrigin, setParentOrigin] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parent -> child handshake: accept "init" only from an allowed origin.
  useEffect(() => {
    const allowedOrigins = getPublicEmbedAllowedOrigins();

    function handleMessage(event: MessageEvent) {
      if (!isEmbedEnvelope(event.data)) return;
      if (allowedOrigins.length > 0 && !isOriginAllowed(event.origin, allowedOrigins)) return;

      if (event.data.type === "init") {
        const payload = event.data.payload as InitPayload;
        setParentOrigin(payload.parentOrigin || event.origin);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Announce readiness once mounted.
  useEffect(() => {
    if (window.parent === window) return;
    window.parent.postMessage(createEnvelope("ready", { version: 1, route: "/embed" }), "*");
  }, []);

  // Measure and report height on any layout change, debounced.
  useEffect(() => {
    if (!rootRef.current || window.parent === window) return;

    function reportHeight() {
      if (!rootRef.current) return;
      const height = Math.max(MIN_HEIGHT_PX, Math.ceil(rootRef.current.getBoundingClientRect().height));
      window.parent.postMessage(createEnvelope("resize", { height }), "*");
    }

    function scheduleReport() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(reportHeight, RESIZE_DEBOUNCE_MS);
    }

    const observer = new ResizeObserver(scheduleReport);
    observer.observe(rootRef.current);
    scheduleReport();

    return () => {
      observer.disconnect();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={rootRef} className="min-h-[480px] bg-white">
      <EstimatorFlow embedMode parentOrigin={parentOrigin} />
    </div>
  );
}
