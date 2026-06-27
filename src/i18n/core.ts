// Pure (no React) i18n: language type, localized-value helper, and the full
// EN/FR string dictionary with {token} interpolation.

export type Lang = "en" | "fr";

/** A value that exists in both languages (used for data labels). */
export interface Loc {
  en: string;
  fr: string;
}

export const loc = (v: Loc, lang: Lang): string => v[lang];

export type Params = Record<string, string | number>;

function interpolate(s: string, params?: Params): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

// English is the source of truth for the key set.
const EN = {
  "header.tagline": "control surfaces · Ableton Live",
  "header.connectMidi": "Connect MIDI",
  "header.assigned": "{n} assigned",
  "header.autoMap": "AI auto-map",
  "header.autoMapTitle": "Describe your workflow, Claude proposes a mapping",
  "header.reset": "Reset",
  "header.export": "Export .zip",
  "header.exporting": "Preparing…",
  "header.scriptNameAria": "Script name",
  "header.liveVersionTitle": "Ableton Live {v}",
  "header.langTitle": "Language",

  "status.unsupported": "Web MIDI unsupported",
  "status.idle": "MIDI offline",
  "status.requesting": "Connecting…",
  "status.ready": "MIDI connected",
  "status.denied": "MIDI access denied",

  "tab.code": "Script preview",
  "tab.monitor": "MIDI monitor",
  "tab.install": "Install",

  "app.resetConfirm": "Reset the whole mapping to the nanoKONTROL Studio defaults?",

  "cat.mix": "Mixer",
  "cat.transport": "Transport",
  "cat.nav": "Navigation",
  "cat.edit": "Edit",
  "cat.none": "None",

  "device.clickHint.ready": "Click a control to assign it. Move it on the nanoKONTROL — it lights up here.",
  "device.clickHint.idle": "Click a control to assign it. Connect MIDI to see it react live.",
  "device.track": "TRACK {n}",

  "inspector.empty": "Select a control on the desk to edit it.",
  "inspector.kind.fader": "Fader (continuous)",
  "inspector.kind.knob": "Knob (continuous)",
  "inspector.kind.button": "Button (momentary)",
  "inspector.trackSuffix": " · track {n}",
  "inspector.actionLabel": "Live action",
  "inspector.midiSignal": "MIDI signal",
  "inspector.learn": "Learn (MIDI)",
  "inspector.learning": "● Listening… (cancel)",
  "inspector.learnHint": "Move or press this control on the nanoKONTROL Studio…",
  "inspector.type": "Type",
  "inspector.channel": "Channel",
  "inspector.ccNum": "CC #",
  "inspector.noteNum": "Note #",
  "inspector.testLed": "Test LED",
  "inspector.testLed.notButton": "LED test is for buttons only",
  "inspector.testLed.notReady": "Connect MIDI first",
  "inspector.testLed.ready": "Briefly lights the LED on the controller",

  "code.files": "{n} files · {name}/",
  "code.copy": "Copy",
  "code.copied": "Copied ✓",
  "code.download": "Download .zip",

  "monitor.inputs": "MIDI inputs",
  "monitor.outputs": "MIDI outputs (LEDs)",
  "monitor.noInput": "No input detected",
  "monitor.noOutput": "No output detected",
  "monitor.incoming": "Incoming stream",
  "monitor.connectFirst": "Connect MIDI to see messages.",
  "monitor.movePrompt": "Move a control on the nanoKONTROL Studio…",
  "monitor.channel": "ch {n}",
  "monitor.val": "val {v}",

  "binding.label": "{type} {n} · ch {ch}",

  "install.intro.title": "How your mapping reaches the controller",
  "install.intro.body":
    "Le Pupitre does not program the hardware. It builds a script that teaches *Ableton Live* what your controller's MIDI means. Once installed, Live and the nanoKONTROL talk to each other live — including lighting the LEDs.",
  "install.flow.web": "Le Pupitre (this app)",
  "install.flow.script": "Python Remote Script",
  "install.flow.live": "Ableton Live",
  "install.flow.device": "nanoKONTROL Studio",
  "install.flow.caption": "Your mapping installs into Ableton — not onto the device. The device just sends MIDI; the script tells Live what each message does.",

  "install.step1.title": "Export the script",
  "install.step1.body": "Click {b} at the top, then unzip it. You get a folder called {code}.",
  "install.step2.title": "Drop it into the Remote Scripts folder",
  "install.step2.body": "Copy the {code} folder into:",
  "install.step2.win": "Windows: {code}",
  "install.step3.title": "Restart Ableton Live",
  "install.step3.body": "Live only reads new scripts at startup.",
  "install.step4.title": "Select the control surface",
  "install.step4.body":
    "{settings}. In a {cs} slot, choose {code}. Set Input and Output to the {device}.",
  "install.step4.settings": "Settings → Link, Tempo & MIDI",
  "install.step4.cs": "Control Surface",
  "install.step5.title": "Turn on Remote (input + output)",
  "install.step5.body":
    "In the {ports} table, set {remote} for the {device}'s input and output. The output drives the button LEDs.",
  "install.step5.ports": "MIDI Ports",
  "install.step5.remote": "Remote = On",
  "install.copy": "Copy",
  "install.copied": "Copied ✓",
  "install.controller.title": "Controller side (Korg Kontrol Editor)",
  "install.controller.body":
    "Set the buttons to Momentary and the LEDs to External, so Live drives the lights. If your unit's CC numbers differ, use MIDI-Learn in the inspector to capture the real values.",

  "onboard.subtitle":
    "Turn your Korg nanoKONTROL Studio into an Ableton Live control surface — without writing a line of Python.",
  "onboard.r1.title": "Map it visually",
  "onboard.r1.body":
    "Click a fader, button or knob, then choose what it drives in Live: volume, pan, mute, solo, play, stop, record…",
  "onboard.r2.title": "Live MIDI-Learn",
  "onboard.r2.body":
    "Plug in the controller, click Learn and move the control: Le Pupitre captures its real MIDI signal. (Chrome/Edge required for Web MIDI.)",
  "onboard.r3.title": "Export a real Remote Script",
  "onboard.r3.body":
    "You download a Python folder ready to drop into Ableton. A default mapping is already waiting — you can export right away.",
  "onboard.cta": "Get started",

  "automap.title": "AI auto-map",
  "automap.subtitle": "Describe your workflow, Claude proposes the mapping.",
  "automap.close": "Close",
  "automap.placeholder":
    "e.g. faders to volume, knobs to pan, buttons to mute/solo/arm, transport for play/stop/rec…",
  "automap.example": "Example {n}",
  "automap.propose": "Propose",
  "automap.busy": "Claude is thinking…",
  "automap.repropose": "Re-propose",
  "automap.apply": "Apply",
  "automap.proposed": "{n} controls proposed",
  "automap.err.unavailable": "AI function unavailable (local mode).",
  "automap.err.status": "Error {status}.",
  "automap.err.unreadable": "Unreadable AI response.",
  "automap.err.failed": "Request failed.",
} as const;

export type StrKey = keyof typeof EN;

const FR: Record<StrKey, string> = {
  "header.tagline": "surfaces de contrôle · Ableton Live",
  "header.connectMidi": "Connecter MIDI",
  "header.assigned": "{n} assignés",
  "header.autoMap": "Auto-map IA",
  "header.autoMapTitle": "Décris ton workflow, Claude propose un mappage",
  "header.reset": "Réinit.",
  "header.export": "Exporter .zip",
  "header.exporting": "Préparation…",
  "header.scriptNameAria": "Nom du script",
  "header.liveVersionTitle": "Ableton Live {v}",
  "header.langTitle": "Langue",

  "status.unsupported": "Web MIDI non supporté",
  "status.idle": "MIDI hors ligne",
  "status.requesting": "Connexion…",
  "status.ready": "MIDI connecté",
  "status.denied": "Accès MIDI refusé",

  "tab.code": "Aperçu du script",
  "tab.monitor": "Moniteur MIDI",
  "tab.install": "Installation",

  "app.resetConfirm": "Réinitialiser tout le mappage aux valeurs par défaut du nanoKONTROL Studio ?",

  "cat.mix": "Mixage",
  "cat.transport": "Transport",
  "cat.nav": "Navigation",
  "cat.edit": "Édition",
  "cat.none": "Aucune",

  "device.clickHint.ready":
    "Clique un contrôle pour l'assigner. Bouge-le sur le nanoKONTROL : il s'illumine ici.",
  "device.clickHint.idle":
    "Clique un contrôle pour l'assigner. Connecte le MIDI pour le voir réagir en direct.",
  "device.track": "PISTE {n}",

  "inspector.empty": "Sélectionne un contrôle sur le pupitre pour l'éditer.",
  "inspector.kind.fader": "Fader (continu)",
  "inspector.kind.knob": "Potentiomètre (continu)",
  "inspector.kind.button": "Bouton (momentané)",
  "inspector.trackSuffix": " · piste {n}",
  "inspector.actionLabel": "Action dans Live",
  "inspector.midiSignal": "Signal MIDI",
  "inspector.learn": "Apprendre (MIDI Learn)",
  "inspector.learning": "● En écoute… (annuler)",
  "inspector.learnHint": "Bouge ou presse ce contrôle sur le nanoKONTROL Studio…",
  "inspector.type": "Type",
  "inspector.channel": "Canal",
  "inspector.ccNum": "N° CC",
  "inspector.noteNum": "N° note",
  "inspector.testLed": "Tester la LED",
  "inspector.testLed.notButton": "Test LED réservé aux boutons",
  "inspector.testLed.notReady": "Connecte le MIDI d'abord",
  "inspector.testLed.ready": "Allume brièvement la LED sur le contrôleur",

  "code.files": "{n} fichiers · {name}/",
  "code.copy": "Copier",
  "code.copied": "Copié ✓",
  "code.download": "Télécharger .zip",

  "monitor.inputs": "Entrées MIDI",
  "monitor.outputs": "Sorties MIDI (LEDs)",
  "monitor.noInput": "Aucune entrée détectée",
  "monitor.noOutput": "Aucune sortie détectée",
  "monitor.incoming": "Flux entrant",
  "monitor.connectFirst": "Connecte le MIDI pour voir les messages.",
  "monitor.movePrompt": "Bouge un contrôle sur le nanoKONTROL Studio…",
  "monitor.channel": "canal {n}",
  "monitor.val": "val {v}",

  "binding.label": "{type} {n} · canal {ch}",

  "install.intro.title": "Comment ton mappage rejoint le contrôleur",
  "install.intro.body":
    "Le Pupitre ne programme pas le matériel. Il fabrique un script qui apprend à *Ableton Live* ce que veut dire le MIDI de ton contrôleur. Une fois installé, Live et le nanoKONTROL se parlent en direct — y compris pour allumer les LED.",
  "install.flow.web": "Le Pupitre (cette app)",
  "install.flow.script": "Script Python (Remote)",
  "install.flow.live": "Ableton Live",
  "install.flow.device": "nanoKONTROL Studio",
  "install.flow.caption":
    "Ton mappage s'installe dans Ableton — pas sur l'appareil. L'appareil envoie juste du MIDI ; le script dit à Live ce que fait chaque message.",

  "install.step1.title": "Exporter le script",
  "install.step1.body": "Clique {b} en haut, puis décompresse-le. Tu obtiens un dossier {code}.",
  "install.step2.title": "Déposer dans le dossier Remote Scripts",
  "install.step2.body": "Copie le dossier {code} dans :",
  "install.step2.win": "Windows : {code}",
  "install.step3.title": "Redémarrer Ableton Live",
  "install.step3.body": "Live ne lit les nouveaux scripts qu'au démarrage.",
  "install.step4.title": "Sélectionner la surface de contrôle",
  "install.step4.body":
    "{settings}. Dans un emplacement {cs}, choisis {code}. Mets l'Entrée et la Sortie sur le {device}.",
  "install.step4.settings": "Réglages → Link, Tempo & MIDI",
  "install.step4.cs": "Surface de contrôle",
  "install.step5.title": "Activer Remote (entrée + sortie)",
  "install.step5.body":
    "Dans le tableau {ports}, mets {remote} pour l'entrée et la sortie du {device}. La sortie pilote les LED des boutons.",
  "install.step5.ports": "Ports MIDI",
  "install.step5.remote": "Remote = On",
  "install.copy": "Copier",
  "install.copied": "Copié ✓",
  "install.controller.title": "Côté contrôleur (Korg Kontrol Editor)",
  "install.controller.body":
    "Règle les boutons en mode Momentary et les LED en External, pour que Live commande les lumières. Si les numéros CC de ton unité diffèrent, utilise le MIDI-Learn de l'inspecteur pour capturer les vraies valeurs.",

  "onboard.subtitle":
    "Transforme ton Korg nanoKONTROL Studio en surface de contrôle Ableton Live — sans écrire une ligne de Python.",
  "onboard.r1.title": "Mappe visuellement",
  "onboard.r1.body":
    "Clique un fader, un bouton, un potentiomètre, puis choisis ce qu'il pilote dans Live : volume, pan, mute, solo, lecture, stop, enregistrement…",
  "onboard.r2.title": "MIDI-Learn en direct",
  "onboard.r2.body":
    "Branche le contrôleur, clique Apprendre et bouge le contrôle : Le Pupitre capture son vrai signal MIDI. (Chrome/Edge requis pour le Web MIDI.)",
  "onboard.r3.title": "Exporte un vrai Remote Script",
  "onboard.r3.body":
    "Tu télécharges un dossier Python prêt à déposer dans Ableton. Un mappage par défaut t'attend déjà — tu peux exporter tout de suite.",
  "onboard.cta": "Commencer",

  "automap.title": "Auto-map IA",
  "automap.subtitle": "Décris ton workflow, Claude propose le mappage.",
  "automap.close": "Fermer",
  "automap.placeholder":
    "Ex. : faders en volume, potards en pan, boutons en mute/solo/arm, transport pour play/stop/rec…",
  "automap.example": "Exemple {n}",
  "automap.propose": "Proposer",
  "automap.busy": "Claude réfléchit…",
  "automap.repropose": "Reproposer",
  "automap.apply": "Appliquer",
  "automap.proposed": "{n} contrôles proposés",
  "automap.err.unavailable": "Fonction IA indisponible (mode local).",
  "automap.err.status": "Erreur {status}.",
  "automap.err.unreadable": "Réponse IA illisible.",
  "automap.err.failed": "Échec de la requête.",
};

const DICT: Record<Lang, Record<StrKey, string>> = { en: EN, fr: FR };

export function makeT(lang: Lang) {
  return (key: StrKey, params?: Params): string => interpolate(DICT[lang][key], params);
}

// ---- language preference (browser default + persistence) ----
const LANG_KEY = "le-pupitre.lang.v1";

export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "fr") return saved;
    const nav = navigator.language?.toLowerCase() ?? "en";
    return nav.startsWith("fr") ? "fr" : "en";
  } catch {
    return "en";
  }
}

export function persistLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}
