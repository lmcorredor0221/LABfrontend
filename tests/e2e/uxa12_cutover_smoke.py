import json
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[3]
DEFAULT_EVIDENCE_DIR = ROOT / "Docs" / "system-analysis" / "evidence" / "uxa12"


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


BASE_URL = env("LEAN_UXA12_BASE_URL", "http://127.0.0.1:3200").rstrip("/")
PROJECT_ID = env("LEAN_UXA12_PROJECT_ID")
AUTH_TOKEN = env("LEAN_UXA12_AUTH_TOKEN")
WORKSPACE_ID = env("LEAN_UXA12_WORKSPACE_ID")
EXPECT_PRODUCT_EXPERIENCE = env("LEAN_UXA12_EXPECT_PRODUCT_EXPERIENCE", "0") in {"1", "true", "yes"}
EVIDENCE_DIR = Path(env("LEAN_UXA12_EVIDENCE_DIR") or DEFAULT_EVIDENCE_DIR)

VIEWPORTS = [
    {"key": "desktop", "width": 1440, "height": 980},
    {"key": "tablet", "width": 1024, "height": 900},
    {"key": "mobile", "width": 390, "height": 844},
]


def print_help() -> None:
    print(
        """
UXA12 cutover smoke

Optional:
  LEAN_UXA12_BASE_URL                    default http://127.0.0.1:3200
  LEAN_UXA12_PROJECT_ID                  enables authenticated project route checks
  LEAN_UXA12_AUTH_TOKEN                  used with project route checks
  LEAN_UXA12_WORKSPACE_ID                used with project route checks
  LEAN_UXA12_EXPECT_PRODUCT_EXPERIENCE   set 1 to assert the new product shell on project routes
  LEAN_UXA12_EVIDENCE_DIR                default Docs/system-analysis/evidence/uxa12
""".strip()
    )


def build_routes() -> list[dict[str, object]]:
    routes: list[dict[str, object]] = [
        {
            "key": "mockup_hifi",
            "path": "/mockups/ux-redesign-hifi",
            "requires_auth": False,
            "expect_terms": ["Quien autoriza", "Descubrir", "Blueprint"],
        }
    ]

    if PROJECT_ID:
        stage_expect_terms = {
            "discover": ["Descubrir: problema y contexto", "Segmento de Atencion"],
            "define": ["Definir: objetivos, alcance y requisitos", "Segmento de Atencion"],
            "design": ["Disenar: arquitectura y comportamiento", "Segmento de Atencion"],
            "tools": ["Herramientas: capacidades minimas", "Segmento de Atencion"],
            "memory": ["Memoria: conocimiento y contexto", "Segmento de Atencion"],
            "estimate": ["Estimar valor, costo y ROI", "Atencion"],
        }
        for stage in ["discover", "define", "design", "tools", "memory", "estimate"]:
            routes.append(
                {
                    "key": f"project_{stage}",
                    "path": f"/projects/{PROJECT_ID}/work/{stage}",
                    "requires_auth": True,
                    "expect_terms": stage_expect_terms[stage] if EXPECT_PRODUCT_EXPERIENCE else [],
                }
            )

        for product in ["blueprint", "diagrams", "attention", "acp"]:
            routes.append(
                {
                    "key": f"product_{product}",
                    "path": f"/projects/{PROJECT_ID}/{product}",
                    "requires_auth": True,
                    "expect_terms": ["Atencion"] if EXPECT_PRODUCT_EXPERIENCE else [],
                }
            )

    return routes


def collect_metrics(page) -> dict[str, object]:
    return page.evaluate(
        """
        () => ({
          bodyTextLength: document.body.innerText.length,
          focusableCount: document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
          h1Count: document.querySelectorAll('h1').length,
          height: document.documentElement.scrollHeight,
          hasMain: Boolean(document.querySelector('main')),
          width: document.documentElement.scrollWidth,
        })
        """
    )


def visible_text(page, selector: str, limit: int = 24) -> list[str]:
    return page.locator(selector).evaluate_all(
        """
        (nodes, limit) => nodes
          .filter((node) => {
            const style = window.getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
          })
          .map((node) => (node.innerText || node.textContent || '').trim())
          .filter(Boolean)
          .slice(0, limit)
        """,
        limit,
    )


def wait_for_route_ready(page, route: dict[str, object]) -> None:
    try:
        page.wait_for_function(
            """
            () => {
              const text = document.body.innerText || "";
              return !text.includes("Recuperando acceso")
                && !text.includes("Preparando tu workspace")
                && !text.includes("Preparando Discover")
                && !text.includes("Preparando Definir")
                && !text.includes("Preparando Disenar")
                && !text.includes("Preparando Herramientas")
                && !text.includes("Preparando Memoria")
                && !text.includes("Preparando Estimar");
            }
            """,
            timeout=30_000,
        )
    except PlaywrightTimeoutError:
        return

    expected_terms = route["expect_terms"]
    if expected_terms:
        try:
            page.wait_for_function(
                """
                (terms) => {
                  const text = document.body.innerText || "";
                  return terms.every((term) => text.includes(term));
                }
                """,
                arg=expected_terms,
                timeout=10_000,
            )
        except PlaywrightTimeoutError:
            return


def run() -> None:
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    screenshots_dir = EVIDENCE_DIR / "browser"
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    routes = build_routes()
    report: dict[str, object] = {
        "base_url": BASE_URL,
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "project_routes_enabled": bool(PROJECT_ID),
        "project_routes_skipped_reason": "" if PROJECT_ID else "LEAN_UXA12_PROJECT_ID no definido.",
        "routes": {},
        "status": "passed",
        "viewports": VIEWPORTS,
    }
    failures: list[dict[str, str]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for viewport in VIEWPORTS:
            for route in routes:
                route_key = str(route["key"])
                viewport_key = str(viewport["key"])
                context = browser.new_context(viewport={"width": viewport["width"], "height": viewport["height"]})

                if route["requires_auth"] and AUTH_TOKEN and WORKSPACE_ID:
                    context.add_init_script(
                        """
                        window.localStorage.setItem('lean-builder.auth-token', %s);
                        window.localStorage.setItem('lean-builder.auth-workspace-id', %s);
                        """
                        % (json.dumps(AUTH_TOKEN), json.dumps(WORKSPACE_ID))
                    )

                page = context.new_page()
                console_errors: list[str] = []
                failed_requests: list[str] = []
                page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
                page.on("requestfailed", lambda request: failed_requests.append(request.url))

                navigation_error = ""
                started = time.monotonic()
                try:
                    page.goto(f"{BASE_URL}{route['path']}", wait_until="networkidle", timeout=60_000)
                    wait_for_route_ready(page, route)
                    page.wait_for_timeout(800)
                except PlaywrightTimeoutError as exc:
                    navigation_error = str(exc)

                for _ in range(3):
                    page.keyboard.press("Tab")
                active_element = page.evaluate("() => document.activeElement?.tagName || ''")
                body_text = page.locator("body").inner_text()
                missing_terms = [term for term in route["expect_terms"] if term not in body_text]
                render_failed = "This page couldn't load" in body_text or "Application error" in body_text
                screenshot_path = screenshots_dir / f"{viewport_key}-{route_key}.png"
                page.screenshot(path=screenshot_path, full_page=True)

                key = f"{viewport_key}:{route_key}"
                report["routes"][key] = {
                    "active_element_after_tabs": active_element,
                    "console_errors": console_errors,
                    "duration_ms": round((time.monotonic() - started) * 1000),
                    "failed_requests": failed_requests,
                    "final_url": page.url,
                    "headings": visible_text(page, "h1, h2, h3"),
                    "metrics": collect_metrics(page),
                    "missing_terms": missing_terms,
                    "navigation_error": navigation_error,
                    "render_failed": render_failed,
                    "screenshot": str(screenshot_path.relative_to(EVIDENCE_DIR)).replace("\\", "/"),
                }

                if navigation_error or render_failed or missing_terms or console_errors:
                    failures.append({"route": key, "reason": navigation_error or "visual/content smoke failed"})

                page.close()
                context.close()
        browser.close()

    if failures:
        report["status"] = "failed"
        report["failures"] = failures

    output_path = EVIDENCE_DIR / "browser-smoke.json"
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"status": report["status"], "evidence": str(output_path), "failures": len(failures)}, indent=2))

    if failures:
        sys.exit(2)


if __name__ == "__main__":
    if "--help" in sys.argv or "-h" in sys.argv:
        print_help()
        sys.exit(0)

    run()
