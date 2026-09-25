/**
 * screens/pass/index.tsx — STUB (foundation lane). The duel (port 5185) lane replaces this file.
 * Spec: docs/hisaab/design-bible.md §11.10. API: editions/hisaab/app/README.md.
 */
import type { ScreenProps } from '../../router';
import { StubScreen } from '../../shell/stub-screen';

export default function PassScreen({ route }: ScreenProps) {
  return <StubScreen route={route} title="Pass & Play" titleHi="पास एंड प्ले" spec="bible §11.10" lane="duel (port 5185)" />;
}
