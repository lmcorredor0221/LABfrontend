export const DLG14_DIAGRAM_READABILITY_SMOKE = {
  evidenceDir: "Docs/system-analysis/evidence/diagram-readability-final",
  runner: "frontend/tests/e2e/diagram-readability-smoke.py",
  routes: [
    "Blueprint",
    "Diagram Center",
    "Blueprint Pro",
    "ACP",
    "Settings / Diagram Governance",
  ],
  validations: [
    "no unnecessary horizontal overflow in primary containers",
    "diagram viewer exposes filters and zoom/readability controls",
    "layout upgrade/regeneration actions remain permission-gated",
    "basic language toggle can be exercised when visible",
    "screenshots and metrics are persisted as DLG14 evidence",
  ],
} as const;

