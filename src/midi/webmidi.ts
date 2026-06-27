// Thin wrapper over the Web MIDI API: port enumeration, message parsing,
// MIDI-Learn capture, and LED feedback. Degrades gracefully where unsupported.

import type { MidiBinding, MidiType } from "../model/types.ts";

export interface MidiEvent {
  type: MidiType;
  channel: number; // 0–15
  number: number; // 0–127
  value: number; // 0–127
  portId: string;
  portName: string;
}

export interface MidiPort {
  id: string;
  name: string;
}

export type MidiStatus = "unsupported" | "idle" | "requesting" | "ready" | "denied";

type EventListener = (e: MidiEvent) => void;
type StatusListener = (s: MidiStatus) => void;

export function bindingKey(b: { type: MidiType; channel: number; number: number }): string {
  return `${b.type}:${b.channel}:${b.number}`;
}

export function midiSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.requestMIDIAccess === "function";
}

function parse(data: Uint8Array, portId: string, portName: string): MidiEvent | null {
  if (data.length < 2) return null;
  const status = data[0] & 0xf0;
  const channel = data[0] & 0x0f;
  if (status === 0xb0) {
    return { type: "cc", channel, number: data[1], value: data[2] ?? 0, portId, portName };
  }
  if (status === 0x90) {
    return { type: "note", channel, number: data[1], value: data[2] ?? 0, portId, portName };
  }
  if (status === 0x80) {
    return { type: "note", channel, number: data[1], value: 0, portId, portName };
  }
  return null;
}

export class MidiEngine {
  private access: MIDIAccess | null = null;
  private status: MidiStatus = midiSupported() ? "idle" : "unsupported";
  private eventListeners = new Set<EventListener>();
  private statusListeners = new Set<StatusListener>();
  private learnResolver: ((b: MidiBinding) => void) | null = null;

  getStatus(): MidiStatus {
    return this.status;
  }

  onEvent(fn: EventListener): () => void {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  }

  onStatus(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  private setStatus(s: MidiStatus) {
    this.status = s;
    this.statusListeners.forEach((fn) => fn(s));
  }

  async request(): Promise<void> {
    if (!midiSupported()) {
      this.setStatus("unsupported");
      return;
    }
    if (this.access) {
      this.setStatus("ready");
      return;
    }
    this.setStatus("requesting");
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      this.access = access;
      access.onstatechange = () => this.wireInputs();
      this.wireInputs();
      this.setStatus("ready");
    } catch {
      this.setStatus("denied");
    }
  }

  private wireInputs() {
    if (!this.access) return;
    for (const input of this.access.inputs.values()) {
      input.onmidimessage = (ev: MIDIMessageEvent) => {
        const data = ev.data;
        if (!data) return;
        const parsed = parse(data, input.id, input.name ?? "MIDI");
        if (!parsed) return;
        this.dispatch(parsed);
      };
    }
  }

  private dispatch(e: MidiEvent) {
    // Resolve a pending learn on the first meaningful (value > 0) message.
    if (this.learnResolver && e.value > 0) {
      const resolve = this.learnResolver;
      this.learnResolver = null;
      resolve({ type: e.type, channel: e.channel, number: e.number });
    }
    this.eventListeners.forEach((fn) => fn(e));
  }

  inputs(): MidiPort[] {
    if (!this.access) return [];
    return [...this.access.inputs.values()].map((p) => ({ id: p.id, name: p.name ?? "MIDI in" }));
  }

  outputs(): MidiPort[] {
    if (!this.access) return [];
    return [...this.access.outputs.values()].map((p) => ({ id: p.id, name: p.name ?? "MIDI out" }));
  }

  /** Wait for the next moved/pressed control. Resolves with its binding. */
  learn(): Promise<MidiBinding> {
    this.cancelLearn();
    return new Promise<MidiBinding>((resolve) => {
      this.learnResolver = resolve;
    });
  }

  cancelLearn() {
    this.learnResolver = null;
  }

  /** Inject a synthetic event (used by the on-screen "test" taps and demos). */
  simulate(e: Omit<MidiEvent, "portId" | "portName">) {
    this.dispatch({ ...e, portId: "sim", portName: "Simulation" });
  }

  isLearning(): boolean {
    return this.learnResolver != null;
  }

  /** Send LED/feedback to every output (or a specific one) for a binding. */
  sendFeedback(binding: MidiBinding, value: number, portId?: string) {
    if (!this.access) return;
    const status = (binding.type === "cc" ? 0xb0 : 0x90) | (binding.channel & 0x0f);
    const bytes = [status, binding.number & 0x7f, value & 0x7f];
    for (const out of this.access.outputs.values()) {
      if (portId && out.id !== portId) continue;
      try {
        out.send(bytes);
      } catch {
        /* port busy/closed — ignore */
      }
    }
  }

  /** Briefly flash an LED so the user can confirm output wiring. */
  flash(binding: MidiBinding, portId?: string) {
    this.sendFeedback(binding, 127, portId);
    setTimeout(() => this.sendFeedback(binding, 0, portId), 220);
  }
}

export const midiEngine = new MidiEngine();
