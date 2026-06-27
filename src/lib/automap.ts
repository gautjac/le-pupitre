import type { DeviceDef } from "../model/types.ts";
import { targetsForKind } from "../model/targets.ts";
import { type Lang, loc, makeT } from "../i18n/core.ts";

export interface AutoMapResponse {
  assignments: Record<string, string>;
  note?: string;
}

/** Build the compact payload the function needs to reason about a mapping. */
export function buildAutoMapPayload(device: DeviceDef, instruction: string, lang: Lang) {
  const controls = device.controls.map((c) => ({
    id: c.id,
    label: loc(c.label, lang),
    kind: c.kind,
    strip: c.strip ?? null,
  }));
  const targets = [
    ...new Map(
      device.controls
        .flatMap((c) => targetsForKind(c.kind))
        .map((t) => [t.id, { id: t.id, label: loc(t.label, lang), category: t.category, suits: t.suits }]),
    ).values(),
  ];
  return { instruction, controls, targets, lang };
}

/** POST to /api/automap, tolerating NDJSON keepalive (heartbeats + final result line). */
export async function requestAutoMap(
  device: DeviceDef,
  instruction: string,
  lang: Lang,
  signal?: AbortSignal,
): Promise<AutoMapResponse> {
  const t = makeT(lang);
  const res = await fetch("/api/automap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildAutoMapPayload(device, instruction, lang)),
    signal,
  });
  if (!res.ok) {
    throw new Error(res.status === 404 ? t("automap.err.unavailable") : t("automap.err.status", { status: res.status }));
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
  throw new Error(t("automap.err.unreadable"));
}
