'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { whoami } from '@/lib/auth-client';
import { Database, Volume2 } from 'lucide-react';
import { AccountPanel } from './account-panel';
import { gateCopy, readClaimedEmail } from './profile-gate';
import { useLocale, type Locale } from '../use-locale';
import { STORAGE } from '@/lib/storage-names.mjs';
import { LOCALES } from '@/lib/i18n/index.mjs';

/** Persisted as localStorage['fact-duel-motion']. */
export type MotionPref = 'full' | 'reduced' | 'off';

export const SETTINGS_KEYS = {
  sound: STORAGE.sound, // 'on' | 'off'
  volume: STORAGE.volume, // '0'..'1'
  theme: STORAGE.theme, // 'dark' | 'light'
  name: STORAGE.name,
  haptics: STORAGE.haptics, // 'on' | 'off'
  motion: STORAGE.motion, // 'full' | 'reduced' | 'off'
  art: STORAGE.art, // 'on' | 'off'
} as const;

export type SettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (name: string) => void;
  sound: boolean;
  onSoundChange: (on: boolean) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onPreviewSound: () => void;
  haptics: boolean;
  onHapticsChange: (on: boolean) => void;
  motion: MotionPref;
  onMotionChange: (pref: MotionPref) => void;
  light: boolean;
  onLightChange: (on: boolean) => void;
  showArt: boolean;
  onShowArtChange: (on: boolean) => void;
  canExport: boolean;
  onExport: () => void;
  onReset: () => void;
  /** Opens the Analytics screen: what this device records, and the JSON/CSV exports of it. */
  onOpenMeasurement: () => void;
};

/**
 * The address the profile gate was given on this device, and the way to make it real. The sheet's
 * content is mounted only while the sheet is open, so reading the record in the state initialiser
 * re-reads it on every open — a claim made a moment ago is already here.
 *
 * Nothing about that address has been verified and the line says so. "Verify by link" hands the
 * person to the account panel just above, whose magic link IS the verification; that panel owns
 * the flow and this only puts the cursor in its field. So this section exists only for the claims
 * that panel cannot speak for: `whoami().signedIn` is PROVED-only now (a clicked link or Google,
 * see lib/server/auth-service.mjs), and when the server itself holds the claim the panel prints
 * it — saying the same thing twice, one section apart, is noise. What is left is the honest
 * remainder: a build with no server, and a claim that reached no server and lives on this device.
 * Nothing is rendered until `whoami` answers, so no state flashes on the way to the right one.
 */
function ClaimedProfile({ locale }: { locale: Locale }) {
  const [claimed] = useState<string | null>(() => readClaimedEmail());
  const [verify, setVerify] = useState<'checking' | 'can' | 'local' | 'done'>('checking');
  /** The account panel above is already showing this address with its own "Verify by link". */
  const [inPanel, setInPanel] = useState(false);
  useEffect(() => {
    let alive = true;
    whoami().then((who) => {
      if (!alive) return;
      setVerify(!who.available ? 'local' : who.signedIn ? 'done' : 'can');
      setInPanel(who.available && !who.signedIn && who.claimed !== null);
    });
    return () => {
      alive = false;
    };
  }, []);
  if (!claimed || verify === 'checking' || verify === 'done' || inPanel) return null;
  const copy = gateCopy(locale);
  const [before, after] = copy.settingsClaimed.split('{email}');
  const verifyByLink = () => {
    const field = document.getElementById('account-email');
    (field ?? document.getElementById('settings-account'))?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    (field as HTMLInputElement | null)?.focus({ preventScroll: true });
  };
  return (
    <section className="fd-setting-group" aria-labelledby="settings-profile">
      <span className="fd-setting-eyebrow" id="settings-profile">
        {copy.settingsTitle}
      </span>
      <p className="fd-setting-note">
        {before}
        <strong className="fd-gate-claim-email">{claimed}</strong>
        {after}
        {verify === 'local' ? ` ${copy.local}` : ''}
      </p>
      {verify === 'can' && (
        <div className="fd-setting-actions">
          <Button variant="outline" onClick={verifyByLink}>
            {copy.settingsVerify}
          </Button>
        </div>
      )}
    </section>
  );
}

/* Settings live in a sheet: a bottom sheet on phones, a right-hand panel from 600px. The
 * orchestrator (arena.tsx) owns every value and persists it under the keys in SETTINGS_KEYS. */
export function SettingsSheet({
  open,
  onOpenChange,
  name,
  onNameChange,
  sound,
  onSoundChange,
  volume,
  onVolumeChange,
  onPreviewSound,
  haptics,
  onHapticsChange,
  motion,
  onMotionChange,
  light,
  onLightChange,
  showArt,
  onShowArtChange,
  canExport,
  onExport,
  onReset,
  onOpenMeasurement,
}: SettingsSheetProps) {
  const mobile = useIsMobile();
  const { t, locale, setLocale } = useLocale();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={mobile ? 'bottom' : 'right'} className="fd-sheet">
        <div className="fd-sheet-grab" aria-hidden="true" />
        <SheetHeader>
          <SheetTitle>{t('settings.title')}</SheetTitle>
          <SheetDescription>{t('settings.desc')}</SheetDescription>
        </SheetHeader>

        {/* The language control: two equal segments, the current one marked, no default nudge.
            Persisted as localStorage['fd-locale'] by the provider. Questions stay English for now
            and the hint says so. */}
        <section className="fd-setting-group" aria-labelledby="settings-language">
          <span className="fd-setting-eyebrow" id="settings-language">
            {t('settings.language')}
          </span>
          <div className="fd-setting-row">
            <span className="fd-setting-label" id="locale-setting-label">
              {t('settings.language')}
              <small>{t('settings.languageHint')}</small>
            </span>
            <div className="fd-seg fd-locale-seg" role="group" aria-labelledby="locale-setting-label">
              {(LOCALES as readonly Locale[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  className="fd-seg-btn"
                  lang={id}
                  aria-pressed={locale === id}
                  onClick={() => setLocale(id)}
                >
                  {id === 'hi' ? t('settings.langHi') : t('settings.langEn')}
                </button>
              ))}
            </div>
          </div>
        </section>

        <AccountPanel />

        <ClaimedProfile locale={locale} />

        <section className="fd-setting-group" aria-labelledby="settings-player">
          <span className="fd-setting-eyebrow" id="settings-player">
            {t('settings.player')}
          </span>
          <div className="fd-setting-stack">
            <Label htmlFor="name-setting">{t('settings.name')}</Label>
            <Input
              id="name-setting"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              maxLength={24}
              autoComplete="nickname"
              placeholder={t('settings.namePlaceholder')}
            />
          </div>
        </section>

        <section className="fd-setting-group" aria-labelledby="settings-feedback">
          <span className="fd-setting-eyebrow" id="settings-feedback">
            {t('settings.feedback')}
          </span>
          <div className="fd-setting-row">
            <Label htmlFor="sound-setting">{t('settings.sounds')}</Label>
            <Switch id="sound-setting" checked={sound} onCheckedChange={onSoundChange} />
          </div>
          <div className="fd-setting-stack">
            <Label>{t('settings.volume')}</Label>
            <Slider
              aria-label={t('settings.volume')}
              value={[volume * 100]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => onVolumeChange(v[0] / 100)}
            />
            <div className="fd-setting-actions">
              <Button variant="outline" disabled={!sound} onClick={onPreviewSound}>
                <Volume2 />
                {t('settings.preview')}
              </Button>
            </div>
          </div>
          <div className="fd-setting-row">
            <Label htmlFor="haptics-setting">{t('settings.haptics')}</Label>
            <Switch id="haptics-setting" checked={haptics} onCheckedChange={onHapticsChange} />
          </div>
          <div className="fd-setting-row">
            <span className="fd-setting-label" id="motion-setting-label">
              {t('settings.effects')}
              <small>{t('settings.effectsHint')}</small>
            </span>
            <Select value={motion} onValueChange={(v) => onMotionChange(v as MotionPref)}>
              <SelectTrigger id="motion-setting" aria-labelledby="motion-setting-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">{t('settings.full')}</SelectItem>
                <SelectItem value="reduced">{t('settings.reduced')}</SelectItem>
                <SelectItem value="off">{t('settings.off')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="fd-setting-group" aria-labelledby="settings-appearance">
          <span className="fd-setting-eyebrow" id="settings-appearance">
            {t('settings.appearance')}
          </span>
          <div className="fd-setting-row">
            <Label htmlFor="theme-setting">{t('settings.light')}</Label>
            <Switch id="theme-setting" checked={light} onCheckedChange={onLightChange} />
          </div>
          <div className="fd-setting-row">
            <Label htmlFor="art-setting">{t('settings.art')}</Label>
            <Switch id="art-setting" checked={showArt} onCheckedChange={onShowArtChange} />
          </div>
        </section>

        <section className="fd-setting-group" aria-labelledby="settings-measurement">
          <span className="fd-setting-eyebrow" id="settings-measurement">
            {t('settings.measurement')}
          </span>
          <p className="fd-setting-note">{t('settings.measurementNote')}</p>
          <div className="fd-setting-actions">
            <Button variant="outline" onClick={onOpenMeasurement}>
              <Database />
              {t('settings.measurementBtn')}
            </Button>
          </div>
        </section>
        <section className="fd-setting-group" aria-labelledby="settings-storage">
          <span className="fd-setting-eyebrow" id="settings-storage">
            {t('settings.storage')}
          </span>
          <p className="fd-setting-note">{t('settings.storageNote')}</p>
          <div className="fd-setting-actions">
            <Button variant="outline" disabled={!canExport} onClick={onExport}>
              {t('settings.export')}
            </Button>
            <Button variant="outline" disabled={!canExport} onClick={onReset}>
              {t('settings.reset')}
            </Button>
          </div>
        </section>
      </SheetContent>
    </Sheet>
  );
}
