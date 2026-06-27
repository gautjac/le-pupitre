// Turns a Mapping into an Ableton Live MIDI Remote Script (a _Framework
// ControlSurface package). Output loads in Live 11 and 12.
//
// Only stable _Framework APIs are used:
//   MixerComponent.channel_strip(i).set_volume_control / set_pan_control /
//     set_send_controls / set_arm_button / set_mute_button / set_solo_button /
//     set_select_button
//   TransportComponent.set_*_button
//   SessionComponent.set_track_bank_buttons / set_scene_bank_buttons
//   custom song().undo()/redo() value listeners

import type { DeviceDef, Mapping, MidiBinding } from "../model/types";
import { TARGET_BY_ID } from "../model/targets";
import { loc, type Lang } from "../i18n/core.ts";

type WarnCode = "incompatible" | "noStrip" | "needButton";

function warn(lang: Lang, code: WarnCode, control: string, target: string): string {
  const en: Record<WarnCode, string> = {
    incompatible: `"${control}" → "${target}" skipped (incompatible control type).`,
    noStrip: `"${control}" → "${target}" skipped (no track associated).`,
    needButton: `"${control}" → "${target}" skipped (a button is required).`,
  };
  const fr: Record<WarnCode, string> = {
    incompatible: `« ${control} » → « ${target} » ignoré (type de contrôle incompatible).`,
    noStrip: `« ${control} » → « ${target} » ignoré (pas de piste associée).`,
    needButton: `« ${control} » → « ${target} » ignoré (un bouton est requis).`,
  };
  return (lang === "fr" ? fr : en)[code];
}

export interface GeneratedFile {
  path: string; // relative path inside the zip (includes the script folder)
  content: string;
}

export interface GenerateResult {
  scriptName: string;
  mainModulePath: string;
  mainModule: string;
  files: GeneratedFile[];
  warnings: string[];
}

const NUM_TRACKS = 8;
const NUM_SCENES = 1;

/** Make a valid Python identifier (also used as folder + module name). */
export function sanitizeScriptName(raw: string): string {
  let s = (raw || "").trim().replace(/[^A-Za-z0-9_]/g, "_");
  s = s.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  if (!s) s = "Le_Pupitre_Surface";
  if (/^[0-9]/.test(s)) s = "_" + s;
  return s;
}

const varFor = (controlId: string) => "_el_" + controlId.replace(/[^A-Za-z0-9]/g, "_");
const msgType = (b: MidiBinding) => (b.type === "cc" ? "MIDI_CC_TYPE" : "MIDI_NOTE_TYPE");

interface ElementPlan {
  controlId: string;
  varName: string;
  kind: "fader" | "knob" | "button";
  binding: MidiBinding;
}

export function generateScript(
  mapping: Mapping,
  device: DeviceDef,
  lang: Lang = "en",
): GenerateResult {
  const name = sanitizeScriptName(mapping.scriptName);
  const warnings: string[] = [];

  const elements: ElementPlan[] = [];
  const volumeCalls: string[] = []; // self._mixer.channel_strip(s).set_volume_control(var)
  const panCalls: string[] = [];
  const stripButtonCalls: string[] = []; // arm/mute/solo/select
  const transportCalls: string[] = [];
  const sends = new Map<number, (string | null)[]>(); // strip0 -> [sendA, sendB]
  const navSlots: Record<string, string> = {}; // slot -> var
  const songActions: { call: "undo" | "redo"; varName: string }[] = [];

  let assignedCount = 0;

  for (const control of device.controls) {
    const state = mapping.controls[control.id];
    if (!state) continue;
    const target = TARGET_BY_ID[state.targetId];
    if (!target || target.wiring.kind === "none") continue;

    const w = target.wiring;
    const isContinuous = control.kind === "fader" || control.kind === "knob";
    const stripIdx = control.strip != null ? control.strip - 1 : null;
    const varName = varFor(control.id);
    const cl = loc(control.label, lang);
    const tl = loc(target.label, lang);

    // Guard: target must suit the physical control.
    if (!target.suits.includes(control.kind)) {
      warnings.push(warn(lang, "incompatible", cl, tl));
      continue;
    }

    switch (w.kind) {
      case "strip_continuous": {
        if (stripIdx == null) {
          warnings.push(warn(lang, "noStrip", cl, tl));
          continue;
        }
        elements.push({ controlId: control.id, varName, kind: control.kind, binding: state.binding });
        const call = `        self._mixer.channel_strip(${stripIdx}).${w.method}(self.${varName})`;
        (w.method === "set_volume_control" ? volumeCalls : panCalls).push(call);
        assignedCount++;
        break;
      }
      case "strip_send": {
        if (stripIdx == null) {
          warnings.push(warn(lang, "noStrip", cl, tl));
          continue;
        }
        elements.push({ controlId: control.id, varName, kind: control.kind, binding: state.binding });
        if (!sends.has(stripIdx)) sends.set(stripIdx, [null, null]);
        sends.get(stripIdx)![w.sendIndex] = `self.${varName}`;
        assignedCount++;
        break;
      }
      case "strip_button": {
        if (stripIdx == null) {
          warnings.push(warn(lang, "noStrip", cl, tl));
          continue;
        }
        elements.push({ controlId: control.id, varName, kind: "button", binding: state.binding });
        stripButtonCalls.push(`        self._mixer.channel_strip(${stripIdx}).${w.method}(self.${varName})`);
        assignedCount++;
        break;
      }
      case "transport_button": {
        if (isContinuous) {
          warnings.push(warn(lang, "needButton", cl, tl));
          continue;
        }
        elements.push({ controlId: control.id, varName, kind: "button", binding: state.binding });
        transportCalls.push(`        self._transport.${w.method}(self.${varName})`);
        assignedCount++;
        break;
      }
      case "session_nav": {
        if (isContinuous) {
          warnings.push(warn(lang, "needButton", cl, tl));
          continue;
        }
        elements.push({ controlId: control.id, varName, kind: "button", binding: state.binding });
        navSlots[w.slot] = `self.${varName}`;
        assignedCount++;
        break;
      }
      case "song_action": {
        if (isContinuous) {
          warnings.push(warn(lang, "needButton", cl, tl));
          continue;
        }
        elements.push({ controlId: control.id, varName, kind: "button", binding: state.binding });
        songActions.push({ call: w.call, varName });
        assignedCount++;
        break;
      }
    }
  }

  // ---- Emit element definitions ----
  const elementLines = elements.map((e) => {
    const t = msgType(e.binding);
    const { channel, number } = e.binding;
    if (e.kind === "fader") {
      return `        self.${e.varName} = SliderElement(${t}, ${channel}, ${number})`;
    }
    if (e.kind === "knob") {
      return `        self.${e.varName} = EncoderElement(${t}, ${channel}, ${number}, Live.MidiMap.MapMode.absolute)`;
    }
    return `        self.${e.varName} = ButtonElement(True, ${t}, ${channel}, ${number})`;
  });

  // ---- Sends ----
  const sendLines: string[] = [];
  for (const [stripIdx, list] of [...sends.entries()].sort((a, b) => a[0] - b[0])) {
    const tuple = list.map((v) => v ?? "None").join(", ");
    sendLines.push(`        self._mixer.channel_strip(${stripIdx}).set_send_controls((${tuple}))`);
  }

  // ---- Session banking (paired) ----
  const navLines: string[] = [];
  if (navSlots.track_prev || navSlots.track_next) {
    const next = navSlots.track_next ?? "None";
    const prev = navSlots.track_prev ?? "None";
    navLines.push(`        self._session.set_track_bank_buttons(${next}, ${prev})`);
  }
  if (navSlots.scene_prev || navSlots.scene_next) {
    const down = navSlots.scene_next ?? "None";
    const up = navSlots.scene_prev ?? "None";
    navLines.push(`        self._session.set_scene_bank_buttons(${down}, ${up})`);
  }

  // ---- Song actions (undo/redo) ----
  const songActionListenerLines: string[] = [];
  const usedActions = new Set(songActions.map((s) => s.call));
  for (const s of songActions) {
    songActionListenerLines.push(`        self.${s.varName}.add_value_listener(self._action_${s.call})`);
  }
  const songActionMethods: string[] = [];
  for (const call of usedActions) {
    songActionMethods.push(
      [
        ``,
        `    def _action_${call}(self, value):`,
        `        if value != 0:`,
        `            self.song().${call}()`,
      ].join("\n"),
    );
  }
  const songActionDisconnect: string[] = [];
  for (const s of songActions) {
    songActionDisconnect.push(
      `        if self.${s.varName}.value_has_listener(self._action_${s.call}):`,
    );
    songActionDisconnect.push(`            self.${s.varName}.remove_value_listener(self._action_${s.call})`);
  }

  if (assignedCount === 0) {
    warnings.push(
      lang === "fr"
        ? "Aucun contrôle assigné : le script ne fera rien tel quel."
        : "No control assigned: the script will do nothing as-is.",
    );
  }

  const header = [
    `# -*- coding: utf-8 -*-`,
    `# ${name} — Ableton Live ${mapping.liveVersion} MIDI Remote Script`,
    `# Generated by Le Pupitre · https://le-pupitre.netlify.app`,
    `# Device: ${device.name}`,
    `#`,
    `# Install: copy this whole folder into`,
    `#   macOS:   ~/Music/Ableton/User Library/Remote Scripts/`,
    `#   Windows: \\Users\\<you>\\Documents\\Ableton\\User Library\\Remote Scripts\\`,
    `# then pick "${name}" as a Control Surface in Live's MIDI settings`,
    `# (Input = nanoKONTROL Studio, Output = nanoKONTROL Studio, both with Remote on).`,
  ].join("\n");

  const moduleBody = [
    header,
    `from __future__ import absolute_import, print_function, unicode_literals`,
    ``,
    `import Live`,
    `from _Framework.ControlSurface import ControlSurface`,
    `from _Framework.MixerComponent import MixerComponent`,
    `from _Framework.TransportComponent import TransportComponent`,
    `from _Framework.SessionComponent import SessionComponent`,
    `from _Framework.ButtonElement import ButtonElement`,
    `from _Framework.SliderElement import SliderElement`,
    `from _Framework.EncoderElement import EncoderElement`,
    `from _Framework.InputControlElement import MIDI_CC_TYPE, MIDI_NOTE_TYPE`,
    ``,
    `NUM_TRACKS = ${NUM_TRACKS}`,
    `NUM_SCENES = ${NUM_SCENES}`,
    ``,
    ``,
    `class ${name}(ControlSurface):`,
    ``,
    `    def __init__(self, c_instance):`,
    `        super(${name}, self).__init__(c_instance)`,
    `        with self.component_guard():`,
    `            self._build()`,
    `        self.log_message("Le Pupitre: ${device.name} surface loaded")`,
    ``,
    `    def _build(self):`,
    `        # Mixer follows the 8-track session bank (the red ring in Session view).`,
    `        self._session = SessionComponent(NUM_TRACKS, NUM_SCENES)`,
    `        self._mixer = MixerComponent(NUM_TRACKS)`,
    `        self._session.set_mixer(self._mixer)`,
    `        self.set_highlighting_session_component(self._session)`,
    `        self._transport = TransportComponent()`,
    ``,
    `        # --- Control elements ---`,
    ...(elementLines.length ? elementLines : ["        pass  # no controls assigned"]),
    ``,
    `        # --- Mixer: volume ---`,
    ...(volumeCalls.length ? volumeCalls : ["        # (none)"]),
    ``,
    `        # --- Mixer: pan ---`,
    ...(panCalls.length ? panCalls : ["        # (none)"]),
    ...(sendLines.length ? ["", "        # --- Mixer: sends ---", ...sendLines] : []),
    ``,
    `        # --- Mixer: track buttons (arm / mute / solo / select) ---`,
    ...(stripButtonCalls.length ? stripButtonCalls : ["        # (none)"]),
    ``,
    `        # --- Transport ---`,
    ...(transportCalls.length ? transportCalls : ["        # (none)"]),
    ...(navLines.length ? ["", "        # --- Session banking ---", ...navLines] : []),
    ...(songActionListenerLines.length
      ? ["", "        # --- Edit (undo / redo) ---", ...songActionListenerLines]
      : []),
    ...songActionMethods,
    ``,
    `    def disconnect(self):`,
    ...(songActionDisconnect.length ? songActionDisconnect : []),
    `        super(${name}, self).disconnect()`,
    ``,
  ].join("\n");

  const initBody = [
    `# -*- coding: utf-8 -*-`,
    `from __future__ import absolute_import, print_function, unicode_literals`,
    `from .${name} import ${name}`,
    ``,
    ``,
    `def create_instance(c_instance):`,
    `    return ${name}(c_instance)`,
    ``,
  ].join("\n");

  const readme = buildReadme(name, device, mapping);

  const mainModulePath = `${name}/${name}.py`;
  return {
    scriptName: name,
    mainModulePath,
    mainModule: moduleBody,
    files: [
      { path: `${name}/__init__.py`, content: initBody },
      { path: mainModulePath, content: moduleBody },
      { path: `${name}/README.md`, content: readme },
    ],
    warnings,
  };
}

function buildReadme(name: string, device: DeviceDef, mapping: Mapping): string {
  const rows: string[] = [];
  for (const c of device.controls) {
    const st = mapping.controls[c.id];
    if (!st) continue;
    const t = TARGET_BY_ID[st.targetId];
    if (!t || t.wiring.kind === "none") continue;
    const ch = st.binding.channel + 1;
    const typ = st.binding.type.toUpperCase();
    rows.push(`| ${loc(c.label, "en")} | ${typ} ${st.binding.number} (ch ${ch}) | ${loc(t.label, "en")} |`);
  }
  return [
    `# ${name}`,
    ``,
    `Ableton Live ${mapping.liveVersion} MIDI Remote Script for the **${device.name}**, generated by [Le Pupitre](https://le-pupitre.netlify.app).`,
    ``,
    `## Install`,
    ``,
    `1. Copy this whole **${name}** folder into your User Remote Scripts folder:`,
    `   - **macOS:** \`~/Music/Ableton/User Library/Remote Scripts/\``,
    `   - **Windows:** \`\\Users\\<you>\\Documents\\Ableton\\User Library\\Remote Scripts\\\``,
    `2. Restart Ableton Live.`,
    `3. **Settings → Link, Tempo & MIDI → MIDI.** Pick **${name}** in a Control Surface slot.`,
    `   Set both **Input** and **Output** to your ${device.name}.`,
    `4. In the **MIDI Ports** table below, turn **Remote = On** for the ${device.name}'s`,
    `   input *and* output (output drives the button LEDs).`,
    ``,
    `## Controller setup (Korg Kontrol Editor)`,
    ``,
    `Set the device's buttons to **Momentary** behaviour and LED mode to **External**`,
    `so Live drives the lights. The CC numbers below must match what the device sends —`,
    `use **MIDI-Learn** in Le Pupitre to capture your unit's actual values if they differ.`,
    ``,
    `## Mapping`,
    ``,
    `| Control | MIDI | Live action |`,
    `| --- | --- | --- |`,
    ...rows,
    ``,
  ].join("\n");
}
