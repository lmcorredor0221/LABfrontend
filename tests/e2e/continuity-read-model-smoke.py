"""Read-only browser smoke for product experience rehydration.

Requires a local authenticated project. It never clicks a product CTA or submits a form.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[3]
BASE_URL = os.environ.get("LEAN_CONTINUITY_BASE_URL", "http://127.0.0.1:3200").rstrip("/")
PROJECT_ID = os.environ.get("LEAN_CONTINUITY_PROJECT_ID", "").strip()
AUTH_TOKEN = os.environ.get("LEAN_CONTINUITY_AUTH_TOKEN", "").strip()
WORKSPACE_ID = os.environ.get("LEAN_CONTINUITY_WORKSPACE_ID", "").strip()
EVIDENCE_DIR = Path(os.environ.get("LEAN_CONTINUITY_EVIDENCE_DIR") or ROOT / "Docs" / "system-analysis" / "evidence" / "continuity")


def require_environment() -> None:
    missing = [
        name
        for name, value in {
            "LEAN_CONTINUITY_PROJECT_ID": PROJECT_ID,
            "LEAN_CONTINUITY_AUTH_TOKEN": AUTH_TOKEN,
            "LEAN_CONTINUITY_WORKSPACE_ID": WORKSPACE_ID,
        }.items()
        if not value
    ]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")


def run() -> dict[str, object]:
    require_environment()
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    routes = {
        "blueprint_free": f"/projects/{PROJECT_ID}/blueprint",
        "blueprint_pro": f"/projects/{PROJECT_ID}/blueprint/pro",
        "acp": f"/projects/{PROJECT_ID}/acp",
    }
    report: dict[str, object] = {
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "routes": {},
        "status": "passed",
    }
    failures: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for route_key, path in routes.items():
            context = browser.new_context(viewport={"width": 1440, "height": 980})
            context.add_init_script(
                """
                window.localStorage.setItem('lean-builder.auth-token', token);
                window.localStorage.setItem('lean-builder.auth-workspace-id', workspaceId);
                """,
                {"token": AUTH_TOKEN, "workspaceId": WORKSPACE_ID},
            )
            page = context.new_page()
            requests: list[dict[str, str]] = []
            console_errors: list[str] = []
            page.on("request", lambda request: requests.append({"method": request.method, "url": request.url}))
            page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
            page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded", timeout=60_000)
            page.wait_for_timeout(3_000)
            body_text = page.locator("body").inner_text()
            initial_request_count = len(requests)

            page.evaluate(
                """
                () => {
                  window.dispatchEvent(new Event('focus'));
                  window.dispatchEvent(new Event('online'));
                  document.dispatchEvent(new Event('visibilitychange'));
                }
                """
            )
            page.wait_for_timeout(1_500)
            revalidation_requests = requests[initial_request_count:]
            methods = sorted({request["method"] for request in revalidation_requests})
            screenshot = EVIDENCE_DIR / f"{route_key}.png"
            page.screenshot(path=screenshot, full_page=True)
            is_login = "/login" in page.url
            has_read = "GET" in methods
            has_mutation = any(method not in {"GET", "HEAD", "OPTIONS"} for method in methods)
            report["routes"][route_key] = {
                "final_url": page.url,
                "is_login": is_login,
                "console_errors": console_errors,
                "initial_request_count": initial_request_count,
                "revalidation_methods": methods,
                "revalidation_request_count": len(revalidation_requests),
                "screenshot": screenshot.name,
            }
            if is_login or not has_read or has_mutation or console_errors:
                failures.append(route_key)
            page.close()
            context.close()
        browser.close()

    if failures:
        report["status"] = "failed"
        report["failures"] = failures
    return report


if __name__ == "__main__":
    try:
        result = run()
    except Exception as exc:  # Keep CI output concise while preserving a nonzero result.
        print(json.dumps({"status": "failed", "error": str(exc)}, ensure_ascii=False))
        sys.exit(1)
    output = EVIDENCE_DIR / "continuity-read-model-smoke.json"
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"status": result["status"], "evidence": str(output)}, ensure_ascii=False))
    sys.exit(0 if result["status"] == "passed" else 1)
