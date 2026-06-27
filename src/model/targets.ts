// Catalog of Live actions a control can drive, with the wiring metadata the
// Python generator needs to emit correct _Framework code.

import type { ControlKind } from "./types";
import type { Loc } from "../i18n/core.ts";

/** Stable category keys (localized for display via cat.* strings). */
export type CatKey = "none" | "mix" | "transport" | "nav" | "edit";

/** How the generator should wire a control bound to this target. */
export type Wiring =
  | { kind: "strip_continuous"; method: "set_volume_control" | "set_pan_control" }
  | { kind: "strip_send"; method: "set_send_control"; sendIndex: number }
  | {
      kind: "strip_button";
      method: "set_arm_button" | "set_mute_button" | "set_solo_button" | "set_select_button";
    }
  | {
      kind: "transport_button";
      method:
        | "set_play_button"
        | "set_stop_button"
        | "set_record_button"
        | "set_loop_button"
        | "set_seek_forward_button"
        | "set_seek_backward_button"
        | "set_metronome_button"
        | "set_tap_tempo_button"
        | "set_overdub_button"
        | "set_nudge_up_button"
        | "set_nudge_down_button";
    }
  | { kind: "session_nav"; slot: "track_prev" | "track_next" | "scene_prev" | "scene_next" }
  | { kind: "song_action"; call: "undo" | "redo" }
  | { kind: "none" };

export interface TargetDef {
  id: string;
  label: Loc;
  hint: Loc;
  /** Which physical controls this target suits. */
  suits: ControlKind[];
  category: CatKey;
  wiring: Wiring;
}

const L = (en: string, fr: string): Loc => ({ en, fr });

export const TARGETS: TargetDef[] = [
  {
    id: "none",
    label: L("— Unassigned —", "— Non assigné —"),
    hint: L("This control sends nothing to Live.", "Ce contrôle n'envoie rien à Live."),
    suits: ["fader", "knob", "button"],
    category: "none",
    wiring: { kind: "none" },
  },

  // ---- Mixer : continuous ----
  {
    id: "strip.volume",
    label: L("Track volume", "Volume de piste"),
    hint: L("Controls the strip's track volume.", "Contrôle le volume de la piste du strip."),
    suits: ["fader", "knob"],
    category: "mix",
    wiring: { kind: "strip_continuous", method: "set_volume_control" },
  },
  {
    id: "strip.pan",
    label: L("Pan", "Panoramique"),
    hint: L("Controls the track's pan.", "Contrôle le pan de la piste."),
    suits: ["fader", "knob"],
    category: "mix",
    wiring: { kind: "strip_continuous", method: "set_pan_control" },
  },
  {
    id: "strip.send_a",
    label: L("Send A", "Envoi A"),
    hint: L("Level of the track's Send A.", "Niveau de l'envoi A de la piste."),
    suits: ["fader", "knob"],
    category: "mix",
    wiring: { kind: "strip_send", method: "set_send_control", sendIndex: 0 },
  },
  {
    id: "strip.send_b",
    label: L("Send B", "Envoi B"),
    hint: L("Level of the track's Send B.", "Niveau de l'envoi B de la piste."),
    suits: ["fader", "knob"],
    category: "mix",
    wiring: { kind: "strip_send", method: "set_send_control", sendIndex: 1 },
  },

  // ---- Mixer : buttons ----
  {
    id: "strip.arm",
    label: L("Arm (REC)", "Armer (REC)"),
    hint: L("Arms the track for recording.", "Arme la piste pour l'enregistrement."),
    suits: ["button"],
    category: "mix",
    wiring: { kind: "strip_button", method: "set_arm_button" },
  },
  {
    id: "strip.mute",
    label: L("Mute", "Mute"),
    hint: L("Mutes / unmutes the track.", "Coupe / réactive la piste."),
    suits: ["button"],
    category: "mix",
    wiring: { kind: "strip_button", method: "set_mute_button" },
  },
  {
    id: "strip.solo",
    label: L("Solo", "Solo"),
    hint: L("Solos the track.", "Solo de la piste."),
    suits: ["button"],
    category: "mix",
    wiring: { kind: "strip_button", method: "set_solo_button" },
  },
  {
    id: "strip.select",
    label: L("Select track", "Sélectionner la piste"),
    hint: L("Makes this the selected track.", "Fait de cette piste la piste sélectionnée."),
    suits: ["button"],
    category: "mix",
    wiring: { kind: "strip_button", method: "set_select_button" },
  },

  // ---- Transport ----
  {
    id: "transport.play",
    label: L("Play", "Lecture"),
    hint: L("Starts playback.", "Démarre la lecture."),
    suits: ["button"],
    category: "transport",
    wiring: { kind: "transport_button", method: "set_play_button" },
  },
  {
    id: "transport.stop",
    label: L("Stop", "Stop"),
    hint: L("Stops playback.", "Arrête la lecture."),
    suits: ["button"],
    category: "transport",
    wiring: { kind: "transport_button", method: "set_stop_button" },
  },
  {
    id: "transport.record",
    label: L("Record", "Enregistrement"),
    hint: L("Toggles record (session/arrangement).", "Active l'enregistrement (session/arrangement)."),
    suits: ["button"],
    category: "transport",
    wiring: { kind: "transport_button", method: "set_record_button" },
  },
  {
    id: "transport.loop",
    label: L("Loop (cycle)", "Boucle (cycle)"),
    hint: L("Toggles the loop.", "Active / désactive la boucle."),
    suits: ["button"],
    category: "transport",
    wiring: { kind: "transport_button", method: "set_loop_button" },
  },
  {
    id: "transport.seek_ff",
    label: L("Fast-forward", "Avance rapide"),
    hint: L("Seeks forward while held.", "Avance dans la timeline tant que maintenu."),
    suits: ["button"],
    category: "transport",
    wiring: { kind: "transport_button", method: "set_seek_forward_button" },
  },
  {
    id: "transport.seek_rew",
    label: L("Rewind", "Retour rapide"),
    hint: L("Seeks backward while held.", "Recule dans la timeline tant que maintenu."),
    suits: ["button"],
    category: "transport",
    wiring: { kind: "transport_button", method: "set_seek_backward_button" },
  },
  {
    id: "transport.metronome",
    label: L("Metronome", "Métronome"),
    hint: L("Toggles the metronome.", "Active / désactive le métronome."),
    suits: ["button"],
    category: "transport",
    wiring: { kind: "transport_button", method: "set_metronome_button" },
  },
  {
    id: "transport.tap_tempo",
    label: L("Tap tempo", "Tap tempo"),
    hint: L("Taps the tempo.", "Tape le tempo."),
    suits: ["button"],
    category: "transport",
    wiring: { kind: "transport_button", method: "set_tap_tempo_button" },
  },
  {
    id: "transport.overdub",
    label: L("MIDI overdub", "Overdub MIDI"),
    hint: L("Toggles arrangement overdub.", "Active / désactive l'overdub d'arrangement."),
    suits: ["button"],
    category: "transport",
    wiring: { kind: "transport_button", method: "set_overdub_button" },
  },
  {
    id: "transport.nudge_up",
    label: L("Nudge +", "Nudge +"),
    hint: L("Temporarily speeds up (sync).", "Accélère temporairement (sync)."),
    suits: ["button"],
    category: "transport",
    wiring: { kind: "transport_button", method: "set_nudge_up_button" },
  },
  {
    id: "transport.nudge_down",
    label: L("Nudge −", "Nudge −"),
    hint: L("Temporarily slows down (sync).", "Ralentit temporairement (sync)."),
    suits: ["button"],
    category: "transport",
    wiring: { kind: "transport_button", method: "set_nudge_down_button" },
  },

  // ---- Navigation ----
  {
    id: "nav.track_prev",
    label: L("Track bank ◀", "Banque pistes ◀"),
    hint: L("Shifts the 8 strips left.", "Décale les 8 strips vers la gauche."),
    suits: ["button"],
    category: "nav",
    wiring: { kind: "session_nav", slot: "track_prev" },
  },
  {
    id: "nav.track_next",
    label: L("Track bank ▶", "Banque pistes ▶"),
    hint: L("Shifts the 8 strips right.", "Décale les 8 strips vers la droite."),
    suits: ["button"],
    category: "nav",
    wiring: { kind: "session_nav", slot: "track_next" },
  },
  {
    id: "nav.scene_prev",
    label: L("Scene ▲", "Scène ▲"),
    hint: L("Up one scene (Session view).", "Remonte d'une scène (vue Session)."),
    suits: ["button"],
    category: "nav",
    wiring: { kind: "session_nav", slot: "scene_prev" },
  },
  {
    id: "nav.scene_next",
    label: L("Scene ▼", "Scène ▼"),
    hint: L("Down one scene (Session view).", "Descend d'une scène (vue Session)."),
    suits: ["button"],
    category: "nav",
    wiring: { kind: "session_nav", slot: "scene_next" },
  },

  // ---- Edit ----
  {
    id: "edit.undo",
    label: L("Undo", "Annuler"),
    hint: L("Undoes the last action.", "Annule la dernière action."),
    suits: ["button"],
    category: "edit",
    wiring: { kind: "song_action", call: "undo" },
  },
  {
    id: "edit.redo",
    label: L("Redo", "Rétablir"),
    hint: L("Redoes the last undone action.", "Rétablit la dernière action annulée."),
    suits: ["button"],
    category: "edit",
    wiring: { kind: "song_action", call: "redo" },
  },
];

export const TARGET_BY_ID: Record<string, TargetDef> = Object.fromEntries(
  TARGETS.map((t) => [t.id, t]),
);

export function targetsForKind(kind: ControlKind): TargetDef[] {
  return TARGETS.filter((t) => t.suits.includes(kind));
}
