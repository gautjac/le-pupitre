import type { MidiBinding } from "../model/types.ts";

/** "CC 7 · canal 1" */
export function bindingLabel(b: MidiBinding): string {
  const t = b.type === "cc" ? "CC" : "Note";
  return `${t} ${b.number} · canal ${b.channel + 1}`;
}

/** Compact "CC7 c1" for tight chips. */
export function bindingShort(b: MidiBinding): string {
  const t = b.type === "cc" ? "CC" : "N";
  return `${t}${b.number}·${b.channel + 1}`;
}
