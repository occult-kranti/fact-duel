/**
 * shell/progression-watch.tsx — turns progression changes into the edition's feedback, once
 * (design bible §9, §12). Mounted once by the shell; screens do not re-implement it.
 *
 *  - a new BAND (label promotion)      → the 'label' ceremony (merged with a 'file' one if both fire)
 *  - a level inside the band           → in place (Activity entry)
 *  - quests completed                  → the visit's one toast (merged into it if one is already up)
 *  - a CL (casual leave) auto-used     → the visit's toast: "Missed a day. 1 CL used. Streak safe."
 *  - achievements (Stamp Register), Babu-rank moves, streak days → in place (Activity entries)
 *
 * The 'file' ceremony (first clear of a state / sector / Kiska Media / Forward Court file) is raised by
 * the route finish screen, which knows the file's name and score.
 * The first progression seen after load is the baseline — nothing fires for history.
 */
import { useEffect, useRef } from 'react';
import { achievementById, levelForXp, progressionDiff } from '@/lib/progression.mjs';
import { budget } from '../budget';
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
      else budget.note(`Now labelled ${l.en}`, l.line);
    } else if (to.level > from.level) {
      budget.note(`Level ${to.level}`, goalCopy(after.xp));
    }

    const quests = diff.questsCompleted
      .map((id) => after.quests.items.find((q) => q.id === id)?.label)
      .filter((x): x is string => !!x);
    if (quests.length && visible) {
      budget.toast({
        tone: 'quest',
        title: quests.length === 1 ? 'Quest done' : `${quests.length} quests done`,
        body: quests.slice(0, 2).join(' · '),
      });
    }

    const clUsed = after.streak.shields < before.streak.shields && after.streak.current >= before.streak.current;
    if (clUsed && visible) {
      const used = before.streak.shields - after.streak.shields;
      budget.toast({ tone: 'streak', title: `Missed a day. ${used} CL used. Streak safe.` });
    } else if (after.streak.current !== before.streak.current) {
      budget.note(`Streak: ${after.streak.current} ${after.streak.current === 1 ? 'day' : 'days'}`);
    }

    for (const id of diff.newAchievements) {
      const a = achievementById(id) as { title?: string; name?: string } | undefined;
      budget.note(`Stamp Register: ${a?.title ?? a?.name ?? id}`);
    }
    if (diff.rankUp) budget.note(`Promoted to ${babuRank(diff.rankUp.to)}`, 'Babu rank, on this device');
  }, [player.loaded, player.progression]);

  return null;
}
