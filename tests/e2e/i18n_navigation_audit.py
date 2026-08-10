import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from itertools import combinations
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[3]
FRONTEND_SRC = ROOT / "frontend" / "src"
DEFAULT_EVIDENCE_DIR = ROOT / "Docs" / "system-analysis" / "evidence" / "i18n-nav-audit"
SOURCE_MATCH_CACHE: dict[str, list[str]] = {}


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


BASE_URL = env("LEAN_I18N_BASE_URL", "http://127.0.0.1:3200").rstrip("/")
API_ORIGIN = env("LEAN_I18N_API_ORIGIN", "http://127.0.0.1:8000").rstrip("/")
EMAIL = env("LEAN_I18N_EMAIL", "admin@leanbuilder.local")
PASSWORD = env("LEAN_I18N_PASSWORD", "LeanBuilder123!")
SESSION_ID = env("LEAN_I18N_SESSION_ID")
ROUTE_KEYS = {key.strip() for key in env("LEAN_I18N_ROUTE_KEYS").split(",") if key.strip()}
EVIDENCE_DIR = Path(env("LEAN_I18N_EVIDENCE_DIR") or DEFAULT_EVIDENCE_DIR)

LANGUAGES = ["es", "en", "pt"]
LANGUAGE_LABELS = {
    "es": "Español",
    "en": "English",
    "pt": "Português",
}

ALLOWLIST = {
    "acp",
    "blueprint",
    "blueprint pro",
    "es",
    "en",
    "pt",
    "lb",
    "llm",
    "lean workspace",
}

LANGUAGE_LEAK_PATTERNS = {
    "es": [
        "discover",
        "define",
        "design",
        "tools",
        "memory & knowledge",
        "save draft",
        "current task",
        "generated result",
        "evidence & traceability",
        "reload",
        "attention",
        "activity",
        "goals and scope",
        "problem and context",
        "capabilities & contracts",
        "value, cost & roi",
    ],
    "en": [
        "descubrir",
        "definir",
        "disenar",
        "diseñar",
        "herramientas",
        "memoria",
        "guardar borrador",
        "tarea actual",
        "resultado generado",
        "evidencia y trazabilidad",
        "recargar",
        "atencion",
        "atención",
        "actividad",
        "problema y contexto",
        "objetivos y alcance",
        "capacidades y contratos",
        "valor, costo y roi",
    ],
    "pt": [
        "descubrir",
        "discover",
        "herramientas",
        "tools",
        "save draft",
        "guardar borrador",
        "current task",
        "tarea actual",
        "generated result",
        "resultado generado",
        "evidence & traceability",
        "evidencia y trazabilidad",
        "reload",
        "recargar",
        "attention",
        "atencion",
        "activity",
        "actividad",
    ],
}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def to_ascii(value: str) -> str:
    replacements = str.maketrans({
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "Á": "A",
        "É": "E",
        "Í": "I",
        "Ó": "O",
        "Ú": "U",
        "ñ": "n",
        "Ñ": "N",
        "ç": "c",
        "Ç": "C",
        "ã": "a",
        "õ": "o",
        "â": "a",
        "ê": "e",
        "ô": "o",
    })
    return normalize_text(value.translate(replacements)).lower()


def fail(message: str) -> None:
    print(f"I18N navigation audit failed: {message}", file=sys.stderr)
    sys.exit(2)


def api_json(method: str, path: str, *, token: str | None = None, body: dict | None = None) -> dict:
    url = f"{API_ORIGIN}{path}"
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, data=payload, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="ignore")
        fail(f"{method.upper()} {path} devolvió {exc.code}: {details}")
    except urllib.error.URLError as exc:
        fail(f"no se pudo llamar {url}: {exc}")


def login() -> tuple[str, str]:
    response = api_json("POST", "/api/v1/auth/login", body={"email": EMAIL, "password": PASSWORD})
    token = response["access_token"]
    workspace_id = response["user"]["active_workspace_id"]
    return token, workspace_id


def ensure_session(token: str) -> tuple[str, str]:
    if SESSION_ID:
        snapshot = api_json("GET", f"/api/v1/sessions/{SESSION_ID}", token=token)
        summary = snapshot["session"]
        return summary["id"], summary["title"]

    listing = api_json(
        "GET",
        "/api/v1/sessions?limit=1&lifecycle=active&sort=updated_desc",
        token=token,
    )
    items = listing.get("items") or []
    if items:
        first = items[0]
        return first["id"], first["title"]

    created = api_json("POST", "/api/v1/sessions", token=token)
    return created["id"], created["title"]


def build_routes(session_id: str) -> list[dict[str, object]]:
    return [
        {
            "key": "login",
            "path": "/login",
            "requires_auth": False,
            "components": [
                "src/components/lean/auth-pages.tsx",
                "src/components/lean/language-selector.tsx",
            ],
        },
        {
            "key": "home",
            "path": "/",
            "requires_auth": True,
            "components": [
                "src/features/productization/saas-home-page.tsx",
                "src/components/lean/shell.tsx",
            ],
        },
        {
            "key": "projects",
            "path": "/projects",
            "requires_auth": True,
            "components": [
                "src/features/projects/project-portfolio-page.tsx",
                "src/features/projects/components/project-toolbar.tsx",
                "src/features/projects/components/project-table.tsx",
                "src/features/projects/components/project-mobile-list.tsx",
            ],
        },
        {
            "key": "templates",
            "path": "/templates",
            "requires_auth": True,
            "components": [
                "src/features/templates/templates-workspace.tsx",
            ],
        },
        {
            "key": "evaluations",
            "path": "/evaluations",
            "requires_auth": True,
            "components": [
                "src/features/evaluation/evaluations-workspace.tsx",
            ],
        },
        {
            "key": "monitoring",
            "path": "/monitoring",
            "requires_auth": True,
            "components": [
                "src/features/operations/monitoring-page.tsx",
            ],
        },
        {
            "key": "library",
            "path": "/library",
            "requires_auth": True,
            "components": [
                "src/features/operations/library-page.tsx",
            ],
        },
        {
            "key": "integrations",
            "path": "/integrations",
            "requires_auth": True,
            "components": [
                "src/features/operations/integrations-page.tsx",
            ],
        },
        {
            "key": "settings",
            "path": "/settings",
            "requires_auth": True,
            "components": [
                "src/features/operations/settings-page.tsx",
                "src/features/operations/components/settings-tabs-nav.tsx",
            ],
        },
        {
            "key": "work_discover",
            "path": f"/projects/{session_id}/work/discover",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/product-experience/stage-screen/lean-stage-screen.tsx",
                "src/features/product-experience/discover/discover-stage-view.tsx",
            ],
        },
        {
            "key": "work_define",
            "path": f"/projects/{session_id}/work/define",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/product-experience/stage-screen/lean-stage-screen.tsx",
                "src/features/product-experience/define/define-stage-view.tsx",
            ],
        },
        {
            "key": "work_design",
            "path": f"/projects/{session_id}/work/design",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/product-experience/stage-screen/lean-stage-screen.tsx",
                "src/features/product-experience/design/design-stage-view.tsx",
            ],
        },
        {
            "key": "work_tools",
            "path": f"/projects/{session_id}/work/tools",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/product-experience/stage-screen/lean-stage-screen.tsx",
                "src/features/product-experience/tools/tools-stage-view.tsx",
            ],
        },
        {
            "key": "work_memory",
            "path": f"/projects/{session_id}/work/memory",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/product-experience/stage-screen/lean-stage-screen.tsx",
                "src/features/product-experience/memory/memory-stage-view.tsx",
            ],
        },
        {
            "key": "work_estimate",
            "path": f"/projects/{session_id}/work/estimate",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/product-experience/stage-screen/lean-stage-screen.tsx",
                "src/features/product-experience/saas/saas-product-views.tsx",
            ],
        },
        {
            "key": "product_blueprint",
            "path": f"/projects/{session_id}/blueprint",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/product-experience/saas/saas-product-views.tsx",
            ],
        },
        {
            "key": "product_blueprint_pro",
            "path": f"/projects/{session_id}/blueprint/pro",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/product-experience/saas/saas-product-views.tsx",
            ],
        },
        {
            "key": "product_diagrams",
            "path": f"/projects/{session_id}/diagrams",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/diagram-center/presentation/diagram-center-page.tsx",
            ],
        },
        {
            "key": "product_acp",
            "path": f"/projects/{session_id}/acp",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/product-experience/saas/saas-product-views.tsx",
            ],
        },
        {
            "key": "product_artifacts",
            "path": f"/projects/{session_id}/artifacts",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/product-experience/saas/saas-product-views.tsx",
            ],
        },
        {
            "key": "product_attention",
            "path": f"/projects/{session_id}/attention",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/product-experience/attention/attention-components.tsx",
                "src/features/product-experience/saas/saas-product-views.tsx",
            ],
        },
        {
            "key": "product_activity",
            "path": f"/projects/{session_id}/activity",
            "requires_auth": True,
            "components": [
                "src/features/product-experience/shell/project-workspace-shell.tsx",
                "src/features/product-experience/saas/saas-product-views.tsx",
            ],
        },
    ]


def visible_texts(page, selector: str, limit: int = 200) -> list[str]:
    texts = page.locator(selector).evaluate_all(
        """
        (nodes, limit) => {
          const clean = (value) => value.replace(/\\s+/g, " ").trim();
          const seen = new Set();
          const values = [];
          for (const node of nodes) {
            const style = window.getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            if (style.visibility === "hidden" || style.display === "none" || rect.width <= 0 || rect.height <= 0) {
              continue;
            }
            const text = clean(node.innerText || node.textContent || "");
            if (!text || seen.has(text)) {
              continue;
            }
            seen.add(text);
            values.push(text);
            if (values.length >= limit) {
              break;
            }
          }
          return values;
        }
        """,
        limit,
    )
    return [normalize_text(text) for text in texts if normalize_text(text)]


def wait_for_route_ready(page) -> None:
    try:
        page.wait_for_function(
            """
            () => {
              const text = document.body.innerText || "";
              return !text.includes("Recuperando acceso")
                && !text.includes("Recovering access")
                && !text.includes("Recuperando acesso")
                && !text.includes("Redirigiendo al login")
                && !text.includes("Redirecting to login")
                && !text.includes("Redirecionando para o login");
            }
            """,
            timeout=30_000,
        )
    except PlaywrightTimeoutError:
        return


def collect_ui_groups(page) -> dict[str, list[str]]:
    return {
        "headings": visible_texts(page, "h1, h2, h3"),
        "buttons": visible_texts(page, "button"),
        "nav": visible_texts(page, "nav a, nav button, aside a, aside button"),
        "links": visible_texts(page, "a[href]"),
    }


def contains_foreign_language_text(language: str, text: str) -> bool:
    lowered = to_ascii(text)
    return any(pattern in lowered for pattern in LANGUAGE_LEAK_PATTERNS[language])


def should_ignore_text(text: str, session_title: str) -> bool:
    normalized = normalize_text(text)
    ascii_text = to_ascii(normalized)
    if not normalized or len(normalized) < 3 or len(normalized) > 140:
        return True
    if ascii_text in ALLOWLIST:
        return True
    if to_ascii(session_title) and to_ascii(session_title) in ascii_text:
        return True
    if re.fullmatch(r"[\d\s.%:+/\\-]+", normalized):
        return True
    if re.fullmatch(r"[A-Z]{1,3}", normalized):
        return True
    return False


def search_source_matches(text: str) -> list[str]:
    if not text:
        return []
    cached = SOURCE_MATCH_CACHE.get(text)
    if cached is not None:
        return cached
    try:
        result = subprocess.run(
            ["rg", "-nF", text, str(FRONTEND_SRC)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            check=False,
        )
    except FileNotFoundError:
        return []

    matches: list[str] = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if line:
            matches.append(line.replace(str(ROOT) + "\\", ""))
        if len(matches) >= 8:
            break
    SOURCE_MATCH_CACHE[text] = matches
    return matches


def route_document_metrics(page) -> dict[str, object]:
    return page.evaluate(
        """
        () => ({
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          focusableCount: document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
          hasMain: Boolean(document.querySelector('main')),
          bodyTextLength: (document.body.innerText || '').length,
        })
        """
    )


def route_body_excerpt(page) -> str:
    try:
        text = normalize_text(page.locator("body").inner_text())
    except Exception:
        return ""
    return text[:1200]


def set_language_and_reload(page, language: str, path: str) -> None:
    page.evaluate(
        """
        (lang) => {
          window.localStorage.setItem("antigravity_language", lang);
          document.cookie = `antigravity_language=${lang}; path=/; SameSite=Lax`;
        }
        """,
        language,
    )
    page.goto(f"{BASE_URL}{path}", wait_until="networkidle", timeout=60_000)
    wait_for_route_ready(page)
    page.wait_for_timeout(1200)


def analyze_route_languages(route: dict[str, object], session_title: str, route_languages: dict[str, dict[str, object]]) -> dict[str, object]:
    pairwise_shared: dict[str, list[dict[str, object]]] = {}
    all_text_sets = {
        language: {
            normalize_text(text)
            for group in route_languages[language]["groups"].values()
            for text in group
        }
        for language in LANGUAGES
    }

    for left, right in combinations(LANGUAGES, 2):
        shared_entries: list[dict[str, object]] = []
        shared = sorted(all_text_sets[left] & all_text_sets[right])
        for text in shared:
            if should_ignore_text(text, session_title):
                continue
            source_matches = search_source_matches(text)
            if not source_matches:
                continue
            shared_entries.append(
                {
                    "text": text,
                    "source_matches": source_matches,
                }
            )
        pairwise_shared[f"{left}_{right}"] = shared_entries

    shared_all: list[dict[str, object]] = []
    for text in sorted(set.intersection(*all_text_sets.values())):
        if should_ignore_text(text, session_title):
            continue
        source_matches = search_source_matches(text)
        if not source_matches:
            continue
        shared_all.append(
            {
                "text": text,
                "source_matches": source_matches,
            }
        )

    foreign_language_leaks: dict[str, list[dict[str, object]]] = {}
    for language in LANGUAGES:
        leaks: list[dict[str, object]] = []
        seen: set[str] = set()
        for group_name, texts in route_languages[language]["groups"].items():
            for text in texts:
                normalized = normalize_text(text)
                if normalized in seen or should_ignore_text(normalized, session_title):
                    continue
                if contains_foreign_language_text(language, normalized):
                    seen.add(normalized)
                    leaks.append(
                        {
                            "group": group_name,
                            "text": normalized,
                            "source_matches": search_source_matches(normalized),
                        }
                    )
        foreign_language_leaks[language] = leaks

    has_findings = any(pairwise_shared.values()) or any(foreign_language_leaks.values())
    return {
        "components": route["components"],
        "foreign_language_leaks": foreign_language_leaks,
        "has_findings": has_findings,
        "pairwise_shared": pairwise_shared,
        "shared_all_languages": shared_all,
    }


def run() -> None:
    token, workspace_id = login()
    session_id, session_title = ensure_session(token)
    routes = build_routes(session_id)
    if ROUTE_KEYS:
        routes = [route for route in routes if route["key"] in ROUTE_KEYS]

    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    screenshots_dir = EVIDENCE_DIR / "browser"
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    report: dict[str, object] = {
        "api_origin": API_ORIGIN,
        "base_url": BASE_URL,
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "languages": LANGUAGES,
        "routes": {},
        "seed_email": EMAIL,
        "session": {
            "id": session_id,
            "title": session_title,
        },
        "workspace_id": workspace_id,
    }

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for route in routes:
            context = browser.new_context(viewport={"width": 1600, "height": 1024})
            if route["requires_auth"]:
                context.add_init_script(
                    """
                    window.localStorage.setItem('lean-builder.auth-token', %s);
                    window.localStorage.setItem('lean-builder.auth-workspace-id', %s);
                    if (!window.localStorage.getItem('antigravity_language')) {
                      window.localStorage.setItem('antigravity_language', 'es');
                    }
                    document.cookie = 'antigravity_language=es; path=/; SameSite=Lax';
                    """
                    % (json.dumps(token), json.dumps(workspace_id))
                )
            else:
                context.add_init_script(
                    """
                    window.localStorage.removeItem('lean-builder.auth-token');
                    window.localStorage.removeItem('lean-builder.auth-workspace-id');
                    if (!window.localStorage.getItem('antigravity_language')) {
                      window.localStorage.setItem('antigravity_language', 'es');
                    }
                    document.cookie = 'antigravity_language=es; path=/; SameSite=Lax';
                    """
                )
            page = context.new_page()
            console_errors: list[str] = []
            failed_requests: list[str] = []
            page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
            page.on("requestfailed", lambda request: failed_requests.append(request.url))

            route_languages: dict[str, dict[str, object]] = {}
            navigation_error = ""
            for index, language in enumerate(LANGUAGES):
                try:
                    if index == 0:
                        page.goto(f"{BASE_URL}{route['path']}", wait_until="networkidle", timeout=60_000)
                        wait_for_route_ready(page)
                        page.wait_for_timeout(1200)
                    else:
                        set_language_and_reload(page, language, route["path"])
                except PlaywrightTimeoutError as exc:
                    navigation_error = str(exc)

                screenshot_path = screenshots_dir / f"{route['key']}-{language}.png"
                try:
                    page.screenshot(path=screenshot_path, full_page=True, timeout=5_000)
                    screenshot_relative = str(screenshot_path.relative_to(EVIDENCE_DIR)).replace("\\", "/")
                except PlaywrightTimeoutError:
                    screenshot_relative = ""
                route_languages[language] = {
                    "body_excerpt": route_body_excerpt(page),
                    "final_url": page.url,
                    "groups": collect_ui_groups(page),
                    "metrics": route_document_metrics(page),
                    "screenshot": screenshot_relative,
                }

            analysis = analyze_route_languages(route, session_title, route_languages)
            report["routes"][route["key"]] = {
                "components": route["components"],
                "console_errors": console_errors,
                "failed_requests": failed_requests,
                "final_url": route_languages["pt"]["final_url"],
                "languages": route_languages,
                "navigation_error": navigation_error,
                "path": route["path"],
                "requires_auth": route["requires_auth"],
                "translation_analysis": analysis,
            }
            output_path = EVIDENCE_DIR / "i18n-navigation-audit.v2.json"
            output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            page.close()
            context.close()
        browser.close()

    output_path = EVIDENCE_DIR / "i18n-navigation-audit.v2.json"
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"status": "ok", "evidence": str(output_path), "route_count": len(routes)}, indent=2))


if __name__ == "__main__":
    run()
