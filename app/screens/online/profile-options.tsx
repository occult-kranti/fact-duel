'use client';
import { useEffect, useState } from 'react';
import { jhkOnline } from '@/lib/jhk-online/runtime';
import type { PlayerSession } from '@/lib/jhk-online/types';
import { STORAGE } from '@/lib/storage-names.mjs';
import { useLocale } from '../../use-locale';

const AVATARS = ['spark', 'shield', 'star', 'bolt', 'book', 'compass'];
const TOPICS = ['sports', 'science', 'cricket', 'football', 'space'];
const EMAIL = /^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+$/;
const PHOTO_KEY = STORAGE.localPhoto;
const TOPICS_KEY = STORAGE.favouriteTopics;
const STATIC_BASE = ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.BASE_URL || '/').replace(/\/?$/, '/');
function savedTopics() { try { const value = JSON.parse(localStorage.getItem(TOPICS_KEY) || '[]'); return Array.isArray(value) ? value.filter((v: unknown) => TOPICS.includes(String(v))) : []; } catch { return []; } }
function photo() { try { return localStorage.getItem(PHOTO_KEY) || ''; } catch { return ''; } }

/** Private account controls; the image and topic preference stay on this browser. */
export function ProfileOptions({ session }: { session: PlayerSession }) {
  const { locale, setLocale } = useLocale();
  const hi = locale === 'hi';
  const t = (en: string, hindi: string) => hi ? hindi : en;
  const [name, setName] = useState(session.nickname);
  const [email, setEmail] = useState(session.email || '');
  const [avatar, setAvatar] = useState(session.avatar || 'spark');
  const [topics, setTopics] = useState<string[]>(savedTopics);
  const [picture, setPicture] = useState(photo);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => { setName(session.nickname); setEmail(session.email || ''); setAvatar(session.avatar || 'spark'); }, [session.id, session.nickname, session.email, session.avatar]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const nickname = name.replace(/\s+/g, ' ').trim(), address = email.trim().toLowerCase();
    if (nickname.length < 2 || nickname.length > 24 || !EMAIL.test(address)) { setMessage(t('Use a 2–24 character name and a valid email.', '2–24 अक्षरों का नाम और सही ईमेल दर्ज करें।')); return; }
    setBusy(true); setMessage('');
    try {
      await jhkOnline.updateProfile({ nickname, email: address, avatar, locale });
      try { localStorage.setItem(TOPICS_KEY, JSON.stringify(topics)); } catch { /* local preference is optional */ }
      setMessage(t('Player card saved. Your email remains private and unverified.', 'खिलाड़ी पहचान सेव हुई। ईमेल निजी और असत्यापित है।'));
    } catch (error) { setMessage(error instanceof Error ? error.message : t('Could not save. Try again.', 'सेव नहीं हुआ। फिर कोशिश करें।')); }
    finally { setBusy(false); }
  };
  const rotate = async () => {
    setBusy(true); setMessage('');
    try { setCode(await jhkOnline.rotateRecovery()); setMessage(t('The previous recovery code no longer works. Save this new one.', 'पुराना रिकवरी कोड अब नहीं चलेगा। नया कोड सँभालें।')); }
    catch (error) { setMessage(error instanceof Error ? error.message : t('Could not rotate the code.', 'कोड नहीं बदल सका।')); }
    finally { setBusy(false); }
  };
  const exportAccount = async () => {
    setBusy(true); setMessage('');
    try {
      const data = await jhkOnline.request('exportProfile');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'jhk-profile.json'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(t('Profile export downloaded.', 'प्रोफ़ाइल निर्यात डाउनलोड हुआ।'));
    } catch (error) { setMessage(error instanceof Error ? error.message : t('Export unavailable. Try again.', 'निर्यात उपलब्ध नहीं। फिर कोशिश करें।')); }
    finally { setBusy(false); }
  };
  const deleteAccount = async () => {
    setBusy(true); setMessage('');
    try {
      await jhkOnline.request('deleteSession');
      jhkOnline.forget(); setCode(''); setConfirmDelete(false);
      window.dispatchEvent(new Event('jhk-profile-recheck'));
    } catch (error) { setMessage(error instanceof Error ? error.message : t('Could not delete the profile. Try again.', 'प्रोफ़ाइल नहीं हटी। फिर कोशिश करें।')); }
    finally { setBusy(false); }
  };
  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5_000_000) { setMessage(t('Choose an image under 5 MB.', '5 MB से छोटी तस्वीर चुनें।')); return; }
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
        const side = Math.min(image.width, image.height);
        canvas.getContext('2d')?.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 256, 256);
        const data = canvas.toDataURL('image/jpeg', .78);
        localStorage.setItem(PHOTO_KEY, data); setPicture(data); setMessage(t('Photo saved on this device only.', 'तस्वीर केवल इसी डिवाइस पर सेव हुई।'));
      } catch { setMessage(t('This browser could not save the photo.', 'यह ब्राउज़र तस्वीर सेव नहीं कर सका।')); }
      finally { URL.revokeObjectURL(url); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); setMessage(t('Could not read this image.', 'यह तस्वीर पढ़ नहीं सके।')); };
    image.src = url;
  };
  return <details className="jhk-profile-options-card"><summary>{t('Edit profile & recovery', 'प्रोफ़ाइल और रिकवरी बदलें')}</summary>
    <p className="jhk-live-muted">{t('Your nickname is public. Your email is private, unverified, and cannot recover access.', 'नाम सार्वजनिक है। ईमेल निजी, असत्यापित है और उससे पहुँच वापस नहीं मिलेगी।')}</p>
    <form className="jhk-live-identity" onSubmit={save}>
      <label htmlFor="jhk-edit-name">{t('Public nickname', 'सार्वजनिक नाम')}</label><input id="jhk-edit-name" value={name} onChange={event => setName(event.target.value)} maxLength={24} autoComplete="nickname" disabled={busy} />
      <label htmlFor="jhk-edit-email">{t('Private email', 'निजी ईमेल')}</label><input id="jhk-edit-email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" disabled={busy} />
      <label htmlFor="jhk-edit-avatar">{t('Avatar', 'अवतार')}</label><select id="jhk-edit-avatar" value={avatar} onChange={event => setAvatar(event.target.value)} disabled={busy}>{AVATARS.map(option => <option value={option} key={option}>{option}</option>)}</select>
      <label htmlFor="jhk-edit-locale">{t('Language', 'भाषा')}</label><select id="jhk-edit-locale" value={locale} onChange={event => setLocale(event.target.value as 'en' | 'hi')} disabled={busy}><option value="en">English</option><option value="hi">हिन्दी</option></select>
      <fieldset className="jhk-profile-topics"><legend>{t('Favourite topics · saved on this device', 'पसंदीदा विषय · इसी डिवाइस पर सेव')}</legend>{TOPICS.map(topic => <label key={topic}><input type="checkbox" checked={topics.includes(topic)} onChange={event => setTopics(current => event.target.checked ? [...current, topic] : current.filter(value => value !== topic))} />{topic}</label>)}</fieldset>
      <button className="jhk-live-primary" type="submit" disabled={busy}>{busy ? t('Saving…', 'सेव हो रहा है…') : t('Save changes', 'बदलाव सेव करें')}</button>
    </form>
    <div className="jhk-profile-photo"><strong>{t('Photo on this device', 'इस डिवाइस पर तस्वीर')}</strong>{picture && <img src={picture} alt={t('Your optional local profile photo', 'आपकी वैकल्पिक स्थानीय तस्वीर')} width="72" height="72" />}<label>{t('Choose photo', 'तस्वीर चुनें')}<input type="file" accept="image/*" onChange={event => choosePhoto(event.target.files?.[0])} /></label>{picture && <button type="button" onClick={() => { try { localStorage.removeItem(PHOTO_KEY); } catch {} setPicture(''); }}>{t('Remove photo', 'तस्वीर हटाएँ')}</button>}<small>{t('Stored and displayed only on this device. Never sent to the game server.', 'सिर्फ़ इसी डिवाइस पर सेव और दिखाई जाती है। गेम सर्वर पर नहीं भेजी जाती।')}</small></div>
    <div className="jhk-profile-recovery"><strong>{t('Recovery code', 'रिकवरी कोड')}</strong><p>{t('Your existing code is hidden. Anyone with it can access this profile. Rotate only after you are ready to save a new code.', 'पुराना कोड छिपा रहता है। जिसके पास कोड होगा, वह प्रोफ़ाइल खोल सकेगा। नया कोड सँभालने के लिए तैयार हों तभी बदलें।')}</p><button type="button" disabled={busy} onClick={() => void rotate()}>{t('Replace recovery code', 'रिकवरी कोड बदलें')}</button>{code && <><output className="jhk-profile-code">{code}</output><button type="button" onClick={() => void navigator.clipboard.writeText(code).then(() => setMessage(t('Code copied.', 'कोड कॉपी हुआ।'))).catch(() => setMessage(t('Copy unavailable; write it down.', 'कॉपी उपलब्ध नहीं; इसे लिख लें।')))}>{t('Copy new code', 'नया कोड कॉपी करें')}</button><button type="button" onClick={() => setCode('')}>{t('I saved it · hide code', 'सँभाल लिया · कोड छिपाएँ')}</button></>}</div>
    <div className="jhk-profile-data"><button type="button" disabled={busy} onClick={() => void exportAccount()}>{t('Download my server data', 'मेरा सर्वर डेटा डाउनलोड करें')}</button><button type="button" disabled={busy} onClick={() => setConfirmDelete(true)}>{t('Delete server profile', 'सर्वर प्रोफ़ाइल हटाएँ')}</button>{confirmDelete && <div className="jhk-profile-confirm"><p>{t('Deactivate this profile and remove its private email and recovery access? Pseudonymous match and coin ledger records may remain for integrity. This cannot be undone. Finish or leave an active match first.', 'यह प्रोफ़ाइल बंद करके निजी ईमेल और रिकवरी पहुँच हटाएँ? खेल और सिक्कों के छद्मनाम रिकॉर्ड निष्पक्षता के लिए रह सकते हैं। इसे वापस नहीं ला सकेंगे। पहले चल रहा मुक़ाबला खत्म या छोड़ें।')} <a href={`${STATIC_BASE}privacy.html`} target="_blank" rel="noopener noreferrer">{t('Privacy notice', 'निजता सूचना')}</a></p><button type="button" disabled={busy} onClick={() => void deleteAccount()}>{t('Yes, deactivate my profile', 'हाँ, प्रोफ़ाइल बंद करें')}</button><button type="button" onClick={() => setConfirmDelete(false)}>{t('Keep profile', 'प्रोफ़ाइल रखें')}</button></div>}</div>
    {message && <p role="status" className="jhk-live-muted">{message}</p>}
  </details>;
}
