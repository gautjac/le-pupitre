import { describe, it, expect } from "vitest";
import { generateScript, sanitizeScriptName } from "./python.ts";
import { NANOKONTROL_STUDIO, defaultMapping } from "../model/device.ts";
import type { Mapping } from "../model/types.ts";

describe("sanitizeScriptName", () => {
  it("strips illegal chars and spaces", () => {
    expect(sanitizeScriptName("Mon Script! (v2)")).toBe("Mon_Script_v2");
  });
  it("prefixes a leading digit", () => {
    expect(sanitizeScriptName("3am jam")).toBe("_3am_jam");
  });
  it("falls back when empty", () => {
    expect(sanitizeScriptName("***")).toBe("Le_Pupitre_Surface");
  });
});

describe("generateScript — default nanoKONTROL mapping", () => {
  const result = generateScript(defaultMapping(NANOKONTROL_STUDIO), NANOKONTROL_STUDIO);
  const code = result.mainModule;

  it("produces a package with __init__.py and a main module", () => {
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain("Le_Pupitre_nanoKONTROL/__init__.py");
    expect(paths).toContain("Le_Pupitre_nanoKONTROL/Le_Pupitre_nanoKONTROL.py");
  });

  it("__init__ exposes create_instance", () => {
    const init = result.files.find((f) => f.path.endsWith("__init__.py"))!.content;
    expect(init).toContain("def create_instance(c_instance):");
    expect(init).toContain("return Le_Pupitre_nanoKONTROL(c_instance)");
  });

  it("wires all 8 faders to volume and knobs to pan", () => {
    for (let i = 0; i < 8; i++) {
      expect(code).toContain(`self._mixer.channel_strip(${i}).set_volume_control(`);
      expect(code).toContain(`self._mixer.channel_strip(${i}).set_pan_control(`);
    }
  });

  it("wires solo/mute/arm on every strip", () => {
    for (let i = 0; i < 8; i++) {
      expect(code).toContain(`self._mixer.channel_strip(${i}).set_solo_button(`);
      expect(code).toContain(`self._mixer.channel_strip(${i}).set_mute_button(`);
      expect(code).toContain(`self._mixer.channel_strip(${i}).set_arm_button(`);
    }
  });

  it("wires the transport (play/stop/record/loop/seek)", () => {
    expect(code).toContain("self._transport.set_play_button(");
    expect(code).toContain("self._transport.set_stop_button(");
    expect(code).toContain("self._transport.set_record_button(");
    expect(code).toContain("self._transport.set_loop_button(");
    expect(code).toContain("self._transport.set_seek_forward_button(");
    expect(code).toContain("self._transport.set_seek_backward_button(");
  });

  it("pairs the session bank buttons in the correct (next, prev) order", () => {
    expect(code).toContain(
      "self._session.set_track_bank_buttons(self._el_nav_track_next, self._el_nav_track_prev)",
    );
    expect(code).toContain("self._session.set_scene_bank_buttons(");
  });

  it("creates a fader as SliderElement, a knob as absolute EncoderElement, a button as momentary", () => {
    expect(code).toContain("self._el_fader_1 = SliderElement(MIDI_CC_TYPE, 0, 0)");
    expect(code).toContain(
      "self._el_knob_1 = EncoderElement(MIDI_CC_TYPE, 0, 16, Live.MidiMap.MapMode.absolute)",
    );
    expect(code).toContain("self._el_solo_1 = ButtonElement(True, MIDI_CC_TYPE, 0, 32)");
  });

  it("emits no warnings for the default mapping", () => {
    expect(result.warnings).toEqual([]);
  });
});

describe("generateScript — edge cases", () => {
  it("aggregates sends into one set_send_controls call with None placeholders", () => {
    const mapping = defaultMapping(NANOKONTROL_STUDIO);
    // strip 1: fader -> send A, knob -> send B
    mapping.controls["fader.1"].targetId = "strip.send_a";
    mapping.controls["knob.1"].targetId = "strip.send_b";
    // strip 2: only send B
    mapping.controls["knob.2"].targetId = "strip.send_b";
    const code = generateScript(mapping, NANOKONTROL_STUDIO).mainModule;
    expect(code).toContain(
      "self._mixer.channel_strip(0).set_send_controls((self._el_fader_1, self._el_knob_1))",
    );
    expect(code).toContain(
      "self._mixer.channel_strip(1).set_send_controls((None, self._el_knob_2))",
    );
  });

  it("emits undo/redo listeners and handler methods", () => {
    const mapping = defaultMapping(NANOKONTROL_STUDIO);
    mapping.controls["nav.marker_prev"].targetId = "edit.undo";
    mapping.controls["nav.marker_next"].targetId = "edit.redo";
    const code = generateScript(mapping, NANOKONTROL_STUDIO).mainModule;
    expect(code).toContain("add_value_listener(self._action_undo)");
    expect(code).toContain("def _action_undo(self, value):");
    expect(code).toContain("self.song().undo()");
    expect(code).toContain("def _action_redo(self, value):");
    // and cleans them up on disconnect
    expect(code).toContain("remove_value_listener(self._action_undo)");
  });

  it("a 'none' target produces no wiring for that control", () => {
    const mapping = defaultMapping(NANOKONTROL_STUDIO);
    mapping.controls["fader.1"].targetId = "none";
    const code = generateScript(mapping, NANOKONTROL_STUDIO).mainModule;
    expect(code).not.toContain("self._el_fader_1 = SliderElement");
    expect(code).not.toContain("self._mixer.channel_strip(0).set_volume_control");
  });

  it("warns when a strip target lands on a control with no strip", () => {
    const mapping: Mapping = defaultMapping(NANOKONTROL_STUDIO);
    mapping.controls["transport.play"].targetId = "strip.mute"; // a button, but no strip
    const result = generateScript(mapping, NANOKONTROL_STUDIO);
    expect(result.warnings.some((w) => w.includes("pas de piste"))).toBe(true);
  });

  it("warns when a continuous control is given a button-only target", () => {
    const mapping = defaultMapping(NANOKONTROL_STUDIO);
    mapping.controls["fader.1"].targetId = "transport.play";
    const result = generateScript(mapping, NANOKONTROL_STUDIO);
    expect(result.warnings.some((w) => w.includes("incompatible"))).toBe(true);
  });
});
