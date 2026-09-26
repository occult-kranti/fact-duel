/**
 * screens/money/index.tsx — the money trail, 2000–2026 (charter §4a, §6; files lane). Views:
 *   #/money                 the hub: four files — Seedha Khaate Mein, Rahat Kosh, Chunav Se Pehle,
 *                           Saal-dar-Saal
 *   #/money/distribution    Seedha Khaate Mein (item tag 'distribution')
 *   #/money/relief          Rahat Kosh ('relief')
 *   #/money/pre-election    Chunav Se Pehle ('pre-election'): every file carries the poll countdown chip
 *   #/money/years           Saal-dar-Saal: the 2000 → 2026 year strip (?y=2019 selects, ?v=list lists)
 *
 * Files come from the routes the foundation derives (edition.ts moneyRoutes / yearRoutes): six cards
 * each, never padded. A mode whose lanes are not registered yet shows the "being typed" file with the
 * real count; the same screen lists the files once the lanes land. Hubs are quiet (bible §9).
 */
import type { MoneyTag } from '../../../edition';
import type { ScreenProps } from '../../router';
import { MoneyHub } from './hub';
import { ModeView } from './mode';
import { YearsView } from './years';

const TAGS: readonly MoneyTag[] = ['distribution', 'relief', 'pre-election'];

export default function MoneyScreen({ route }: ScreenProps) {
  const view = route.view ?? 'hub';
  if (view === 'years') return <YearsView route={route} />;
  const tag = TAGS.find((t) => t === view);
  if (tag) return <ModeView key={tag} tag={tag} />;
  return <MoneyHub />;
}
