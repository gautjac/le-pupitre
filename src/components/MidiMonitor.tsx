import type { UseMidi } from "../midi/useMidi.ts";

export function MidiMonitor({ midi }: { midi: UseMidi }) {
  return (
    <div className="p-4">
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <PortList title="Entrées MIDI" ports={midi.inputs} empty="Aucune entrée détectée" />
        <PortList title="Sorties MIDI (LEDs)" ports={midi.outputs} empty="Aucune sortie détectée" />
      </div>

      <div className="text-[11px] font-mono uppercase tracking-wider text-ink-dim">
        Flux entrant
      </div>
      <div className="scroll-thin mt-1.5 max-h-[280px] overflow-auto rounded-lg border border-desk-edge bg-desk-black/60">
        {midi.status !== "ready" ? (
          <Empty>Connecte le MIDI pour voir les messages.</Empty>
        ) : midi.lastEvents.length === 0 ? (
          <Empty>Bouge un contrôle sur le nanoKONTROL Studio…</Empty>
        ) : (
          <table className="w-full font-mono text-xs">
            <tbody>
              {midi.lastEvents.map((e, i) => (
                <tr key={i} className="border-b border-desk-edge/50 last:border-0">
                  <td className="px-3 py-1.5">
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                      style={{
                        background: e.type === "cc" ? "#33d6dd22" : "#9b8cff22",
                        color: e.type === "cc" ? "#7df0f4" : "#9b8cff",
                      }}
                    >
                      {e.type === "cc" ? "CC" : "NOTE"}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-ink-soft">canal {e.channel + 1}</td>
                  <td className="px-2 py-1.5 text-ink">#{e.number}</td>
                  <td className="px-2 py-1.5 text-amber-glow">val {e.value}</td>
                  <td className="w-1/3 px-3 py-1.5 text-right text-ink-dim">{e.portName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PortList({
  title,
  ports,
  empty,
}: {
  title: string;
  ports: { id: string; name: string }[];
  empty: string;
}) {
  return (
    <div className="rounded-lg border border-desk-edge bg-desk-rail/30 p-3">
      <div className="mb-1.5 text-[11px] font-mono uppercase tracking-wider text-ink-dim">{title}</div>
      {ports.length === 0 ? (
        <div className="text-xs text-ink-dim">{empty}</div>
      ) : (
        <ul className="space-y-1">
          {ports.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-xs text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              {p.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-8 text-center text-xs text-ink-dim">{children}</div>;
}
