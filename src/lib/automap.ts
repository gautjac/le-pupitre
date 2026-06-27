import type { DeviceDef } from "../model/types.ts";
import { targetsForKind } from "../model/targets.ts";

export interface AutoMapResponse {
  assignments: Record<string, string>;
  note?: string;
}

/** Build the compact payload the function needs to reason about a mapping. */
export function buildAutoMapPayload(device: DeviceDef, instruction: string) {
  const controls = device.controls.map((c) => ({
    id: c.id,
    label: c.label,
    kind: c.kind,
    strip: c.strip ?? null,
  }));
  // De-duplicated target catalog with the kinds each suits.
  const targets = [
    ...new Map(
      device.controls
        .flatMap((c) => targetsForKind(c.kind))
        .map((t) => [t.id, { id: t.id, label: t.label, category: t.category, suits: t.suits }]),
    ).values(),
  ];
  return { instruction, controls, targets };
}

/** POST to /api/automap, tolerating NDJSON keepalive (heartbeats + final result line). */
export async function requestAutoMap(
  device: DeviceDef,
  instruction: string,
  signal?: AbortSignal,
): Promise<AutoMapResponse> {
  const res = await fetch("/api/automap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildAutoMapPayload(device, instruction)),
    signal,
  });
  if (!res.ok) {
    throw new Error(res.status === 404 ? "Fonction IA indisponible (mode local)." : `Erreur ${res.status}.`);
  }

  const text = await res.text();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(lines[i]);
      const payload = parsed.result ?? parsed;
      if (payload && typeof payload === "object" && payload.assignments) {
        return payload as AutoMapResponse;
      }
    } catch {
      /* not JSON — keep scanning upward */
    }
  }
  throw new Error("Réponse IA illisible.");
}
