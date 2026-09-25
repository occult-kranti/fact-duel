/**
 * screens/money/index.tsx — STUB (foundation lane). The files lane (money trail) replaces this file.
 * Views: hub (#/money), distribution (Seedha Khaate Mein), relief (Rahat Kosh), pre-election
 * (Chunav Se Pehle), years (Saal-dar-Saal). Spec: CHARTER.md §4a, §6. API: app/README.md.
 */
import { moneyMode, moneyRoutes, MONEY_MODES, YEAR_MODE, yearRoutes, type MoneyTag } from '../../../edition';
import type { ScreenProps } from '../../router';
import { StubScreen } from '../../shell/stub-screen';

export default function MoneyScreen({ route }: ScreenProps) {
  const view = route.view ?? 'hub';
  const mode = view === 'hub' || view === 'years' ? null : moneyMode(view as MoneyTag);
  const title = mode ? mode.title : view === 'years' ? YEAR_MODE.title : 'The money trail';
  const titleHi = mode ? mode.titleDevanagari : view === 'years' ? YEAR_MODE.titleDevanagari : 'पैसे का हिसाब';
  const lines = [...MONEY_MODES.map((m) => `${m.title}: ${moneyRoutes(m.tag).length} routes`), `${YEAR_MODE.title}: ${yearRoutes().length} routes`];
  return (
    <StubScreen route={route} title={title} titleHi={titleHi} spec="CHARTER §4a, §6" lane="files (port 5183)">
      <p className="h-meta">{lines.join(' · ')} (routes appear as the money-trail lanes are registered).</p>
    </StubScreen>
  );
}
