// Device definition: Korg nanoKONTROL Studio.
//
// The factory MIDI map is configurable via Korg Kontrol Editor, so these CC
// numbers follow the widely-used nanoKONTROL2 convention (faders 0–7, knobs
// 16–23, solo 32–39, mute 48–55, rec 64–71, transport block). They are a
// sensible *starting* preset: use MIDI-Learn in the editor to capture whatever
// your unit actually sends, or load the matching Kontrol Editor scene.

import type { ControlDef, DeviceDef, MidiBinding } from "./types";
import type { Loc } from "../i18n/core.ts";

const cc = (number: number, channel = 0): MidiBinding => ({ type: "cc", channel, number });
const L = (en: string, fr: string): Loc => ({ en, fr });

const STRIPS = 8;

function stripControls(): ControlDef[] {
  const out: ControlDef[] = [];
  for (let i = 1; i <= STRIPS; i++) {
    const s = i - 1;
    out.push({
      id: `fader.${i}`,
      label: L(`Fader ${i}`, `Fader ${i}`),
      short: "FADER",
      kind: "fader",
      group: "strip",
      strip: i,
      defaultBinding: cc(0 + s),
      defaultTarget: "strip.volume",
    });
    out.push({
      id: `knob.${i}`,
      label: L(`Knob ${i}`, `Potentiomètre ${i}`),
      short: "KNOB",
      kind: "knob",
      group: "strip",
      strip: i,
      defaultBinding: cc(16 + s),
      defaultTarget: "strip.pan",
    });
    out.push({
      id: `solo.${i}`,
      label: L(`Solo ${i}`, `Solo ${i}`),
      short: "S",
      kind: "button",
      group: "strip",
      strip: i,
      defaultBinding: cc(32 + s),
      defaultTarget: "strip.solo",
    });
    out.push({
      id: `mute.${i}`,
      label: L(`Mute ${i}`, `Mute ${i}`),
      short: "M",
      kind: "button",
      group: "strip",
      strip: i,
      defaultBinding: cc(48 + s),
      defaultTarget: "strip.mute",
    });
    out.push({
      id: `rec.${i}`,
      label: L(`Rec ${i}`, `Rec ${i}`),
      short: "R",
      kind: "button",
      group: "strip",
      strip: i,
      defaultBinding: cc(64 + s),
      defaultTarget: "strip.arm",
    });
  }
  return out;
}

const transportControls: ControlDef[] = [
  { id: "transport.rewind", label: L("Rewind", "Retour"), short: "◀◀", kind: "button", group: "transport", defaultBinding: cc(43), defaultTarget: "transport.seek_rew" },
  { id: "transport.ff", label: L("Forward", "Avance"), short: "▶▶", kind: "button", group: "transport", defaultBinding: cc(44), defaultTarget: "transport.seek_ff" },
  { id: "transport.stop", label: L("Stop", "Stop"), short: "■", kind: "button", group: "transport", defaultBinding: cc(42), defaultTarget: "transport.stop" },
  { id: "transport.play", label: L("Play", "Lecture"), short: "▶", kind: "button", group: "transport", defaultBinding: cc(41), defaultTarget: "transport.play" },
  { id: "transport.record", label: L("Record", "Enregistrement"), short: "●", kind: "button", group: "transport", defaultBinding: cc(45), defaultTarget: "transport.record" },
  { id: "transport.cycle", label: L("Cycle", "Cycle"), short: "↺", kind: "button", group: "transport", defaultBinding: cc(46), defaultTarget: "transport.loop" },
];

const navControls: ControlDef[] = [
  { id: "nav.track_prev", label: L("Track ◀", "Piste ◀"), short: "◀", kind: "button", group: "nav", defaultBinding: cc(58), defaultTarget: "nav.track_prev" },
  { id: "nav.track_next", label: L("Track ▶", "Piste ▶"), short: "▶", kind: "button", group: "nav", defaultBinding: cc(59), defaultTarget: "nav.track_next" },
  { id: "nav.marker_set", label: L("Marker ●", "Marqueur ●"), short: "SET", kind: "button", group: "nav", defaultBinding: cc(60), defaultTarget: "transport.metronome" },
  { id: "nav.marker_prev", label: L("Marker ◀", "Marqueur ◀"), short: "◀M", kind: "button", group: "nav", defaultBinding: cc(61), defaultTarget: "nav.scene_prev" },
  { id: "nav.marker_next", label: L("Marker ▶", "Marqueur ▶"), short: "▶M", kind: "button", group: "nav", defaultBinding: cc(62), defaultTarget: "nav.scene_next" },
];

export const NANOKONTROL_STUDIO: DeviceDef = {
  id: "korg-nanokontrol-studio",
  name: "Korg nanoKONTROL Studio",
  vendor: "Korg",
  strips: STRIPS,
  controls: [...stripControls(), ...transportControls, ...navControls],
};

export const DEVICES: DeviceDef[] = [NANOKONTROL_STUDIO];

export function deviceById(id: string): DeviceDef {
  return DEVICES.find((d) => d.id === id) ?? NANOKONTROL_STUDIO;
}

/** Build a fresh mapping from a device's defaults. */
export function defaultMapping(device: DeviceDef = NANOKONTROL_STUDIO) {
  const controls: Record<string, { binding: MidiBinding; targetId: string }> = {};
  for (const c of device.controls) {
    controls[c.id] = { binding: { ...c.defaultBinding }, targetId: c.defaultTarget };
  }
  return {
    deviceId: device.id,
    scriptName: "Le_Pupitre_nanoKONTROL",
    liveVersion: "12" as const,
    controls,
  };
}
