export const BOOT_ROUTE = "/boot";
export const HOME_ROUTE = "/";
export const LOGIN_ROUTE = "/login";
export const REGISTER_ROUTE = "/register";
export const MOCKUPS_ROUTE = "/mockups";
export const PROJECT_ROUTE_PREFIX = "/projects";

export const PUBLIC_ROUTES = [BOOT_ROUTE, LOGIN_ROUTE, REGISTER_ROUTE, MOCKUPS_ROUTE] as const;

export const PROJECT_STAGE_ORDER = [
  "discover",
  "define",
  "design",
  "tools",
  "memory",
  "estimate",
  "validate",
  "package",
] as const;

export type ProjectRouteStage = (typeof PROJECT_STAGE_ORDER)[number];
export type ProjectLegacyStage = "evaluate" | "security" | "build" | "operate";
export type ProjectStageInput = ProjectRouteStage | ProjectLegacyStage;
export type ProjectProductSection = "blueprint" | "acp" | "artifacts" | "attention" | "activity";
export type ProjectProductRouteSection = ProjectProductSection | "blueprint_pro" | "diagrams";

export const DEFAULT_PROJECT_STAGE: ProjectRouteStage = "discover";

const LEGACY_STAGE_REDIRECTS: Record<
  ProjectLegacyStage,
  {
    section?: string;
    stage: ProjectRouteStage;
  }
> = {
  build: {
    stage: "package",
  },
  evaluate: {
    section: "evaluation",
    stage: "validate",
  },
  operate: {
    section: "summary",
    stage: "package",
  },
  security: {
    section: "governance",
    stage: "validate",
  },
};

function normalizeQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isProjectRouteStage(value: string): value is ProjectRouteStage {
  return PROJECT_STAGE_ORDER.includes(value as ProjectRouteStage);
}

export function isProjectStageInput(value: string): value is ProjectStageInput {
  return isProjectRouteStage(value) || value in LEGACY_STAGE_REDIRECTS;
}

export function buildProjectStageQuery(params: Record<string, string | null | undefined> = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (!value) {
      continue;
    }

    searchParams.set(key, value);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function getProjectRoute(
  sessionId: string,
  stage: ProjectRouteStage = DEFAULT_PROJECT_STAGE,
  options: {
    section?: string | null;
  } = {},
) {
  return `${PROJECT_ROUTE_PREFIX}/${sessionId}/work/${stage}${buildProjectStageQuery({
    section: options.section ?? undefined,
  })}`;
}

export function getProjectProductRoute(sessionId: string, section: ProjectProductRouteSection = "blueprint") {
  const productPath: Record<ProjectProductRouteSection, string> = {
    acp: "acp",
    activity: "activity",
    artifacts: "artifacts",
    attention: "attention",
    blueprint: "blueprint",
    blueprint_pro: "blueprint/pro",
    diagrams: "diagrams",
  };

  return `${PROJECT_ROUTE_PREFIX}/${sessionId}/${productPath[section]}`;
}

export function getProjectDiagramsRoute(sessionId: string) {
  return getProjectProductRoute(sessionId, "diagrams");
}

export function resolveProjectStage(
  stage: string,
  options: {
    searchParams?: Record<string, string | string[] | undefined>;
    sessionId?: string;
  } = {},
) {
  const { searchParams, sessionId } = options;
  const normalizedSection = normalizeQueryValue(searchParams?.section);

  if (isProjectRouteStage(stage)) {
    return {
      isLegacyAlias: false,
      redirectPath: null,
      section: normalizedSection ?? null,
      stage,
    };
  }

  if (!(stage in LEGACY_STAGE_REDIRECTS)) {
    const fallbackStage = DEFAULT_PROJECT_STAGE;
    return {
      isLegacyAlias: false,
      redirectPath: sessionId ? getProjectRoute(sessionId, fallbackStage) : null,
      section: null,
      stage: fallbackStage,
    };
  }

  const legacyStage = stage as ProjectLegacyStage;
  const nextStage = LEGACY_STAGE_REDIRECTS[legacyStage];
  const section = nextStage.section ?? normalizedSection ?? null;

  return {
    isLegacyAlias: true,
    redirectPath: sessionId ? getProjectRoute(sessionId, nextStage.stage, { section }) : null,
    section,
    stage: nextStage.stage,
  };
}

export function parseProjectRoute(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "projects" || segments.length < 3) {
    return null;
  }

  const sessionId = segments[1];
  const stage = segments[2] ?? "";

  if (stage === "diagrams" || isProjectProductSection(stage)) {
    return {
      sessionId,
      stage: DEFAULT_PROJECT_STAGE,
    };
  }

  if (stage === "work") {
    const workStage = segments[3] ?? DEFAULT_PROJECT_STAGE;
    if (!isProjectStageInput(workStage)) {
      return {
        sessionId,
        stage: DEFAULT_PROJECT_STAGE,
      };
    }

    return {
      sessionId,
      stage: resolveProjectStage(workStage).stage,
    };
  }

  if (!isProjectStageInput(stage)) {
    return null;
  }

  return {
    sessionId,
    stage: resolveProjectStage(stage).stage,
  };
}

export function isProjectProductSection(value: string): value is ProjectProductSection {
  return value === "blueprint" || value === "acp" || value === "artifacts" || value === "attention" || value === "activity";
}
