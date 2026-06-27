import type { Mapping } from "../model/types.ts";
import { NANOKONTROL_STUDIO, defaultMapping, deviceById } from "../model/device.ts";

const KEY = "le-pupitre.mapping.v1";
const ONBOARD_KEY = "le-pupitre.onboarded.v1";

/** Load a saved mapping, healing it against the current device definition. */
export function loadMapping(): Mapping {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultMapping(NANOKONTROL_STUDIO);
    const saved = JSON.parse(raw) as Mapping;
    const device = deviceById(saved.deviceId);
    const base = defaultMapping(device);
    // Keep saved control states that still exist; fill any new controls from defaults.
    const controls = { ...base.controls };
    for (const id of Object.keys(controls)) {
      const s = saved.controls?.[id];
      if (s && s.binding && typeof s.targetId === "string") {
        controls[id] = { binding: { ...s.binding }, targetId: s.targetId };
      }
    }
    return {
      deviceId: device.id,
      scriptName: saved.scriptName || base.scriptName,
      liveVersion: saved.liveVersion === "11" ? "11" : "12",
      controls,
    };
  } catch {
    return defaultMapping(NANOKONTROL_STUDIO);
  }
}

export function saveMapping(m: Mapping): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* storage full / private mode — non-fatal */
  }
}

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARD_KEY) === "1";
  } catch {
    return true;
  }
}

export function setOnboarded(): void {
  try {
    localStorage.setItem(ONBOARD_KEY, "1");
  } catch {
    /* ignore */
  }
}
