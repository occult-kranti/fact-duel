/**
 * shell/progression-watch.tsx — turns progression changes into the edition's feedback, once
 * (design bible §9, §12). Mounted once by the shell; screens do not re-implement it.
 *
 *  - a new BAND (label promotion)      → the 'label' ceremony (merged with a 'file' one if both fire)
 *  - a level inside the band           → in place (Activity entry)
 *  - a CL (casual leave) auto-used     → the visit's toast: "Missed a day. 1 CL used. Streak safe."
 *  - quests completed                  → the visit's one toast, unless the CL notice took it (then in
 *                                        place): one or the other, never both (bible §9, Home)
 *  - a promotion while this tab is hidden → Activity kind PENDING_LABEL ({ band }); Home opens it
 *  - achievements (Stamp Register), Babu-rank moves, streak days → in place (Activity entries)
 *
 * The 'file' ceremony (first clear of a state / sector / Kiska Media / Forward Court file) is raised by
 * the route finish screen, which knows the file's name and score.
 * The first progression seen after load is the baseline — nothing fires for history.
 */
import { useEffect, useRef } from 'react';
import { achievementById, levelForXp, progressionDiff } from '@/lib/progression.mjs';
import { budget, PENDING_LABEL } from '../budget';
import { babuRank, goalCopy, labelDisplay } from '../data';
import { useAppPlayer } from './player';

type Progression = {
  xp: number;
  streak: { current: number; shields: number; lastDay: string | null };
  quests: { day: string; items: Array<{ id: string; label: string; done: boolean }> };
  rank: { tier: string };
};

export function ProgressionWatch() {
  const player = useAppPlayer();
  const prev = useRef<Progression | null>(null);

  useEffect(() => {
    if (!player.loaded) return;
    const after = player.progression as Progression | undefined;
    if (!after) return;
    const before = prev.current;
    prev.current = after;
    if (!before || before === after) return;
    // Another tab's write arrives here too; only the visible tab speaks up.
    const visible = typeof document === 'undefined' || document.visibilityState !== 'hidden';
    const diff = progressionDiff(before, after) as { questsCompleted: string[]; newAchievements: string[]; rankUp: { to: string } | null };
    const from = levelForXp(before.xp);
    const to = levelForXp(after.xp);

    if (to.band > from.band) {
      const l = labelDisplay(to.band);
      if (visible)
        budget.ceremony({
          kind: 'label',
          kicker: 'Label promotion',
          title: l.en,
          titleHi: l.hi,
          subtitle: l.line,
          stamp: `ISSUED · ${l.en.toUpperCase()}`,
          seed: `band-${l.band}`,
        });
      // Earned in another tab: Home opens this ceremony when the player comes back (finds it by kind).
      else budget.note(`Now labelled ${l.en}`, l.line, { kind: PENDING_LABEL, data: { band: l.band } });
    } else if (to.level > from.level) {
      budget.note(`Level ${to.level}`, goalCopy(after.xp));
    }

    const quests = diff.questsCompleted
      .map((id) => after.quests.items.find((q) => q.id === id)?.label)
      .filter((x): x is string => !!x);
    const questWords = quests.length
      ? { title: quests.length === 1 ? 'Quest done' : `${quests.length} quests done`, body: quests.slice(0, 2).join(' · ') }
      : null;

    // Bible §9 (Home): the one toast is the CL notice OR the quests summary, never both. The CL
    // notice wins (it explains a streak number that would otherwise look wrong); quests go in place.
    const clUsed = after.streak.shields < before.streak.shields && after.streak.current >= before.streak.current;
    if (clUsed && visible) {
      const used = before.streak.shields - after.streak.shields;
      budget.toast({ tone: 'streak', title: `Missed a day. ${used} CL used. Streak safe.` });
      if (questWords) budget.note(questWords.title, questWords.body);
    } else {
      if (questWords && visible) budget.toast({ tone: 'quest', ...questWords });
      else if (questWords) budget.note(questWords.title, questWords.body);
      if (after.streak.current !== before.streak.current) {
        budget.note(`Streak: ${after.streak.current} ${after.streak.current === 1 ? 'day' : 'days'}`);
      }
    }

    for (const id of diff.newAchievements) {
      const a = achievementById(id) as { title?: string; name?: string } | undefined;
      budget.note(`Stamp Register: ${a?.title ?? a?.name ?? id}`);
    }
    if (diff.rankUp) budget.note(`Promoted to ${babuRank(diff.rankUp.to)}`, 'Babu rank, on this device');
  }, [player.loaded, player.progression]);

  return null;
}
