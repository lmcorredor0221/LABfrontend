import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(frontendRoot, "..");
const productExperienceRoot = path.join(frontendRoot, "src", "features", "product-experience");
const appProjectRoot = path.join(frontendRoot, "src", "app", "projects");
const evidenceDir = path.join(repoRoot, "Docs", "system-analysis", "evidence", "uxa12");
const evidencePath = path.join(evidenceDir, "cutover-audit.json");

const bannedLegacyImportPrefixes = [
  "@/components/lean",
  "@/features/acp",
  "@/features/estimation",
  "@/features/evaluation",
  "@/features/productization",
  "@/features/validation",
];

const deprecatedProductShellFiles = [
  "@/features/product-experience/shell/lean-stage-layout",
  "@/features/product-experience/shell/project-product-layout",
  "./lean-stage-layout",
  "./project-product-layout",
];

const prohibitedUiTokens = ["StageCommandCenter", "StageUsabilityBoard", "HorizontalJourney"];
const removedLegacyVisualFiles = [
  path.join(frontendRoot, "src", "components", "lean", "project-pages.tsx"),
  path.join(frontendRoot, "src", "features", "journey", "project-stage-page.tsx"),
  path.join(frontendRoot, "src", "features", "diagrams", "diagram-browser.tsx"),
  path.join(frontendRoot, "src", "features", "productization", "saas-product-pages.tsx"),
  path.join(frontendRoot, "src", "features", "discovery", "discovery-stage-shell.tsx"),
];
const allowedDomainAdapters = new Set([
  "@/features/blueprint/blueprint-results-adapter",
  "@/features/diagrams/diagram-browser-adapter",
  "@/features/discovery/discovery-adapter",
  "@/features/journey/journey-model",
]);

function walkFiles(root, extensions = new Set([".ts", ".tsx"])) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(absolutePath, extensions));
      continue;
    }

    if (extensions.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

function relative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function extractImports(source) {
  return Array.from(source.matchAll(/from\s+["']([^"']+)["']/g)).map((match) => match[1]);
}

const violations = [];
const warnings = [];
const productFiles = walkFiles(productExperienceRoot);
const productProductionFiles = productFiles.filter((filePath) => !filePath.includes(".test."));

for (const filePath of removedLegacyVisualFiles) {
  if (existsSync(filePath)) {
    violations.push({
      file: relative(filePath),
      kind: "removed_legacy_visual_file_still_exists",
    });
  }
}

for (const filePath of productProductionFiles) {
  const source = readFileSync(filePath, "utf8");
  const importSpecifiers = extractImports(source);

  for (const specifier of importSpecifiers) {
    const isBannedLegacyImport = bannedLegacyImportPrefixes.some((prefix) => specifier.startsWith(prefix));
    const isDeprecatedShellImport = deprecatedProductShellFiles.includes(specifier);
    const isAllowedDomainAdapter = allowedDomainAdapters.has(specifier);

    if ((isBannedLegacyImport || isDeprecatedShellImport) && !isAllowedDomainAdapter) {
      violations.push({
        file: relative(filePath),
        kind: "legacy_import",
        specifier,
      });
    }
  }

  for (const token of prohibitedUiTokens) {
    if (source.includes(token)) {
      violations.push({
        file: relative(filePath),
        kind: "prohibited_ui_token",
        token,
      });
    }
  }
}

const shellIndexPath = path.join(productExperienceRoot, "shell", "index.ts");
const shellIndexSource = readFileSync(shellIndexPath, "utf8");
for (const deprecatedExport of ["LeanStageLayout", "ProjectProductLayout"]) {
  if (shellIndexSource.includes(deprecatedExport)) {
    violations.push({
      file: relative(shellIndexPath),
      kind: "deprecated_public_export",
      token: deprecatedExport,
    });
  }
}

const boundaryPath = path.join(productExperienceRoot, "shell", "project-experience-boundary.tsx");
const boundarySource = readFileSync(boundaryPath, "utf8");
for (const requiredToken of [
  "resolveProductExperienceCutoverDecision",
  "workspaceId: snapshot?.session.workspace_id",
  "ProductExperienceCutoverTelemetry",
]) {
  if (!boundarySource.includes(requiredToken)) {
    violations.push({
      file: relative(boundaryPath),
      kind: "cutover_boundary_missing_token",
      token: requiredToken,
    });
  }
}
for (const forbiddenToken of [
  "return props.children",
  'experience !== "product_experience_v2"',
]) {
  if (boundarySource.includes(forbiddenToken)) {
    violations.push({
      file: relative(boundaryPath),
      kind: "legacy_boundary_fallback_token",
      token: forbiddenToken,
    });
  }
}

const featureFlagsPath = path.join(frontendRoot, "src", "core", "config", "feature-flags.ts");
const featureFlagsSource = readFileSync(featureFlagsPath, "utf8");
for (const requiredToken of [
  "NEXT_PUBLIC_PRODUCT_EXPERIENCE_ROLLOUT_PERCENT",
  "NEXT_PUBLIC_PRODUCT_EXPERIENCE_ROLLBACK",
  "resolveProductExperienceCutoverDecision",
  "legacy_removed",
]) {
  if (!featureFlagsSource.includes(requiredToken)) {
    violations.push({
      file: relative(featureFlagsPath),
      kind: "feature_flag_cutover_missing_token",
      token: requiredToken,
    });
  }
}

const projectRouteFiles = walkFiles(appProjectRoot).filter((filePath) => filePath.endsWith("page.tsx"));
for (const filePath of projectRouteFiles) {
  const source = readFileSync(filePath, "utf8");
  const isProjectList = relative(filePath) === "frontend/src/app/projects/page.tsx";
  const isRedirectOnly = source.includes("redirect(") && !source.includes("return (");

  if (isProjectList || isRedirectOnly) {
    continue;
  }

  if (!source.includes("ProjectExperienceBoundary")) {
    violations.push({
      file: relative(filePath),
      kind: "project_route_without_boundary",
    });
  }
}

for (const filePath of productProductionFiles) {
  const specifiers = extractImports(readFileSync(filePath, "utf8"));
  for (const specifier of specifiers) {
    if (allowedDomainAdapters.has(specifier)) {
      warnings.push({
        file: relative(filePath),
        kind: "allowed_domain_adapter",
        specifier,
      });
    }
  }
}

const result = {
  checked_at: new Date().toISOString(),
  checks: {
    app_project_pages: projectRouteFiles.length,
    product_experience_files: productFiles.length,
    product_experience_production_files: productProductionFiles.length,
  },
  status: violations.length === 0 ? "passed" : "failed",
  violations,
  warnings,
};

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(evidencePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));

if (violations.length > 0) {
  process.exitCode = 1;
}
