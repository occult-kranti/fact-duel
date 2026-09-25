/**
 * screens/settings/index.tsx — STUB (foundation lane). The me (port 5186) lane replaces this file.
 * Spec: docs/hisaab/design-bible.md §11.16. API: editions/hisaab/app/README.md.
 */
import type { ScreenProps } from '../../router';
import { StubScreen } from '../../shell/stub-screen';

export default function SettingsScreen({ route }: ScreenProps) {
  return <StubScreen route={route} title="Settings" titleHi="सेटिंग्स" spec="bible §11.16" lane="me (port 5186)" />;
}
