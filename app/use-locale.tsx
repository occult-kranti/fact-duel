'use client';
/**
 * app/use-locale.tsx — the chrome's language.
 *
 * `LocaleProvider` owns one value, the locale, persisted per device under localStorage['fd-locale']
 * and read through a small external store: a server render says English, the client snapshot is
 * the stored choice, else the browser language (`hi*` → Hindi). Switching sets `<html lang>` and,
 * for Hindi only, appends the Noto Sans Devanagari stylesheet (font-display: swap) to <head>: the
 * English build never carries a blocking or extra font request, and the static build shares this
 * code path.
 *
 * `useLocale()` returns `{ locale, setLocale, t, n, fmt, rich, when, topic, ready }`. Only the
 * chrome is translated; the question bank stays English, and the settings control says so.
 */
import { createContext, useContext, useLayoutEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import {
  DEFAULT_LOCALE,
  DICTIONARIES,
  bind,
  bindFormat,
  detectLocale,
  interpolate,
  localizeWhen,
  readLocale,
} from '@/lib/i18n/index.mjs';
import { STORAGE } from '@/lib/storage-names.mjs';
import './locale.css';

/** Persisted as localStorage['fd-locale']: 'en' | 'hi'. */
export const LOCALE_KEY = STORAGE.locale;
export type Locale = 'en' | 'hi';

/** The Devanagari face for Hindi chrome; loaded only while the locale is Hindi. */
const DEVANAGARI_HREF = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400..700&display=swap';
const DEVANAGARI_ID = 'fd-font-devanagari';

type Vars = Record<string, string | number>;
export type LocaleApi = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  /** A chrome string by key, with `{name}` slots filled from `vars`. */
  t: (key: string, vars?: Vars) => string;
  /** The one/other form of `key` for `count`, with `{count}` and any `vars` filled in. */
  n: (key: string, count: number, vars?: Vars) => string;
  fmt: {
    number: (value: number, options?: Intl.NumberFormatOptions) => string;
    date: (value: number | Date, options?: Intl.DateTimeFormatOptions) => string;
    isoDay: (iso: string, options?: Intl.DateTimeFormatOptions) => string;
    month: (key: string) => string;
  };
  /** Like `t`, but the named slots are replaced by React nodes instead of text. */
  rich: (key: string, slots: Record<string, ReactNode>, vars?: Vars) => ReactNode[];
  /** An English calendar day line from lib/fixtures.mjs or events/util.ts, in the current locale. */
  when: (copy: string) => string;
  /** A served sport's name in the current locale; unknown topics print as given. */
  topic: (name: string) => string;
  /** The string for `key` when the dictionary has it, else `fallback` (for data-driven names). */
  pick: (key: string, fallback: string) => string;
  /** False until the stored or detected locale has been read after mount. */
  ready: boolean;
};

const LocaleContext = createContext<LocaleApi | null>(null);

/* ---- the store: one locale per device, read lazily on the client, 'en' for a server render ---- */
const listeners = new Set<() => void>();
let current: Locale | null = null;

function readStored(): Locale | null {
  try {
    const raw = localStorage.getItem(LOCALE_KEY);
    return raw === null ? null : (readLocale(raw) as Locale);
  } catch {
    return null;
  }
}

function writeStored(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    /* storage blocked: the choice lasts for this visit only */
  }
}

/** The client snapshot: the stored choice, else the browser language, read once and cached. */
function snapshot(): Locale {
  if (current === null) {
    const langs = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]);
    current = readStored() ?? (detectLocale(langs) as Locale);
  }
  return current;
}
const serverSnapshot = (): Locale => DEFAULT_LOCALE as Locale;
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function store(next: Locale) {
  const clean = readLocale(next) as Locale;
  if (clean === current) return;
  current = clean;
  writeStored(clean);
  for (const listener of listeners) listener();
}

/** The Devanagari stylesheet is present exactly while the locale is Hindi. */
function syncFont(locale: Locale) {
  const existing = document.getElementById(DEVANAGARI_ID);
  if (locale === 'hi') {
    if (existing) return;
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://fonts.gstatic.com';
    preconnect.crossOrigin = 'anonymous';
    preconnect.dataset.for = DEVANAGARI_ID;
    const link = document.createElement('link');
    link.id = DEVANAGARI_ID;
    link.rel = 'stylesheet';
    link.href = DEVANAGARI_HREF;
    document.head.appendChild(preconnect);
    document.head.appendChild(link);
  } else {
    existing?.remove();
    document.querySelector(`link[data-for="${DEVANAGARI_ID}"]`)?.remove();
  }
}

function makeApi(locale: Locale, setLocale: (next: Locale) => void, ready: boolean): LocaleApi {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
  const { t, n } = bind(dict, locale);
  const fmt = bindFormat(locale);
  const rich: LocaleApi['rich'] = (key, slots, vars) => {
    let parts: ReactNode[] = [interpolate(t(key), vars)];
    for (const [slot, node] of Object.entries(slots)) {
      const marker = `{${slot}}`;
      parts = parts.flatMap((part) => {
        if (typeof part !== 'string' || !part.includes(marker)) return [part];
        const [before, after] = part.split(marker, 2);
        return [before, node, part.slice(before.length + marker.length) || after];
      });
    }
    return parts.filter((p) => p !== '' && p !== undefined);
  };
  const pick: LocaleApi['pick'] = (key, fallback) => {
    const hit = t(key);
    return hit === key ? fallback : hit;
  };
  const topic: LocaleApi['topic'] = (name) => pick(`topic.${name}`, name);
  return {
    locale,
    setLocale,
    t,
    n,
    fmt: fmt as LocaleApi['fmt'],
    rich,
    when: (copy) => localizeWhen(copy, t, n),
    topic,
    pick,
    ready,
  };
}

/** The fallback API for a mount outside the provider (tests, the studio): English, not ready. */
const FALLBACK = makeApi('en', () => {}, false);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // A server render and the hydration frame say English; React then re-renders with the client
  // snapshot (the stored choice, else the browser language) without a mismatch. The static build
  // has no hydration frame, so its first paint is already in the right language.
  const locale = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useLayoutEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    syncFont(locale);
  }, [locale, ready]);

  const api = useMemo(() => makeApi(locale, store, ready), [locale, ready]);
  return <LocaleContext value={api}>{children}</LocaleContext>;
}

export function useLocale(): LocaleApi {
  return useContext(LocaleContext) ?? FALLBACK;
}
