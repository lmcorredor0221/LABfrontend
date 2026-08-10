import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { enterpriseThemeAllowlist } from "./enterprise-theme-allowlist.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const experienceRoot = resolve(root, "src/features/product-experience");
const reportPath = resolve(
  root,
  "../Docs/redisenio_visual_2026/theme-01-enterprise-corporate/enterprise-theme-audit.json",
);
const reportOnly = process.argv.includes("--report-only");

const sourceExtensions = new Set([".css", ".ts", ".tsx"]);

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = resolve(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(absolutePath);
      const extension = entry.name.slice(entry.name.lastIndexOf("."));
      return sourceExtensions.has(extension) ? [absolutePath] : [];
    })
    .sort();
}

const rules = [
  {
    id: "large_text",
    pattern: /text-\[(?:2[4-9]|[3-9]\d|clamp)[^\]]*\]/gi,
  },
  {
    id: "negative_tracking",
    pattern: /tracking-\[-0\.[^\]]+\]/g,
  },
  {
    id: "large_radius",
    pattern: /rounded-(?:2xl|3xl)|rounded-\[(?:1[3-9]|[2-9]\d)px\]/g,
  },
  {
    id: "large_padding",
    pattern: /(?:^|\s)(?:p-[56]|py-[45]|lg:p-6)(?=\s|["'`])/gm,
  },
  {
    id: "large_icon_tile",
    pattern: /(?:^|\s)(?:h-(?:12|14)|w-(?:12|14))(?=\s|["'`])/gm,
  },
  {
    id: "legacy_purple",
    pattern: /#(?:4f46f5|6d4aff|7c3aed|8b5cf6)|\b(?:violet|purple)\b|rgba?\(\s*79\s*,\s*70\s*,\s*245/gi,
  },
  {
    id: "heavy_shadow",
    pattern: /shadow-(?:xl|2xl)|0[_ ]2[0-9]px|0[_ ]28px/g,
  },
];

function normalizePath(absolutePath) {
  return relative(root, absolutePath).replaceAll("\\", "/");
}

function lineFor(source, index) {
  return source.slice(0, index).split("\n").length;
}

function contextFor(source, index, length) {
  const start = Math.max(0, index - 160);
  const end = Math.min(source.length, index + length + 160);
  return source.slice(start, end).replace(/\s+/g, " ").trim();
}

function isActionablePill(source, index) {
  const context = contextFor(source, index, "rounded-full".length);
  return /<(?:button|a)\b|\b(?:onClick|href|role=["'](?:button|tab|option)|cursor-pointer)\b/.test(context);
}

function allowlistMatch(finding) {
  return enterpriseThemeAllowlist.find((entry) => {
    if (entry.file !== finding.file || entry.rule !== finding.rule) return false;
    if (entry.value && entry.value !== finding.value) return false;
    if (entry.line && entry.line !== finding.line) return false;
    return true;
  });
}

const findings = [];
const auditedFiles = sourceFiles(experienceRoot);

for (const absolutePath of auditedFiles) {
  const source = readFileSync(absolutePath, "utf8");
  const file = normalizePath(absolutePath);

  for (const rule of rules) {
    for (const match of source.matchAll(rule.pattern)) {
      const index = match.index ?? 0;
      findings.push({
        file,
        line: lineFor(source, index),
        rule: rule.id,
        value: match[0].trim(),
        context: contextFor(source, index, match[0].length),
      });
    }
  }

  for (const match of source.matchAll(/rounded-full/g)) {
    const index = match.index ?? 0;
    if (!isActionablePill(source, index)) continue;
    findings.push({
      file,
      line: lineFor(source, index),
      rule: "pill_action_control",
      value: match[0],
      context: contextFor(source, index, match[0].length),
    });
  }
}

const allowed = [];
const failures = [];

for (const finding of findings) {
  const allowlistEntry = allowlistMatch(finding);
  if (allowlistEntry) {
    allowed.push({ ...finding, reason: allowlistEntry.reason });
  } else {
    failures.push(finding);
  }
}

function requireSource(file, checks) {
  const absolutePath = resolve(root, file);
  if (!existsSync(absolutePath)) {
    failures.push({ file, line: 1, rule: "semantic_contract", value: "missing file", context: file });
    return;
  }
  const source = readFileSync(absolutePath, "utf8");
  for (const check of checks) {
    if (check.pattern.test(source)) continue;
    failures.push({ file, line: 1, rule: "semantic_contract", value: check.value, context: check.reason });
  }
}

requireSource("src/features/product-experience/shell/project-workspace-shell.tsx", [
  { pattern: /className="uxa-product-nav-link"/, value: "uxa-product-nav-link", reason: "Product navigation must use the semantic navigation control." },
  { pattern: /uxa-project-topbar/, value: "uxa-project-topbar", reason: "Project topbar must use compact shell classes." },
  { pattern: /uxa-project-title/, value: "uxa-project-title", reason: "Project title must use the semantic title token." },
  { pattern: /uxa-project-controls/, value: "uxa-project-controls", reason: "Project controls must share the semantic compact layout." },
]);

requireSource("src/features/product-experience/stage-screen/lean-stage-screen.tsx", [
  { pattern: /uxa-stage-hero-body/, value: "uxa-stage-hero-body", reason: "Stage screen must use the compact semantic hero." },
  { pattern: /uxa-stage-title/, value: "uxa-stage-title", reason: "Stage title must use semantic typography." },
  { pattern: /uxa-stage-action-copy/, value: "uxa-stage-action-copy", reason: "Stage action copy must use the compact grid." },
]);

requireSource("src/features/product-experience/design-system/tokens.css", [
  { pattern: /--uxa-button-primary-bg:\s*var\(--uxa-color-brand\);/, value: "--uxa-button-primary-bg", reason: "Primary actions must use the flat enterprise brand color." },
  { pattern: /\.uxa-product-nav-link\[aria-current="page"\][\s\S]*?color:\s*var\(--uxa-color-inverse\);/, value: "active nav inverse", reason: "Active navigation must preserve readable inverse text." },
  { pattern: /\.uxa-button > span[\s\S]*?white-space:\s*nowrap;/, value: "button nowrap", reason: "Button icon and label must stay on one line." },
]);

const ruleIds = [...rules.map((rule) => rule.id), "pill_action_control", "semantic_contract"];
const summary = Object.fromEntries(ruleIds.map((rule) => [rule, 0]));
const files = {};

for (const finding of failures) {
  summary[finding.rule] = (summary[finding.rule] ?? 0) + 1;
  files[finding.file] ??= Object.fromEntries(ruleIds.map((rule) => [rule, 0]));
  files[finding.file][finding.rule] = (files[finding.file][finding.rule] ?? 0) + 1;
}

const report = {
  status: failures.length === 0 ? "passed" : reportOnly ? "reported" : "failed",
  mode: reportOnly ? "report-only" : "strict",
  auditedRoot: normalizePath(experienceRoot),
  auditedFileCount: auditedFiles.length,
  failureCount: failures.length,
  allowlistedCount: allowed.length,
  summary,
  files,
  failures,
  allowlisted: allowed,
  generatedAt: new Date().toISOString(),
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const consoleReport = {
  status: report.status,
  mode: report.mode,
  auditedFileCount: report.auditedFileCount,
  failureCount: report.failureCount,
  allowlistedCount: report.allowlistedCount,
  summary: report.summary,
  report: reportPath,
};

if (failures.length > 0 && !reportOnly) {
  console.error(JSON.stringify({ ...consoleReport, failures }, null, 2));
  process.exit(2);
}

console.log(JSON.stringify(consoleReport, null, 2));
