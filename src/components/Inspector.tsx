import type { ControlDef, ControlState, MidiBinding, MidiType } from "../model/types.ts";
import { TARGET_BY_ID, targetsForKind, type CatKey, type TargetDef } from "../model/targets.ts";
import type { UseMidi } from "../midi/useMidi.ts";
import { useI18n } from "../i18n/lang.tsx";

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
  const { t, lc } = useI18n();

  if (!control || !state) {
    return (
      <aside className="panel h-fit p-5 lg:sticky lg:top-[84px]">
        <p className="text-sm text-ink-dim">{t("inspector.empty")}</p>
      </aside>
    );
  }

  const target = TARGET_BY_ID[state.targetId];
  const grouped = groupByCategory(targetsForKind(control.kind));
  const b = state.binding;
  const patch = (p: Partial<MidiBinding>) => onBinding({ ...b, ...p });

  const kindLabel = t(`inspector.kind.${control.kind}` as const);
  const bindingLabel = t("binding.label", {
    type: b.type === "cc" ? "CC" : "Note",
    n: b.number,
    ch: b.channel + 1,
  });

  return (
    <aside className="panel h-fit p-5 lg:sticky lg:top-[84px]">
      <div className="mb-4">
        <div className="text-[11px] font-mono uppercase tracking-wider text-ink-dim">
          {kindLabel}
          {control.strip ? t("inspector.trackSuffix", { n: control.strip }) : ""}
        </div>
        <h2 className="font-display text-xl font-bold text-ink">{lc(control.label)}</h2>
        <div className="mt-1 text-xs text-ink-soft">{bindingLabel}</div>
      </div>

      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
        {t("inspector.actionLabel")}
      </label>
      <select
        value={state.targetId}
        onChange={(e) => onTarget(e.target.value)}
        className="w-full rounded-lg border border-desk-line bg-desk-rail px-3 py-2.5 text-sm text-ink outline-none focus:border-cyan-deep focus:shadow-glowcyan"
      >
        {grouped.map(([category, items]) => (
          <optgroup key={category} label={t(`cat.${category}` as const)}>
            {items.map((tg) => (
              <option key={tg.id} value={tg.id}>
                {lc(tg.label)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {target && <p className="mt-1.5 text-xs text-ink-dim">{lc(target.hint)}</p>}

      <hr className="my-5 border-desk-edge" />

      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
          {t("inspector.midiSignal")}
        </span>
        <button
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
            learning
              ? "animate-pulse2 bg-amber/20 text-amber-glow shadow-glowamber"
              : "border border-cyan-deep/60 bg-cyan/10 text-cyan-glow hover:bg-cyan/20"
          }`}
          onClick={learning ? onCancelLearn : onLearn}
        >
          {learning ? t("inspector.learning") : t("inspector.learn")}
        </button>
      </div>
      {learning && (
        <p className="mb-2 rounded-md bg-amber/10 px-2.5 py-1.5 text-xs text-amber-glow">
          {t("inspector.learnHint")}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Field label={t("inspector.type")}>
          <div className="flex overflow-hidden rounded-md border border-desk-line">
            {(["cc", "note"] as MidiType[]).map((tp) => (
              <button
                key={tp}
                onClick={() => patch({ type: tp })}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold transition ${
                  b.type === tp ? "bg-desk-edge text-ink" : "bg-desk-rail text-ink-dim hover:text-ink"
                }`}
              >
                {tp === "cc" ? "CC" : "Note"}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t("inspector.channel")}>
          <NumberInput
            value={b.channel + 1}
            min={1}
            max={16}
            onChange={(n) => patch({ channel: clamp(n, 1, 16) - 1 })}
          />
        </Field>
        <Field label={b.type === "cc" ? t("inspector.ccNum") : t("inspector.noteNum")}>
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
            ? t("inspector.testLed.notButton")
            : midi.status !== "ready"
              ? t("inspector.testLed.notReady")
              : t("inspector.testLed.ready")
        }
      >
        {t("inspector.testLed")}
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

function groupByCategory(items: TargetDef[]): [CatKey, TargetDef[]][] {
  const order: CatKey[] = ["none", "mix", "transport", "nav", "edit"];
  const map = new Map<CatKey, TargetDef[]>();
  for (const tg of items) {
    if (!map.has(tg.category)) map.set(tg.category, []);
    map.get(tg.category)!.push(tg);
  }
  return [...map.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
}
