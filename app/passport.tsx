'use client';
/**
 * Side quests & finishes — the three finite legacy missions from `passportSummary` and the four
 * card finishes they unlock. This is the calm, deadline-free half of the Player screen: it sits
 * under the XP / rank / badge systems and never competes with them.
 *
 * `Passport` is the section rendered by app/screens/player-screen.tsx; `MissionStrip` is the
 * one-line "next side quest" teaser other screens can embed; `FINISHES` names the four card
 * finishes (ids match `passportSummary().skins`).
 */
import { ArrowRight, Check, Compass, BookOpen, Lock, Sparkles, Flag } from 'lucide-react';
import { usePress } from './screens/player/shared';

export const FINISHES = [
  { id: 'classic', name: 'Original', copy: 'Yours from the start.' },
  { id: 'orbit', name: 'Orbit', copy: 'Complete First field notes.' },
  { id: 'grid', name: 'Field grid', copy: 'Complete Field notes.' },
  { id: 'rally', name: 'Rally', copy: 'Complete The mode tour.' },
];

export function MissionStrip({ summary, onOpen }: { summary: any; onOpen: () => void }) {
  const press = usePress();
  const mission = summary.missions.find((m: any) => !m.complete) || summary.missions[0],
    done = mission.steps.filter((s: any) => s.done).length;
  return (
    <button className="mission-strip fd-btn" onPointerDown={press} onClick={onOpen}>
      <span className="mini-stamp">
        <Compass />
      </span>
      <span>
        <small>YOUR NEXT SIDE QUEST</small>
        <strong>{mission.complete ? 'Passport complete. Keep exploring.' : mission.name}</strong>
      </span>
      <span className="mission-mini-progress">
        {done}/{mission.steps.length}
        <ArrowRight size={16} />
      </span>
    </button>
  );
}

export function Passport({
  player,
  onAction,
}: {
  player: any;
  catalogue?: any;
  onAction: (s: string) => void;
}) {
  const { passport: p, summary: s } = player;
  const press = usePress();
  return (
    <>
      <div className="fd-sec">
        <div className="fd-sec-head">
          <div>
            <p className="fd-eyebrow">NO DEADLINES. JUST A LITTLE DIRECTION.</p>
            <h2>Side quests &amp; finishes</h2>
          </div>
          <span className="fd-sec-aside">
            <span>
              {s.complete} / {s.missions.length} complete
            </span>
            <button
              type="button"
              className="fd-cos-action fd-btn"
              data-kind="ghost"
              onPointerDown={press}
              onClick={player.exportAll}
            >
              <BookOpen aria-hidden="true" />
              Export activity
            </button>
          </span>
        </div>
        <p className="fd-player-note">
          Finite missions with no timer to maintain. They unlock card finishes and nothing else — never
          answers, extra time or an advantage in a duel.
        </p>
        <div className="fd-quests">
          {s.missions.map((m: any, i: number) => (
            <article className="fd-card fd-quest" data-complete={m.complete} key={m.id}>
              <div className="fd-quest-top">
                <span>0{i + 1}</span>
                <span className="fd-pill">
                  {m.complete ? (
                    <>
                      <Check size={13} aria-hidden="true" />
                      Complete
                    </>
                  ) : (
                    'At your pace'
                  )}
                </span>
              </div>
              <h3>{m.name}</h3>
              <p>{m.description}</p>
              <ul>
                {m.steps.map((step: any, j: number) => (
                  <li key={j}>
                    <span className="fd-check" data-done={!!step.done} aria-hidden="true">
                      {step.done ? <Check size={12} /> : j + 1}
                    </span>
                    <span>{step.label}</span>
                  </li>
                ))}
              </ul>
              <span className="fd-quest-reward">
                <Sparkles aria-hidden="true" />
                {m.reward}
              </span>
              <button
                type="button"
                className="fd-cos-action fd-btn"
                data-kind={m.complete ? 'equipped' : 'equip'}
                disabled={m.complete}
                onPointerDown={m.complete ? undefined : press}
                onClick={() => onAction(m.steps.find((step: any) => !step.done)?.action || 'play')}
              >
                {m.complete ? (
                  <>
                    <Check aria-hidden="true" /> Finish unlocked
                  </>
                ) : (
                  <>
                    Continue mission <ArrowRight aria-hidden="true" />
                  </>
                )}
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="fd-sec">
        <div className="fd-sec-head">
          <div>
            <p className="fd-eyebrow">MAKE THE CARD YOURS</p>
            <h2>Card finishes</h2>
          </div>
          <span>Cosmetics only</span>
        </div>
        <div className="fd-finishes">
          {FINISHES.map((f) => {
            const unlocked = s.skins.includes(f.id),
              equipped = p.skin === f.id;
            return (
              <button
                type="button"
                className="fd-finish fd-btn"
                data-finish={f.id}
                key={f.id}
                aria-pressed={equipped}
                disabled={!unlocked || !player.loaded}
                onPointerDown={!unlocked || !player.loaded ? undefined : press}
                onClick={() => player.skin(f.id)}
              >
                <span className="fd-finish-art">
                  <span>
                    FACT
                    <br />
                    //DUEL
                  </span>
                  {!unlocked ? (
                    <Lock aria-hidden="true" />
                  ) : equipped ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <Sparkles aria-hidden="true" />
                  )}
                </span>
                <strong>{f.name}</strong>
                <small>{equipped ? 'Equipped' : unlocked ? 'Tap to equip' : f.copy}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="fd-player-footnote">
        <Flag aria-hidden="true" />
        <p>
          All game modes and collections are available from the start. Missions never unlock answers, extra
          time or coins. You can pause here and return whenever you want. Everything on this page is stored in
          this browser, so export your activity before you clear it.
        </p>
      </div>
    </>
  );
}
