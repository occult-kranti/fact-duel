'use client';
import { useEffect, useState } from 'react';
import { jhkOnline as online } from '@/lib/jhk-online/runtime';
import { useLocale } from '../use-locale';

/** Aggregate read only. Does not create a guest, heartbeat, account or available-rival claim. */
export function StadiumPresence() {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!online.configured) return;
    let stopped = false;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let expiry: ReturnType<typeof setTimeout>;
    async function refresh() {
      if (document.hidden) { timer = setTimeout(refresh, 30000); return; }
      try {
        const data = await online.request('presence', {}, { signal: controller.signal });
        const value = data?.presence;
        if (!stopped && value?.windowSeconds === 120 && Number.isSafeInteger(value.activeHumans) && value.activeHumans >= 0 && Number.isFinite(value.expiresAt) && value.expiresAt > online.now()) {
          setCount(value.activeHumans);
          clearTimeout(expiry);
          expiry = setTimeout(() => setCount(null), Math.min(30000, value.expiresAt - online.now()));
        } else if (!stopped) setCount(null);
      } catch { if (!stopped) setCount(null); }
      if (!stopped) timer = setTimeout(refresh, 20000);
    }
    void refresh();
    return () => { stopped = true; controller.abort(); clearTimeout(timer); clearTimeout(expiry); };
  }, []);
  return <span className="stadium-presence" data-state={count === null ? 'unknown' : 'live'} title={hi ? 'पिछले दो मिनट में सक्रिय इंसानी प्रोफ़ाइल। उपलब्ध प्रतिद्वंद्वियों की संख्या नहीं।' : 'Human profiles active in the last two minutes. This is not a count of available opponents.'}>
    <i aria-hidden="true" />{count === null ? hi ? 'लाइव गिनती उपलब्ध नहीं' : 'Live count unavailable' : hi ? `${count} इंसानी खिलाड़ी · पिछले 2 मिनट` : `${count} human${count === 1 ? '' : 's'} active · last 2 min`}
  </span>;
}
