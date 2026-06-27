import { useState } from "react";
import type { DeviceDef } from "../model/types.ts";
import { TARGET_BY_ID } from "../model/targets.ts";
import { requestAutoMap } from "../lib/automap.ts";
import { useI18n } from "../i18n/lang.tsx";
import type { Loc } from "../i18n/core.ts";

const PRESETS: Loc[] = [
  {
    en: "A classic mixer: faders to volume, knobs to pan, the buttons to mute/solo/arm, and the transport for play/stop/record.",
    fr: "Un mixeur classique : faders en volume, potentiomètres en pan, les boutons en mute/solo/arm, et le transport pour lecture/stop/enregistrement.",
  },
  {
    en: "I want to mix sends: faders 1–4 to volume, faders 5–8 to Send A, knobs to pan.",
    fr: "Je veux mixer des envois : faders 1–4 en volume, faders 5–8 en envoi A, potentiomètres en pan.",
  },
  {
    en: "Live tracking: all faders to volume, the rec buttons arm tracks, cycle = loop, and the markers navigate scenes.",
    fr: "Setup de prise live : tous les faders en volume, les boutons rec arment les pistes, cycle = boucle, et les marqueurs naviguent les scènes.",
  },
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
  const { t, lc, lang } = useI18n();
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
      const res = await requestAutoMap(device, text.trim(), lang);
      setResult(res.assignments);
      setNote(res.note ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("automap.err.failed"));
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
            <h2 className="font-display text-lg font-bold text-ink">{t("automap.title")}</h2>
            <p className="text-xs text-ink-dim">{t("automap.subtitle")}</p>
          </div>
          <button className="btn px-3 py-1.5 text-xs" onClick={onClose}>
            {t("automap.close")}
          </button>
        </div>

        <div className="scroll-thin flex-1 overflow-auto px-5 py-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={t("automap.placeholder")}
            className="w-full resize-none rounded-lg border border-desk-line bg-desk-rail px-3 py-2.5 text-sm text-ink outline-none focus:border-cyan-deep focus:shadow-glowcyan"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setText(lc(p))}
                className="rounded-full border border-desk-line bg-desk-rail px-2.5 py-1 text-[11px] text-ink-dim transition hover:text-ink"
              >
                {t("automap.example", { n: i + 1 })}
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
                {t("automap.proposed", { n: changed.length })}
              </div>
              <div className="scroll-thin mt-1.5 max-h-52 overflow-auto rounded-lg border border-desk-edge">
                <table className="w-full text-xs">
                  <tbody>
                    {changed.map((c) => (
                      <tr key={c.id} className="border-b border-desk-edge/50 last:border-0">
                        <td className="px-3 py-1.5 text-ink-soft">{lc(c.label)}</td>
                        <td className="px-3 py-1.5 text-right text-ink">
                          {TARGET_BY_ID[result[c.id]] ? lc(TARGET_BY_ID[result[c.id]].label) : result[c.id]}
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
            {busy ? t("automap.busy") : result ? t("automap.repropose") : t("automap.propose")}
          </button>
          {result && (
            <button
              className="btn btn-amber font-semibold"
              onClick={() => onApply(result)}
              disabled={changed.length === 0}
            >
              {t("automap.apply")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
