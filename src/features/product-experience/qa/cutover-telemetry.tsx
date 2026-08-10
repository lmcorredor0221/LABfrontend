"use client";

import { useEffect, useRef } from "react";
import type { ProductExperienceCutoverDecision } from "@/core/config/feature-flags";

export const PRODUCT_EXPERIENCE_CUTOVER_EVENTS_KEY = "lean-builder.uxa12-cutover-events";

export type ProductExperienceCutoverTelemetryProps = {
  decision: ProductExperienceCutoverDecision;
  routeKey: string;
  sessionId: string;
};

type CutoverTelemetryEvent = {
  cohortPercent: number;
  elapsedMs?: number;
  event: "view_opened" | "first_action" | "retry_action" | "abandonment";
  experience: ProductExperienceCutoverDecision["experience"];
  reason: ProductExperienceCutoverDecision["reason"];
  rolloutPercent: number;
  routeKey: string;
  sessionId: string;
  timestamp: string;
  workspaceId: string | null;
};

function readEvents() {
  try {
    const rawEvents = window.localStorage.getItem(PRODUCT_EXPERIENCE_CUTOVER_EVENTS_KEY);
    if (!rawEvents) {
      return [];
    }

    const parsedEvents = JSON.parse(rawEvents);
    return Array.isArray(parsedEvents) ? parsedEvents : [];
  } catch {
    return [];
  }
}

function writeEvent(event: CutoverTelemetryEvent) {
  try {
    const events = [...readEvents(), event].slice(-80);
    window.localStorage.setItem(PRODUCT_EXPERIENCE_CUTOVER_EVENTS_KEY, JSON.stringify(events));
  } catch {
    // Local telemetry must never block the product flow.
  }
}

function getElementLabel(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return "";
  }

  const actionableElement = target.closest("button,a,[role='button'],input,textarea,select");
  return [
    actionableElement?.getAttribute("aria-label"),
    actionableElement?.getAttribute("title"),
    actionableElement?.textContent,
    actionableElement instanceof HTMLInputElement ? actionableElement.value : null,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isRetryLabel(label: string) {
  return /\b(reintentar|recargar|retry|reload|reanudar|resume)\b/.test(label);
}

export function ProductExperienceCutoverTelemetry({
  decision,
  routeKey,
  sessionId,
}: ProductExperienceCutoverTelemetryProps) {
  const startedAt = useRef(0);
  const sawFirstAction = useRef(false);
  const wroteAbandonment = useRef(false);

  useEffect(() => {
    startedAt.current = performance.now();
    sawFirstAction.current = false;
    wroteAbandonment.current = false;

    const buildEvent = (
      event: CutoverTelemetryEvent["event"],
      elapsedMs = Math.max(0, Math.round(performance.now() - startedAt.current)),
    ): CutoverTelemetryEvent => ({
      cohortPercent: decision.cohortPercent,
      elapsedMs,
      event,
      experience: decision.experience,
      reason: decision.reason,
      rolloutPercent: decision.rolloutPercent,
      routeKey,
      sessionId,
      timestamp: new Date().toISOString(),
      workspaceId: decision.workspaceId,
    });

    writeEvent(buildEvent("view_opened", 0));

    const handleFirstAction = (event: Event) => {
      const label = getElementLabel(event.target);

      if (!sawFirstAction.current) {
        sawFirstAction.current = true;
        writeEvent(buildEvent("first_action"));
      }

      if (isRetryLabel(label)) {
        writeEvent(buildEvent("retry_action"));
      }
    };

    const handleVisibilityExit = () => {
      if (document.visibilityState !== "hidden" || sawFirstAction.current || wroteAbandonment.current) {
        return;
      }

      wroteAbandonment.current = true;
      writeEvent(buildEvent("abandonment"));
    };

    const handlePageHide = () => {
      if (sawFirstAction.current || wroteAbandonment.current) {
        return;
      }

      wroteAbandonment.current = true;
      writeEvent(buildEvent("abandonment"));
    };

    document.addEventListener("click", handleFirstAction, true);
    document.addEventListener("keydown", handleFirstAction, true);
    document.addEventListener("input", handleFirstAction, true);
    document.addEventListener("change", handleFirstAction, true);
    document.addEventListener("visibilitychange", handleVisibilityExit);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("click", handleFirstAction, true);
      document.removeEventListener("keydown", handleFirstAction, true);
      document.removeEventListener("input", handleFirstAction, true);
      document.removeEventListener("change", handleFirstAction, true);
      document.removeEventListener("visibilitychange", handleVisibilityExit);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [decision, routeKey, sessionId]);

  return null;
}
