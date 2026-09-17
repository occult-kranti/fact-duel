'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, ArrowRight, BadgeCheck, Coins, ShieldCheck, Timer } from 'lucide-react';
import type { RulesScreenProps } from './types';
import { CoinRules } from './rules/coin-rules';
import { Trust } from './rules/trust';
import { useLocale } from '../use-locale';

/* Rules tab: the Playbook, plus the Timing Lab, Rules of the coin and Trust sub-views. */
export function RulesScreen({ view, go }: RulesScreenProps) {
  const { t } = useLocale();
  if (view === 'coin' || view === 'trust')
    return (
      <>
        <Button variant="ghost" onClick={() => go('rules')}>
          <ArrowLeft />
          {t('rules.back')}
        </Button>
        {view === 'coin' ? <CoinRules /> : <Trust />}
      </>
    );
  if (view === 'timing')
    return (
      <>
        <Button variant="ghost" onClick={() => go('rules')}>
          <ArrowLeft />
          {t('rules.back')}
        </Button>
        <TimingLab />
      </>
    );
  return (
    <>
      <Playbook />
      <div className="fd-rules__links">
        <Button variant="outline" onClick={() => go('coin')}>
          <Coins />
          {t('rules.coin')}
          <ArrowRight />
        </Button>
        <Button variant="outline" onClick={() => go('trust')}>
          <BadgeCheck />
          {t('rules.trust')}
          <ArrowRight />
        </Button>
        <Button variant="outline" onClick={() => go('timing')}>
          <Timer />
          {t('rules.timing')}
          <ArrowRight />
        </Button>
      </div>
    </>
  );
}

export function TimingLab() {
  const { t } = useLocale();
  const [a, setA] = useState(2200),
    [b, setB] = useState(2300),
    [networkA, setNetworkA] = useState(500),
    [networkB, setNetworkB] = useState(40);
  const serverA = a + networkA,
    serverB = b + networkB;
  const winner = (x: number, y: number, band = 0) =>
    Math.abs(x - y) <= band ? t('timing.draw') : x < y ? t('timing.playerA') : t('timing.playerB');
  return (
    <section className="timing-lab">
      <p className="eyebrow">{t('timing.eyebrow')}</p>
      <h1>
        {t('timing.titleA')}
        <br />
        {t('timing.titleB')}
      </h1>
      <p>{t('timing.intro')}</p>
      <div className="lab-controls">
        {[
          [t('timing.aResponse'), a, setA, 5000],
          [t('timing.bResponse'), b, setB, 5000],
          [t('timing.aNetwork'), networkA, setNetworkA, 1500],
          [t('timing.bNetwork'), networkB, setNetworkB, 1500],
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
              <th>{t('timing.comparison')}</th>
              <th>{t('timing.playerA')}</th>
              <th>{t('timing.playerB')}</th>
              <th>{t('timing.result')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t('timing.envelope')}</td>
              <td>{serverA} ms</td>
              <td>{serverB} ms</td>
              <td>{winner(serverA, serverB)}</td>
            </tr>
            <tr>
              <td>{t('timing.screen')}</td>
              <td>{a} ms</td>
              <td>{b} ms</td>
              <td>{winner(a, b)}</td>
            </tr>
            <tr>
              <td>{t('timing.tieBand')}</td>
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
          <h2>{t('timing.tradeoff')}</h2>
          <p>{t('timing.tradeoffText')}</p>
        </div>
      </div>
    </section>
  );
}

export function Playbook() {
  const { t } = useLocale();
  return (
    <section className="playbook">
      <p className="eyebrow">{t('rules.eyebrow')}</p>
      <h1>{t('rules.title')}</h1>
      <div className="rule-grid">
        {[
          [t('rules.stepOne'), t('rules.stepOneText')],
          [t('rules.stepTwo'), t('rules.stepTwoText')],
          [t('rules.stepThree'), t('rules.stepThreeText')],
          [t('rules.stepFour'), t('rules.stepFourText')],
          [t('rules.stepFive'), t('rules.stepFiveText')],
          [t('rules.stepSix'), t('rules.stepSixText')],
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
          <h2>{t('rules.casual')}</h2>
          <p>{t('rules.casualOne')}</p>
          <p>{t('rules.casualTwo')}</p>
          <p>{t('rules.casualThree')}</p>
        </div>
      </div>
    </section>
  );
}
