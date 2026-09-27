'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { jhkOnline } from '@/lib/jhk-online/runtime';
import { OnlineError } from '@/lib/jhk-online/client.mjs';
import { STORAGE } from '@/lib/storage-names.mjs';
import { useLocale } from '../use-locale';
import { JhkWordmark } from './brand-mark';
import './profile-gate.css';

const EMAIL = /^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+$/;
const TOPICS = ['sports', 'science', 'cricket', 'football', 'space'] as const;
const AVATARS = ['spark', 'shield', 'star', 'bolt'] as const;
const STATIC_BASE = ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.BASE_URL || '/').replace(/\/?$/, '/');
type Stage = 'checking' | 'setup' | 'recover' | 'backup' | 'ready';
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Could not reach the game server. Try again.';

/** A live server answer, never a cached local flag, unlocks a configured build. */
export function JhkProfileGate({ name, onName, deferForActiveMatch = false, onBlockedChange }: {
  name: string; onName: (name: string) => void; deferForActiveMatch?: boolean; onBlockedChange?: (blocked: boolean) => void;
}) {
  const { locale, setLocale } = useLocale();
  const hi = locale === 'hi';
  const copy = (en: string, hindi: string) => hi ? hindi : en;
  const [stage, setStage] = useState<Stage>('checking');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nickname, setNickname] = useState(name === 'Player' ? '' : name);
  const [email, setEmail] = useState('');
  const [adult, setAdult] = useState(false);
  const [avatar, setAvatar] = useState<(typeof AVATARS)[number]>('spark');
  const [topics, setTopics] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState('');
  const [copied, setCopied] = useState(false);
  const [verified, setVerified] = useState(false);
  const [hadProfile, setHadProfile] = useState(false);
  const first = useRef<HTMLInputElement>(null);
  const gate = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const blocked = jhkOnline.configured && stage !== 'ready' && !deferForActiveMatch;
  useEffect(() => { onBlockedChange?.(blocked); }, [blocked, onBlockedChange]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (name && name !== 'Player') setNickname(current => current || name); }, [name]);
  const check = useCallback(async () => {
    if (!jhkOnline.configured) { setStage('ready'); return; }
    setStage('checking'); setError('');
    if (!jhkOnline.hasCredential) { setHadProfile(false); setVerified(false); setStage('setup'); return; }
    try {
      const session = await jhkOnline.connect();
      if (!mounted.current) return;
      setHadProfile(true);
      setNickname(session.nickname || ''); setEmail(session.email || '');
      setVerified(session.profileComplete === true);
      setStage(session.profileComplete === true ? 'ready' : 'setup');
    } catch (failure) {
      if (!mounted.current) return;
      const code = (failure as OnlineError).code;
      setHadProfile(true);
      setStage(code === 'SESSION_EXPIRED' || code === 'INVALID_SESSION' || code === 'UNAUTHORIZED' ? 'recover' : 'checking');
      setError(code === 'SESSION_EXPIRED' ? 'This session expired. Restore with your recovery code.' : errorMessage(failure));
    }
  }, []);
  useEffect(() => { void check(); }, [check]);
  useEffect(() => { const recheck = () => void check(); window.addEventListener('jhk-profile-recheck', recheck); return () => window.removeEventListener('jhk-profile-recheck', recheck); }, [check]);
  useEffect(() => {
    if (!jhkOnline.configured) return;
    const retry = () => { if (document.visibilityState === 'visible' && stage === 'ready') void check(); };
    window.addEventListener('online', retry); document.addEventListener('visibilitychange', retry);
    return () => { window.removeEventListener('online', retry); document.removeEventListener('visibilitychange', retry); };
  }, [stage, check]);
  useEffect(() => {
    if (!blocked) return;
    const siblings = gate.current?.parentElement ? [...gate.current.parentElement.children].filter(node => node !== gate.current) as HTMLElement[] : [];
    const prior = siblings.map(node => node.inert);
    siblings.forEach(node => { node.inert = true; });
    const previous = document.activeElement as HTMLElement | null;
    first.current?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !gate.current) return;
      const controls = [...gate.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled])')];
      if (!controls.length) return;
      const start = controls[0], end = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === start) { event.preventDefault(); end.focus(); }
      else if (!event.shiftKey && document.activeElement === end) { event.preventDefault(); start.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); siblings.forEach((node, i) => { node.inert = prior[i]; }); if (previous?.isConnected) previous.focus(); };
  }, [blocked, stage]);
  if (!blocked) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = nickname.replace(/\s+/g, ' ').trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2 || cleanName.length > 24) { setError(copy('Use 2–24 characters for your public nickname.', 'सार्वजनिक नाम 2–24 अक्षरों का रखें।')); first.current?.focus(); return; }
    if (cleanEmail.length > 254 || !EMAIL.test(cleanEmail)) { setError(copy('Enter a valid email address.', 'सही ईमेल पता दर्ज करें।')); document.getElementById('jhk-profile-email')?.focus(); return; }
    if (!adult) { setError(copy('Confirm you are 18 or older and accept the beta terms.', 'पुष्टि करें कि आप 18 साल या उससे बड़े हैं और बीटा शर्तें स्वीकार करते हैं।')); document.getElementById('jhk-profile-adult')?.focus(); return; }
    setError(''); setBusy(true);
    try {
      const details = { nickname: cleanName, email: cleanEmail, adultConfirmed: true, termsVersion: 'beta-1', avatar, locale };
      const result = hadProfile ? await jhkOnline.updateProfile(details) : await jhkOnline.createProfile(details);
      if (result.session?.profileComplete !== true) throw new OnlineError('The server has not confirmed a complete profile. Retry.', 'PROFILE_REQUIRED');
      try { localStorage.setItem(STORAGE.favouriteTopics, JSON.stringify(topics)); } catch { /* optional preference lasts for this visit */ }
      onName(cleanName); setVerified(true);
      if (result.recoveryCode) { setCode(result.recoveryCode); setStage('backup'); }
      else setStage('ready');
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  };
  const restore = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const session = await jhkOnline.recover(recovery.trim());
      setRecovery(''); setNickname(session.nickname); setEmail(session.email || ''); setHadProfile(true);
      onName(session.nickname);
      setVerified(session.profileComplete === true);
      setStage(session.profileComplete === true ? 'ready' : 'setup');
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  };
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); }
    catch { setError(copy('Copy is unavailable. Write the code down before continuing.', 'कॉपी उपलब्ध नहीं। आगे बढ़ने से पहले कोड लिख लें।')); }
  };
  return <div ref={gate} className="fd-gate jhk-profile-gate" role="dialog" aria-modal="true" aria-labelledby="jhk-profile-title">
    <div className="fd-gate-inner">
      <JhkWordmark height={20} variant={hi ? 'hi' : 'full'} className="fd-gate-mark" />
      <p className="jhk-profile-kicker">{copy('YOUR PLAYER CARD', 'आपकी खिलाड़ी पहचान')}</p>
      <h1 className="fd-gate-title" id="jhk-profile-title">{stage === 'recover' ? copy('Restore your profile', 'प्रोफ़ाइल वापस लाएँ') : stage === 'backup' ? copy('Keep your recovery code', 'रिकवरी कोड सँभालें') : copy('Make your player profile', 'खिलाड़ी प्रोफ़ाइल बनाएँ')}</h1>
      {stage === 'checking' ? <><p className="fd-gate-body" role="status">{copy('Checking your profile with the game server…', 'गेम सर्वर पर आपकी प्रोफ़ाइल जाँच रहे हैं…')}</p><button className="fd-gate-secondary" onClick={() => void check()}>{copy('Retry connection', 'फिर जुड़ें')}</button></> : null}
      {stage === 'setup' && <><p className="fd-gate-body">{copy('Your nickname appears to other players. Email is private, unverified, and cannot restore access. No password or email link is needed today.', 'आपका नाम दूसरे खिलाड़ियों को दिखता है। ईमेल निजी और असत्यापित है; उससे पहुँच वापस नहीं मिलेगी। अभी पासवर्ड या ईमेल लिंक नहीं चाहिए।')}</p>
        <form className="fd-gate-form" noValidate onSubmit={submit}>
          <label className="fd-gate-field" htmlFor="jhk-profile-name"><span>{copy('Public nickname', 'सार्वजनिक खिलाड़ी नाम')}</span><input ref={first} id="jhk-profile-name" className="fd-gate-input" value={nickname} onChange={event => setNickname(event.target.value)} autoComplete="nickname" maxLength={24} disabled={busy} /></label>
          <label className="fd-gate-field" htmlFor="jhk-profile-email"><span>{copy('Private email', 'निजी ईमेल')}</span><input id="jhk-profile-email" className="fd-gate-input" type="email" inputMode="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} disabled={busy} /></label>
          <details className="jhk-profile-options"><summary>{copy('Personalize (optional)', 'अपनी पसंद (वैकल्पिक)')}</summary><fieldset><legend>{copy('Avatar', 'अवतार')}</legend><div className="jhk-profile-choices">{AVATARS.map(option => <label key={option}><input type="radio" name="avatar" checked={avatar === option} onChange={() => setAvatar(option)} disabled={busy} /><span aria-hidden="true">{({ spark: '✦', shield: '⬡', star: '★', bolt: 'ϟ' } as const)[option]}</span>{option}</label>)}</div></fieldset><fieldset><legend>{copy('Topics you like (saved on this device)', 'पसंदीदा विषय (इसी डिवाइस पर सेव)')}</legend><div className="jhk-profile-choices">{TOPICS.map(topic => <label key={topic}><input type="checkbox" checked={topics.includes(topic)} onChange={event => setTopics(current => event.target.checked ? [...current, topic] : current.filter(value => value !== topic))} disabled={busy} />{topic}</label>)}</div></fieldset><label className="fd-gate-field" htmlFor="jhk-profile-language"><span>{copy('Language', 'भाषा')}</span><select id="jhk-profile-language" className="fd-gate-input" value={locale} onChange={event => setLocale(event.target.value as 'en' | 'hi')} disabled={busy}><option value="en">English</option><option value="hi">हिन्दी</option></select></label></details>
          <label className="jhk-profile-attest" htmlFor="jhk-profile-adult"><input id="jhk-profile-adult" type="checkbox" checked={adult} onChange={event => setAdult(event.target.checked)} disabled={busy} /><span>{copy('I confirm I am 18 or older and accept the ', 'मैं पुष्टि करता/करती हूँ कि मेरी उम्र 18 वर्ष या अधिक है और मैं ')}<a href={`${STATIC_BASE}terms.html`} target="_blank" rel="noopener noreferrer">{copy('beta terms', 'बीटा शर्तें')}</a>{copy(' and ', ' तथा ') }<a href={`${STATIC_BASE}privacy.html`} target="_blank" rel="noopener noreferrer">{copy('privacy notice', 'निजता सूचना')}</a>{copy('. This is self-attestation, not age verification.', ' स्वीकार करता/करती हूँ। यह स्व-पुष्टि है, उम्र की जाँच नहीं।')}</span></label>
          {error && <p className="fd-gate-error" role="alert">{error}</p>}
          <button className="fd-gate-save" type="submit" disabled={busy}>{busy ? copy('Saving…', 'सेव हो रहा है…') : copy('Save profile', 'प्रोफ़ाइल सेव करें')}</button>
        </form><button className="fd-gate-secondary" type="button" onClick={() => { setError(''); setStage('recover'); }}>{copy('I have a recovery code', 'मेरे पास रिकवरी कोड है')}</button>
      </>}
      {stage === 'recover' && <><p className="fd-gate-body">{copy('Use the recovery code you saved to restore this player card. Your email cannot recover it.', 'इस खिलाड़ी पहचान को वापस पाने के लिए सँभाला हुआ रिकवरी कोड दर्ज करें। ईमेल से इसे वापस नहीं पा सकते।')}</p><form className="fd-gate-form" onSubmit={restore}><label className="fd-gate-field" htmlFor="jhk-profile-recovery"><span>{copy('Recovery code', 'रिकवरी कोड')}</span><input ref={first} id="jhk-profile-recovery" className="fd-gate-input" value={recovery} onChange={event => setRecovery(event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} required disabled={busy} /></label>{error && <p className="fd-gate-error" role="alert">{error}</p>}<button className="fd-gate-save" type="submit" disabled={busy}>{busy ? copy('Restoring…', 'वापस ला रहे हैं…') : copy('Restore profile', 'प्रोफ़ाइल वापस लाएँ')}</button></form><button className="fd-gate-secondary" type="button" onClick={() => { jhkOnline.forget(); setHadProfile(false); setEmail(''); setError(''); setStage('setup'); }}>{copy('Start a new profile (old progress stays with the old code)', 'नई प्रोफ़ाइल (पुरानी प्रगति पुराने कोड के साथ रहेगी)')}</button></>}
      {stage === 'backup' && <><p className="fd-gate-body">{copy('Save this code now. Anyone with it can access your profile. Your email cannot recover it.', 'यह कोड अभी सँभालें। जिसके पास यह होगा, वह आपकी प्रोफ़ाइल खोल सकता है। ईमेल से इसे वापस नहीं पा सकते।')}</p><output className="jhk-profile-code" aria-label={copy('Recovery code', 'रिकवरी कोड')}>{code}</output>{error && <p className="fd-gate-error" role="alert">{error}</p>}<button className="fd-gate-secondary" onClick={() => void copyCode()}>{copied ? copy('Copied', 'कॉपी हुआ') : copy('Copy code', 'कोड कॉपी करें')}</button><button className="fd-gate-save" onClick={() => { setCode(''); setStage(verified ? 'ready' : 'setup'); }}>{copy('I saved my code · play', 'कोड सँभाल लिया · खेलें')}</button></>}
      <p className="fd-gate-note">{copy('A profile is required for play. ', 'खेलने के लिए प्रोफ़ाइल ज़रूरी है। ')}<a href={`${STATIC_BASE}privacy.html`} target="_blank" rel="noopener noreferrer">{copy('Privacy', 'निजता')}</a> · <a href={`${STATIC_BASE}terms.html`} target="_blank" rel="noopener noreferrer">{copy('Terms', 'शर्तें')}</a></p>
    </div>
  </div>;
}
