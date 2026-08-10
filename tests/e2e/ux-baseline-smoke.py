import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[3]
DEFAULT_EVIDENCE_DIR = ROOT / "Docs" / "system-analysis" / "evidence" / "uxa0"


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


BASE_URL = env("LEAN_UXA0_BASE_URL", "http://127.0.0.1:3200").rstrip("/")
API_ORIGIN = env("LEAN_UXA0_API_ORIGIN", "http://127.0.0.1:8000").rstrip("/")
PROJECT_ID = env("LEAN_UXA0_PROJECT_ID")
EVIDENCE_DIR = Path(env("LEAN_UXA0_EVIDENCE_DIR") or DEFAULT_EVIDENCE_DIR)

VIEWPORTS = [
    {"key": "desktop", "width": 1600, "height": 1000},
    {"key": "tablet", "width": 1024, "height": 900},
    {"key": "mobile", "width": 390, "height": 844},
]


def fail(message: str) -> None:
    print(f"UXA0 baseline smoke failed: {message}", file=sys.stderr)
    sys.exit(2)


def print_help() -> None:
    print(
        """
UXA0 baseline smoke

Required:
  LEAN_UXA0_PROJECT_ID
  LEAN_UXA0_AUTH_TOKEN + LEAN_UXA0_WORKSPACE_ID
  or LEAN_UXA0_EMAIL + LEAN_UXA0_PASSWORD

Optional:
  LEAN_UXA0_BASE_URL      default http://127.0.0.1:3200
  LEAN_UXA0_API_ORIGIN    default http://127.0.0.1:8000
  LEAN_UXA0_EVIDENCE_DIR  default Docs/system-analysis/evidence/uxa0
""".strip()
    )


def login() -> tuple[str, str]:
    token = env("LEAN_UXA0_AUTH_TOKEN")
    workspace_id = env("LEAN_UXA0_WORKSPACE_ID")
    if token and workspace_id:
        return token, workspace_id

    email = env("LEAN_UXA0_EMAIL")
    password = env("LEAN_UXA0_PASSWORD")
    if not email or not password:
        fail("define LEAN_UXA0_AUTH_TOKEN + LEAN_UXA0_WORKSPACE_ID or LEAN_UXA0_EMAIL + LEAN_UXA0_PASSWORD.")

    payload = json.dumps({"email": email, "password": password}).encode("utf-8")
    request = urllib.request.Request(
        f"{API_ORIGIN}/api/v1/auth/login",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = json.load(response)
    except urllib.error.URLError as exc:
        fail(f"no se pudo autenticar contra {API_ORIGIN}: {exc}")

    return data["access_token"], data["user"]["active_workspace_id"]


def build_routes() -> list[dict[str, object]]:
    if not PROJECT_ID:
        fail("define LEAN_UXA0_PROJECT_ID para auditar rutas reales del flujo LEAN.")

    return [
        {"key": "mockup", "path": "/mockups/ux-redesign-hifi", "requires_auth": False},
        {"key": "discover", "path": f"/projects/{PROJECT_ID}/discover", "requires_auth": True},
        {"key": "define", "path": f"/projects/{PROJECT_ID}/define", "requires_auth": True},
        {"key": "design", "path": f"/projects/{PROJECT_ID}/design", "requires_auth": True},
        {"key": "tools", "path": f"/projects/{PROJECT_ID}/tools", "requires_auth": True},
        {"key": "memory", "path": f"/projects/{PROJECT_ID}/memory", "requires_auth": True},
        {"key": "attention", "path": f"/projects/{PROJECT_ID}/attention", "requires_auth": True},
    ]


def visible_texts(page, selector: str) -> list[str]:
    return page.locator(selector).evaluate_all(
        """
        (nodes) => nodes
          .filter((node) => {
            const style = window.getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
          })
          .map((node) => (node.innerText || node.textContent || '').trim())
          .filter(Boolean)
        """
    )


def collect_document_metrics(page) -> dict[str, object]:
    return page.evaluate(
        """
        () => ({
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          bodyTextLength: document.body.innerText.length,
          focusableCount: document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
          formControlCount: document.querySelectorAll('input, select, textarea').length,
          h1Count: document.querySelectorAll('h1').length,
          landmarkCount: document.querySelectorAll('main, nav, aside, header, footer').length,
        })
        """
    )


def wait_for_restored_access(page) -> None:
    try:
        page.wait_for_function(
            "() => !document.body.innerText.includes('Recuperando acceso')",
            timeout=20_000,
        )
    except PlaywrightTimeoutError:
        # The screenshot/report will preserve the stuck transitional state.
        return


def run() -> None:
    routes = build_routes()
    token, workspace_id = login()
    captures_dir = EVIDENCE_DIR / "browser"
    captures_dir.mkdir(parents=True, exist_ok=True)
    report: dict[str, object] = {
        "base_url": BASE_URL,
        "api_origin": API_ORIGIN,
        "project_id": PROJECT_ID,
        "generated_at_epoch_ms": round(time.time() * 1000),
        "viewports": VIEWPORTS,
        "routes": {},
    }

    with sync_playwright() as playwright:
      browser = playwright.chromium.launch(headless=True)
      for viewport in VIEWPORTS:
        for route in routes:
          route_key = str(route["key"])
          viewport_key = str(viewport["key"])
          context = browser.new_context(viewport={"width": viewport["width"], "height": viewport["height"]})
          context.add_init_script(
              """
              window.localStorage.setItem('lean-builder.auth-token', %s);
              window.localStorage.setItem('lean-builder.auth-workspace-id', %s);
              """
              % (json.dumps(token), json.dumps(workspace_id))
          )
          page = context.new_page()
          console_errors: list[str] = []
          failed_requests: list[dict[str, object]] = []
          http_errors: list[dict[str, object]] = []
          page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
          page.on(
              "requestfailed",
              lambda request: failed_requests.append({"url": request.url, "failure": str(request.failure)}),
          )
          page.on(
              "response",
              lambda response: http_errors.append({"url": response.url, "status": response.status})
              if response.status >= 400 and "/api/" in response.url
              else None,
          )
          started = time.monotonic()
          final_url = ""
          navigation_error = ""
          try:
              page.goto(f"{BASE_URL}{route['path']}", wait_until="networkidle", timeout=90_000)
              wait_for_restored_access(page)
              page.wait_for_timeout(1500)
              final_url = page.url
          except PlaywrightTimeoutError as exc:
              navigation_error = str(exc)
              final_url = page.url

          screenshot_path = captures_dir / f"{viewport_key}-{route_key}.png"
          page.screenshot(path=screenshot_path, full_page=True)
          body_text = page.locator("body").inner_text()
          route_report = {
              "path": route["path"],
              "final_url": final_url,
              "duration_ms": round((time.monotonic() - started) * 1000),
              "navigation_error": navigation_error,
              "document": collect_document_metrics(page),
              "headings": visible_texts(page, "h1, h2, h3")[:30],
              "buttons": visible_texts(page, "button")[:40],
              "links": visible_texts(page, "a[href]")[:40],
              "attention_mentions": sum(
                  body_text.lower().count(term)
                  for term in ["atencion", "pregunta", "gap", "decision", "hitl", "bloque"]
              ),
              "console_errors": console_errors,
              "failed_requests": failed_requests,
              "http_errors": http_errors,
              "screenshot": str(screenshot_path.relative_to(EVIDENCE_DIR)),
          }
          report["routes"][f"{viewport_key}:{route_key}"] = route_report
          page.close()
          context.close()
      browser.close()

    output_path = EVIDENCE_DIR / "browser-baseline.json"
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"status": "ok", "evidence": str(output_path), "routes": len(report["routes"])}, indent=2))


if __name__ == "__main__":
    if "--help" in sys.argv or "-h" in sys.argv:
        print_help()
        sys.exit(0)
    run()
