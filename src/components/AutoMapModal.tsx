import { useState } from "react";
import type { DeviceDef } from "../model/types.ts";
import { TARGET_BY_ID } from "../model/targets.ts";
import { requestAutoMap } from "../lib/automap.ts";

const PRESETS = [
  "Un mixeur classique : faders en volume, potentiomètres en pan, les boutons en mute/solo/arm, et le transport pour lecture/stop/enregistrement.",
  "Je veux mixer des envois : faders 1–4 en volume, faders 5–8 en envoi A, potentiomètres en pan.",
  "Setup de prise live : tous les faders en volume, les boutons rec arment les pistes, cycle = boucle, et les marqueurs naviguent les scènes.",
];

export function AutoMapModal({
  device,
  onClose,
  onApply,
}: {
  device: DeviceDef;
  onClose: () => void;
  onApply: (assignments: Record<string, string>) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const run = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setNote(null);
    try {
      const res = await requestAutoMap(device, text.trim());
      setResult(res.assignments);
      setNote(res.note ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la requête.");
    } finally {
      setBusy(false);
    }
  };

  const changed = result
    ? device.controls.filter((c) => result[c.id] && result[c.id] !== "none")
    : [];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="panel flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-desk-edge bg-desk-rail/50 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Auto-map IA</h2>
            <p className="text-xs text-ink-dim">Décris ton workflow, Claude propose le mappage.</p>
          </div>
          <button className="btn px-3 py-1.5 text-xs" onClick={onClose}>
            Fermer
          </button>
        </div>

        <div className="scroll-thin flex-1 overflow-auto px-5 py-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Ex. : faders en volume, potards en pan, boutons en mute/solo/arm, transport pour play/stop/rec…"
            className="w-full resize-none rounded-lg border border-desk-line bg-desk-rail px-3 py-2.5 text-sm text-ink outline-none focus:border-cyan-deep focus:shadow-glowcyan"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setText(p)}
                className="rounded-full border border-desk-line bg-desk-rail px-2.5 py-1 text-[11px] text-ink-dim transition hover:text-ink"
              >
                Exemple {i + 1}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-rose/40 bg-rose/10 px-3 py-2 text-xs text-rose">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4">
              {note && <p className="mb-2 text-xs text-ink-soft">{note}</p>}
              <div className="text-[11px] font-mono uppercase tracking-wider text-ink-dim">
                {changed.length} contrôles proposés
              </div>
              <div className="scroll-thin mt-1.5 max-h-52 overflow-auto rounded-lg border border-desk-edge">
                <table className="w-full text-xs">
                  <tbody>
                    {changed.map((c) => (
                      <tr key={c.id} className="border-b border-desk-edge/50 last:border-0">
                        <td className="px-3 py-1.5 text-ink-soft">{c.label}</td>
                        <td className="px-3 py-1.5 text-right text-ink">
                          {TARGET_BY_ID[result[c.id]]?.label ?? result[c.id]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-desk-edge bg-desk-rail/40 px-5 py-4">
          <button className="btn" onClick={run} disabled={busy || !text.trim()}>
            {busy ? "Claude réfléchit…" : result ? "Reproposer" : "Proposer"}
          </button>
          {result && (
            <button
              className="btn btn-amber font-semibold"
              onClick={() => onApply(result)}
              disabled={changed.length === 0}
            >
              Appliquer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
