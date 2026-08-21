import json
import os
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[3]
DEFAULT_EVIDENCE_DIR = ROOT / "Docs" / "system-analysis" / "evidence" / "diagram-readability-final"


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


BASE_URL = env("LEAN_DLG14_BASE_URL", "http://127.0.0.1:3200").rstrip("/")
API_ORIGIN = env("LEAN_DLG14_API_ORIGIN", "http://127.0.0.1:8000").rstrip("/")
PROJECT_ID = env("LEAN_DLG14_PROJECT_ID")
EVIDENCE_DIR = Path(env("LEAN_DLG14_EVIDENCE_DIR") or DEFAULT_EVIDENCE_DIR)

VIEWPORTS = [
    {"key": "desktop", "width": 1440, "height": 960},
    {"key": "tablet", "width": 1024, "height": 900},
]


def fail(message: str) -> None:
    print(f"DLG14 diagram readability smoke failed: {message}", file=sys.stderr)
    sys.exit(2)


def normalize_text(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    return "".join(char for char in decomposed if not unicodedata.combining(char)).lower()


def print_help() -> None:
    print(
        """
DLG14 diagram readability smoke

Required for real project routes:
  LEAN_DLG14_PROJECT_ID
  LEAN_DLG14_AUTH_TOKEN + LEAN_DLG14_WORKSPACE_ID
  or LEAN_DLG14_EMAIL + LEAN_DLG14_PASSWORD

Optional:
  LEAN_DLG14_BASE_URL      default http://127.0.0.1:3200
  LEAN_DLG14_API_ORIGIN    default http://127.0.0.1:8000
  LEAN_DLG14_EVIDENCE_DIR  default Docs/system-analysis/evidence/diagram-readability-final

Without project/auth env, the script still validates the public mockup route and records
project routes as skipped instead of inventing a session.
""".strip()
    )


def login() -> tuple[str | None, str | None]:
    token = env("LEAN_DLG14_AUTH_TOKEN")
    workspace_id = env("LEAN_DLG14_WORKSPACE_ID")
    if token and workspace_id:
        return token, workspace_id

    email = env("LEAN_DLG14_EMAIL", "admin@leanbuilder.local")
    password = env("LEAN_DLG14_PASSWORD", "LeanBuilder123!")
    if not email or not password:
        return None, None

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
    except (urllib.error.URLError, TimeoutError, KeyError):
        return None, None

    return data.get("access_token"), data.get("user", {}).get("active_workspace_id")


def build_routes(has_auth: bool) -> list[dict[str, object]]:
    routes: list[dict[str, object]] = [
        {
            "key": "mockup_diagram_viewer",
            "path": "/mockups/diagram-viewer-final",
            "requires_auth": False,
            "terms": ["Catalogo", "Visor"],
            "kind": "diagram_viewer",
        },
        {
            "key": "settings_diagram_governance",
            "path": "/settings/diagram-governance",
            "requires_auth": True,
            "terms": ["Diagram", "PromptSpec"],
            "kind": "governance",
        },
    ]

    if PROJECT_ID:
        routes.extend(
            [
                {
                    "key": "blueprint",
                    "path": f"/projects/{PROJECT_ID}/blueprint",
                    "requires_auth": True,
                    "terms": ["Blueprint", "Diagramas"],
                    "kind": "product",
                },
                {
                    "key": "diagram_center",
                    "path": f"/projects/{PROJECT_ID}/diagrams",
                    "requires_auth": True,
                    "terms": ["Catalogo", "Visor"],
                    "kind": "diagram_center",
                },
                {
                    "key": "blueprint_pro",
                    "path": f"/projects/{PROJECT_ID}/blueprint/pro",
                    "requires_auth": True,
                    "terms": ["Blueprint"],
                    "kind": "product",
                },
                {
                    "key": "acp",
                    "path": f"/projects/{PROJECT_ID}/acp",
                    "requires_auth": True,
                    "terms": ["ACP"],
                    "kind": "product",
                },
            ]
        )

    if not has_auth:
        for route in routes:
            if route["requires_auth"]:
                route["skipped"] = "auth_unavailable"

    return routes


def wait_ready(page) -> None:
    page.wait_for_load_state("networkidle")
    try:
        page.wait_for_function(
            """
            () => {
              const text = document.body.innerText || "";
              return !text.includes("Recuperando acceso")
                && !text.includes("Preparando tu workspace")
                && !text.includes("Loading")
                && !text.includes("Cargando");
            }
            """,
            timeout=30_000,
        )
    except PlaywrightTimeoutError:
        pass


def collect_metrics(page, kind: str) -> dict[str, object]:
    return page.evaluate(
        """
        (kind) => {
          const viewport = document.querySelector('[aria-label*="Vista desplazable"], [aria-label*="Scrollable view"], [class*="canvas"]');
          const diagramImage = document.querySelector('img[alt*="Diagrama"], img[alt*="Diagram"], svg');
          const controls = Array.from(document.querySelectorAll('button, select, input'))
            .map((node) => (node.innerText || node.getAttribute('aria-label') || node.getAttribute('placeholder') || '').trim())
            .filter(Boolean);
          const body = document.body.innerText || "";
          const doc = document.documentElement;
          const mainOverflow = doc.scrollWidth > doc.clientWidth + 8;
          return {
            bodyTextLength: body.length,
            canvasControls: controls.filter((text) => /ajustar|tama|vista|fit|actual|wide|regener|legibilidad|readability|zoom/i.test(text)).slice(0, 20),
            catalogFilters: controls.filter((text) => /buscar|search|categoria|category|etapa|stage|tipo|type|dispon/i.test(text)).slice(0, 20),
            downloadControls: controls.filter((text) => /download|descargar|svg|json|export/i.test(text)).slice(0, 20),
            hasDiagramSurface: Boolean(viewport || diagramImage),
            hasHorizontalOverflow: mainOverflow,
            hasLayoutUpgradeCopy: /legibilidad|readability|layout upgrade|actualizar legibilidad/i.test(body),
            hasProtectedPreviewCopy: /bloquead|locked|preview|vista previa|protegida|protected/i.test(body),
            height: doc.scrollHeight,
            kind,
            width: doc.scrollWidth,
          };
        }
        """,
        kind,
    )


def try_i18n_toggle(page) -> dict[str, object]:
    before = page.locator("body").inner_text(timeout=5_000)
    buttons = page.get_by_role("button").all()
    candidates = []
    for button in buttons[:80]:
        try:
            label = button.inner_text(timeout=500).strip()
        except PlaywrightTimeoutError:
            continue
        if label in {"ES", "EN", "PT"} or "ES" in label or "EN" in label:
            candidates.append(button)

    toggled = False
    for candidate in candidates[:2]:
        try:
            candidate.click(timeout=1_500)
            page.wait_for_timeout(300)
            toggled = True
            break
        except PlaywrightTimeoutError:
            continue

    after = page.locator("body").inner_text(timeout=5_000)
    return {
        "attempted": bool(candidates),
        "changed": toggled and before != after,
        "candidate_count": len(candidates),
    }


def run() -> int:
    if "--help" in sys.argv:
        print_help()
        return 0

    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    token, workspace_id = login()
    has_auth = bool(token and workspace_id)
    routes = build_routes(has_auth)
    results: list[dict[str, object]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for viewport in VIEWPORTS:
            context = browser.new_context(viewport={"width": viewport["width"], "height": viewport["height"]})
            if has_auth:
                context.add_init_script(
                    f"""
                    window.localStorage.setItem("lean-builder.auth-token", {json.dumps(token)});
                    window.localStorage.setItem("lean-builder.auth-workspace-id", {json.dumps(workspace_id)});
                    window.localStorage.setItem("antigravity_language", "es");
                    """,
                )
            page = context.new_page()

            for route in routes:
                record = {
                    "key": route["key"],
                    "path": route["path"],
                    "viewport": viewport["key"],
                    "status": "pending",
                    "missing_terms": [],
                    "metrics": {},
                    "screenshot": "",
                }
                if route.get("skipped"):
                    record["status"] = "skipped"
                    record["reason"] = route["skipped"]
                    results.append(record)
                    continue

                try:
                    page.goto(f"{BASE_URL}{route['path']}", wait_until="domcontentloaded", timeout=45_000)
                    wait_ready(page)
                    text = page.locator("body").inner_text(timeout=10_000)
                    normalized_text = normalize_text(text)
                    missing_terms = [term for term in route["terms"] if normalize_text(term) not in normalized_text]
                    screenshot_path = EVIDENCE_DIR / f"{viewport['key']}-{route['key']}.png"
                    page.screenshot(path=str(screenshot_path), full_page=True)
                    record["missing_terms"] = missing_terms
                    record["metrics"] = collect_metrics(page, str(route["kind"]))
                    record["i18n"] = try_i18n_toggle(page) if route["kind"] in {"diagram_center", "diagram_viewer"} else {}
                    record["screenshot"] = str(screenshot_path.relative_to(ROOT))
                    record["status"] = "ok" if not missing_terms else "warning"
                except Exception as exc:  # noqa: BLE001 - evidence script must record all browser failures.
                    record["status"] = "error"
                    record["error"] = repr(exc)

                results.append(record)

            context.close()
        browser.close()

    report = {
        "base_url": BASE_URL,
        "project_id": PROJECT_ID,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "has_auth": has_auth,
        "results": results,
    }
    (EVIDENCE_DIR / "browser-smoke-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    blocking = [
        result
        for result in results
        if result["status"] == "error"
        or (
            result["status"] == "ok"
            and isinstance(result.get("metrics"), dict)
            and result["metrics"].get("hasHorizontalOverflow")
            and result.get("key") in {"diagram_center", "blueprint", "mockup_diagram_viewer"}
        )
    ]
    return 1 if blocking else 0


if __name__ == "__main__":
    raise SystemExit(run())
