import { useState } from "react";
import type { DeviceDef } from "../model/types.ts";

export function InstallGuide({ scriptName, device }: { scriptName: string; device: DeviceDef }) {
  const macPath = "~/Music/Ableton/User Library/Remote Scripts/";
  const [copied, setCopied] = useState(false);

  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText(macPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-4 p-5 text-sm text-ink-soft">
      <ol className="space-y-3">
        <Step n={1} title="Exporter le script">
          Clique <b className="text-ink">Exporter .zip</b> en haut, puis décompresse-le. Tu obtiens
          un dossier <Code>{scriptName}</Code>.
        </Step>
        <Step n={2} title="Déposer dans le dossier Remote Scripts">
          Copie le dossier <Code>{scriptName}</Code> dans :
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-md border border-desk-edge bg-desk-black/70 px-3 py-2 font-mono text-xs text-cyan-glow">
              {macPath}
            </code>
            <button className="btn px-3 py-2 text-xs" onClick={copyPath}>
              {copied ? "Copié ✓" : "Copier"}
            </button>
          </div>
          <span className="mt-1 block text-xs text-ink-dim">
            Windows : <Code>\Users\&lt;toi&gt;\Documents\Ableton\User Library\Remote Scripts\</Code>
          </span>
        </Step>
        <Step n={3} title="Redémarrer Ableton Live">
          Live ne lit les nouveaux scripts qu'au démarrage.
        </Step>
        <Step n={4} title="Sélectionner la surface de contrôle">
          <b className="text-ink">Réglages → Link, Tempo & MIDI</b>. Dans un emplacement
          <b className="text-ink"> Surface de contrôle</b>, choisis <Code>{scriptName}</Code>. Mets
          l'<b className="text-ink">Entrée</b> et la <b className="text-ink">Sortie</b> sur le{" "}
          {device.name}.
        </Step>
        <Step n={5} title="Activer Remote (entrée + sortie)">
          Dans le tableau <b className="text-ink">Ports MIDI</b>, mets <b className="text-ink">Remote = On</b>{" "}
          pour l'entrée <i>et</i> la sortie du {device.name}. La sortie pilote les LED des boutons.
        </Step>
      </ol>

      <div className="rounded-lg border border-cyan-deep/40 bg-cyan/5 p-3 text-xs">
        <div className="mb-1 font-semibold text-cyan-glow">Côté contrôleur (Korg Kontrol Editor)</div>
        Règle les boutons en mode <b>Momentary</b> et les LED en <b>External</b>, pour que Live
        commande les lumières. Si les numéros CC de ton unité diffèrent, utilise le{" "}
        <b>MIDI-Learn</b> de l'inspecteur pour capturer les vraies valeurs.
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-amber-deep/60 bg-amber/15 text-xs font-bold text-amber-glow">
        {n}
      </span>
      <div>
        <div className="font-semibold text-ink">{title}</div>
        <div className="mt-0.5 leading-relaxed">{children}</div>
      </div>
    </li>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-desk-black/70 px-1.5 py-0.5 font-mono text-[12px] text-ink">
      {children}
    </code>
  );
}
