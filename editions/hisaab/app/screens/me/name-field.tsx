/**
 * screens/me/name-field.tsx — "Name on certificates" (optional, empty by default — N13/N14).
 *
 * Stored on this device only (the same name a duel room shows the other player). Certificates print the
 * first 20 characters, and a name that is — or contains — anyone in the bank's `people` lists prints
 * "Anonymous Janta", so nobody can certify a real politician. The field says which it will be.
 */
import { useEffect, useId, useState } from 'react';
import { ANONYMOUS, certificateName, NAME_MAX } from '../../data';
import { cx } from '../../ui/cx';
import { useLang } from '../../ui/lang';
import { NAME_INPUT_MAX, savePlayerName, usePlayerName } from './lib';
import './name-field.css';

export function NameField({ className, compact }: { className?: string; compact?: boolean }) {
  const { t } = useLang();
  const stored = usePlayerName();
  const [value, setValue] = useState(stored);
  const id = useId();
  // Follow the stored name when it changes elsewhere (another tab, Settings), without fighting the
  // typist: "Riya " stores as "Riya", and that must not eat the space before the next word.
  useEffect(() => {
    setValue((v) => (v.replace(/\s+/g, ' ').trim().slice(0, NAME_INPUT_MAX) === stored ? v : stored));
  }, [stored]);
  const printed = certificateName(value);
  const typed = value.replace(/\s+/g, ' ').trim();
  const blocked = !!typed && printed === ANONYMOUS;
  const trimmed = !blocked && typed.length > NAME_MAX;
  return (
    <div className={cx('h-namefield', compact && 'h-namefield--compact', className)}>
      <label className="h-namefield__label" htmlFor={id}>
        {t('Name on certificates', 'प्रमाण पत्र पर नाम')} <span className="h-namefield__opt">{t('(optional)', '(वैकल्पिक)')}</span>
      </label>
      <input
        id={id}
        className="h-namefield__input"
        type="text"
        value={value}
        maxLength={NAME_INPUT_MAX}
        autoComplete="nickname"
        spellCheck={false}
        placeholder={ANONYMOUS}
        aria-describedby={`${id}-hint`}
        onChange={(e) => {
          setValue(e.target.value);
          savePlayerName(e.target.value);
        }}
      />
      <p className="h-namefield__hint" id={`${id}-hint`} aria-live="polite">
        {t('Prints as', 'छपेगा')}: <strong>{printed}</strong>
        {blocked
          ? ` — ${t('that name matches someone in our files, and labels never go on real people.', 'यह नाम हमारी फ़ाइलों के किसी व्यक्ति से मिलता है; लेबल असली लोगों पर नहीं लगते।')}`
          : trimmed
            ? ` — ${t(`certificates print the first ${NAME_MAX} characters.`, `प्रमाण पत्र पर पहले ${NAME_MAX} अक्षर छपते हैं।`)}`
            : '.'}
        {compact
          ? null
          : ` ${t(
              'Stored on this device. A friend sees it only in a duel room you join.',
              'इसी फ़ोन पर रखा जाता है। दोस्त को यह सिर्फ़ उस मुक़ाबले के रूम में दिखता है जिसमें आप जुड़ते हैं।',
            )}`}
      </p>
    </div>
  );
}
