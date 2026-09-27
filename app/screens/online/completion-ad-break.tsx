'use client';
/** Optional, terminal human-match ad opportunity in the JHK shell. */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { sound } from '@/components/fx';
import { recordCompletion } from '../../../editions/hisaab/app/ads/cadence.mjs';
import { googleH5Provider, requestGameBreak } from '../../../editions/hisaab/app/ads/game-runtime.mjs';
import { gameAdEligibility, normalizeAdConfig } from '../../../editions/hisaab/app/ads/policy.mjs';
import { readAdConsent } from '../../../editions/hisaab/app/ads/runtime.mjs';
import { useLocale } from '../../use-locale';
import './completion-ad-break.css';

// Public build-time values only. The default release is off until publisher and CMP approval.
const config = normalizeAdConfig({
  enabled: process.env.NEXT_PUBLIC_JHK_ADS_ENABLED === 'true',
  approved: process.env.NEXT_PUBLIC_JHK_ADS_SITE_APPROVED === 'true',
  autoAdsDisabled: process.env.NEXT_PUBLIC_JHK_ADS_AUTO_ADS_DISABLED === 'true',
  client: process.env.NEXT_PUBLIC_JHK_ADS_CLIENT,
  cmpId: process.env.NEXT_PUBLIC_JHK_ADS_CMP_ID,
  origin: process.env.NEXT_PUBLIC_JHK_ADS_ORIGIN,
  h5Enabled: process.env.NEXT_PUBLIC_JHK_ADS_H5_ENABLED === 'true',
  h5Approved: process.env.NEXT_PUBLIC_JHK_ADS_H5_APPROVED === 'true',
  h5Test: process.env.NEXT_PUBLIC_JHK_ADS_H5_TEST === 'true',
});

const context = () => ({ origin: location.origin, phase: 'completed', activeGame: false, online: navigator.onLine });
const allowed = () => gameAdEligibility(config, context(), readAdConsent(window)).allowed;

export function CompletionAdBreak({ completionId, outcome }: { completionId: string; outcome: 'win' | 'loss' | 'draw' }) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  const [due, setDue] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setDue(false); setOpen(false);
    let active = true;
    // Persist first, even when advertising is disabled. Effect replay and polling share the ID.
    const timer = setTimeout(() => {
      void recordCompletion({ id: completionId, kind: 'duel', outcome }).then((result) => {
        if (active && result.due) setDue(true);
      });
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [completionId, outcome]);
  useEffect(() => {
    if (!due) return;
    const update = () => setEligible(allowed());
    update();
    let unsubscribe = () => {};
    try { unsubscribe = (window as Window & { hisaabAdConsent?: { subscribe: (fn: () => void) => () => void } }).hisaabAdConsent?.subscribe(update) ?? unsubscribe; }
    catch { setEligible(false); }
    window.addEventListener('hisaab:ad-consent-ready', update);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { unsubscribe(); window.removeEventListener('hisaab:ad-consent-ready', update); window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, [due]);
  if (!due || !eligible) return null;
  return <>
    <div className="jhk-ad-entry">
      <span>{hi ? 'खेलों के बीच वैकल्पिक विज्ञापन। आपका नतीजा दर्ज है।' : 'Optional ad break between games. Your result is saved.'}</span>
      <button type="button" disabled={open} onClick={() => {
        if (document.hidden || document.querySelector('dialog[open], [aria-modal="true"]')) return;
        setOpen(true);
      }}>{hi ? 'आगे' : 'Continue'}</button>
    </div>
    {open ? createPortal(<AdDialog hi={hi} onClose={() => { setOpen(false); setDue(false); }} />, document.body) : null}
  </>;
}

function AdDialog({ hi, onClose }: { hi: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const cancel = useRef<() => void>(() => {});
  const [state, setState] = useState('loading');
  useEffect(() => {
    const node = dialog.current;
    if (!node || !container.current) return;
    const before = document.activeElement as HTMLElement | null;
    let active = true;
    try { node.showModal(); } catch { close.current(); return; }
    const resumeSound = sound.pauseForAd();
    const placement = requestGameBreak({
      config, context: context(), win: window,
      provider: googleH5Provider({ config, container: container.current, win: window, doc: document, sound: false, continueLabel: hi ? 'आगे' : 'Continue' }),
      onState: (next: string) => { if (active) setState(next); },
    });
    cancel.current = placement.cancel;
    void placement.done.then(() => { if (active) close.current(); });
    const offline = () => placement.cancel();
    window.addEventListener('offline', offline);
    return () => { active = false; placement.cancel(); resumeSound(); window.removeEventListener('offline', offline); node.close(); if (before?.isConnected) before.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className="jhk-ad-dialog" aria-labelledby="jhk-ad-title" onCancel={() => cancel.current()}>
    <div className="jhk-ad-dialog__head"><div><h2 id="jhk-ad-title">{hi ? 'विज्ञापन' : 'Advertisement'}</h2>
      <p role="status">{state === 'loading' ? hi ? 'विज्ञापन खोज रहे हैं…' : 'Checking for an ad…' : state === 'ready' ? hi ? 'आगे बढ़ें। आपका नतीजा दर्ज है।' : 'Continue to the ad break. Your result is saved.' : hi ? 'आपका नतीजा दर्ज है।' : 'Your result is saved.'}</p></div>
      <button type="button" onClick={() => cancel.current()}>{hi ? 'नतीजे पर वापस' : 'Return to result'}</button></div>
    <div ref={container} className="jhk-ad-dialog__body" />
  </dialog>;
}
