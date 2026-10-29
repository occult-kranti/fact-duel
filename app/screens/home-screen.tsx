'use client';
import { ArrowRight, ArrowUpRight, Users, BookOpen, Zap, SlidersHorizontal, Play, Radio } from 'lucide-react';
import type { HomeScreenProps } from './types';
import { useLocale } from '../use-locale';
import { DisplayPlacement } from '../ads/display-placement';

/** The first question takes one tap. Human duels keep their separate beta consent. */
export function HomeScreen({ ready, busy, onRoute, onDuel, onLive, onSetup, go }: HomeScreenProps) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  return (
    <section className="gc-home" aria-labelledby="gc-home-title">
      <div className="gc-edition"><span>{hi ? 'जान्ता है क्या / क्रिकेट क्लब' : 'JAANTA HAI KYA / CRICKET KNOWLEDGE CLUB'}</span><span>{hi ? 'जिज्ञासु लोगों के लिए' : 'FOR THE LOVE OF THE GAME'}</span></div>
      <div className="gc-hero">
        <div className="gc-hero-copy">
          <p className="gc-kicker">{hi ? 'बातों से आगे। पिच पर आओ।' : 'BIG OPINIONS. SMALL GAMES.'}</p>
          <h1 id="gc-home-title">{hi ? <>जानते हो?<br /><em>दिखाओ।</em></> : <>All talk?<br /><em>Prove it.</em></>}</h1>
          <p className="gc-lead">{hi ? 'गली क्रिकेट से विश्व कप तक। पाँच सवाल, एक अभ्यास बॉट और आपकी अगली अच्छी खोज।' : 'From the gully to the World Cup. Five questions, a practice rival, and something worth knowing.'}</p>
          <div className="gc-actions">
            <button type="button" className="gc-play" disabled={!ready || busy} onClick={() => onDuel('gauntlet', 'Cricket')}><Play size={19} fill="currentColor" aria-hidden="true" /><span>{busy ? (hi ? 'पिच तैयार है…' : 'Taking the field…') : ready ? (hi ? 'क्रिकेट खेलें' : 'Play cricket') : (hi ? 'सवाल तैयार हो रहे हैं…' : 'Getting your questions…')}</span><ArrowRight size={22} aria-hidden="true" /></button>
            <button type="button" className="gc-human" disabled={busy} onClick={onLive}><Users size={19} aria-hidden="true" /><span>{hi ? 'इंसान से मुकाबला' : 'Human duel'}</span><ArrowUpRight size={20} aria-hidden="true" /></button>
          </div>
          <p className="gc-play-note">{hi ? 'अभ्यास बॉट · हर सवाल के लिए 30 सेकंड · साइनअप नहीं' : 'Practice bot · 30s per question · No signup'}</p>
        </div>
        <figure className="gc-art"><img src="/art/gully-cricket.webp" width="960" height="960" alt="" fetchPriority="high" decoding="async" /><figcaption>{hi ? 'गली से दुनिया तक।' : 'SAME GAME. ENDLESS CURIOSITY.'}</figcaption><span className="gc-art-stamp" aria-hidden="true">JHK<br /><b>05</b><br />CRICKET CLUB</span></figure>
      </div>
      <div className="gc-match-ticket" aria-label={hi ? 'खेलने का तरीका' : 'How a match works'}><span className="gc-ticket-number" aria-hidden="true">05</span><p><b>{hi ? 'एक छोटी पारी।' : 'A little innings.'}</b><span>{hi ? 'चार विकल्प। जवाब लॉक करें। जानें क्यों। फिर खेलें।' : 'Four choices. Lock your answer. Learn the why. Go again.'}</span></p><span className="gc-ticket-free">{hi ? 'मुफ़्त खेलें' : 'FREE TO PLAY'}<small>{hi ? 'असली पैसा नहीं' : 'No real money'}</small></span></div>
      <div className="gc-section-title"><h2>{hi ? 'आज किस मूड में हो?' : 'Find your kind of game.'}</h2><button onClick={() => onSetup('settings')}>{hi ? 'सभी मोड' : 'All modes'}<ArrowUpRight size={17} aria-hidden="true" /></button></div>
      <div className="gc-game-menu">
        <button disabled={!ready || busy} onClick={() => onDuel('quick', 'Cricket')}><span className="gc-menu-no">01</span><Zap size={24} aria-hidden="true" /><span><strong>{hi ? 'एक सवाल का शॉट' : 'The quick single'}</strong><small>{hi ? 'एक सवाल। तुरंत नतीजा।' : 'One question. A tiny test of instinct.'}</small></span><ArrowUpRight size={23} aria-hidden="true" /></button>
        <button onClick={() => onSetup('friend')}><span className="gc-menu-no">02</span><Users size={24} aria-hidden="true" /><span><strong>{hi ? 'दोस्त को चुनौती' : 'Settle it with a friend'}</strong><small>{hi ? 'निजी रूम। लिंक भेजें। साथ खेलें।' : 'A private room. A link. A proper rivalry.'}</small></span><ArrowUpRight size={23} aria-hidden="true" /></button>
        <button onClick={() => onRoute(null)}><span className="gc-menu-no">03</span><BookOpen size={24} aria-hidden="true" /><span><strong>{hi ? 'बिना घड़ी के खोजें' : 'Take the scenic route'}</strong><small>{hi ? 'खेल और विज्ञान। अपनी रफ़्तार से।' : 'Sports and science, at your own pace.'}</small></span><ArrowUpRight size={23} aria-hidden="true" /></button>
      </div>
      <div className="gc-club-notes"><div><Radio size={19} aria-hidden="true" /><p><b>{hi ? 'इंसान के साथ खेलना है?' : 'Want a human rival?'}</b><span>{hi ? 'पाँच सेकंड में कोई न मिले तो अलग, शून्य-सिक्का अभ्यास शुरू होता है।' : 'Public search opens separate, zero-stake practice if nobody joins in five seconds.'}</span></p></div><button onClick={() => go('journal')}>{hi ? 'आपके जवाब और स्रोत' : 'Your answers & sources'}<ArrowRight size={17} aria-hidden="true" /></button><button onClick={() => onSetup('settings')}><SlidersHorizontal size={16} aria-hidden="true" />{hi ? 'अपना खेल बनाएँ' : 'Build your own match'}</button></div>
      <DisplayPlacement placement="home-footer" />
    </section>
  );
}
