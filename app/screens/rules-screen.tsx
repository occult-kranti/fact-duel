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
import { jhkOnline } from '@/lib/jhk-online/runtime';

/* Rules tab: the Playbook, plus the Timing Lab, Rules of the coin and Trust sub-views. */
export function RulesScreen({ view, go }: RulesScreenProps) {
  const { t } = useLocale();
  if (jhkOnline.configured) return <OnlineBetaRules go={go} />;
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

function OnlineBetaRules({ go }: Pick<RulesScreenProps, 'go'>) {
  const { locale } = useLocale();
  const text = (en: string, hi: string) => locale === 'hi' ? hi : en;
  const sections = [
    [text('Same question. Real rival.', 'एक सवाल। असली प्रतिद्वंद्वी।'), text('Public queue and private room codes connect human players. There is no bot replacement. Each duel has five rounds, 30 seconds each, with a 2.5 second countdown. Your first answer counts.', 'सार्वजनिक कतार और निजी रूम कोड इंसानी खिलाड़ियों को जोड़ते हैं। कोई बॉट नहीं आता। पाँच राउंड, हर राउंड 30 सेकंड, और 2.5 सेकंड की उलटी गिनती। पहला जवाब गिना जाता है।')],
    [text('Server timing and score', 'सर्वर का समय और स्कोर'), text('Most correct answers wins. Lower total server-recorded answer time breaks ties; a difference within 0.12 seconds is a draw. The server owns questions, accepted answers, scores and coin settlement. Network delay can affect timing.', 'सबसे अधिक सही जवाब जीतते हैं। बराबरी पर कुल कम सर्वर समय जीतता है; 0.12 सेकंड तक का अंतर बराबरी है। सवाल, स्वीकार हुए जवाब, स्कोर और सिक्के सर्वर तय करता है। नेटवर्क समय पर असर डाल सकता है।')],
    [text('Free simulated coins', 'मुफ़्त खेल के सिक्के'), text('A new server guest starts with 100 coins. Coins cannot be bought or cashed out. Stakes are optional and start at zero; zero balance still lets you duel. Both players confirm the same stake before it is reserved. The winner receives the combined stake; a draw refunds both players.', 'नए सर्वर अतिथि को 100 सिक्के मिलते हैं। इन्हें खरीदा या पैसे में बदला नहीं जा सकता। सिक्के लगाना वैकल्पिक है और शुरुआत शून्य से होती है; शून्य बैलेंस पर भी खेलें। सुरक्षित होने से पहले दोनों बराबर सिक्के मंज़ूर करते हैं। विजेता को दोनों की रकम मिलती है; बराबरी पर वापसी होती है।')],
    [text('Completion reward', 'पूरा खेलने का इनाम'), text('Earn 10 coins once per topic per UTC day after a completed human duel. Both players must answer at least three rounds, and you must answer at least one correctly. The reward is separate from any stake payout.', 'पूरा इंसानी मुक़ाबला खेलने पर प्रति विषय प्रति UTC दिन एक बार 10 सिक्के मिलते हैं। दोनों को कम से कम तीन राउंड के जवाब देने होंगे और आपका कम से कम एक जवाब सही होना चाहिए। यह लगाई गई रकम से अलग इनाम है।')],
    [text('Leaving and disconnects', 'छोड़ना और कनेक्शन टूटना'), text('After both players are ready, leaving or deleting your guest forfeits your stake to your rival. Being absent for over 90 seconds while your rival remains also forfeits it. Before the start, system cancellation, or both players absent: reserved stakes are refunded. Cancelled matches give no completion reward or ranked result.', 'दोनों तैयार होने के बाद छोड़ने या अतिथि पहचान मिटाने पर लगाए सिक्के प्रतिद्वंद्वी को जाते हैं। सामने वाला मौजूद हो और आप 90 सेकंड से अधिक गायब हों तो भी यही होता है। शुरू होने से पहले, सिस्टम रद्द होने या दोनों गायब होने पर सुरक्षित सिक्के वापस होते हैं। रद्द मुक़ाबले का इनाम या रैंक नहीं मिलता।')],
    [text('Your guest and your practice', 'आपकी अतिथि पहचान और अभ्यास'), text('Your public nickname, online XP and server coins belong to this browser’s guest identity, which lasts 30 days. Clearing browser data loses access. A guest identity is not proof of a unique person. Practice XP, missions, medals and stamps remain on this device; online duels do not advance device missions or import device scores into server rank.', 'सार्वजनिक नाम, ऑनलाइन XP और सर्वर सिक्के इस ब्राउज़र की 30 दिन वाली अतिथि पहचान से जुड़े हैं। ब्राउज़र डेटा हटाने पर पहुँच खो जाती है। अतिथि पहचान अलग व्यक्ति का प्रमाण नहीं है। अभ्यास XP, काम, मेडल और स्टैम्प डिवाइस पर रहते हैं; ऑनलाइन मुक़ाबले डिवाइस के काम नहीं बढ़ाते और डिवाइस का स्कोर सर्वर रैंक में नहीं जाता।')],
  ];
  return <section className="fd-rules" aria-labelledby="jhk-beta-rules-title"><div className="fd-rules__head"><p className="eyebrow">{text('JHK · ONLINE BETA', 'JHK · ऑनलाइन बीटा')}</p><h1 id="jhk-beta-rules-title">{text('Human duel rules', 'इंसानी मुक़ाबले के नियम')}</h1><p className="fd-rules__lede">{text('Sports and science. Optional coins. Learning at your own pace between duels.', 'खेल और विज्ञान। वैकल्पिक सिक्के। मुक़ाबलों के बीच अपनी रफ़्तार से सीखें।')}</p></div><div className="fd-rules__grid">{sections.map(([title, body]) => <article className="fd-rules__section" key={title}><h2>{title}</h2><p>{body}</p></article>)}</div><Button onClick={() => go('online')}>{text('Find a human rival', 'असली प्रतिद्वंद्वी ढूँढ़ें')}<ArrowRight /></Button></section>;
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
