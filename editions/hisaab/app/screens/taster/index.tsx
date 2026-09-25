/**
 * screens/taster/index.tsx — STUB (foundation lane). The route (port 5184) lane replaces this file.
 * Spec: docs/hisaab/design-bible.md §8.4, §11.7. API: editions/hisaab/app/README.md.
 */
import type { ScreenProps } from '../../router';
import { StubScreen } from '../../shell/stub-screen';

export default function TasterScreen({ route }: ScreenProps) {
  return <StubScreen route={route} title="One question" titleHi="एक सवाल" spec="bible §8.4, §11.7" lane="route (port 5184)" />;
}
