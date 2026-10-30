'use client';
import { ArrowRight, ArrowUpRight, Users, Flame, Trophy, BookOpen, Sparkles, SlidersHorizontal } from 'lucide-react';
import type { HomeScreenProps } from './types';
import { useLocale } from '../use-locale';
import { DisplayPlacement } from '../ads/display-placement';
import { TrophyRoadPreview } from './stadium-road';
import { eligibleStadiumSelection } from '@/lib/stadium-road.mjs';
import { localTitleProgress, OVER_REWARD_RULES } from '@/lib/over-rewards.mjs';
import './trophy-home.css';
import './over-entry.css';
import { StadiumPresence } from './stadium-presence';

export function HomeScreen({ player, selectedStadiumId, humanTrophies = 0, name, ready, busy, onRoute, onDuel, onLive, onSetup, go }: HomeScreenProps) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  const stadium = eligibleStadiumSelection(player.profile, selectedStadiumId, humanTrophies);
  const advanced = stadium.id !== 'gully';
  const titleProgress = localTitleProgress(player.profile);
  return (
    <section className="ps-home jo-home" aria-labelledby="ps-title">
      <div className="ps-welcome"><span>{hi ? 'आपकी पिच। आपका खेल।' : 'A little cricket. A lot to play for.'}</span><button data-stadium-open="locker" onClick={() => go('passport')}><Trophy size={15} aria-hidden="true" />{hi ? 'मेरा क्लब' : 'My club'}<ArrowUpRight size={15} aria-hidden="true" /></button></div>
      <div className="ps-hero">
        <div className="ps-world tr-home-world" data-stadium={stadium.id}>
          <div className="ps-world-heading"><p className="ps-eyebrow">{hi ? 'मैच के लिए तैयार?' : 'Your pocket pavilion'}</p><h1 id="ps-title">{hi ? <>पूरा क्रिकेट।<br /><em>पूरा जुनून।</em></> : <>Big cricket.<br /><em>Your kind of game.</em></>}</h1></div>
          <img className="tr-home-art" src={stadium.art} width="960" height="640" alt="" decoding="async" fetchPriority="high" />
          <span className="ps-ground-label"><i aria-hidden="true" />{stadium.name} / {hi ? `मैदान ${stadium.level}` : `GROUND ${stadium.level.toString().padStart(2, '0')}`}</span>
        </div>
        <div className="ps-matchdesk">
          <div className="ps-match-meta"><span>{hi ? 'एक टैप में खेलें' : 'Ready when you are'}</span></div>
          <h2>{hi ? 'एक ओवर। आपकी पहचान।' : 'One over. Make it yours.'}</h2>
          <p className="ps-intro jo-promise">{hi ? 'जवाब चुनें। XP कमाएँ। अपनी स्थानीय पहचान बनाएँ।' : 'Cricket stories, quick decisions, a title to build.'}</p>
          <div className="jo-over-choices" aria-label={hi ? 'अपना ओवर चुनें' : 'Choose your over'}>
            <button type="button" data-stadium-start="cricket" data-over="mini" className="ps-start gc-play jo-mini" disabled={!ready || busy} onClick={() => onDuel('trilogy', 'Cricket')}>
              <span><strong>{busy ? (hi ? 'पिच पर आ रहे हैं…' : 'Taking the field…') : ready ? (hi ? 'मिनी ओवर खेलें' : 'Play Mini over') : (hi ? 'पिच तैयार हो रही है…' : 'Preparing the pitch…')}</strong><small>{hi ? `3 राउंड · पूरा करने पर +${OVER_REWARD_RULES.trilogy.completionXp} XP` : `3 rounds · +${OVER_REWARD_RULES.trilogy.completionXp} completion XP`}</small></span><ArrowRight size={23} aria-hidden="true" />
            </button>
            <button type="button" data-over="full" className="jo-full" disabled={!ready || busy} onClick={() => onDuel('gauntlet', 'Cricket')}><span><strong>{hi ? 'फुल ओवर' : 'Full over'}</strong><small>{hi ? `6 राउंड · पूरा करने पर +${OVER_REWARD_RULES.gauntlet.completionXp} XP` : `6 rounds · +${OVER_REWARD_RULES.gauntlet.completionXp} completion XP`}</small></span><ArrowRight size={20} aria-hidden="true" /></button>
          </div>
          <p className="jo-reward-note">{hi ? 'बोनस के लिए हर राउंड का जवाब दें। जीतना ज़रूरी नहीं।' : 'Answer every round to earn the completion bonus.'}</p>
          <p className="ps-start-note jo-free-note">{hi ? 'मुफ़्त अभ्यास · स्पष्ट रूप से बॉट के खिलाफ़ · साइनअप नहीं' : 'Free practice · Against a bot · No signup'}</p>
          <details className="jo-other-ways"><summary>{hi ? 'दोस्तों के साथ या अलग विषय पर खेलें' : 'Play people or choose another topic'}</summary><div className="jo-other-body">
            <div className="ps-rival-row"><button onClick={onLive} disabled={busy}><Users size={18} aria-hidden="true" /><span>{hi ? 'इंसान के खिलाफ़' : 'Play a human'}</span><ArrowUpRight size={18} aria-hidden="true" /></button><button onClick={() => onSetup('friend')} disabled={busy}>{hi ? 'दोस्त बुलाएँ' : 'Invite a friend'}</button></div>
            <button className="jo-settings" onClick={() => onSetup('settings')} disabled={busy}><SlidersHorizontal size={17} aria-hidden="true" />{hi ? 'विषय और खेल सेटिंग' : 'Topics & match settings'}<ArrowRight size={16} aria-hidden="true" /></button>
          </div></details>
          <StadiumPresence />
        </div>
      </div>
      <button className="jp-team-invite" type="button" onClick={() => go('teams')}>
        <span className="jp-team-emblem" aria-hidden="true"><Users size={27} /><span>JHK</span></span>
        <span className="jp-team-invite-copy"><strong>{hi ? 'आपके साथी। आपकी पारी।' : 'Your people. Your innings.'}</strong><small>{hi ? '5 या 11 की टीम · टीम मैच और टूर्नामेंट' : 'Squads of 5 or 11 · Team matches & tournaments'}</small></span>
        <ArrowRight size={21} aria-hidden="true" />
      </button>
      <button className="jo-title-goal" onClick={() => go('passport')} aria-label={hi ? 'अपनी स्थानीय पहचान और प्रगति देखें' : 'View your local title and progress'}>
        <Trophy size={23} aria-hidden="true" /><span><strong>{titleProgress.title}</strong><small>{player.persistent ? (hi ? 'अभ्यास की पहचान · इस ब्राउज़र में सुरक्षित' : 'Practice title · Saved in this browser') : (hi ? 'अभ्यास की पहचान · सिर्फ़ इस विज़िट तक' : 'Practice title · This visit only')}</small><small>{titleProgress.nextTitle ? (hi ? `${titleProgress.nextTitle} तक ${titleProgress.remaining} पूरे ओवर। अपनी गति से खेलें।` : `${titleProgress.remaining} completed ${titleProgress.remaining === 1 ? 'over' : 'overs'} to ${titleProgress.nextTitle}. Play at your pace.`) : (hi ? 'सबसे ऊँची स्थानीय पहचान। अब अपना पल साझा करें।' : 'Top local title earned. Make your next moment shareworthy.')}</small><progress max="1" value={titleProgress.progress} aria-label={hi ? 'अगली पहचान की प्रगति' : 'Progress to next local title'} /></span><ArrowUpRight size={18} aria-hidden="true" />
      </button>
      <div className="tr-home-bridge"><TrophyRoadPreview player={player} selectedId={stadium.id} humanTrophies={humanTrophies} onOpen={() => go('road')} />{advanced && <button className="tr-home-innings" onClick={() => onDuel(stadium.mode, 'Cricket')} disabled={!ready || busy}>{hi ? stadium.hindiAction : stadium.action}<ArrowRight size={16} aria-hidden="true" /></button>}</div>
      <div className="ps-lower-grid">
        <section className="ps-spicy" aria-labelledby="ps-spicy-title"><div className="ps-spicy-top"><span className="ps-label"><Flame size={15} aria-hidden="true" />{hi ? 'मैदान के बाहर' : 'BEYOND THE BOUNDARY'}</span><span className="ps-heat" aria-label="Spicy">● ● ●</span></div><div className="ps-spicy-copy"><div><h2 id="ps-spicy-title">{hi ? 'स्पाइसी।' : 'Spicy.'}<span>{hi ? 'स्कोर से आगे।' : 'Off the pitch.'}</span></h2><p>{hi ? 'विवाद, बैन और सार्वजनिक रिश्ते। हर जवाब के साथ स्रोत।' : 'Scandals, bans & public ties. The drama, with receipts.'}</p></div><svg className="ps-chilli" viewBox="0 0 90 110" aria-hidden="true"><path d="M55 24Q55 6 72 8" fill="none" stroke="#539063" strokeWidth="8" strokeLinecap="round"/><path d="M39 26Q64 16 70 38C82 71 42 98 12 99Q41 78 36 55Q29 38 39 26Z" fill="#e6623e" stroke="#a8392a" strokeWidth="2"/><path d="M39 27Q53 20 66 29L62 39 53 34 42 40Z" fill="#4d8053"/><path d="M52 46Q61 64 41 81" fill="none" stroke="#ffb481" strokeWidth="5" strokeLinecap="round"/></svg></div><button data-stadium-start="spicy" disabled={!ready || busy} onClick={() => onDuel('trilogy', 'Cricket', 'Spicy')}>{hi ? 'स्पाइसी मिनी ओवर · 3 राउंड' : 'Spicy Mini over · 3 rounds'}<ArrowRight size={18} aria-hidden="true" /></button><small>{hi ? 'दस्तावेज़ों पर आधारित घटनाएँ। अफ़वाहें नहीं।' : 'Sourced events. Findings and allegations kept distinct.'}</small></section>
        <section className="ps-club-tease" aria-labelledby="ps-club-title"><span className="ps-label"><Sparkles size={15} aria-hidden="true" />{hi ? 'अपनी पहचान बनाएँ' : 'Your club, your colours'}</span><div className="ps-ticket-art" aria-hidden="true"><span>JHK / MEMBER</span><b>{name?.trim() || 'Cricket fan'}</b><span>PLAYED. EARNED. YOURS.</span><i>★</i></div><h2 id="ps-club-title">{hi ? 'मैदान भी आपका। पहचान भी।' : 'A ground to call your own.'}</h2><p>{hi ? 'खेलकर क्लब अंक कमाएँ। टाइटल, कार्ड और स्टेडियम सजावट चुनें।' : 'Turn earned Club points into titles, card finishes and stadium details.'}</p><button onClick={() => go('passport')}>{hi ? 'क्लब खोलें' : 'Open my club'}<ArrowUpRight size={18} aria-hidden="true" /></button></section>
      </div>
      <details className="jo-explore"><summary>{hi ? 'और भी खेलें और जानें' : 'Explore the clubhouse'}</summary><div className="ps-extras"><button onClick={() => onSetup('settings')}><SlidersHorizontal size={20} aria-hidden="true" /><span><b>{hi ? 'अपना मैच बनाएँ' : 'Make it your match'}</b><small>{hi ? 'विषय और समय चुनें।' : 'Choose a topic and timer.'}</small></span><ArrowUpRight size={18} aria-hidden="true" /></button><button onClick={() => go('showroom')}><Trophy size={20} aria-hidden="true" /><span><b>{hi ? 'नेट प्रैक्टिस' : 'Net practice'}</b><small>{hi ? 'स्वीट स्पॉट खोजें।' : 'Tap, time it, send it.'}</small></span><ArrowUpRight size={18} aria-hidden="true" /></button><button onClick={() => onRoute(null)}><BookOpen size={20} aria-hidden="true" /><span><b>{hi ? 'थोड़ा और जानें' : 'Explore the stories'}</b><small>{hi ? 'बिना घड़ी के कहानियाँ और स्रोत।' : 'Stories & sources. No clock.'}</small></span><ArrowUpRight size={18} aria-hidden="true" /></button></div></details>
      <DisplayPlacement placement="home-footer" />
    </section>
  );
}
