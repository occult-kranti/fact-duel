/**
 * screens/duel/index.tsx — #/duel (Muqabla setup, bible §11.8) and #/duel/friend (the P2P lobby,
 * §11.9, which also hosts the friend match once both seats are ready).
 */
import type { ScreenProps } from '../../router';
import { FriendLobby } from './friend';
import { DuelSetup } from './setup';

export default function DuelScreen({ route }: ScreenProps) {
  return route.view === 'friend' ? <FriendLobby route={route} /> : <DuelSetup route={route} />;
}
