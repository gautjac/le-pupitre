import type { ControlDef, ControlState, MidiBinding, MidiType } from "../model/types.ts";
import { TARGET_BY_ID, targetsForKind, type TargetDef } from "../model/targets.ts";
import type { UseMidi } from "../midi/useMidi.ts";
import { bindingLabel } from "../lib/format.ts";

const KIND_LABEL: Record<string, string> = {
  fader: "Fader (continu)",
  knob: "Potentiomètre (continu)",
  button: "Bouton (momentané)",
};

export function Inspector({
  control,
  state,
  midi,
  learning,
  onTarget,
  onBinding,
  onLearn,
  onCancelLearn,
}: {
  control: ControlDef | null;
  state: ControlState | null;
  midi: UseMidi;
  learning: boolean;
  onTarget: (targetId: string) => void;
  onBinding: (b: MidiBinding) => void;
  onLearn: () => void;
  onCancelLearn: () => void;
}) {
  if (!control || !state) {
    return (
      <aside className="panel h-fit p-5 lg:sticky lg:top-[84px]">
        <p className="text-sm text-ink-dim">Sélectionne un contrôle sur le pupitre pour l'éditer.</p>
      </aside>
    );
  }

  const target = TARGET_BY_ID[state.targetId];
  const options = targetsForKind(control.kind);
  const grouped = groupByCategory(options);
  const b = state.binding;

  const patch = (p: Partial<MidiBinding>) => onBinding({ ...b, ...p });

  return (
    <aside className="panel h-fit p-5 lg:sticky lg:top-[84px]">
      <div className="mb-4">
        <div className="text-[11px] font-mono uppercase tracking-wider text-ink-dim">
          {KIND_LABEL[control.kind]}
          {control.strip ? ` · piste ${control.strip}` : ""}
        </div>
        <h2 className="font-display text-xl font-bold text-ink">{control.label}</h2>
        <div className="mt-1 text-xs text-ink-soft">{bindingLabel(b)}</div>
      </div>

      {/* Target picker */}
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
        Action dans Live
      </label>
      <select
        value={state.targetId}
        onChange={(e) => onTarget(e.target.value)}
        className="w-full rounded-lg border border-desk-line bg-desk-rail px-3 py-2.5 text-sm text-ink outline-none focus:border-cyan-deep focus:shadow-glowcyan"
      >
        {grouped.map(([category, items]) => (
          <optgroup key={category} label={category}>
            {items.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {target && <p className="mt-1.5 text-xs text-ink-dim">{target.hint}</p>}

      <hr className="my-5 border-desk-edge" />

      {/* MIDI binding */}
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
          Signal MIDI
        </span>
        <button
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
            learning
              ? "animate-pulse2 bg-amber/20 text-amber-glow shadow-glowamber"
              : "border border-cyan-deep/60 bg-cyan/10 text-cyan-glow hover:bg-cyan/20"
          }`}
          onClick={learning ? onCancelLearn : onLearn}
        >
          {learning ? "● En écoute… (annuler)" : "Apprendre (MIDI Learn)"}
        </button>
      </div>
      {learning && (
        <p className="mb-2 rounded-md bg-amber/10 px-2.5 py-1.5 text-xs text-amber-glow">
          Bouge ou presse ce contrôle sur le nanoKONTROL Studio…
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Field label="Type">
          <div className="flex overflow-hidden rounded-md border border-desk-line">
            {(["cc", "note"] as MidiType[]).map((t) => (
              <button
                key={t}
                onClick={() => patch({ type: t })}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold transition ${
                  b.type === t ? "bg-desk-edge text-ink" : "bg-desk-rail text-ink-dim hover:text-ink"
                }`}
              >
                {t === "cc" ? "CC" : "Note"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Canal">
          <NumberInput
            value={b.channel + 1}
            min={1}
            max={16}
            onChange={(n) => patch({ channel: clamp(n, 1, 16) - 1 })}
          />
        </Field>
        <Field label={b.type === "cc" ? "N° CC" : "N° note"}>
          <NumberInput
            value={b.number}
            min={0}
            max={127}
            onChange={(n) => patch({ number: clamp(n, 0, 127) })}
          />
        </Field>
      </div>

      <button
        className="btn mt-4 w-full"
        onClick={() => midi.flash(b)}
        disabled={midi.status !== "ready" || control.kind !== "button"}
        title={
          control.kind !== "button"
            ? "Test LED réservé aux boutons"
            : midi.status !== "ready"
              ? "Connecte le MIDI d'abord"
              : "Allume brièvement la LED sur le contrôleur"
        }
      >
        Tester la LED
      </button>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
      {children}
    </label>
  );
}

function NumberInput({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        if (!Number.isNaN(n)) onChange(n);
      }}
      className="w-full rounded-md border border-desk-line bg-desk-rail px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-cyan-deep"
    />
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function groupByCategory(items: TargetDef[]): [string, TargetDef[]][] {
  const order = ["Aucune", "Mixage", "Transport", "Navigation", "Édition"];
  const map = new Map<string, TargetDef[]>();
  for (const t of items) {
    if (!map.has(t.category)) map.set(t.category, []);
    map.get(t.category)!.push(t);
  }
  return [...map.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
}
