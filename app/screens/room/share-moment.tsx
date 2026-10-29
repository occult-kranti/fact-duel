'use client';
import { useEffect, useState } from 'react';
import { Copy, Download, Share2 } from 'lucide-react';
import { shareMoment } from '@/lib/share-moment.mjs';
import { useLocale } from '../../use-locale';
import './share-moment.css';

type MomentInput = { mode?: string; nickname?: string; title?: string; rounds: number; correct: number; xp: number; human?: boolean };
/** Canvas contains exact score text and simple original geometry, with no remote assets to taint it. */
function makeCard(moment: ReturnType<typeof shareMoment>): Promise<Blob | null> {
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350;
  const c = canvas.getContext('2d'); if (!c) return Promise.resolve(null);
  c.fillStyle = '#102e27'; c.fillRect(0, 0, 1080, 1350);
  c.strokeStyle = '#335348'; c.lineWidth = 3;
  for (const radius of [260, 390, 520]) { c.beginPath(); c.ellipse(920, 270, radius, radius * .7, -.3, 0, Math.PI * 2); c.stroke(); }
  c.fillStyle = '#f6cf80'; c.fillRect(68, 72, 80, 10);
  const line = (text: string, y: number, size: number, color = '#f8f0df', bold = false) => {
    c.fillStyle = color; c.font = `${bold ? 800 : 500} ${size}px system-ui, sans-serif`;
    c.fillText(text, 72, y, 936);
  };
  line('JAANTA HAI KYA', 145, 35, '#f6cf80', true);
  line(`${moment.mode.toUpperCase()} · ${moment.rounds} ROUNDS`, 250, 28);
  line(moment.headline, 365, 66, '#f8f0df', true);
  line(`${moment.correct}/${moment.rounds}`, 650, 210, '#f6cf80', true);
  line('CORRECT ANSWERS', 715, 30);
  c.fillStyle = '#22483a'; c.fillRect(72, 770, 936, 190);
  line(`+${moment.xp} XP`, 846, 54, '#f6cf80', true);
  line(moment.rival, 910, 32);
  line(moment.nickname, 1040, 43, '#f8f0df', true);
  line(moment.title, 1095, 31, '#f6cf80');
  line('Can you beat this over?', 1210, 38, '#f8f0df', true);
  line('occult-kranti.github.io/fact-duel', 1270, 25);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

export function ShareMoment(props: MomentInput) {
  const { locale } = useLocale(); const hi = locale === 'hi';
  const moment = shareMoment(props);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  const [copyFallback, setCopyFallback] = useState(false);
  useEffect(() => {
    let active = true; setFile(null);
    void makeCard(moment).then(blob => { if (active && blob) setFile(new File([blob], 'jhk-my-over.png', { type: 'image/png' })); }).catch(() => {});
    return () => { active = false; };
  }, [moment.text]);
  async function copy() {
    try { await navigator.clipboard.writeText(moment.text); setNote(hi ? 'नतीजा कॉपी हुआ।' : 'Result copied. Paste it wherever you like.'); }
    catch { setCopyFallback(true); setNote(hi ? 'नीचे से नतीजा चुनकर कॉपी करें।' : 'Select and copy your result below.'); }
  }
  async function share() {
    if (busy) return;
    if (!navigator.share) { await copy(); return; }
    setBusy(true); setNote('');
    try {
      const files = file && navigator.canShare?.({ files: [file] }) ? [file] : undefined;
      await navigator.share(files ? { title: 'My JHK over', text: moment.text, files } : { title: 'My JHK over', text: moment.text });
      setNote(hi ? 'नतीजा आपके शेयर विकल्प को सौंपा गया।' : 'Result handed to your share option.');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setNote(hi ? 'शेयर नहीं खुला। कार्ड सेव या टेक्स्ट कॉपी करें।' : 'Sharing did not open. Save the card or copy the result.');
    } finally { setBusy(false); }
  }
  function download() {
    if (!file) return;
    const url = URL.createObjectURL(file), link = document.createElement('a');
    link.href = url; link.download = 'jhk-my-over.png'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    setNote(hi ? 'कार्ड सेव करने के लिए तैयार।' : 'Card ready to save.');
  }
  return <section className="jhk-moment" aria-label={hi ? 'आपका शेयर कार्ड' : 'Your share moment'}>
    <div className="jhk-moment-ticket"><span>{moment.mode} · {moment.rival}</span><strong>{moment.headline}</strong><p><b>{moment.correct}/{moment.rounds}</b> {hi ? 'सही' : 'correct'} <i>·</i> +{moment.xp} XP</p><small>{moment.title} · {moment.nickname}</small></div>
    <div className="jhk-moment-actions"><button type="button" onClick={() => void share()} disabled={busy}><Share2 size={17} aria-hidden="true"/>{hi ? 'अपना ओवर शेयर करें' : 'Share my over'}</button><button type="button" onClick={download} disabled={!file}><Download size={17} aria-hidden="true"/>{hi ? 'कार्ड सेव करें' : 'Save card'}</button><button type="button" onClick={() => void copy()} aria-label={hi ? 'नतीजा कॉपी करें' : 'Copy result'}><Copy size={17} aria-hidden="true"/></button></div>
    <p className="jhk-moment-note" role="status">{note}</p>
    {copyFallback && <textarea readOnly aria-label={hi ? 'कॉपी करने योग्य नतीजा' : 'Copyable result'} value={moment.text} onFocus={event => event.currentTarget.select()} rows={5}/>}
  </section>;
}
