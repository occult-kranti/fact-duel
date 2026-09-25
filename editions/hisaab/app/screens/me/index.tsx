/**
 * screens/me/index.tsx — STUB (foundation lane). The me (port 5186) lane replaces this file.
 * Spec: docs/hisaab/design-bible.md §11.14. API: editions/hisaab/app/README.md.
 */
import type { ScreenProps } from '../../router';
import { StubScreen } from '../../shell/stub-screen';

export default function MeScreen({ route }: ScreenProps) {
  return <StubScreen route={route} title="Me" titleHi="मैं" spec="bible §11.14" lane="me (port 5186)" />;
}
