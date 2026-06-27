import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import App from "./App.tsx";
import { I18nProvider } from "./i18n/lang.tsx";

// Renders the whole component tree once (default language = English in Node).
// Catches runtime/render errors across Header, DevicePanel, Inspector,
// CodePreview, MidiMonitor, InstallGuide. Browser-only APIs (Web MIDI,
// localStorage, rAF) run only in effects or are guarded.
describe("App smoke render", () => {
  const html = renderToString(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );

  it("renders the brand and device", () => {
    expect(html).toContain("Le Pupitre");
    expect(html).toContain("nanoKONTROL Studio");
  });

  it("renders all 8 channel strips (English headers)", () => {
    const count = (html.match(/TRACK \d/g) ?? []).length;
    expect(count).toBe(8);
  });

  it("shows the live code preview with the default script name", () => {
    expect(html).toContain("Le_Pupitre_nanoKONTROL");
    expect(html).toContain("class");
  });

  it("renders the inspector in English for the default-selected fader", () => {
    expect(html).toContain("Live action");
    expect(html).toContain("Learn (MIDI)");
  });
});
