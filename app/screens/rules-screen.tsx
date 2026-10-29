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
  if (jhkOnline.configured) return <OnlineBetaRules view={view} go={go} />;
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

/** These pages describe the JHK server contract, separate from legacy local economy rules. */
function OnlineBetaRules({ view, go }: RulesScreenProps) {
  const { locale } = useLocale();
  const text = (en: string, hi: string) => locale === 'hi' ? hi : en;
  const shared: Record<string, [string, string]> = {
    opponents: [text('Human duels and bot practice', 'इंसानी मुक़ाबले और बॉट अभ्यास'), text('Public searches look for a human first. After five seconds without a match, a separate zero-stake practice bot can start on this device. Practice never changes human standings or server coins. Private friend rooms stay human-only; a bot never replaces a player inside a human match.', 'सार्वजनिक खोज पहले इंसानी खिलाड़ी ढूँढ़ती है। पाँच सेकंड में मुक़ाबला न मिले तो इस डिवाइस पर बिना सिक्के का अलग बॉट अभ्यास शुरू हो सकता है। अभ्यास से इंसानी रैंकिंग या सर्वर के सिक्के नहीं बदलते। दोस्तों के निजी रूम केवल इंसानों के हैं; चलते इंसानी मुक़ाबले में बॉट किसी की जगह नहीं लेता।')],
    format: [text('Five questions. One locked answer.', 'पाँच सवाल। एक पक्का जवाब।'), text('Human duels have five rounds with four choices and 30 seconds per question, after a 2.5-second countdown. Both players receive the same question. Your first accepted answer is locked. Most correct answers wins; total server-recorded answer time breaks a tied score.', 'इंसानी मुक़ाबले में पाँच राउंड, चार विकल्प और 2.5 सेकंड की उलटी गिनती के बाद हर सवाल के लिए 30 सेकंड हैं। दोनों को समान सवाल मिलता है। पहला स्वीकार हुआ जवाब पक्का होता है। सबसे अधिक सही जवाब जीतते हैं; बराबरी पर कुल सर्वर समय तय करता है।')],
    timing: [text('The server decides the result', 'नतीजा सर्वर तय करता है'), text('The server owns questions, accepted answers, scores, timing and coin settlement. A tied score with a total time difference of at most 120 milliseconds is a draw. Incorrect or missing answers count as 30 seconds. Network delay can affect the recorded time; the display countdown is an estimate.', 'सवाल, स्वीकार किए जवाब, स्कोर, समय और सिक्कों का हिसाब सर्वर तय करता है। बराबर स्कोर और कुल समय में 120 मिलीसेकंड तक का अंतर हो तो ड्रॉ है। गलत या बिना जवाब वाले सवाल के लिए 30 सेकंड गिने जाते हैं। नेटवर्क देर समय को प्रभावित कर सकती है; स्क्रीन की घड़ी अनुमान है।')],
    coins: [text('Free simulated coins', 'मुफ़्त खेल के सिक्के'), text('A new server guest starts with 100 coins. Coins cannot be bought, cashed out or redeemed for money. A stake is optional and starts at zero. A zero balance never blocks a zero-stake human duel. Bot practice uses no server coins.', 'नए सर्वर अतिथि को 100 सिक्के मिलते हैं। इन्हें खरीदा, निकाला या पैसे में बदला नहीं जा सकता। सिक्के लगाना वैकल्पिक है और शुरुआत शून्य से होती है। शून्य बैलेंस बिना सिक्के के इंसानी मुक़ाबले को नहीं रोकता। बॉट अभ्यास में सर्वर के सिक्के नहीं लगते।')],
    stakes: [text('Confirm before coins are reserved', 'सिक्के सुरक्षित होने से पहले मंज़ूरी'), text('Both human players confirm the same disclosed stake before it is reserved once for the match. The winner receives the combined reserved stake. A draw, a prestart cancellation or a system cancellation refunds the appropriate reserved coins. Match results and wallet balances come from the server.', 'मुक़ाबले के लिए सिक्के एक बार सुरक्षित होने से पहले दोनों इंसानी खिलाड़ी समान बताई गई रकम मंज़ूर करते हैं। विजेता को दोनों की सुरक्षित रकम मिलती है। ड्रॉ, शुरू होने से पहले रद्द होने या सिस्टम के रद्द करने पर उचित सुरक्षित सिक्के वापस आते हैं। नतीजे और बैलेंस सर्वर से आते हैं।')],
    reward: [text('Completion reward', 'पूरा खेलने का इनाम'), text('An eligible player earns a separate 10-coin reward once per topic per UTC day after a completed human duel. Both players must answer at least three questions, and that player must answer at least one correctly. This reward is separate from the stake pot. Cancelled or forfeited matches earn no completion reward or ranked result.', 'पूरा इंसानी मुक़ाबला खेलने पर योग्य खिलाड़ी को प्रति विषय प्रति UTC दिन एक बार अलग 10 सिक्के मिलते हैं। दोनों को कम से कम तीन सवालों के जवाब देने होंगे और उस खिलाड़ी का कम से कम एक जवाब सही होना चाहिए। यह लगाई गई रकम से अलग इनाम है। रद्द या छोड़े मुक़ाबले का पूरा करने का इनाम या रैंक नहीं मिलता।')],
    leaving: [text('Leaving and disconnects', 'छोड़ना और कनेक्शन टूटना'), text('After both players are ready, leaving or deleting your guest forfeits any reserved stake to your rival. Being absent for over 90 seconds while your rival remains also forfeits it. If both players are absent or the room expires, the server refunds the appropriate reserves. Read the leave confirmation before ending an active duel.', 'दोनों तैयार होने के बाद छोड़ने या अतिथि पहचान मिटाने पर सुरक्षित सिक्के प्रतिद्वंद्वी को जाते हैं। सामने वाला मौजूद हो और आप 90 सेकंड से अधिक गायब हों तो भी यही होता है। दोनों गायब हों या रूम की अवधि खत्म हो तो सर्वर उचित सुरक्षित सिक्के लौटाता है। चलते मुक़ाबले को छोड़ने से पहले पुष्टि पढ़ें।')],
    identity: [text('Your guest identity', 'आपकी अतिथि पहचान'), text('Human play requires the explicit 18+ beta-terms confirmation. Email is optional and unverified; email alone cannot restore an account. The browser bearer session lasts 30 days. Save your separate recovery code before clearing browser data. Optional player-card controls support profile editing, private export and deactivation.', 'इंसानी खेल के लिए 18+ होने और बीटा शर्तों की स्पष्ट मंज़ूरी ज़रूरी है। ईमेल वैकल्पिक और अप्रमाणित है; केवल ईमेल से खाता वापस नहीं खुलता। ब्राउज़र सत्र 30 दिन चलता है। ब्राउज़र डेटा हटाने से पहले अपना अलग रिकवरी कोड सहेजें। वैकल्पिक खिलाड़ी कार्ड में प्रोफ़ाइल बदलना, निजी निर्यात और निष्क्रिय करना उपलब्ध हैं।')],
    records: [text('Two kinds of progress', 'दो तरह की प्रगति'), text('Online XP, server coins and human standings belong to the server guest. Practice XP, missions, medals, stamps and saved facts remain on this device. Practice scores never enter human standings. A guest identity is not proof of a unique person; this is a casual beta, not verified competitive identity.', 'ऑनलाइन XP, सर्वर के सिक्के और इंसानी रैंकिंग सर्वर अतिथि से जुड़े हैं। अभ्यास XP, काम, मेडल, स्टैम्प और सहेजे तथ्य इस डिवाइस पर रहते हैं। अभ्यास स्कोर इंसानी रैंकिंग में नहीं जाता। अतिथि पहचान अलग व्यक्ति का प्रमाण नहीं है; यह साधारण बीटा है, सत्यापित प्रतियोगी पहचान नहीं।')],
    answers: [text('Check the answer sources', 'जवाब के स्रोत जाँचें'), text('Question explanations and source links are available with accepted answer receipts. Human answers and results come from server snapshots. Saved practice facts and question reports are available in Answers. Sources explain the editorial basis of a question; they do not guarantee that every question is free of errors.', 'स्वीकार हुए जवाब की रसीद में सवाल की व्याख्या और स्रोत लिंक मिलते हैं। इंसानी जवाब और नतीजे सर्वर से आते हैं। सहेजे अभ्यास तथ्य और सवाल की रिपोर्ट जवाब वाले भाग में मिलते हैं। स्रोत सवाल का आधार बताते हैं; वे हर सवाल के त्रुटिरहित होने की गारंटी नहीं हैं।')],
    ads: [text('Space to play', 'बिना रुकावट खेलें'), text('Advertising is disabled until approved delivery and consent are configured. An optional opportunity may be offered after a completed human match. An unavailable or failed ad must not block the result or your next game. Advertising does not belong beside answer choices or a running match clock.', 'स्वीकृत विज्ञापन सेवा और सहमति की व्यवस्था होने तक विज्ञापन बंद हैं। पूरा इंसानी मुक़ाबला होने के बाद वैकल्पिक अवसर दिख सकता है। विज्ञापन न मिले या विफल हो तो नतीजा या अगला खेल नहीं रुकना चाहिए। जवाब के विकल्पों या चलती घड़ी के पास विज्ञापन नहीं होने चाहिए।')],
  };
  const pages = {
    rules: { title: text('Human duel rules', 'इंसानी मुक़ाबले के नियम'), lede: text('Know the format, the score and what happens next.', 'मोड, स्कोर और आगे का तरीका जानें।'), keys: ['opponents', 'format', 'timing', 'leaving', 'records'] },
    coin: { title: text('Rules of the coin', 'सिक्कों के नियम'), lede: text('Free game coins. Optional stakes. No cash value.', 'मुफ़्त खेल के सिक्के। वैकल्पिक दाँव। कोई नकद कीमत नहीं।'), keys: ['coins', 'stakes', 'reward', 'leaving'] },
    trust: { title: text('Fair play & your data', 'निष्पक्ष खेल और आपका डेटा'), lede: text('What runs on the server, what stays here and what you can check.', 'सर्वर पर क्या चलता है, यहाँ क्या रहता है और आप क्या जाँच सकते हैं।'), keys: ['opponents', 'identity', 'records', 'answers', 'ads'] },
    timing: { title: text('How human duel timing works', 'इंसानी मुक़ाबले में समय कैसे गिना जाता है'), lede: text('A visible countdown helps you play; the server records the result.', 'दिखती उलटी गिनती खेलने में मदद करती है; नतीजा सर्वर दर्ज करता है।'), keys: ['format', 'timing', 'leaving'] },
  };
  const page = pages[view];
  return (
    <section className="fd-rules" aria-labelledby="jhk-beta-rules-title">
      {view !== 'rules' && <Button variant="ghost" onClick={() => go('rules')}><ArrowLeft />{text('Back to human duel rules', 'इंसानी मुक़ाबले के नियम पर लौटें')}</Button>}
      <div className="fd-rules__head">
        <p className="eyebrow">{text('JHK · ONLINE BETA', 'JHK · ऑनलाइन बीटा')}</p>
        <h1 id="jhk-beta-rules-title">{page.title}</h1>
        <p className="fd-rules__lede">{page.lede}</p>
      </div>
      <div className="fd-rules__grid">{page.keys.map(key => {
        const [title, body] = shared[key];
        return <article className="fd-rules__section" key={key}><h2>{title}</h2><p>{body}</p></article>;
      })}</div>
      <div className="fd-rules__links">
        {view !== 'coin' && <Button variant="outline" onClick={() => go('coin')}><Coins />{text('Coin rules', 'सिक्कों के नियम')}<ArrowRight /></Button>}
        {view !== 'trust' && <Button variant="outline" onClick={() => go('trust')}><BadgeCheck />{text('Fair play & data', 'निष्पक्ष खेल और डेटा')}<ArrowRight /></Button>}
        {view !== 'timing' && <Button variant="outline" onClick={() => go('timing')}><Timer />{text('Timing', 'समय')}<ArrowRight /></Button>}
        <Button onClick={() => go('online')}>{text('Find a human rival', 'असली प्रतिद्वंद्वी ढूँढ़ें')}<ArrowRight /></Button>
      </div>
    </section>
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
