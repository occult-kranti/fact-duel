/**
 * screens/files/index.tsx — the Files tab (files lane). Views (router.ts):
 *   #/files            the hub: the section tabs, opening on Rajya Rounds (bible §11.3 — default Rajya)
 *   #/files/states     Rajya Rounds: the records-room cartogram (?s=UP selects, ?v=list lists, ?q= searches)
 *   #/files/sectors    Sector Files (?f=<sector slug> selects)                               bible §11.4
 *   #/files/media      Kiska Media? + who owns what                                          bible §11.5
 *   #/files/forwards   Forward Court + the docket                                            bible §11.6
 * The money trail (#/money…) lives under the same tab; see screens/money.
 *
 * Hubs are quiet (bible §9): no toast, no ceremony — tile states, meters and registers update in place.
 * Every file opens #/route/:id.
 */
import type { ScreenProps } from '../../router';
import { ForwardsView } from './forwards';
import { MediaView } from './media';
import { RajyaView } from './rajya';
import { SectorsView } from './sectors';

export default function FilesScreen({ route }: ScreenProps) {
  switch (route.view) {
    case 'sectors':
      return <SectorsView route={route} />;
    case 'media':
      return <MediaView route={route} />;
    case 'forwards':
      return <ForwardsView route={route} />;
    default:
      return <RajyaView route={route} />;
  }
}
