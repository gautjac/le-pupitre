import { useState } from "react";
import type { DeviceDef } from "../model/types.ts";
import { useI18n } from "../i18n/lang.tsx";

export function InstallGuide({ scriptName, device }: { scriptName: string; device: DeviceDef }) {
  const { t } = useI18n();
  const macPath = "~/Music/Ableton/User Library/Remote Scripts/";
  const winPath = "\\Users\\<you>\\Documents\\Ableton\\User Library\\Remote Scripts\\";
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
      {/* Conceptual flow — where the mapping actually goes */}
      <div className="rounded-lg border border-violet/40 bg-violet/5 p-4">
        <div className="mb-1 font-semibold text-violet">{t("install.intro.title")}</div>
        <p className="text-xs leading-relaxed">{t("install.intro.body")}</p>
        <FlowDiagram
          web={t("install.flow.web")}
          script={t("install.flow.script")}
          live={t("install.flow.live")}
          deviceLabel={t("install.flow.device")}
        />
        <p className="mt-2 text-[11px] italic text-ink-dim">{t("install.flow.caption")}</p>
      </div>

      <ol className="space-y-3">
        <Step n={1} title={t("install.step1.title")}>
          {t("install.step1.body", { b: t("header.export"), code: scriptName })}
        </Step>
        <Step n={2} title={t("install.step2.title")}>
          {t("install.step2.body", { code: scriptName })}
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-md border border-desk-edge bg-desk-black/70 px-3 py-2 font-mono text-xs text-cyan-glow">
              {macPath}
            </code>
            <button className="btn px-3 py-2 text-xs" onClick={copyPath}>
              {copied ? t("install.copied") : t("install.copy")}
            </button>
          </div>
          <span className="mt-1 block text-xs text-ink-dim">
            {t("install.step2.win", { code: winPath })}
          </span>
        </Step>
        <Step n={3} title={t("install.step3.title")}>
          {t("install.step3.body")}
        </Step>
        <Step n={4} title={t("install.step4.title")}>
          {t("install.step4.body", {
            settings: t("install.step4.settings"),
            cs: t("install.step4.cs"),
            code: scriptName,
            device: device.name,
          })}
        </Step>
        <Step n={5} title={t("install.step5.title")}>
          {t("install.step5.body", {
            ports: t("install.step5.ports"),
            remote: t("install.step5.remote"),
            device: device.name,
          })}
        </Step>
      </ol>

      <div className="rounded-lg border border-cyan-deep/40 bg-cyan/5 p-3 text-xs">
        <div className="mb-1 font-semibold text-cyan-glow">{t("install.controller.title")}</div>
        {t("install.controller.body")}
      </div>
    </div>
  );
}

function FlowDiagram({
  web,
  script,
  live,
  deviceLabel,
}: {
  web: string;
  script: string;
  live: string;
  deviceLabel: string;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-stretch gap-2 text-[11px]">
      <Box color="#f6a821">{web}</Box>
      <Arrow />
      <Box color="#9b8cff">{script}</Box>
      <Arrow />
      <Box color="#33d6dd">{live}</Box>
      <Arrow two />
      <Box color="#5be08a">{deviceLabel}</Box>
    </div>
  );
}

function Box({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      className="grid place-items-center rounded-md border bg-desk-black/60 px-2.5 py-2 text-center font-medium"
      style={{ borderColor: `${color}66`, color }}
    >
      {children}
    </div>
  );
}

function Arrow({ two }: { two?: boolean }) {
  return (
    <div className="grid place-items-center px-0.5 font-mono text-ink-dim" aria-hidden>
      {two ? "⇄" : "→"}
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
