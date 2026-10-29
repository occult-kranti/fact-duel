'use client';
import { ArrowRight, ArrowUpRight, Users, Flame, Trophy, Zap, BookOpen, Sparkles } from 'lucide-react';
import type { HomeScreenProps } from './types';
import { useLocale } from '../use-locale';
import { DisplayPlacement } from '../ads/display-placement';
import { StadiumScene } from './stadium-scene';
import { StadiumPresence } from './stadium-presence';

export function HomeScreen({ name, ready, busy, onRoute, onDuel, onLive, onSetup, go }: HomeScreenProps) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  return (
    <section className="ps-home" aria-labelledby="ps-title">
      <div className="ps-welcome"><span>{hi ? 'आपकी पिच। आपका खेल।' : 'YOUR GROUND. YOUR GAME.'}</span><button data-stadium-open="locker" onClick={() => go('passport')}><Trophy size={15} aria-hidden="true" />{hi ? 'मेरा क्लब' : 'My club'}<ArrowUpRight size={15} aria-hidden="true" /></button></div>
      <div className="ps-hero">
        <div className="ps-world">
          <div className="ps-world-heading"><p className="ps-eyebrow">{hi ? 'मैच के लिए तैयार?' : 'THE POCKET STADIUM'}</p><h1 id="ps-title">{hi ? <>पूरा क्रिकेट।<br /><em>पूरा जुनून।</em></> : <>Big cricket.<br /><em>Pocket rivalry.</em></>}</h1></div>
          <StadiumScene compact interactive={false} />
          <span className="ps-ground-label"><i aria-hidden="true" />{hi ? 'गली ग्राउंड · आपका घरेलू मैदान' : 'GULLY GROUND / HOME TURF'}</span>
        </div>
        <div className="ps-matchdesk">
          <div className="ps-match-meta"><span>{hi ? 'आज की पारी' : 'YOUR NEXT INNINGS'}</span><span>05 <small>{hi ? 'सवाल' : 'QUESTIONS'}</small></span></div>
          <h2>{hi ? 'क्रिकेट दिमाग से खेलो।' : 'Bring your cricket brain.'}</h2>
          <p className="ps-intro">{hi ? 'बड़े पल। गहरी प्रतिद्वंद्विता। ऐसी कहानियाँ जो स्कोरकार्ड नहीं बताता।' : 'Big moments. Deep rivalries. Stories the scorecard doesn’t tell.'}</p>
          <button type="button" data-stadium-start="cricket" className="ps-start gc-play" disabled={!ready || busy} onClick={() => onDuel('gauntlet', 'Cricket')}><span>{busy ? (hi ? 'पिच पर आ रहे हैं…' : 'Taking the field…') : ready ? (hi ? 'पारी खेलें' : 'Play an innings') : (hi ? 'पिच तैयार हो रही है…' : 'Preparing the pitch…')}</span><ArrowRight size={23} aria-hidden="true" /></button>
          <p className="ps-start-note">{hi ? 'अभ्यास बॉट · 30 सेकंड / सवाल · कोई साइनअप नहीं' : 'Practice bot · 30s / question · No signup'}</p>
          <div className="ps-rival-row"><button onClick={onLive} disabled={busy}><Users size={18} aria-hidden="true" /><span>{hi ? 'आमने-सामने' : 'Head to head'}</span><ArrowUpRight size={18} aria-hidden="true" /></button><button onClick={() => onSetup('friend')}>{hi ? 'दोस्त बुलाएँ' : 'Invite a friend'}</button></div>
          <StadiumPresence />
        </div>
      </div>
      <div className="ps-lower-grid">
        <section className="ps-spicy" aria-labelledby="ps-spicy-title"><div className="ps-spicy-top"><span className="ps-label"><Flame size={15} aria-hidden="true" />{hi ? 'मैदान के बाहर' : 'BEYOND THE BOUNDARY'}</span><span className="ps-heat" aria-label="Spicy">● ● ●</span></div><div className="ps-spicy-copy"><div><h2 id="ps-spicy-title">{hi ? 'स्पाइसी।' : 'Spicy.'}<span>{hi ? 'स्कोर से आगे।' : 'Off the pitch.'}</span></h2><p>{hi ? 'विवाद, बैन और सार्वजनिक रिश्ते। हर जवाब के साथ स्रोत।' : 'Scandals, bans & public ties. The drama, with receipts.'}</p></div><svg className="ps-chilli" viewBox="0 0 90 110" aria-hidden="true"><path d="M55 24Q55 6 72 8" fill="none" stroke="#539063" strokeWidth="8" strokeLinecap="round"/><path d="M39 26Q64 16 70 38C82 71 42 98 12 99Q41 78 36 55Q29 38 39 26Z" fill="#e6623e" stroke="#a8392a" strokeWidth="2"/><path d="M39 27Q53 20 66 29L62 39 53 34 42 40Z" fill="#4d8053"/><path d="M52 46Q61 64 41 81" fill="none" stroke="#ffb481" strokeWidth="5" strokeLinecap="round"/></svg></div><button data-stadium-start="spicy" disabled={!ready || busy} onClick={() => onDuel('gauntlet', 'Cricket', 'Spicy')}>{hi ? 'स्पाइसी पारी खेलें' : 'Play Spicy'}<ArrowRight size={18} aria-hidden="true" /></button><small>{hi ? 'दस्तावेज़ों पर आधारित घटनाएँ। अफ़वाहें नहीं।' : 'Sourced events. Findings and allegations kept distinct.'}</small></section>
        <section className="ps-club-tease" aria-labelledby="ps-club-title"><span className="ps-label"><Sparkles size={15} aria-hidden="true" />{hi ? 'अपनी पहचान बनाएँ' : 'MAKE IT YOURS'}</span><div className="ps-ticket-art" aria-hidden="true"><span>JHK / MEMBER</span><b>{name?.trim() || 'Cricket fan'}</b><span>HOME GROUND ADVANTAGE</span><i>★</i></div><h2 id="ps-club-title">{hi ? 'मैदान भी आपका। पहचान भी।' : 'Build a ground. Make a name.'}</h2><p>{hi ? 'खेलकर क्लब अंक कमाएँ। टाइटल, कार्ड और स्टेडियम सजावट चुनें।' : 'Earn free Club points. Equip titles, card finishes and stadium upgrades.'}</p><button onClick={() => go('passport')}>{hi ? 'क्लब खोलें' : 'Open my club'}<ArrowUpRight size={18} aria-hidden="true" /></button></section>
      </div>
      <div className="ps-extras"><button data-stadium-start="quick" disabled={!ready || busy} onClick={() => onDuel('quick', 'Cricket')}><Zap size={20} aria-hidden="true" /><span><b>{hi ? 'एक शॉट' : 'Quick single'}</b><small>{hi ? 'एक सवाल। पूरी चुनौती।' : 'One question. One shot.'}</small></span><ArrowUpRight size={18} aria-hidden="true" /></button><button onClick={() => go('showroom')}><Trophy size={20} aria-hidden="true" /><span><b>{hi ? 'नेट प्रैक्टिस' : 'Net practice'}</b><small>{hi ? 'स्वीट स्पॉट खोजें।' : 'Tap, time it, send it.'}</small></span><ArrowUpRight size={18} aria-hidden="true" /></button><button onClick={() => onRoute(null)}><BookOpen size={20} aria-hidden="true" /><span><b>{hi ? 'थोड़ा और जानें' : 'Go down the rabbit hole'}</b><small>{hi ? 'बिना घड़ी के कहानियाँ और स्रोत।' : 'Stories & sources. No clock.'}</small></span><ArrowUpRight size={18} aria-hidden="true" /></button></div>
      <DisplayPlacement placement="home-footer" />
    </section>
  );
}
