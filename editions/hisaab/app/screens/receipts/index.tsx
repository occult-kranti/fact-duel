/**
 * screens/receipts/index.tsx — STUB (foundation lane). The me (port 5186) lane replaces this file.
 * Spec: docs/hisaab/design-bible.md §11.15. API: editions/hisaab/app/README.md.
 */
import type { ScreenProps } from '../../router';
import { StubScreen } from '../../shell/stub-screen';

export default function ReceiptsScreen({ route }: ScreenProps) {
  return <StubScreen route={route} title="Receipts" titleHi="रसीदें" spec="bible §11.15" lane="me (port 5186)" />;
}
