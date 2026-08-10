"use client";

import { useSessionWorkspace } from "@/features/sessions/use-session-workspace";

export function useOperationalSession({
  requireSnapshot = false,
}: {
  requireSnapshot?: boolean;
} = {}) {
  const workspace = useSessionWorkspace({ requireSnapshot });

  return {
    ...workspace,
    selectOperationalSession: workspace.selectWorkspaceSession,
  };
}
