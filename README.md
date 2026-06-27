# Le Pupitre

**A visual editor for Ableton Live control-surface scripts — built for the Korg nanoKONTROL Studio.**

Inspired by remotify.io. Map your controller's faders, knobs and buttons to Live actions
(volume, pan, sends, mute/solo/arm, play/stop/record, loop, track & scene banking, undo/redo),
then export a real **MIDI Remote Script** (a Python `_Framework` package) you drop straight into
Ableton. No Python required. Everything runs locally in the browser.

🔗 **Live:** https://le-pupitre.netlify.app

---

## What it does

- **Visual desk.** A faithful nanoKONTROL Studio panel: 8 channel strips (fader · knob · S/M/R),
  transport row, and navigation buttons. Click any control to assign it.
- **MIDI-Learn (Web MIDI).** Connect the controller, hit **Apprendre**, wiggle a control — Le Pupitre
  captures its real MIDI signal. This sidesteps any factory-default CC differences. *(Chrome/Edge.)*
- **Live activity.** Controls glow in real time as MIDI arrives; a built-in monitor shows the raw stream.
- **Correct code generation.** Produces a Live 11/12 `ControlSurface` package using only stable
  `_Framework` APIs (`MixerComponent`, `TransportComponent`, `SessionComponent`). The generated
  Python is verified to compile (`python3 -m py_compile`) in CI-style checks.
- **One-click export.** Download a `.zip` containing the ready-to-install script folder + a README.
- **Optional AI auto-map.** Describe your workflow in plain French/English and Claude proposes a full
  mapping (validated server-side against the control types).
- **Bilingual (EN/FR).** Full English and Québécois-French UI with a one-click toggle in the header;
  defaults to your browser language and remembers your choice.

## The generated script

Each export is a Python package:

```
Le_Pupitre_nanoKONTROL/
  __init__.py        # create_instance(c_instance)
  Le_Pupitre_nanoKONTROL.py   # the ControlSurface subclass
  README.md          # per-export install + mapping table
```

Wiring uses only well-supported `_Framework` methods:

| Target | Method |
| --- | --- |
| Volume / Pan | `channel_strip(i).set_volume_control` / `set_pan_control` |
| Sends A/B | `channel_strip(i).set_send_controls((a, b))` |
| Arm / Mute / Solo / Select | `channel_strip(i).set_arm_button` / `set_mute_button` / `set_solo_button` / `set_select_button` |
| Play / Stop / Record / Loop / Seek / Metronome / Tap / Overdub / Nudge | `TransportComponent.set_*_button` |
| Track & scene banking | `SessionComponent.set_track_bank_buttons` / `set_scene_bank_buttons` |
| Undo / Redo | custom `song().undo()` / `redo()` value listeners |

## Install the script in Ableton Live

1. **Export .zip** in the app and unzip it.
2. Copy the `Le_Pupitre_nanoKONTROL` folder into your User Remote Scripts folder:
   - **macOS:** `~/Music/Ableton/User Library/Remote Scripts/`
   - **Windows:** `\Users\<you>\Documents\Ableton\User Library\Remote Scripts\`
3. Restart Live.
4. **Settings → Link, Tempo & MIDI → MIDI:** pick `Le_Pupitre_nanoKONTROL` as a Control Surface,
   with Input **and** Output set to the nanoKONTROL Studio.
5. In the **MIDI Ports** table, turn **Remote = On** for the device's input and output (output drives
   the button LEDs).

### Controller side (Korg Kontrol Editor)

Set the buttons to **Momentary** and their LEDs to **External** so Live commands the lights. If your
unit's CC numbers differ from the defaults, use **MIDI-Learn** in Le Pupitre to capture the real values.

## Default CC map

Modelled on the common nanoKONTROL convention (the Studio is configurable, so treat these as a
starting point and Learn over them if needed):

| Control | CC |
| --- | --- |
| Faders 1–8 | 0–7 |
| Knobs 1–8 | 16–23 |
| Solo 1–8 | 32–39 |
| Mute 1–8 | 48–55 |
| Rec 1–8 | 64–71 |
| Transport (rew/ff/stop/play/rec/cycle) | 43/44/42/41/45/46 |
| Track ◀▶ · Marker set/◀/▶ | 58/59 · 60/61/62 |

## Tech

Vite · React 19 · TypeScript · Tailwind v3 · Web MIDI API · JSZip · a Netlify Function calling the
Claude API for the optional auto-map. Mapping state persists locally (localStorage).

## Develop

```bash
npm install
npm run dev:vite     # Vite only (UI + generator + Web MIDI)
npm run dev          # netlify dev (also serves the /api/automap function)
npm test             # generator + render smoke tests
npm run verify:python  # emit a sample script and prove it compiles as Python
npm run build
```

Built in the Atelier. 🎚️
