import type { MidiBinding } from "../model/types.ts";

/** Compact "CC7·1" for tight chips (language-neutral). */
export function bindingShort(b: MidiBinding): string {
  const t = b.type === "cc" ? "CC" : "N";
  return `${t}${b.number}·${b.channel + 1}`;
}
