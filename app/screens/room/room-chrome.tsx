'use client';
/** Room chrome: leave, the mode · round chip and the connection indicator. */
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { usePress } from './room-bits';
import { useLocale } from '../../use-locale';

export function RoomChrome({
  settled,
  modeName,
  roundIndex,
  rounds,
  connected,
  onLeave,
}: {
  settled: boolean;
  modeName: string;
  roundIndex: number;
  rounds: number;
  connected: boolean;
  onLeave: () => void;
}) {
  const press = usePress();
  const { t } = useLocale();
  return (
    <header className="fd-room-bar">
      <Button variant="ghost" className="fd-btn fd-room-leave" onPointerDown={press} onClick={onLeave}>
        <ArrowLeft size={16} />
        {settled ? t('room.back') : t('room.leave')}
      </Button>
      <span className="fd-room-chip" data-round={Math.min(roundIndex + 1, rounds)}>
        <b>{modeName}</b>
        <i aria-hidden="true">·</i>
        <span>{t('room.round', { n: Math.min(roundIndex + 1, rounds), of: rounds })}</span>
      </span>
      <span className="fd-room-conn" data-on={connected ? 'true' : 'false'}>
        {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span className="fd-room-conn-text">{connected ? t('room.connected') : t('room.reconnecting')}</span>
      </span>
    </header>
  );
}
