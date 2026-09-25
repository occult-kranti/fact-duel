/**
 * screens/aaj/index.tsx — STUB (foundation lane). The route (port 5184) lane replaces this file.
 * Spec: docs/hisaab/design-bible.md §11.7. API: editions/hisaab/app/README.md.
 */
import type { ScreenProps } from '../../router';
import { StubScreen } from '../../shell/stub-screen';

export default function AajScreen({ route }: ScreenProps) {
  return <StubScreen route={route} title="Aaj Ka Hisaab" titleHi="आज का हिसाब" spec="bible §11.7" lane="route (port 5184)" />;
}
