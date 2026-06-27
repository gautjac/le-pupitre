import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MidiBinding, Mapping } from "./model/types.ts";
import { deviceById, defaultMapping } from "./model/device.ts";
import { generateScript } from "./generator/python.ts";
import { downloadZip } from "./generator/zip.ts";
import { useMidi } from "./midi/useMidi.ts";
import { loadMapping, saveMapping, isOnboarded, setOnboarded } from "./lib/store.ts";
import { useI18n } from "./i18n/lang.tsx";
import { Header } from "./components/Header.tsx";
import { DevicePanel } from "./components/DevicePanel.tsx";
import { Inspector } from "./components/Inspector.tsx";
import { CodePreview } from "./components/CodePreview.tsx";
import { MidiMonitor } from "./components/MidiMonitor.tsx";
import { InstallGuide } from "./components/InstallGuide.tsx";
import { Onboarding } from "./components/Onboarding.tsx";
import { AutoMapModal } from "./components/AutoMapModal.tsx";

type BottomTab = "code" | "monitor" | "install";

export default function App() {
  const [mapping, setMapping] = useState<Mapping>(() => loadMapping());
  const device = useMemo(() => deviceById(mapping.deviceId), [mapping.deviceId]);
  const [selectedId, setSelectedId] = useState<string | null>("fader.1");
  const [learningId, setLearningId] = useState<string | null>(null);
  const [tab, setTab] = useState<BottomTab>("code");
  const [showOnboard, setShowOnboard] = useState<boolean>(() => !isOnboarded());
  const [showAutoMap, setShowAutoMap] = useState(false);
  const [exporting, setExporting] = useState(false);
  const learnToken = useRef(0);

  const { t, lang } = useI18n();
  const midi = useMidi();

  useEffect(() => {
    saveMapping(mapping);
  }, [mapping]);

  const generated = useMemo(() => generateScript(mapping, device, lang), [mapping, device, lang]);

  const patchControl = useCallback(
    (id: string, patch: Partial<{ binding: MidiBinding; targetId: string }>) => {
      setMapping((m) => ({
        ...m,
        controls: { ...m.controls, [id]: { ...m.controls[id], ...patch } },
      }));
    },
    [],
  );

  const startLearn = useCallback(
    async (id: string) => {
      const token = ++learnToken.current;
      setLearningId(id);
      if (midi.status !== "ready") await midi.request();
      try {
        const binding = await midi.learn();
        if (learnToken.current === token) {
          patchControl(id, { binding });
        }
      } finally {
        if (learnToken.current === token) setLearningId(null);
      }
    },
    [midi, patchControl],
  );

  const cancelLearn = useCallback(() => {
    learnToken.current++;
    midi.cancelLearn();
    setLearningId(null);
  }, [midi]);

  const resetAll = useCallback(() => {
    if (!confirm(t("app.resetConfirm"))) return;
    setMapping(defaultMapping(device));
    setSelectedId("fader.1");
  }, [device, t]);

  const onExport = useCallback(async () => {
    setExporting(true);
    try {
      await downloadZip(generated);
    } finally {
      setTimeout(() => setExporting(false), 600);
    }
  }, [generated]);

  const applyAutoMap = useCallback((assignments: Record<string, string>) => {
    setMapping((m) => {
      const controls = { ...m.controls };
      for (const [id, targetId] of Object.entries(assignments)) {
        if (controls[id]) controls[id] = { ...controls[id], targetId };
      }
      return { ...m, controls };
    });
  }, []);

  const closeOnboard = useCallback(() => {
    setOnboarded();
    setShowOnboard(false);
  }, []);

  const selectedDef = selectedId ? device.controls.find((c) => c.id === selectedId) ?? null : null;
  const selectedState = selectedId ? mapping.controls[selectedId] ?? null : null;

  const assignedCount = useMemo(
    () => Object.values(mapping.controls).filter((c) => c.targetId !== "none").length,
    [mapping],
  );

  return (
    <div className="min-h-full">
      <Header
        device={device}
        midi={midi}
        mapping={mapping}
        assignedCount={assignedCount}
        exporting={exporting}
        warnings={generated.warnings}
        onScriptName={(scriptName) => setMapping((m) => ({ ...m, scriptName }))}
        onLiveVersion={(liveVersion) => setMapping((m) => ({ ...m, liveVersion }))}
        onRequestMidi={midi.request}
        onExport={onExport}
        onReset={resetAll}
        onAutoMap={() => setShowAutoMap(true)}
      />

      <main className="mx-auto grid max-w-[1500px] gap-5 px-4 pb-16 pt-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          <DevicePanel
            device={device}
            mapping={mapping}
            activity={midi.activity}
            midiReady={midi.status === "ready"}
            selectedId={selectedId}
            learningId={learningId}
            onSelect={setSelectedId}
          />

          <section className="panel overflow-hidden">
            <div className="flex items-center gap-1 border-b border-desk-edge bg-desk-rail/60 px-3 py-2">
              <TabButton active={tab === "code"} onClick={() => setTab("code")}>
                {t("tab.code")}
              </TabButton>
              <TabButton active={tab === "monitor"} onClick={() => setTab("monitor")}>
                {t("tab.monitor")}
              </TabButton>
              <TabButton active={tab === "install"} onClick={() => setTab("install")}>
                {t("tab.install")}
              </TabButton>
              <div className="ml-auto pr-1 text-[11px] font-mono text-ink-dim">
                {generated.scriptName}.py
              </div>
            </div>
            {tab === "code" && <CodePreview generated={generated} onExport={onExport} />}
            {tab === "monitor" && <MidiMonitor midi={midi} />}
            {tab === "install" && <InstallGuide scriptName={generated.scriptName} device={device} />}
          </section>
        </div>

        <Inspector
          control={selectedDef}
          state={selectedState}
          midi={midi}
          learning={learningId === selectedId}
          onTarget={(targetId) => selectedId && patchControl(selectedId, { targetId })}
          onBinding={(binding) => selectedId && patchControl(selectedId, { binding })}
          onLearn={() => selectedId && startLearn(selectedId)}
          onCancelLearn={cancelLearn}
        />
      </main>

      {showOnboard && <Onboarding onClose={closeOnboard} />}
      {showAutoMap && (
        <AutoMapModal
          device={device}
          onClose={() => setShowAutoMap(false)}
          onApply={(a) => {
            applyAutoMap(a);
            setShowAutoMap(false);
          }}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={`seg ${active ? "seg-on" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}
