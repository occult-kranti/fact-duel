/**
 * screens/route/index.tsx — STUB (foundation lane). The route (port 5184) lane replaces this file.
 * Spec: docs/hisaab/design-bible.md §11.7, §11.13. API: editions/hisaab/app/README.md.
 */
import type { ScreenProps } from '../../router';
import { StubScreen } from '../../shell/stub-screen';

export default function RouteScreen({ route }: ScreenProps) {
  return <StubScreen route={route} title="File" titleHi="फ़ाइल" spec="bible §11.7, §11.13" lane="route (port 5184)" />;
}
