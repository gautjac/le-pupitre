import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import App from "./App.tsx";

// Renders the whole component tree once. Catches runtime/render errors across
// Header, DevicePanel, Inspector, CodePreview, MidiMonitor, InstallGuide.
// (Browser-only APIs — Web MIDI, localStorage, rAF — are used only in effects
//  or guarded, so server rendering exercises the full render path.)
describe("App smoke render", () => {
  const html = renderToString(<App />);

  it("renders the brand and device", () => {
    expect(html).toContain("Le Pupitre");
    expect(html).toContain("nanoKONTROL Studio");
  });

  it("renders all 8 channel strips", () => {
    const count = (html.match(/PISTE/g) ?? []).length;
    expect(count).toBe(8);
  });

  it("shows the live code preview with the default script name", () => {
    expect(html).toContain("Le_Pupitre_nanoKONTROL");
    expect(html).toContain("class");
  });

  it("renders the inspector for the default-selected fader", () => {
    expect(html).toContain("Action dans Live");
    expect(html).toContain("Apprendre (MIDI Learn)");
  });
});
