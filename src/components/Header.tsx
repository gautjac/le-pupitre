import type { DeviceDef, Mapping } from "../model/types.ts";
import type { UseMidi } from "../midi/useMidi.ts";

const STATUS: Record<string, { dot: string; label: string }> = {
  unsupported: { dot: "bg-rose", label: "Web MIDI non supporté" },
  idle: { dot: "bg-ink-dim", label: "MIDI hors ligne" },
  requesting: { dot: "bg-amber animate-pulse2", label: "Connexion…" },
  ready: { dot: "bg-lime", label: "MIDI connecté" },
  denied: { dot: "bg-rose", label: "Accès MIDI refusé" },
};

export function Header({
  device,
  midi,
  mapping,
  assignedCount,
  exporting,
  warnings,
  onScriptName,
  onLiveVersion,
  onRequestMidi,
  onExport,
  onReset,
  onAutoMap,
}: {
  device: DeviceDef;
  midi: UseMidi;
  mapping: Mapping;
  assignedCount: number;
  exporting: boolean;
  warnings: string[];
  onScriptName: (s: string) => void;
  onLiveVersion: (v: "12" | "11") => void;
  onRequestMidi: () => void;
  onExport: () => void;
  onReset: () => void;
  onAutoMap: () => void;
}) {
  const st = STATUS[midi.status] ?? STATUS.idle;
  const canConnect = midi.status === "idle" || midi.status === "denied";

  return (
    <header className="sticky top-0 z-30 border-b border-desk-edge bg-desk/85 backdrop-blur-md brushed">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight text-ink">
              Le Pupitre
            </div>
            <div className="text-[11px] text-ink-dim">surfaces de contrôle · Ableton Live</div>
          </div>
        </div>

        <span className="chip border-desk-line/80">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
          {device.name}
        </span>

        {/* Script name + Live version */}
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="scriptName">
            Nom du script
          </label>
          <input
            id="scriptName"
            value={mapping.scriptName}
            onChange={(e) => onScriptName(e.target.value)}
            spellCheck={false}
            className="w-52 rounded-lg border border-desk-line bg-desk-rail px-3 py-2 font-mono text-sm text-ink outline-none focus:border-cyan-deep focus:shadow-glowcyan"
            aria-label="Nom du script"
          />
          <div className="flex overflow-hidden rounded-lg border border-desk-line">
            {(["12", "11"] as const).map((v) => (
              <button
                key={v}
                onClick={() => onLiveVersion(v)}
                className={`px-2.5 py-2 text-xs font-semibold transition ${
                  mapping.liveVersion === v
                    ? "bg-desk-edge text-ink"
                    : "bg-desk-rail text-ink-dim hover:text-ink"
                }`}
                title={`Ableton Live ${v}`}
              >
                L{v}
              </button>
            ))}
          </div>
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="chip" title={st.label}>
            <span className={`h-2 w-2 rounded-full ${st.dot}`} />
            {st.label}
          </span>
          {canConnect && (
            <button className="btn btn-cyan" onClick={onRequestMidi}>
              Connecter MIDI
            </button>
          )}
          <span className="chip border-desk-line/60 text-ink-soft">
            {assignedCount} assignés
            {warnings.length > 0 && (
              <span className="ml-1 text-amber-glow" title={warnings.join("\n")}>
                · {warnings.length}⚠
              </span>
            )}
          </span>
          <button className="btn" onClick={onAutoMap} title="Décris ton workflow, Claude propose un mappage">
            <SparkIcon /> Auto-map IA
          </button>
          <button className="btn" onClick={onReset}>
            Réinit.
          </button>
          <button className="btn btn-amber font-semibold" onClick={onExport} disabled={exporting}>
            {exporting ? "Préparation…" : "Exporter .zip"}
          </button>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden>
      <rect width="40" height="40" rx="9" fill="#191d26" stroke="#2e3543" />
      <rect x="9" y="8" width="3.5" height="24" rx="1.75" fill="#2e3543" />
      <rect x="18.5" y="8" width="3.5" height="24" rx="1.75" fill="#2e3543" />
      <rect x="28" y="8" width="3.5" height="24" rx="1.75" fill="#2e3543" />
      <rect x="7" y="22" width="7.5" height="4.5" rx="2.25" fill="#f6a821" />
      <rect x="16.5" y="13" width="7.5" height="4.5" rx="2.25" fill="#33d6dd" />
      <rect x="26" y="25" width="7.5" height="4.5" rx="2.25" fill="#5be08a" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M12 3l1.8 4.9L18.7 9.7 13.8 11.5 12 16.4 10.2 11.5 5.3 9.7l4.9-1.8L12 3z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M18.5 14.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
