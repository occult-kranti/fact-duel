/**
 * screens/duel/index.tsx — STUB (foundation lane). The duel (port 5185) lane replaces this file.
 * Spec: docs/hisaab/design-bible.md §11.8, §11.9. API: editions/hisaab/app/README.md.
 */
import type { ScreenProps } from '../../router';
import { StubScreen } from '../../shell/stub-screen';

export default function DuelScreen({ route }: ScreenProps) {
  return <StubScreen route={route} title="Muqabla" titleHi="मुक़ाबला" spec="bible §11.8, §11.9" lane="duel (port 5185)" />;
}
