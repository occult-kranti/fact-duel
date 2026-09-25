/**
 * screens/room/index.tsx — STUB (foundation lane). The duel (port 5185) lane replaces this file.
 * Spec: docs/hisaab/design-bible.md §11.10–§11.12. API: editions/hisaab/app/README.md.
 */
import type { ScreenProps } from '../../router';
import { StubScreen } from '../../shell/stub-screen';

export default function RoomScreen({ route }: ScreenProps) {
  return <StubScreen route={route} title="Duel" titleHi="मुक़ाबला" spec="bible §11.10–§11.12" lane="duel (port 5185)" />;
}
