'use client';
import { ArrowRight, Users, BookOpen, FlaskConical } from 'lucide-react';
import { CricketArt, CricketMark } from '../cricket-art';
import type { HomeScreenProps } from './types';
import { useLocale } from '../use-locale';

/** The homepage is a launch surface. Records and learning tools stay one tap away. */
export function HomeScreen({ ready, busy, onRoute, onDuel, onLive, onSetup, go }: HomeScreenProps) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  return (
    <section className="cr-home" aria-labelledby="cr-home-title">
      <div className="cr-hero">
        <div className="cr-hero-copy">
          <p className="cr-eyebrow"><span aria-hidden="true">●</span> {hi ? 'जान्ता है क्या / क्रिकेट क्लब' : 'JAANTA HAI KYA / THE CRICKET CLUB'}</p>
          <h1 id="cr-home-title" className="cr-hero-title">{hi ? <>क्रिकेट दिमाग में?<br /><em>पिच पर आओ।</em></> : <>Know the game?<br /><em>Play your shot.</em></>}</h1>
          <p className="cr-hero-lead">{hi ? 'चार विकल्प। पाँच सवाल। क्रिकेट की जानकारी का एक छोटा मुकाबला।' : 'Four choices. Five questions. A little cricket knowledge goes a long way.'}</p>
          <div className="cr-actions">
            <button className="cr-primary" disabled={busy} onClick={onLive}>{hi ? 'क्रिकेट खेलें' : 'Play cricket'} <ArrowRight size={20} aria-hidden="true" /></button>
            <button className="cr-secondary" disabled={!ready || busy} onClick={() => onDuel('gauntlet', 'Cricket')}>{hi ? 'बॉट के साथ अभ्यास' : 'Just practice'}</button>
          </div>
          <p className="cr-inline-note">{hi ? 'ईमेल ज़रूरी नहीं · 5 सेकंड में खिलाड़ी न मिले तो अभ्यास बॉट' : 'No email needed · No rival in 5 seconds? Play a practice bot.'}</p>
          <div className="cr-match-facts" aria-label={hi ? 'मुकाबले की जानकारी' : 'Match details'}>
            <span><b>05</b> {hi ? 'सवाल' : 'questions'}</span><span><b>04</b> {hi ? 'विकल्प' : 'choices'}</span><span><b>₹0</b> {hi ? 'असली पैसे नहीं' : 'real money'}</span>
          </div>
        </div>
        <CricketArt />
      </div>
      <div className="cr-section-heading"><h2>{hi ? 'अपना खेल चुनें' : 'Your next innings'}</h2><span>{hi ? 'सीधे खेलें। आसानी से।' : 'A quick game. A good break.'}</span></div>
      <div className="cr-mode-grid">
        <button className="cr-mode" onClick={() => onSetup('friend')}><span className="cr-mode-number">01 / VERSUS</span><Users className="cr-mode-icon" aria-hidden="true" /><strong>{hi ? 'दोस्त को चुनौती' : 'Challenge a friend'}</strong><p>{hi ? 'लिंक भेजें और आमने-सामने खेलें।' : 'Send a link. Settle it on the scoreboard.'}</p><ArrowRight size={18} aria-hidden="true" /></button>
        <button className="cr-mode" disabled={!ready || busy} onClick={() => onDuel('quick', 'Cricket')}><span className="cr-mode-number">02 / QUICK SINGLE</span><CricketMark kind="ball" className="cr-mode-icon" /><strong>{hi ? 'एक सवाल का शॉट' : 'One-question warm-up'}</strong><p>{hi ? 'एक सवाल। अभ्यास बॉट। तुरंत नतीजा।' : 'One question against a bot. Straight to the result.'}</p><ArrowRight size={18} aria-hidden="true" /></button>
        <button className="cr-mode" onClick={() => onRoute(null)}><span className="cr-mode-number">03 / OFF THE PITCH</span><BookOpen className="cr-mode-icon" aria-hidden="true" /><strong>{hi ? 'सीखें और खोजें' : 'Explore & learn'}</strong><p>{hi ? 'बिना घड़ी के खेल और विज्ञान के सवाल।' : 'Untimed sports and science. Follow your curiosity.'}</p><ArrowRight size={18} aria-hidden="true" /></button>
      </div>
      <div className="cr-home-links"><button onClick={() => onSetup('settings')}><FlaskConical size={16} aria-hidden="true" />{hi ? 'सभी विषय और गेम मोड' : 'All topics & game modes'} <ArrowRight size={16} aria-hidden="true" /></button><button onClick={() => go('journal')}>{hi ? 'जवाब और स्रोत देखें' : 'Your answers & sources'} <ArrowRight size={16} aria-hidden="true" /></button></div>
    </section>
  );
}
