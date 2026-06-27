// Core data model shared by the editor UI and the Python script generator.

export type MidiType = "cc" | "note";

/** A physical control's MIDI signature. channel is 0-based (0–15); shown as 1–16. */
export interface MidiBinding {
  type: MidiType;
  channel: number; // 0–15
  number: number; // 0–127 (CC number or note number)
}

export type ControlKind = "fader" | "knob" | "button";

/** Where a control sits on the device, for layout + which targets apply. */
export type ControlGroup = "strip" | "transport" | "nav";

export interface ControlDef {
  id: string; // stable id, e.g. "fader.1", "btn.solo.3", "transport.play"
  label: string; // human label, e.g. "Fader 1"
  short: string; // tiny label for the on-device chip, e.g. "S", "M", "REC"
  kind: ControlKind;
  group: ControlGroup;
  strip?: number; // 1–8 for per-channel controls
  defaultBinding: MidiBinding;
  defaultTarget: string; // a TargetId from the catalog
}

export interface DeviceDef {
  id: string;
  name: string;
  vendor: string;
  strips: number;
  controls: ControlDef[];
}

/** Per-control editable state in a mapping. */
export interface ControlState {
  binding: MidiBinding;
  targetId: string;
}

/** A complete, exportable mapping for one device. */
export interface Mapping {
  deviceId: string;
  /** Folder + Python module name. Must be a valid identifier. Shown in Live's Control Surface menu. */
  scriptName: string;
  /** Live version target (affects only a header comment + folder hint). */
  liveVersion: "12" | "11";
  controls: Record<string, ControlState>; // keyed by ControlDef.id
}
