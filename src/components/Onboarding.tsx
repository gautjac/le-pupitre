export function Onboarding({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="panel max-w-lg animate-riseIn overflow-hidden">
        <div className="border-b border-desk-edge bg-desk-rail/50 px-6 py-5">
          <h2 className="font-display text-2xl font-bold text-ink">Le Pupitre</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Transforme ton Korg nanoKONTROL Studio en surface de contrôle Ableton Live — sans écrire
            une ligne de Python.
          </p>
        </div>
        <div className="space-y-4 px-6 py-5">
          <Row icon="🎚️" title="Mappe visuellement">
            Clique un fader, un bouton, un potentiomètre, puis choisis ce qu'il pilote dans Live :
            volume, pan, mute, solo, lecture, stop, enregistrement…
          </Row>
          <Row icon="🎛️" title="MIDI-Learn en direct">
            Branche le contrôleur, clique <b>Apprendre</b> et bouge le contrôle : Le Pupitre capture
            son vrai signal MIDI. (Chrome/Edge requis pour le Web MIDI.)
          </Row>
          <Row icon="🐍" title="Exporte un vrai Remote Script">
            Tu télécharges un dossier Python prêt à déposer dans Ableton. Un mappage par défaut
            t'attend déjà — tu peux exporter tout de suite.
          </Row>
        </div>
        <div className="flex justify-end gap-2 border-t border-desk-edge bg-desk-rail/40 px-6 py-4">
          <button className="btn btn-amber font-semibold" onClick={onClose}>
            Commencer
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-2xl leading-none">{icon}</span>
      <div>
        <div className="font-semibold text-ink">{title}</div>
        <div className="mt-0.5 text-sm leading-relaxed text-ink-soft">{children}</div>
      </div>
    </div>
  );
}
