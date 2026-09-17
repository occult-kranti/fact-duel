'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestMagicLink, signInWithGoogle, signOut, whoami, type Whoami } from '@/lib/auth-client';
import './account.css';

/**
 * The account section at the top of Settings. Guest first: the copy says what signing in is for
 * (keeping coins and card across devices) and never pushes. Three honest states — no server
 * (the static build), signed out, signed in — and the Google button exists only when a client id
 * was actually configured for this deployment, so nothing on screen promises what the server
 * cannot do.
 */

type Phase = 'loading' | 'static' | 'out' | 'sent' | 'in';

declare global {
  interface Window {
    __fdGoogleClientId?: string;
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: 'popup' | 'redirect' }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
        };
      };
    };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const EMAIL = /^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+$/;

/** The client id is a deployment fact, injected by the host page; absent means no Google button. */
function googleClientId(): string | null {
  if (typeof window === 'undefined') return null;
  const fromWindow = window.__fdGoogleClientId;
  if (typeof fromWindow === 'string' && fromWindow.trim()) return fromWindow.trim();
  const meta = document.querySelector<HTMLMetaElement>('meta[name="fd-google-client-id"]');
  const content = meta?.content?.trim();
  return content ? content : null;
}

function loadGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('gsi')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('gsi'));
    document.head.appendChild(script);
  });
}

/** What `/?signed-in=1|0` says when the magic-link click lands back on the app. */
function landingNote(): string | null {
  if (typeof window === 'undefined') return null;
  const flag = new URLSearchParams(window.location.search).get('signed-in');
  if (flag === '1') return 'You are signed in on this device.';
  if (flag === '0') return 'That link has expired or was already used. Ask for a new one.';
  return null;
}

export function AccountPanel() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [me, setMe] = useState<Whoami | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(() => landingNote());
  const [clientId] = useState<string | null>(() => googleClientId());
  const googleSlot = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(async () => {
    const who = await whoami();
    setMe(who);
    if (!who.available) setPhase('static');
    else setPhase(who.signedIn ? 'in' : 'out');
  }, []);

  useEffect(() => {
    let alive = true;
    whoami().then((who) => {
      if (!alive) return;
      setMe(who);
      if (!who.available) setPhase('static');
      else setPhase(who.signedIn ? 'in' : 'out');
    });
    return () => {
      alive = false;
    };
  }, []);

  // Google's own button, rendered by Google's script, only when this deployment has a client id.
  useEffect(() => {
    if (!clientId || phase !== 'out') return;
    let alive = true;
    loadGsi()
      .then(() => {
        const slot = googleSlot.current;
        if (!alive || !slot || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: async ({ credential }) => {
            setBusy(true);
            setNote(null);
            try {
              const result = await signInWithGoogle(credential);
              setNote(
                result.abandonedGuest
                  ? 'Signed in. Coins earned as a guest on this device stay with that guest id; this account has its own.'
                  : 'Signed in. Your coins and card are on this account now.',
              );
              await refresh();
            } catch (error) {
              setNote((error as Error).message || 'Google sign-in did not go through.');
            } finally {
              setBusy(false);
            }
          },
        });
        slot.replaceChildren();
        window.google.accounts.id.renderButton(slot, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 280 });
      })
      .catch(() => {
        if (alive) setNote('Google sign-in could not load. Email still works.');
      });
    return () => {
      alive = false;
    };
  }, [clientId, phase, refresh]);

  const sendLink = async (event: React.FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (!EMAIL.test(address)) {
      setNote('Enter an email address to send the link to.');
      return;
    }
    setBusy(true);
    setNote(null);
    const ok = await requestMagicLink(address);
    setBusy(false);
    if (ok) {
      setPhase('sent');
    } else {
      setNote('The link could not be sent right now. Try again in a minute.');
    }
  };

  const leave = async () => {
    setBusy(true);
    setNote(null);
    await signOut();
    setBusy(false);
    setEmail('');
    await refresh();
  };

  return (
    <section className="fd-setting-group fd-account" aria-labelledby="settings-account" aria-busy={busy || phase === 'loading'}>
      <span className="fd-setting-eyebrow" id="settings-account">
        Account
      </span>

      {phase === 'loading' && <p className="fd-setting-note">Checking this device.</p>}

      {phase === 'static' && (
        <p className="fd-setting-note">Sign-in arrives with the server build; on this build your card lives on this device.</p>
      )}

      {phase === 'out' && (
        <>
          <p className="fd-setting-note">Play as a guest, or sign in to keep your coins and card across devices.</p>
          <form className="fd-account-form" onSubmit={sendLink}>
            <Label htmlFor="account-email">Email</Label>
            <div className="fd-account-row">
              <Input
                id="account-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@example.com"
                value={email}
                maxLength={254}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
              <Button type="submit" disabled={busy}>
                Send me a sign-in link
              </Button>
            </div>
          </form>
          {clientId && (
            <div className="fd-account-google">
              <span className="fd-account-or" aria-hidden="true">
                or
              </span>
              <div ref={googleSlot} className="fd-account-gsi" aria-label="Continue with Google" />
            </div>
          )}
        </>
      )}

      {phase === 'sent' && (
        <>
          <p className="fd-setting-note">
            Check <strong className="fd-account-email">{email.trim().toLowerCase()}</strong> for a sign-in link. It works once and
            stops working in 15 minutes.
          </p>
          <div className="fd-setting-actions">
            <Button variant="outline" onClick={() => setPhase('out')} disabled={busy}>
              Use a different address
            </Button>
          </div>
        </>
      )}

      {phase === 'in' && me?.available && (
        <>
          <p className="fd-setting-note">
            Signed in as <strong className="fd-account-email">{me.email ?? 'this account'}</strong>. Your coins and card follow this
            account on any device.
          </p>
          <div className="fd-setting-actions">
            <Button variant="outline" onClick={leave} disabled={busy}>
              Sign out
            </Button>
          </div>
        </>
      )}

      {note && (
        <p className="fd-account-note" role="status">
          {note}
        </p>
      )}
    </section>
  );
}
