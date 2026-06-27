// Catalog of Live actions a control can drive, with the wiring metadata the
// Python generator needs to emit correct _Framework code.

import type { ControlKind } from "./types";

/** How the generator should wire a control bound to this target. */
export type Wiring =
  // continuous, per-track (fader/knob) -> ChannelStripComponent method
  | { kind: "strip_continuous"; method: "set_volume_control" | "set_pan_control" }
  | { kind: "strip_send"; method: "set_send_control"; sendIndex: number }
  // momentary, per-track (button) -> ChannelStripComponent method
  | {
      kind: "strip_button";
      method: "set_arm_button" | "set_mute_button" | "set_solo_button" | "set_select_button";
    }
  // momentary, global -> TransportComponent method
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
  // momentary, session banking -> SessionComponent paired bank buttons
  | { kind: "session_nav"; slot: "track_prev" | "track_next" | "scene_prev" | "scene_next" }
  // momentary, custom song() listener (undo/redo)
  | { kind: "song_action"; call: "undo" | "redo" }
  // not wired
  | { kind: "none" };

export interface TargetDef {
  id: string;
  /** FR label for the inspector. */
  label: string;
  /** Short FR description shown under the picker. */
  hint: string;
  /** Which physical controls this target suits. */
  suits: ControlKind[];
  /** Grouping for the picker menu. */
  category: "Mixage" | "Transport" | "Navigation" | "Édition" | "Aucune";
  wiring: Wiring;
}

export const TARGETS: TargetDef[] = [
  // ---- Aucune ----
  {
    id: "none",
    label: "— Non assigné —",
    hint: "Ce contrôle n'envoie rien à Live.",
    suits: ["fader", "knob", "button"],
    category: "Aucune",
    wiring: { kind: "none" },
  },

  // ---- Mixage : continus ----
  {
    id: "strip.volume",
    label: "Volume de piste",
    hint: "Contrôle le volume de la piste du strip.",
    suits: ["fader", "knob"],
    category: "Mixage",
    wiring: { kind: "strip_continuous", method: "set_volume_control" },
  },
  {
    id: "strip.pan",
    label: "Panoramique",
    hint: "Contrôle le pan de la piste.",
    suits: ["fader", "knob"],
    category: "Mixage",
    wiring: { kind: "strip_continuous", method: "set_pan_control" },
  },
  {
    id: "strip.send_a",
    label: "Envoi A",
    hint: "Niveau de l'envoi A de la piste.",
    suits: ["fader", "knob"],
    category: "Mixage",
    wiring: { kind: "strip_send", method: "set_send_control", sendIndex: 0 },
  },
  {
    id: "strip.send_b",
    label: "Envoi B",
    hint: "Niveau de l'envoi B de la piste.",
    suits: ["fader", "knob"],
    category: "Mixage",
    wiring: { kind: "strip_send", method: "set_send_control", sendIndex: 1 },
  },

  // ---- Mixage : boutons ----
  {
    id: "strip.arm",
    label: "Armer (REC)",
    hint: "Arme la piste pour l'enregistrement.",
    suits: ["button"],
    category: "Mixage",
    wiring: { kind: "strip_button", method: "set_arm_button" },
  },
  {
    id: "strip.mute",
    label: "Mute",
    hint: "Coupe / réactive la piste.",
    suits: ["button"],
    category: "Mixage",
    wiring: { kind: "strip_button", method: "set_mute_button" },
  },
  {
    id: "strip.solo",
    label: "Solo",
    hint: "Solo de la piste.",
    suits: ["button"],
    category: "Mixage",
    wiring: { kind: "strip_button", method: "set_solo_button" },
  },
  {
    id: "strip.select",
    label: "Sélectionner la piste",
    hint: "Fait de cette piste la piste sélectionnée.",
    suits: ["button"],
    category: "Mixage",
    wiring: { kind: "strip_button", method: "set_select_button" },
  },

  // ---- Transport ----
  {
    id: "transport.play",
    label: "Lecture",
    hint: "Démarre la lecture.",
    suits: ["button"],
    category: "Transport",
    wiring: { kind: "transport_button", method: "set_play_button" },
  },
  {
    id: "transport.stop",
    label: "Stop",
    hint: "Arrête la lecture.",
    suits: ["button"],
    category: "Transport",
    wiring: { kind: "transport_button", method: "set_stop_button" },
  },
  {
    id: "transport.record",
    label: "Enregistrement",
    hint: "Active l'enregistrement (session/arrangement).",
    suits: ["button"],
    category: "Transport",
    wiring: { kind: "transport_button", method: "set_record_button" },
  },
  {
    id: "transport.loop",
    label: "Boucle (cycle)",
    hint: "Active / désactive la boucle.",
    suits: ["button"],
    category: "Transport",
    wiring: { kind: "transport_button", method: "set_loop_button" },
  },
  {
    id: "transport.seek_ff",
    label: "Avance rapide",
    hint: "Avance dans la timeline tant que maintenu.",
    suits: ["button"],
    category: "Transport",
    wiring: { kind: "transport_button", method: "set_seek_forward_button" },
  },
  {
    id: "transport.seek_rew",
    label: "Retour rapide",
    hint: "Recule dans la timeline tant que maintenu.",
    suits: ["button"],
    category: "Transport",
    wiring: { kind: "transport_button", method: "set_seek_backward_button" },
  },
  {
    id: "transport.metronome",
    label: "Métronome",
    hint: "Active / désactive le métronome.",
    suits: ["button"],
    category: "Transport",
    wiring: { kind: "transport_button", method: "set_metronome_button" },
  },
  {
    id: "transport.tap_tempo",
    label: "Tap tempo",
    hint: "Tape le tempo.",
    suits: ["button"],
    category: "Transport",
    wiring: { kind: "transport_button", method: "set_tap_tempo_button" },
  },
  {
    id: "transport.overdub",
    label: "Overdub MIDI",
    hint: "Active / désactive l'overdub d'arrangement.",
    suits: ["button"],
    category: "Transport",
    wiring: { kind: "transport_button", method: "set_overdub_button" },
  },
  {
    id: "transport.nudge_up",
    label: "Nudge +",
    hint: "Accélère temporairement (sync).",
    suits: ["button"],
    category: "Transport",
    wiring: { kind: "transport_button", method: "set_nudge_up_button" },
  },
  {
    id: "transport.nudge_down",
    label: "Nudge −",
    hint: "Ralentit temporairement (sync).",
    suits: ["button"],
    category: "Transport",
    wiring: { kind: "transport_button", method: "set_nudge_down_button" },
  },

  // ---- Navigation ----
  {
    id: "nav.track_prev",
    label: "Banque pistes ◀",
    hint: "Décale les 8 strips vers la gauche.",
    suits: ["button"],
    category: "Navigation",
    wiring: { kind: "session_nav", slot: "track_prev" },
  },
  {
    id: "nav.track_next",
    label: "Banque pistes ▶",
    hint: "Décale les 8 strips vers la droite.",
    suits: ["button"],
    category: "Navigation",
    wiring: { kind: "session_nav", slot: "track_next" },
  },
  {
    id: "nav.scene_prev",
    label: "Scène ▲",
    hint: "Remonte d'une scène (vue Session).",
    suits: ["button"],
    category: "Navigation",
    wiring: { kind: "session_nav", slot: "scene_prev" },
  },
  {
    id: "nav.scene_next",
    label: "Scène ▼",
    hint: "Descend d'une scène (vue Session).",
    suits: ["button"],
    category: "Navigation",
    wiring: { kind: "session_nav", slot: "scene_next" },
  },

  // ---- Édition ----
  {
    id: "edit.undo",
    label: "Annuler",
    hint: "Annule la dernière action.",
    suits: ["button"],
    category: "Édition",
    wiring: { kind: "song_action", call: "undo" },
  },
  {
    id: "edit.redo",
    label: "Rétablir",
    hint: "Rétablit la dernière action annulée.",
    suits: ["button"],
    category: "Édition",
    wiring: { kind: "song_action", call: "redo" },
  },
];

export const TARGET_BY_ID: Record<string, TargetDef> = Object.fromEntries(
  TARGETS.map((t) => [t.id, t]),
);

export function targetsForKind(kind: ControlKind): TargetDef[] {
  return TARGETS.filter((t) => t.suits.includes(kind));
}
