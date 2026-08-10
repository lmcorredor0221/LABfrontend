from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT / "Docs" / "redisenio_visual_2026" / "mockups"
URL = "http://127.0.0.1:3200/mockups/visual-proposals"


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        desktop = browser.new_page(viewport={"width": 1600, "height": 1000}, device_scale_factor=1)
        desktop.goto(URL, wait_until="networkidle")

        expect(desktop.get_by_role("heading", name="Una misma experiencia. Doce identidades.")).to_be_visible()
        tabs = desktop.get_by_role("tab")
        assert tabs.count() == 12, f"Expected 12 theme tabs, found {tabs.count()}"

        for index in range(tabs.count()):
            tabs.nth(index).click()
            expect(tabs.nth(index)).to_have_attribute("aria-selected", "true")
            desktop.screenshot(path=str(OUTPUT / f"{index + 1:02d}-visual-proposal.png"), full_page=True)

        desktop.get_by_role("button", name="Abrir bandeja completa").click()
        attention_dialog = desktop.get_by_role("dialog", name="Requiere tu atención")
        expect(attention_dialog).to_be_visible()
        attention_dialog.get_by_role("button", name="Cerrar").click()
        expect(attention_dialog).not_to_be_visible()

        desktop.get_by_role("button", name="Abrir comandos").click()
        command_dialog = desktop.get_by_role("dialog", name="¿Qué quieres inspeccionar?")
        expect(command_dialog).to_be_visible()
        command_dialog.get_by_role("button", name="Buscar contexto").click()
        expect(command_dialog).not_to_be_visible()

        mobile = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
        mobile.goto(URL, wait_until="networkidle")
        expect(mobile.get_by_role("heading", name="Una misma experiencia. Doce identidades.")).to_be_visible()
        mobile.get_by_role("button", name="Abrir menú").click()
        expect(mobile.get_by_role("navigation", name="Navegación principal")).to_be_visible()
        mobile.screenshot(path=str(OUTPUT / "mobile-visual-proposal.png"), full_page=True)

        print(f"PASS: 12 desktop mockups + mobile capture written to {OUTPUT}")
        browser.close()


if __name__ == "__main__":
    main()
