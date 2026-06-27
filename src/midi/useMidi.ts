import { useCallback, useEffect, useRef, useState } from "react";
import { bindingKey, midiEngine, type MidiEvent, type MidiPort, type MidiStatus } from "./webmidi.ts";
import type { MidiBinding } from "../model/types.ts";

export interface Activity {
  value: number;
  at: number; // performance.now() timestamp of last message
}

export interface UseMidi {
  status: MidiStatus;
  inputs: MidiPort[];
  outputs: MidiPort[];
  /** bindingKey -> last activity, for the live device highlight. */
  activity: Record<string, Activity>;
  request: () => Promise<void>;
  learn: () => Promise<MidiBinding>;
  cancelLearn: () => void;
  flash: (b: MidiBinding) => void;
  /** Last event seen, for a scrolling monitor. */
  lastEvents: MidiEvent[];
}

export function useMidi(): UseMidi {
  const [status, setStatus] = useState<MidiStatus>(midiEngine.getStatus());
  const [ports, setPorts] = useState<{ inputs: MidiPort[]; outputs: MidiPort[] }>({
    inputs: midiEngine.inputs(),
    outputs: midiEngine.outputs(),
  });
  const [activity, setActivity] = useState<Record<string, Activity>>({});
  const [lastEvents, setLastEvents] = useState<MidiEvent[]>([]);
  const flushRef = useRef<Record<string, Activity>>({});
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const offStatus = midiEngine.onStatus((s) => {
      setStatus(s);
      setPorts({ inputs: midiEngine.inputs(), outputs: midiEngine.outputs() });
    });
    const offEvent = midiEngine.onEvent((e) => {
      const key = bindingKey(e);
      flushRef.current[key] = { value: e.value, at: performance.now() };
      // Throttle React updates to once per animation frame.
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          setActivity((prev) => ({ ...prev, ...flushRef.current }));
          flushRef.current = {};
        });
      }
      setLastEvents((prev) => [e, ...prev].slice(0, 60));
    });
    return () => {
      offStatus();
      offEvent();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const request = useCallback(() => midiEngine.request(), []);
  const learn = useCallback(() => midiEngine.learn(), []);
  const cancelLearn = useCallback(() => midiEngine.cancelLearn(), []);
  const flash = useCallback((b: MidiBinding) => midiEngine.flash(b), []);

  return {
    status,
    inputs: ports.inputs,
    outputs: ports.outputs,
    activity,
    request,
    learn,
    cancelLearn,
    flash,
    lastEvents,
  };
}
