/**
 * screens/files/index.tsx — STUB (foundation lane). The files lane replaces this file.
 * Views: hub (#/files), states (#/files/states — the cartogram), sectors, media (Kiska Media?),
 * forwards (Forward Court). Spec: docs/hisaab/design-bible.md §11.3–§11.6. API: app/README.md.
 */
import { routesOfKind } from '../../../edition';
import type { ScreenProps } from '../../router';
import { StubScreen } from '../../shell/stub-screen';

const VIEWS: Record<string, { title: string; titleHi: string; spec: string }> = {
  hub: { title: 'Files', titleHi: 'फ़ाइलें', spec: 'bible §11.3' },
  states: { title: 'Rajya Rounds', titleHi: 'राज्य राउंड्स', spec: 'bible §11.3' },
  sectors: { title: 'Sector Files', titleHi: 'सेक्टर फ़ाइलें', spec: 'bible §11.4' },
  media: { title: 'Kiska Media?', titleHi: 'किसका मीडिया?', spec: 'bible §11.5' },
  forwards: { title: 'Forward Court', titleHi: 'फ़ॉरवर्ड अदालत', spec: 'bible §11.6' },
};

export default function FilesScreen({ route }: ScreenProps) {
  const v = VIEWS[route.view ?? 'hub'] ?? VIEWS.hub;
  const counts = `${routesOfKind('state').length} state files · ${routesOfKind('sector').length} sector files · ${routesOfKind('media').length} Kiska Media · ${routesOfKind('forward').length} Forward Court`;
  return (
    <StubScreen route={route} title={v.title} titleHi={v.titleHi} spec={v.spec} lane="files (port 5183)">
      <p className="h-meta">{counts}</p>
    </StubScreen>
  );
}
