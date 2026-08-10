import {
  PRODUCT_EXPERIENCE_V2_FLAG_KEY,
  resolveProductFrontendExperience,
  type WorkspaceFeatureFlag,
} from "../../src/core/config/feature-flags";

export const UXA0_REQUIRED_ENV = [
  "LEAN_UXA0_PROJECT_ID",
  "LEAN_UXA0_EMAIL or LEAN_UXA0_AUTH_TOKEN",
  "LEAN_UXA0_PASSWORD when LEAN_UXA0_EMAIL is used",
] as const;

export const UXA0_VIEWPORTS = [
  { height: 1000, key: "desktop", width: 1600 },
  { height: 900, key: "tablet", width: 1024 },
  { height: 844, key: "mobile", width: 390 },
] as const;

export function buildUxa0Routes(projectId: string) {
  return [
    { key: "mockup", path: "/mockups/ux-redesign-hifi", requiresAuth: false },
    { key: "discover", path: `/projects/${projectId}/discover`, requiresAuth: true },
    { key: "define", path: `/projects/${projectId}/define`, requiresAuth: true },
    { key: "design", path: `/projects/${projectId}/design`, requiresAuth: true },
    { key: "tools", path: `/projects/${projectId}/tools`, requiresAuth: true },
    { key: "memory", path: `/projects/${projectId}/memory`, requiresAuth: true },
    { key: "attention", path: `/projects/${projectId}/attention`, requiresAuth: true },
  ] as const;
}

export function assertUxa0ExperienceSelectorContract(workspaceFlags: WorkspaceFeatureFlag[]) {
  const flagOffExperience = resolveProductFrontendExperience({
    integralGateEnabled: false,
    workspaceFlags,
  });

  const flagOnExperience = resolveProductFrontendExperience({
    integralGateEnabled: true,
    workspaceFlags,
  });

  return {
    flagOffExperience,
    flagOnExperience,
    productExperienceFlag: PRODUCT_EXPERIENCE_V2_FLAG_KEY,
  };
}
