import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { type Lang, type Loc, type StrKey, type Params, loc, makeT, initialLang, persistLang } from "./core.ts";

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StrKey, params?: Params) => string;
  /** Localize a {en,fr} data value with the current language. */
  lc: (v: Loc) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => initialLang());

  const setLang = useCallback((l: Lang) => {
    persistLang(l);
    setLangState(l);
  }, []);

  const value = useMemo<I18nValue>(() => {
    const t = makeT(lang);
    return { lang, setLang, t, lc: (v: Loc) => loc(v, lang) };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
