import { useEffect, useState } from "react";
import type { ControlDef, DeviceDef, Mapping, MidiType } from "../model/types.ts";
import { TARGET_BY_ID, type CatKey } from "../model/targets.ts";
import { bindingKey } from "../midi/webmidi.ts";
import type { Activity } from "../midi/useMidi.ts";
import { bindingShort } from "../lib/format.ts";
import { useI18n } from "../i18n/lang.tsx";
import type { Loc } from "../i18n/core.ts";

const CATEGORY_COLOR: Record<CatKey, string> = {
  mix: "#f6a821",
  transport: "#33d6dd",
  nav: "#9b8cff",
  edit: "#5be08a",
  none: "#5b6675",
};

function colorFor(targetId: string): string {
  const t = TARGET_BY_ID[targetId];
  if (!t || t.wiring.kind === "none") return CATEGORY_COLOR.none;
  return CATEGORY_COLOR[t.category] ?? CATEGORY_COLOR.none;
}

interface Common {
  mapping: Mapping;
  activity: Record<string, Activity>;
  now: number;
  midiReady: boolean;
  selectedId: string | null;
  learningId: string | null;
  onSelect: (id: string) => void;
  lc: (v: Loc) => string;
}

interface CtrlView {
  def: ControlDef;
  label: string;
  color: string;
  assigned: boolean;
  targetLabel: string;
  value: number;
  active: boolean;
  selected: boolean;
  learning: boolean;
  bindingType: MidiType;
  bindingText: string;
}

function view(def: ControlDef, c: Common): CtrlView {
  const state = c.mapping.controls[def.id];
  const target = TARGET_BY_ID[state.targetId];
  const assigned = !!target && target.wiring.kind !== "none";
  const key = bindingKey(state.binding);
  const act = c.activity[key];
  const active = c.midiReady && !!act && c.now - act.at < 240;
  return {
    def,
    label: c.lc(def.label),
    color: colorFor(state.targetId),
    assigned,
    targetLabel: assigned ? c.lc(target.label) : "—",
    value: act?.value ?? 0,
    active,
    selected: c.selectedId === def.id,
    learning: c.learningId === def.id,
    bindingType: state.binding.type,
    bindingText: bindingShort(state.binding),
  };
}

function frame(v: CtrlView): React.CSSProperties {
  if (v.learning) return { boxShadow: "0 0 0 2px #f6a821, 0 0 16px -2px #ffc24d" };
  if (v.active) return { boxShadow: `0 0 0 1px ${v.color}, 0 0 16px -2px ${v.color}` };
  if (v.selected) return { boxShadow: `0 0 0 2px ${v.color}` };
  return {};
}

export function DevicePanel({
  device,
  mapping,
  activity,
  midiReady,
  selectedId,
  learningId,
  onSelect,
}: {
  device: DeviceDef;
  mapping: Mapping;
  activity: Record<string, Activity>;
  midiReady: boolean;
  selectedId: string | null;
  learningId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t, lc } = useI18n();
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!midiReady) return;
    const tk = setInterval(() => setNow(performance.now()), 90);
    return () => clearInterval(tk);
  }, [midiReady]);

  const common: Common = { mapping, activity, now, midiReady, selectedId, learningId, onSelect, lc };

  const strips = Array.from({ length: device.strips }, (_, i) => i + 1);
  const byId = (id: string) => device.controls.find((c) => c.id === id)!;
  const transport = device.controls.filter((c) => c.group === "transport");
  const nav = device.controls.filter((c) => c.group === "nav");

  return (
    <section className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-soft">
          {device.vendor} · {device.name.replace(device.vendor + " ", "")}
        </h2>
        <Legend />
      </div>

      <div className="rounded-xl border border-desk-edge bg-desk-black/60 p-3 shadow-slot">
        <div className="overflow-x-auto scroll-thin">
          <div className="flex min-w-max gap-2.5">
            {strips.map((s) => {
              const fader = view(byId(`fader.${s}`), common);
              const knob = view(byId(`knob.${s}`), common);
              const solo = view(byId(`solo.${s}`), common);
              const mute = view(byId(`mute.${s}`), common);
              const rec = view(byId(`rec.${s}`), common);
              return (
                <div
                  key={s}
                  className="flex w-[92px] shrink-0 flex-col items-center gap-2 rounded-lg border border-desk-edge/70 bg-desk-rail/40 px-1.5 pb-2 pt-1.5"
                >
                  <div className="text-[10px] font-mono text-ink-dim">{t("device.track", { n: s })}</div>
                  <Knob v={knob} onSelect={onSelect} />
                  <div className="flex w-full items-stretch gap-1">
                    <Fader v={fader} onSelect={onSelect} />
                    <div className="flex flex-col justify-end gap-1">
                      <Pad v={solo} onSelect={onSelect} />
                      <Pad v={mute} onSelect={onSelect} />
                      <Pad v={rec} onSelect={onSelect} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-4 border-t border-desk-edge/70 pt-3">
          <Cluster label={t("cat.transport")}>
            {transport.map((c) => (
              <WideButton key={c.id} v={view(c, common)} onSelect={onSelect} />
            ))}
          </Cluster>
          <Cluster label={t("cat.nav")}>
            {nav.map((c) => (
              <WideButton key={c.id} v={view(c, common)} onSelect={onSelect} />
            ))}
          </Cluster>
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-dim">
        {midiReady ? t("device.clickHint.ready") : t("device.clickHint.idle")}
      </p>
    </section>
  );
}

function Cluster({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-dim">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function title(v: CtrlView): string {
  return `${v.label} → ${v.targetLabel} (${v.bindingText})`;
}

function Knob({ v, onSelect }: { v: CtrlView; onSelect: (id: string) => void }) {
  const angle = -135 + (v.value / 127) * 270;
  return (
    <button
      onClick={() => onSelect(v.def.id)}
      style={frame(v)}
      className="group relative grid h-11 w-11 place-items-center rounded-full border border-desk-line bg-gradient-to-b from-desk-line/80 to-desk-black transition"
      title={title(v)}
    >
      <span
        className="absolute h-[18px] w-[2px] rounded-full"
        style={{ background: v.assigned ? v.color : "#5b6675", transform: `rotate(${angle}deg)`, transformOrigin: "center 18px", top: 4 }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: v.assigned ? v.color : "#3a4150", opacity: v.active ? 1 : 0.5 }}
      />
    </button>
  );
}

function Fader({ v, onSelect }: { v: CtrlView; onSelect: (id: string) => void }) {
  const pct = Math.max(0, Math.min(1, v.value / 127));
  return (
    <button
      onClick={() => onSelect(v.def.id)}
      style={frame(v)}
      className="relative h-[104px] w-7 rounded-md border border-desk-line bg-desk-black/80"
      title={title(v)}
    >
      <span className="absolute inset-x-1/2 top-2 bottom-2 w-[2px] -translate-x-1/2 rounded bg-desk-line/70" />
      <span
        className="absolute left-1/2 h-4 w-5 -translate-x-1/2 rounded-sm border border-black/40 shadow"
        style={{
          bottom: `calc(${pct * 100}% * 0.78 + 6px)`,
          background: v.assigned
            ? `linear-gradient(180deg, ${v.color}, ${v.color}aa)`
            : "linear-gradient(180deg,#3a4150,#222733)",
        }}
      />
    </button>
  );
}

function Pad({ v, onSelect }: { v: CtrlView; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(v.def.id)}
      style={frame(v)}
      className="grid h-[26px] w-7 place-items-center rounded-[5px] border text-[10px] font-bold transition"
      title={title(v)}
    >
      <span
        className="grid h-full w-full place-items-center rounded-[4px]"
        style={{
          color: v.assigned ? "#0c0e12" : "#6f7b8b",
          background: v.assigned ? (v.active ? v.color : `${v.color}cc`) : "transparent",
          borderColor: v.assigned ? v.color : "#2e3543",
        }}
      >
        {v.def.short}
      </span>
    </button>
  );
}

function WideButton({ v, onSelect }: { v: CtrlView; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(v.def.id)}
      style={frame(v)}
      className="flex min-w-[44px] items-center gap-1.5 rounded-md border border-desk-line bg-desk-rail/70 px-2 py-1.5 transition hover:bg-desk-edge"
      title={title(v)}
    >
      <span
        className="grid h-4 w-4 place-items-center rounded-full text-[10px]"
        style={{
          background: v.assigned ? (v.active ? v.color : `${v.color}cc`) : "#2e3543",
          color: v.assigned ? "#0c0e12" : "#6f7b8b",
        }}
      >
        {v.def.short}
      </span>
      <span className="text-[11px] font-medium text-ink-soft">
        {v.label.replace(/[◀▶●]/g, "").trim() || v.label}
      </span>
    </button>
  );
}

function Legend() {
  const { t } = useI18n();
  const items: [CatKey, string][] = [
    ["mix", CATEGORY_COLOR.mix],
    ["transport", CATEGORY_COLOR.transport],
    ["nav", CATEGORY_COLOR.nav],
    ["edit", CATEGORY_COLOR.edit],
  ];
  return (
    <div className="hidden items-center gap-2.5 sm:flex">
      {items.map(([key, color]) => (
        <span key={key} className="flex items-center gap-1 text-[10px] text-ink-dim">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {t(`cat.${key}`)}
        </span>
      ))}
    </div>
  );
}
