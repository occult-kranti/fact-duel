/**
 * screens/rules/index.tsx — STUB (foundation lane). The me (port 5186) lane replaces this file.
 * Spec: docs/hisaab/design-bible.md §11.17. API: editions/hisaab/app/README.md.
 */
import type { ScreenProps } from '../../router';
import { StubScreen } from '../../shell/stub-screen';

export default function RulesScreen({ route }: ScreenProps) {
  return <StubScreen route={route} title="Rules & Sources" titleHi="नियम और स्रोत" spec="bible §11.17" lane="me (port 5186)" />;
}
