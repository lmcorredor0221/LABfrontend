import json
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[3]
BASE_URL = os.environ.get("LEAN_ENTERPRISE_BASE_URL", "http://127.0.0.1:3200").rstrip("/")
OUTPUT = ROOT / "Docs" / "redisenio_visual_2026" / "theme-01-enterprise-corporate"
PROJECT_ID = os.environ.get("LEAN_ENTERPRISE_PROJECT_ID", "enterprise-theme-fixture").strip()
AXE_PATH = ROOT / "frontend" / "node_modules" / "axe-core" / "axe.min.js"

EXPECTED = {
    "brand": "rgb(30, 64, 175)",
    "canvas": "rgb(241, 245, 249)",
    "sidebar": "rgb(15, 23, 42)",
    "text": "rgb(15, 23, 42)",
    "uxa_brand": "rgb(30, 64, 175)",
    "product_nav_active_background": "rgb(30, 64, 175)",
    "product_nav_active_text": "rgb(255, 255, 255)",
}

VIEWPORTS = {
    "desktop": {"width": 1440, "height": 980},
    "laptop": {"width": 1280, "height": 800},
    "mobile": {"width": 390, "height": 844},
}

PROJECT_ROOT = f"/projects/{PROJECT_ID}"
ROUTES = [
    {
        "key": "foundation",
        "path": "/mockups/uxa-foundations",
        "terms": ["Sistema visual para Lean Agent Builder", "Componentes criticos"],
    },
    {"key": "discover", "path": f"{PROJECT_ROOT}/work/discover", "terms": ["Descubrir: problema y contexto"]},
    {"key": "define", "path": f"{PROJECT_ROOT}/work/define", "terms": ["Definir: objetivos, alcance y requisitos"]},
    {"key": "design", "path": f"{PROJECT_ROOT}/work/design", "terms": ["Disenar: arquitectura y comportamiento"]},
    {"key": "tools", "path": f"{PROJECT_ROOT}/work/tools", "terms": ["Herramientas: capacidades minimas"]},
    {"key": "memory", "path": f"{PROJECT_ROOT}/work/memory", "terms": ["Memoria: conocimiento y contexto"]},
    {"key": "estimate", "path": f"{PROJECT_ROOT}/work/estimate", "terms": ["Estimar valor, costo y ROI"]},
    {"key": "validate", "path": f"{PROJECT_ROOT}/work/validate", "terms": ["Validar Blueprint antes del ACP"]},
    {"key": "package", "path": f"{PROJECT_ROOT}/work/package", "terms": ["Package portable y desacoplado"]},
    {"key": "blueprint", "path": f"{PROJECT_ROOT}/blueprint", "terms": ["Resultado del Blueprint listo para demostrar valor"]},
    {"key": "blueprint-pro", "path": f"{PROJECT_ROOT}/blueprint/pro", "terms": ["Blueprint Profesional"]},
    {"key": "diagrams", "path": f"{PROJECT_ROOT}/diagrams", "terms": ["Diagramas del Blueprint y ACP"]},
    {"key": "acp", "path": f"{PROJECT_ROOT}/acp", "terms": ["ACP"]},
    {"key": "artifacts", "path": f"{PROJECT_ROOT}/artifacts", "terms": ["Repositorio de entregables generados"]},
    {"key": "attention", "path": f"{PROJECT_ROOT}/attention", "terms": ["Atencion requerida"]},
    {"key": "activity", "path": f"{PROJECT_ROOT}/activity", "terms": ["Operacion y trazabilidad del proyecto"]},
]


def route_ready(page, terms: list[str]) -> list[str]:
    page.wait_for_load_state("networkidle")
    try:
        page.wait_for_function(
            """
            (terms) => {
              const text = document.body.innerText || "";
              return terms.every((term) => text.includes(term));
            }
            """,
            arg=terms,
            timeout=20_000,
        )
    except PlaywrightTimeoutError:
        pass
    body_text = page.locator("body").inner_text()
    return [term for term in terms if term not in body_text]


def resolved_color(page, css_value: str) -> str:
    return page.evaluate(
        """
        (cssValue) => {
          const node = document.createElement("span");
          node.style.color = cssValue;
          document.body.appendChild(node);
          const color = getComputedStyle(node).color;
          node.remove();
          return color;
        }
        """,
        css_value,
    )


def collect_theme(page) -> dict[str, str]:
    density_root = page.locator("[data-density]").first
    return {
        "body_theme": page.locator("body").get_attribute("data-visual-theme") or "",
        "app_theme": density_root.get_attribute("data-visual-theme") or "" if density_root.count() else "",
        "brand": resolved_color(page, "var(--brand-primary)"),
        "canvas": resolved_color(page, "var(--surface-canvas)"),
        "sidebar": resolved_color(page, "var(--surface-sidebar)"),
        "text": resolved_color(page, "var(--text-primary)"),
        "uxa_brand": resolved_color(page, "var(--uxa-color-brand)"),
        "product_nav_active_background": page.evaluate(
            """() => {
              const active = document.querySelector('.uxa-product-navigation .uxa-product-nav-link[aria-current="page"]');
              return active ? getComputedStyle(active).backgroundColor : "";
            }"""
        ),
        "product_nav_active_text": page.evaluate(
            """() => {
              const active = document.querySelector('.uxa-product-navigation .uxa-product-nav-link[aria-current="page"]');
              return active ? getComputedStyle(active).color : "";
            }"""
        ),
        "stage_active_text": page.evaluate(
            """() => {
              const active = document.querySelector('.uxa-stage-rail a[aria-current="step"]');
              return active ? getComputedStyle(active).color : "";
            }"""
        ),
    }


def collect_compactness(page) -> dict[str, float | bool]:
    return page.evaluate(
        """
        () => {
          const px = (value) => Number.parseFloat(String(value || "0")) || 0;
          const maxMetric = (selector, reader) => {
            const values = Array.from(document.querySelectorAll(selector))
              .filter((node) => {
                const style = getComputedStyle(node);
                return style.display !== "none" && style.visibility !== "hidden";
              })
              .map((node) => reader(getComputedStyle(node), node))
              .filter((value) => Number.isFinite(value));
            return values.length ? Math.max(...values) : 0;
          };

          return {
            maxButtonHeight: maxMetric("button:not(.absolute.inset-0):not(.uxa-selection-card), .uxa-button", (_style, node) => node.getBoundingClientRect().height),
            maxCardRadius: maxMetric(".uxa-card, .uxa-card-muted, .uxa-stage-rail, .uxa-product-hero, .uxa-page-state", (style) => px(style.borderTopLeftRadius)),
            maxH1Font: maxMetric(".uxa-foundation-root h1", (style) => px(style.fontSize)),
            maxH2Font: maxMetric(".uxa-foundation-root h2", (style) => px(style.fontSize)),
            maxH3Font: maxMetric(".uxa-foundation-root h3", (style) => px(style.fontSize)),
            productNavActiveRadius: maxMetric(".uxa-product-nav-link[aria-current='page']", (style) => px(style.borderTopLeftRadius)),
            productNavMaxHeight: maxMetric(".uxa-product-nav-link", (_style, node) => node.getBoundingClientRect().height),
            stageActionButtonRadius: maxMetric(".uxa-stage-action-strip .uxa-button", (style) => px(style.borderTopLeftRadius)),
            horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          };
        }
        """
    )


def collect_accessibility(page) -> dict[str, object]:
    page.add_script_tag(path=str(AXE_PATH))
    violations = page.evaluate(
        """
        async () => {
          const result = await window.axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
          });
          return result.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            nodes: violation.nodes.slice(0, 5).map((node) => ({
              target: node.target,
              summary: node.failureSummary,
            })),
          }));
        }
        """
    )
    page.keyboard.press("Tab")
    focus = page.evaluate(
        """() => {
          const node = document.activeElement;
          if (!node || node === document.body) return { visible: false, tag: "body", label: "" };
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return {
            visible: rect.width > 0 && rect.height > 0 && (style.outlineStyle !== "none" || style.boxShadow !== "none"),
            tag: node.tagName.toLowerCase(),
            label: node.getAttribute("aria-label") || node.textContent?.trim().slice(0, 80) || "",
          };
        }"""
    )
    page.evaluate("() => document.activeElement instanceof HTMLElement && document.activeElement.blur()")
    return {"violations": violations, "focusProbe": focus}


def check_attention_drawer_keyboard(page) -> dict[str, object]:
    source = page.locator('button[aria-label^="Abrir Segmento de Atencion"]').first
    if not source.count() or not source.is_visible():
        source = page.locator('button[aria-label="Abrir Segmento de Atencion"]').first
    source.focus()
    source.click()
    dialog = page.get_by_role("dialog", name="Segmento de Atencion")
    dialog.wait_for(state="visible")
    first_focus_inside = page.evaluate("() => Boolean(document.activeElement?.closest('[role=dialog]'))")
    page.keyboard.press("Escape")
    dialog.wait_for(state="detached")
    focus_returned = source.evaluate("node => document.activeElement === node")
    return {
        "escapeCloses": True,
        "focusEntered": first_focus_inside,
        "focusReturned": focus_returned,
    }


def evaluate_page(page, route: dict[str, object], viewport_key: str) -> dict[str, object]:
    console_errors: list[str] = []
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.goto(f"{BASE_URL}{route['path']}", wait_until="networkidle", timeout=60_000)
    missing_terms = route_ready(page, route["terms"])
    page.wait_for_timeout(250)

    theme = collect_theme(page)
    compactness = collect_compactness(page)
    accessibility = collect_accessibility(page)
    screenshot = OUTPUT / f"{route['key']}-{viewport_key}.png"
    page.screenshot(path=screenshot, full_page=True)

    failures: list[str] = []
    if missing_terms:
        failures.append(f"missing terms: {missing_terms}")
    if theme["body_theme"] != "enterprise-corporate":
        failures.append("body theme attribute missing")
    if theme["app_theme"] != "enterprise-corporate":
        failures.append("app theme attribute missing")
    for key, expected in EXPECTED.items():
        if key.startswith("product_nav") and not theme[key]:
            continue
        if theme[key] != expected:
            failures.append(f"{key} expected {expected}, got {theme[key]}")
    if theme["stage_active_text"] and theme["stage_active_text"] != "rgb(255, 255, 255)":
        failures.append(f"stage active text is not inverse: {theme['stage_active_text']}")
    if compactness["maxH1Font"] > 30:
        failures.append(f"h1 too large: {compactness['maxH1Font']}")
    if compactness["maxH2Font"] > 26:
        failures.append(f"h2 too large: {compactness['maxH2Font']}")
    if compactness["maxH3Font"] > 22:
        failures.append(f"h3 too large: {compactness['maxH3Font']}")
    if compactness["maxButtonHeight"] > 48:
        failures.append(f"button too tall: {compactness['maxButtonHeight']}")
    if compactness["maxCardRadius"] > 12:
        failures.append(f"card radius too large: {compactness['maxCardRadius']}")
    if compactness["productNavActiveRadius"] > 12:
        failures.append(f"product nav active radius too large: {compactness['productNavActiveRadius']}")
    if compactness["productNavMaxHeight"] > 40:
        failures.append(f"product nav too tall: {compactness['productNavMaxHeight']}")
    if compactness["stageActionButtonRadius"] > 12:
        failures.append(f"stage action button radius too large: {compactness['stageActionButtonRadius']}")
    if compactness["horizontalOverflow"]:
        failures.append("horizontal overflow detected")
    if accessibility["violations"]:
        ids = [violation["id"] for violation in accessibility["violations"]]
        failures.append(f"axe violations: {ids}")
    if not accessibility["focusProbe"]["visible"]:
        failures.append(f"focus indicator probe failed: {accessibility['focusProbe']}")
    if console_errors:
        failures.append(f"console errors: {console_errors}")

    drawer_keyboard = None
    if route["key"] == "attention" and viewport_key == "desktop":
        drawer_keyboard = check_attention_drawer_keyboard(page)
        if not all(drawer_keyboard.values()):
            failures.append(f"drawer keyboard flow failed: {drawer_keyboard}")

    return {
        "accessibility": accessibility,
        "compactness": compactness,
        "consoleErrors": console_errors,
        "drawerKeyboard": drawer_keyboard,
        "failures": failures,
        "finalUrl": page.url,
        "screenshot": str(screenshot.relative_to(ROOT)).replace("\\", "/"),
        "theme": theme,
    }


def main() -> None:
    if not AXE_PATH.exists():
        raise RuntimeError(f"axe-core not found at {AXE_PATH}")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    report: dict[str, object] = {
        "baseUrl": BASE_URL,
        "checkedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "projectId": PROJECT_ID,
        "routes": {},
        "status": "passed",
        "viewports": VIEWPORTS,
    }
    failures: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for viewport_key, viewport in VIEWPORTS.items():
            page = browser.new_page(viewport=viewport, device_scale_factor=1)
            for route in ROUTES:
                result = evaluate_page(page, route, viewport_key)
                report["routes"].setdefault(route["key"], {})[viewport_key] = result
                failures.extend(f"{route['key']}:{viewport_key}: {failure}" for failure in result["failures"])
            page.close()
        browser.close()

    if failures:
        report["status"] = "failed"
        report["failures"] = failures

    report_path = OUTPUT / "theme-smoke.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "status": report["status"],
        "report": str(report_path),
        "routes": len(ROUTES),
        "viewports": len(VIEWPORTS),
        "failures": len(failures),
    }, indent=2))
    if failures:
        print(json.dumps({"failures": failures}, ensure_ascii=False, indent=2))
        sys.exit(2)


if __name__ == "__main__":
    main()
