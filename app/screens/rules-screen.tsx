'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, ArrowRight, ShieldCheck, Timer } from 'lucide-react';
import type { RulesScreenProps } from './types';

/* Rules tab: the Playbook, plus the Timing Lab sub-view. */
export function RulesScreen({ view, go }: RulesScreenProps) {
  if (view === 'timing')
    return (
      <>
        <Button variant="ghost" onClick={() => go('rules')}>
          <ArrowLeft />
          Back to playbook
        </Button>
        <TimingLab />
      </>
    );
  return (
    <>
      <Playbook />
      <Button variant="outline" onClick={() => go('timing')}>
        <Timer />
        Explore the timing lab
        <ArrowRight />
      </Button>
    </>
  );
}

export function TimingLab() {
  const [a, setA] = useState(2200),
    [b, setB] = useState(2300),
    [networkA, setNetworkA] = useState(500),
    [networkB, setNetworkB] = useState(40);
  const serverA = a + networkA,
    serverB = b + networkB;
  const winner = (x: number, y: number, band = 0) =>
    Math.abs(x - y) <= band ? 'Draw' : x < y ? 'Player A' : 'Player B';
  return (
    <section className="timing-lab">
      <p className="eyebrow">TIMING LAB · ILLUSTRATIVE MODEL</p>
      <h1>
        A faster packet isn't
        <br />
        always a faster answer.
      </h1>
      <p>
        Change response time and total transport delay. This model assumes honest client clocks and excludes
        display/input variation.
      </p>
      <div className="lab-controls">
        {[
          ['Player A response', a, setA, 5000],
          ['Player B response', b, setB, 5000],
          ['Player A network total', networkA, setNetworkA, 1500],
          ['Player B network total', networkB, setNetworkB, 1500],
        ].map(([label, value, fn, max]: any) => (
          <div className="slider-field" key={label}>
            <Label>
              {label}
              <strong>{value} ms</strong>
            </Label>
            <Slider
              aria-label={label}
              value={[value]}
              min={0}
              max={max}
              step={10}
              onValueChange={(v) => fn(v[0])}
            />
          </div>
        ))}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Comparison</th>
              <th>Player A</th>
              <th>Player B</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Server elapsed envelope</td>
              <td>{serverA} ms</td>
              <td>{serverB} ms</td>
              <td>{winner(serverA, serverB)}</td>
            </tr>
            <tr>
              <td>Reported screen time</td>
              <td>{a} ms</td>
              <td>{b} ms</td>
              <td>{winner(a, b)}</td>
            </tr>
            <tr>
              <td>Screen time + 150 ms tie band</td>
              <td>{a} ms</td>
              <td>{b} ms</td>
              <td>{winner(a, b, 150)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="protocol-note">
        <ShieldCheck />
        <div>
          <h2>The trade-off stays visible.</h2>
          <p>
            Measuring locally avoids charging a player for packet delivery time. A modified browser can still
            lie about that measurement. This prototype checks plausibility and refunds inconsistent timing; a
            ranked service needs stronger validation and an explicit uncertainty policy.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Playbook() {
  return (
    <section className="playbook">
      <p className="eyebrow">TWO SCREENS, CLEAR RULES</p>
      <h1>How an online duel works.</h1>
      <div className="rule-grid">
        {[
          [
            '1. Choose your rival',
            'Practice bot works in all three modes without a second screen. It picks each answer uniformly at random and waits a random 1 second to half a second before the time limit. Choices and times are fixed before play; it does not adapt to your answers. Or create a friend room and share its invite with a permitted tester.',
          ],
          [
            '2. Ready to begin',
            'Start practice begins a short countdown. Friends press ready to start. A practice bot is automatically ready for each round; friends ready on both screens. Both demo entries are reserved once per match.',
          ],
          [
            '3. One attempt each',
            'Your screen measures from its reveal marker to activation: tap/click release or a 1–4 keypress. Your first accepted answer locks. Both answers remain sealed until both players finish or time runs out.',
          ],
          [
            '4. Compare the durations',
            'A sole correct answer wins. If both are correct, the shorter reported screen duration wins unless the difference is at most 150 ms, which is a draw.',
          ],
          [
            '5. Check the envelope',
            'The server timestamps an answer when its database write succeeds and applies a capped transport allowance of 0.5–2 seconds. Implausible timings void and refund the match. These checks cannot prove client honesty.',
          ],
          [
            '6. Learn and replay',
            'The result includes the fact, explanation, source and both response times. Bot rows are labelled as scheduled simulations. Start another room only when you choose.',
          ],
        ].map(([title, text]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="protocol-note">
        <ShieldCheck />
        <div>
          <h2>Casual play, with boundaries.</h2>
          <p>
            Quick Draw has one round. Triple Threat has up to three: first to two wins, otherwise the higher
            score after three wins. The Gauntlet plays all five questions and the higher final score wins.
            Tied scores refund both entries. Leaving, reloading after reveal, or hiding an active match
            cancels and refunds it. Reading sources between rounds is fine.
          </p>
          <p>
            Coins are free, non-transferable and have no cash value. Each room begins with 1,000 per player.
            Rooms expire after two hours. There is no cash-out, purchase, public matchmaking or verified
            global rank.
          </p>
          <p>
            A web page cannot guarantee zero latency, physical display timing or an unmodified client. This is
            a private playtest. The Product Studio separates implemented features from plans and untested
            scale. Discovery offers three untimed teaching cards from the same sample, even before your first
            duel. Vault recall revisits encountered facts. Passport points describe browser-local activity and
            never change competitive rules.
          </p>
        </div>
      </div>
    </section>
  );
}
