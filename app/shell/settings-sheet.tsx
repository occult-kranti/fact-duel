'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Database, Volume2 } from 'lucide-react';

/** Persisted as localStorage['fact-duel-motion']. */
export type MotionPref = 'full' | 'reduced' | 'off';

export const SETTINGS_KEYS = {
  sound: 'fact-duel-online-sound', // 'on' | 'off'
  volume: 'fact-duel-volume', // '0'..'1'
  theme: 'fact-duel-online-theme', // 'dark' | 'light'
  name: 'fact-duel-name',
  haptics: 'fact-duel-haptics', // 'on' | 'off'
  motion: 'fact-duel-motion', // 'full' | 'reduced' | 'off'
  art: 'fact-duel-art', // 'on' | 'off'
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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={mobile ? 'bottom' : 'right'} className="fd-sheet">
        <div className="fd-sheet-grab" aria-hidden="true" />
        <SheetHeader>
          <SheetTitle>Make yourself at home.</SheetTitle>
          <SheetDescription>Preferences stay on this device. Sounds are optional.</SheetDescription>
        </SheetHeader>

        <section className="fd-setting-group" aria-labelledby="settings-player">
          <span className="fd-setting-eyebrow" id="settings-player">
            Player
          </span>
          <div className="fd-setting-stack">
            <Label htmlFor="name-setting">Your player name</Label>
            <Input
              id="name-setting"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              maxLength={24}
              autoComplete="nickname"
              placeholder="Choose a name"
            />
          </div>
        </section>

        <section className="fd-setting-group" aria-labelledby="settings-feedback">
          <span className="fd-setting-eyebrow" id="settings-feedback">
            Feedback
          </span>
          <div className="fd-setting-row">
            <Label htmlFor="sound-setting">Game sounds</Label>
            <Switch id="sound-setting" checked={sound} onCheckedChange={onSoundChange} />
          </div>
          <div className="fd-setting-stack">
            <Label>Sound volume</Label>
            <Slider
              aria-label="Sound volume"
              value={[volume * 100]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => onVolumeChange(v[0] / 100)}
            />
            <div className="fd-setting-actions">
              <Button variant="outline" disabled={!sound} onClick={onPreviewSound}>
                <Volume2 />
                Preview sound
              </Button>
            </div>
          </div>
          <div className="fd-setting-row">
            <Label htmlFor="haptics-setting">Haptics</Label>
            <Switch id="haptics-setting" checked={haptics} onCheckedChange={onHapticsChange} />
          </div>
          <div className="fd-setting-row">
            <span className="fd-setting-label" id="motion-setting-label">
              Effects
              <small>Confetti, shakes and celebrations</small>
            </span>
            <Select value={motion} onValueChange={(v) => onMotionChange(v as MotionPref)}>
              <SelectTrigger id="motion-setting" aria-labelledby="motion-setting-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="reduced">Reduced</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="fd-setting-group" aria-labelledby="settings-appearance">
          <span className="fd-setting-eyebrow" id="settings-appearance">
            Appearance
          </span>
          <div className="fd-setting-row">
            <Label htmlFor="theme-setting">Light theme</Label>
            <Switch id="theme-setting" checked={light} onCheckedChange={onLightChange} />
          </div>
          <div className="fd-setting-row">
            <Label htmlFor="art-setting">Arena object in 3D</Label>
            <Switch id="art-setting" checked={showArt} onCheckedChange={onShowArtChange} />
          </div>
        </section>

        <section className="fd-setting-group" aria-labelledby="settings-measurement">
          <span className="fd-setting-eyebrow" id="settings-measurement">
            Measurement
          </span>
          <p className="fd-setting-note">
            Sessions, active days and whether you came back on day 1, 7 or 30 are recorded on this device and
            nowhere else. The Analytics screen shows all of it, in full, and exports it as JSON or CSV.
          </p>
          <div className="fd-setting-actions">
            <Button variant="outline" onClick={onOpenMeasurement}>
              <Database />
              Measurement and your data
            </Button>
          </div>
        </section>
        <section className="fd-setting-group" aria-labelledby="settings-storage">
          <span className="fd-setting-eyebrow" id="settings-storage">
            Your local activity
          </span>
          <p className="fd-setting-note">
            Everything you earn lives in this browser: your Vault of facts and saved question issues,
            expedition progress and stamps, XP and activity points, side quests and card finishes — and
            the measurement record behind the Analytics screen. Export them before resetting. Theme and sound
            preferences are kept.
          </p>
          <div className="fd-setting-actions">
            <Button variant="outline" disabled={!canExport} onClick={onExport}>
              Export all activity
            </Button>
            <Button variant="outline" disabled={!canExport} onClick={onReset}>
              Reset local activity
            </Button>
          </div>
        </section>
      </SheetContent>
    </Sheet>
  );
}
