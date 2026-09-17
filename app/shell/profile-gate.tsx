'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { quickProfile, whoami } from '@/lib/auth-client';
import { GATE, gateDecision, noteClaim, noteSkip, noteVisit, readGate } from '@/lib/profile-gate.mjs';
import { useLocale } from '../use-locale';
import { JhkWordmark } from './brand-mark';
import './profile-gate.css';

/**
 * app/shell/profile-gate.tsx — the first landing asks for a name and an email, once.
 *
 * One screen, one step, two fields, and a way out that is a plain text link at body size:
 * "Play as guest" is never a smaller, greyer or wordier button than the one beside it, and
 * skipping costs nothing. `lib/profile-gate.mjs` holds the only rule about coming back — three
 * visits after a skip, never again after a claim — so the nagging behaviour is a tested pure
 * function rather than something buried in this component.
 *
 * What the claim actually does is said on screen, because it is small: the email is NOT verified
 * (`quickProfile` in lib/server/auth-service.mjs explains what that means for the server), and on
 * the static build there is no server at all, so the pair stays on the device and the sheet says
 * exactly that. Settings has "Verify by link" for the real thing.
 *
 * The name is arena's state: this component calls the setter it is handed, and arena's existing
 * effect persists it under SETTINGS_KEYS.name. The gate record is this file's own, under
 * localStorage `fd-gate`.
 *
 * The chrome's dictionaries are owned by another lane this round, so the gate's copy is the small
 * inline table below, keyed by the same locale `useLocale()` reports.
 */

const EMAIL = /^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+$/;
const NAME_MAX = 24;

type GateRecord = ReturnType<typeof readGate>;
type CopyKey =
  | 'title'
  | 'body'
  | 'name'
  | 'namePlaceholder'
  | 'email'
  | 'emailPlaceholder'
  | 'save'
  | 'saving'
  | 'guest'
  | 'unverified'
  | 'local'
  | 'badName'
  | 'badEmail'
  | 'failed'
  | 'settingsTitle'
  | 'settingsClaimed'
  | 'settingsVerify';

const COPY: Record<'en' | 'hi', Record<CopyKey, string>> = {
  en: {
    title: 'Set up your profile',
    body: 'Jaanta Hai Kya keeps your coins and card under this profile. No password, no link to click.',
    name: 'Display name',
    namePlaceholder: 'Pick a name',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    save: 'Save and play',
    saving: 'Saving',
    guest: 'Play as guest',
    unverified: 'Nothing here is verified yet. Settings has a verify-by-link step when you want it.',
    local: 'This preview keeps it on this device.',
    badName: `Enter a name, up to ${NAME_MAX} characters.`,
    badEmail: 'Enter an email address that works.',
    failed: 'That did not save. Play as guest and set it later in Settings.',
    settingsTitle: 'Profile',
    settingsClaimed: 'You entered {email}. It has not been verified.',
    settingsVerify: 'Verify by link',
  },
  hi: {
    title: 'अपनी प्रोफ़ाइल बनाएँ',
    body: 'जानता है क्या आपके सिक्के और कार्ड इसी प्रोफ़ाइल के तहत रखता है। कोई पासवर्ड नहीं, कोई लिंक क्लिक करने की ज़रूरत नहीं।',
    name: 'आपका खिलाड़ी नाम',
    namePlaceholder: 'एक नाम चुनें',
    email: 'ईमेल',
    emailPlaceholder: 'you@example.com',
    save: 'सेव करके खेलें',
    saving: 'सेव हो रहा है',
    guest: 'मेहमान के तौर पर खेलें',
    unverified: 'अभी यहाँ कुछ भी सत्यापित नहीं है। जब चाहें, सेटिंग में लिंक से सत्यापित कर लें।',
    local: 'यह प्रीव्यू इसे इसी डिवाइस पर रखता है।',
    badName: `${NAME_MAX} अक्षरों तक का एक नाम लिखें।`,
    badEmail: 'चलने वाला ईमेल पता लिखें।',
    failed: 'यह सेव नहीं हुआ। मेहमान के तौर पर खेलें और बाद में सेटिंग में सेट कर लें।',
    settingsTitle: 'प्रोफ़ाइल',
    settingsClaimed: 'आपने {email} दर्ज किया था। यह सत्यापित नहीं हुआ है।',
    settingsVerify: 'लिंक से सत्यापित करें',
  },
};

/** The gate's own copy table, shared with the claimed-email line in Settings. */
export function gateCopy(locale: string): Record<CopyKey, string> {
  return COPY[locale === 'hi' ? 'hi' : 'en'];
}

/* One decision per page load, taken the first time the gate renders in a browser: the landing is
 * counted, written back, and handed to the pure rule. `useSyncExternalStore` is how the rest of
 * this app (app/use-locale.tsx) reads a stored value — the server render and the hydration frame
 * both say "closed", and React swaps in the real answer afterwards without a mismatch. Caching the
 * answer on the module also means React's double-mount in development counts one visit, not two. */
type Decision = { record: GateRecord; show: boolean };
const listeners = new Set<() => void>();
let decided: Decision | null = null;

function snapshot(): Decision {
  if (!decided) {
    const now = Date.now();
    const record = noteVisit(load(), now);
    save(record);
    decided = { record, show: gateDecision({ ...record, now }).show };
  }
  return decided;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Claimed or skipped: write the record and close for the rest of this page load. */
function settle(record: GateRecord) {
  save(record);
  decided = { record, show: false };
  for (const listener of listeners) listener();
}

function load(): GateRecord {
  try {
    return readGate(JSON.parse(window.localStorage.getItem(GATE.storageKey) ?? 'null'));
  } catch {
    return readGate(null);
  }
}

/** A server render, and the hydration frame, show nothing: only a browser has the record. */
const CLOSED: Decision = Object.freeze({ record: readGate(null), show: false });
const serverSnapshot = (): Decision => CLOSED;

function save(gate: GateRecord) {
  try {
    window.localStorage.setItem(GATE.storageKey, JSON.stringify(gate));
  } catch {
    /* storage blocked: the gate then asks again next time, which is the honest failure */
  }
}

/** The address the gate was given on this device, for the Settings line. Never a verified one. */
export function readClaimedEmail(): string | null {
  if (typeof window === 'undefined') return null;
  const gate = load();
  return gate.claimed ? gate.email : null;
}

export type ProfileGateProps = {
  /** arena's display name at mount. Anything but the placeholder default pre-fills the field. */
  name: string;
  /** arena's setter. arena persists it under SETTINGS_KEYS.name. */
  onName: (name: string) => void;
};

export function ProfileGate({ name, onName }: ProfileGateProps) {
  const { locale } = useLocale();
  const copy = gateCopy(locale);
  const { record, show } = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  /** null until `whoami` answers; false is the static build, which has no server to keep a claim. */
  const [available, setAvailable] = useState<boolean | null>(null);
  const [draftName, setDraftName] = useState(name === 'Challenger' ? '' : name);
  const [draftEmail, setDraftEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `whoami` only decides which honest footnote is printed, so it is allowed to land later — and
  // a device that is past the gate never asks at all.
  useEffect(() => {
    if (!show) return;
    let alive = true;
    whoami().then((who) => {
      if (alive) setAvailable(who.available);
    });
    return () => {
      alive = false;
    };
  }, [show]);

  if (!show) return null;

  const skip = () => settle(noteSkip(record, Date.now()));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const display = draftName.replace(/\s+/g, ' ').trim();
    const address = draftEmail.trim().toLowerCase();
    if (!display || display.length > NAME_MAX) {
      setError(copy.badName);
      return;
    }
    if (address.length > 254 || !EMAIL.test(address)) {
      setError(copy.badEmail);
      return;
    }
    setError(null);
    setBusy(true);
    // A build with no server is not asked; it was already told so, and the sheet says so on screen.
    const result = available === false ? null : await quickProfile(display, address);
    setBusy(false);
    if (result && !result.ok) {
      if (result.available) {
        setError(result.error || copy.failed);
        return;
      }
      setAvailable(false);
    }
    onName(display);
    settle(noteClaim(record, address));
  };

  return (
    <div className="fd-gate" role="dialog" aria-modal="true" aria-labelledby="fd-gate-title">
      <div className="fd-gate-inner">
        <JhkWordmark height={20} variant="full" className="fd-gate-mark" />
        <h1 className="fd-gate-title" id="fd-gate-title">
          {copy.title}
        </h1>
        <p className="fd-gate-body">{copy.body}</p>

        {/* `noValidate`: the email field keeps its mobile keyboard, but the refusal is this sheet's
            own line in the player's language, not the browser's untranslated bubble. */}
        <form className="fd-gate-form" onSubmit={submit} noValidate>
          <div className="fd-gate-field">
            <Label htmlFor="fd-gate-name">{copy.name}</Label>
            <Input
              id="fd-gate-name"
              className="fd-gate-input"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={NAME_MAX}
              autoComplete="nickname"
              autoCapitalize="words"
              enterKeyHint="next"
              placeholder={copy.namePlaceholder}
              disabled={busy}
              /* The gate is the only thing on screen on a first landing: the first field is the task. */
              autoFocus
            />
          </div>
          <div className="fd-gate-field">
            <Label htmlFor="fd-gate-email">{copy.email}</Label>
            <Input
              id="fd-gate-email"
              className="fd-gate-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="go"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              maxLength={254}
              placeholder={copy.emailPlaceholder}
              disabled={busy}
            />
          </div>
          {error && (
            <p className="fd-gate-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="fd-gate-save" disabled={busy}>
            {busy ? copy.saving : copy.save}
          </Button>
        </form>

        <p className="fd-gate-note">{available === false ? copy.local : copy.unverified}</p>

        <button type="button" className="fd-gate-guest" onClick={skip}>
          {copy.guest}
        </button>
      </div>
    </div>
  );
}
