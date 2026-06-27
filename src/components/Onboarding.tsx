import { useI18n } from "../i18n/lang.tsx";

export function Onboarding({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="panel max-w-lg animate-riseIn overflow-hidden">
        <div className="border-b border-desk-edge bg-desk-rail/50 px-6 py-5">
          <h2 className="font-display text-2xl font-bold text-ink">Le Pupitre</h2>
          <p className="mt-1 text-sm text-ink-soft">{t("onboard.subtitle")}</p>
        </div>
        <div className="space-y-4 px-6 py-5">
          <Row icon="🎚️" title={t("onboard.r1.title")}>
            {t("onboard.r1.body")}
          </Row>
          <Row icon="🎛️" title={t("onboard.r2.title")}>
            {t("onboard.r2.body")}
          </Row>
          <Row icon="🐍" title={t("onboard.r3.title")}>
            {t("onboard.r3.body")}
          </Row>
        </div>
        <div className="flex justify-end gap-2 border-t border-desk-edge bg-desk-rail/40 px-6 py-4">
          <button className="btn btn-amber font-semibold" onClick={onClose}>
            {t("onboard.cta")}
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
