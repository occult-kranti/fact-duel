/**
 * ui/lang.ts — the chrome's two languages, in one call.
 *
 *   const { t, locale } = useLang();
 *   t('Open file', 'फ़ाइल खोलो')     // Hindi when the locale is Hindi and a Hindi string is given
 *
 * The locale comes from `@/app/use-locale` (persisted per device). English screens keep Hinglish in
 * Latin script; the Hindi locale shows Devanagari UI strings; the bank stays English (bible §2.3).
 * Wrap Devanagari inside an English screen in `<Hi>` (ui/text.tsx) so it gets lang="hi".
 */
import { useMemo } from 'react';
import { useLocale } from '@/app/use-locale';

export type Locale = 'en' | 'hi';

export function useLang() {
  const { locale, setLocale } = useLocale();
  return useMemo(
    () => ({
      locale: locale as Locale,
      isHi: locale === 'hi',
      setLocale,
      /** The English string, or the Hindi one in the Hindi locale when given. */
      t: (en: string, hi?: string) => (locale === 'hi' && hi ? hi : en),
    }),
    [locale, setLocale],
  );
}
