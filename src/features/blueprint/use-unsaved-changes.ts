"use client";

import { useEffect } from "react";

const UNSAVED_CHANGES_MESSAGE = "Hay cambios sin guardar. Si sales ahora, podrias perderlos.";

export function useUnsavedChangesPrompt(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty || typeof window === "undefined") {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = UNSAVED_CHANGES_MESSAGE;
      return UNSAVED_CHANGES_MESSAGE;
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}

export function canLeaveWithUnsavedChanges(isDirty: boolean) {
  if (!isDirty || typeof window === "undefined") {
    return true;
  }

  return window.confirm(UNSAVED_CHANGES_MESSAGE);
}
