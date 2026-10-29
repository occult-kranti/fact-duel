'use client';
import { useState } from 'react';
import { ArrowRight, Check, ChevronRight, Crown, Flag, LockKeyhole, Map, Trophy, Waves } from 'lucide-react';
import { canPlayStadiumMode, eligibleStadiumSelection, stadiumById, stadiumRoad } from '@/lib/stadium-road.mjs';
import type { Player } from './types';
import { useLocale } from '../use-locale';
import './stadium-road.css';

type Props = {
  player: Player;
  name?: string;
  ready?: boolean;
  busy?: boolean;
  selectedId?: string;
  humanTrophies?: number;
  onSelect?: (id: string) => void;
  onPlay: (mode: string, stadiumId: string) => void;
};
const SIGNS = { gully: Flag, riverside: Waves, crown: Crown };

/** Browsing a locked ground is a preview; only an earned ground can be selected or played. */
export function StadiumRoad({ player, name = 'Challenger', ready = true, busy = false, selectedId, humanTrophies = 0, onSelect, onPlay }: Props) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  const road = stadiumRoad(player.profile, humanTrophies);
  const selected = eligibleStadiumSelection(player.profile, selectedId, humanTrophies);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const stage = stadiumById(previewId) ?? selected;
  const unlocked = canPlayStadiumMode(player.profile, stage.mode, humanTrophies);
  const Sign = SIGNS[stage.id as keyof typeof SIGNS];
  const left = Math.max(0, stage.threshold - road.trophies);
  function choose(id: string) {
    const next = road.levels.find((level) => level.id === id);
    if (!next) return;
    if (next.unlocked && onSelect) { onSelect(next.id); setPreviewId(null); }
    else setPreviewId(next.id);
  }
  function play() {
    if (!ready || busy || !player.loaded || !canPlayStadiumMode(player.profile, stage.mode, humanTrophies)) return;
    onPlay(stage.mode, stage.id);
  }
  return <section className="tr-road" aria-labelledby="tr-road-title" data-stadium={stage.id}>
    <header className="tr-heading"><div><p>{hi ? 'अपने मैदान से बड़ी रोशनी तक' : 'FROM YOUR GULLY TO THE BIG LIGHTS'}</p><h1 id="tr-road-title">{hi ? 'ट्रॉफ़ी का सफ़र।' : 'Every ground has a story.'}</h1></div><span className="tr-trophies"><Trophy size={20} aria-hidden="true" /><b data-testid="road-trophies">{road.trophies}</b><small>{hi ? 'अनलॉक ट्रॉफ़ी' : 'Unlock trophies'}</small></span></header>
    <p className="tr-records"><span>{hi ? 'इस डिवाइस पर' : 'Local play'} <b>{road.practiceTrophies}</b></span><span>{hi ? 'सत्यापित इंसानी मुकाबले' : 'Verified human'} <b>{road.humanTrophies}</b></span><small>{hi ? 'अधिक स्कोर से मैदान खुलते हैं। दोनों रिकॉर्ड अलग हैं।' : 'Your higher total unlocks grounds. Records stay separate.'}</small></p>
    <div className="tr-layout">
      <div className="tr-journey"><div className="tr-journey-heading"><Map size={18} aria-hidden="true" /><h2>{hi ? 'आपका ट्रॉफ़ी रोड' : 'Your trophy road'}</h2></div>
        <ol className="tr-stops">{road.levels.map((level) => {
          const Icon = SIGNS[level.id as keyof typeof SIGNS];
          const active = stage.id === level.id;
          return <li key={level.id} data-unlocked={level.unlocked} data-current={active}><button type="button" data-road-stage={level.id} aria-pressed={active} aria-label={`${level.name}, ${hi ? `${level.threshold} ट्रॉफ़ी` : `${level.threshold} trophies`}, ${level.unlocked ? hi ? 'खुला हुआ' : 'unlocked' : hi ? 'लॉक है, प्रीव्यू देखें' : 'locked, preview'}`} onClick={() => choose(level.id)}><span className="tr-stop-icon">{level.unlocked ? <Icon size={24} aria-hidden="true" /> : <LockKeyhole size={23} aria-hidden="true" />}</span><span className="tr-stop-name"><small>{hi ? 'मैदान' : 'GROUND'} {level.level.toString().padStart(2, '0')}</small><strong>{level.name}</strong><span>{hi ? level.hindiLabel : level.label}</span></span><span className="tr-stop-gate"><Trophy size={13} aria-hidden="true" />{level.threshold}<ChevronRight size={17} aria-hidden="true" /></span></button></li>;
        })}</ol>
      </div>
      <div className="tr-ground" data-level={stage.id} data-locked={!unlocked}>
        <div className="tr-art"><img src={stage.art} width="960" height="640" alt="" decoding="async" /><span className="tr-level">{hi ? 'मैदान' : 'GROUND'} {stage.level.toString().padStart(2, '0')}</span><span className="tr-ground-state">{unlocked ? <Check size={15} aria-hidden="true" /> : <LockKeyhole size={15} aria-hidden="true" />}{unlocked ? hi ? 'आपका मैदान' : 'YOURS TO PLAY' : hi ? 'अगला पड़ाव' : 'NEXT CHAPTER'}</span></div>
        <div className="tr-ground-copy"><div className="tr-ground-title"><Sign size={26} aria-hidden="true" /><div><p>{hi ? stage.hindiLabel : stage.label}</p><h2>{stage.name}</h2></div></div><p className="tr-description">{hi ? stage.hindiDescription : stage.description}</p>
          <ul className="tr-perks">{(hi ? stage.hindiPerks : stage.perks).map((perk) => <li key={perk}><Check size={13} aria-hidden="true" />{perk}</li>)}</ul>
          {!unlocked && <div className="tr-locked-progress"><span><LockKeyhole size={15} aria-hidden="true" />{hi ? `${left} ट्रॉफ़ी और चाहिए` : `${left} trophies to unlock`}</span><progress value={Math.min(stage.threshold, road.trophies)} max={stage.threshold} aria-label={hi ? `${stage.name} की प्रगति` : `Progress to ${stage.name}`} /><small>{road.trophies} / {stage.threshold} {hi ? 'ट्रॉफ़ी' : 'trophies'}</small></div>}
          <button className="tr-play" type="button" data-road-play={stage.mode} disabled={!unlocked || !ready || busy || !player.loaded} onClick={play}>{unlocked ? busy ? hi ? 'मैदान तैयार है…' : 'Taking the field…' : hi ? stage.hindiAction : stage.action : hi ? `${stage.threshold} ट्रॉफ़ी पर खुलेगा` : `Unlock at ${stage.threshold} trophies`}{unlocked ? <ArrowRight size={21} aria-hidden="true" /> : <LockKeyhole size={18} aria-hidden="true" />}</button>
          <p className="tr-play-note">{hi ? 'अभ्यास बॉट · बिना दाँव · सहेजे गए सवाल बाद में पढ़ें' : 'Practice bot · Zero stake · Review your answers later'}</p>
        </div>
      </div>
      <div className="tr-progress">
        <div className="tr-next"><b>{road.next ? hi ? `${road.next.name} अब बस ${road.remaining} ट्रॉफ़ी दूर।` : `${road.next.name} is ${road.remaining} trophies away.` : hi ? 'तीनों मैदान खुले हैं। अपना पसंदीदा खेलें।' : 'Every ground is open. Play your favourite.'}</b><p>{hi ? 'हर दिए हुए जवाब पर 4 ट्रॉफ़ी, सही होने पर 2 और। समय खत्म होने पर कोई ट्रॉफ़ी नहीं।' : 'In local play, each answered delivery earns four trophies, plus two if correct. Timeouts earn none.'}</p><progress max={1} value={road.fraction} aria-label={hi ? 'अगले मैदान की प्रगति' : 'Progress to the next ground'} /></div>
        <details className="tr-earn"><summary>{hi ? 'ट्रॉफ़ी और अनलॉक कैसे काम करते हैं' : 'How trophies and unlocks work'}</summary><p>{hi ? `${name}, यह इस डिवाइस पर आपके खेल का रिकॉर्ड है। हर पूरे हुए राउंड में आपका दिया हुआ जवाब एक बार गिना जाता है। ट्रॉफ़ी खर्च नहीं होतीं।` : `${name}, this road follows your play record on this device. An answer counts once when its round settles. Trophies are earned progress and cannot be spent.`}</p><p>{hi ? 'पुराने रिकॉर्ड में केवल साबित सही जवाबों से शुरुआत होती है। इस डिवाइस का डेटा मिटाने पर स्थानीय सफ़र रीसेट होगा। नए मैदान नए फ़ॉर्मैट खोलते हैं; सामान्य पारी और विषय पहले से खुले रहते हैं।' : 'Older device records start from provable correct answers. Clearing device activity resets local trophies. New grounds unlock formats; ordinary innings and subjects stay available.'}</p><p>{hi ? 'इंसानी मुकाबले की सर्वर ट्रॉफ़ी से भी मैदान खोल सकते हैं। बड़ा स्कोर गिना जाता है; दोनों रिकॉर्ड जोड़े नहीं जाते। ऑनलाइन रैंक अलग है।' : 'You can also unlock with server-recorded human trophies. The higher total counts; the two records are never added or uploaded into each other. Online rankings stay separate.'}</p></details>
        {!player.persistent && <p className="tr-storage" role="status">{hi ? 'सेव उपलब्ध नहीं है। यह सफ़र अभी इस खुले पेज तक है।' : 'Saving is unavailable. This road lasts for the current open page.'}</p>}
      </div>
    </div>
  </section>;
}

/** Optional home bridge: it adds no intermediate screen to the ordinary one-tap innings. */
export function TrophyRoadPreview({ player, selectedId, humanTrophies = 0, onOpen }: { player: Player; selectedId?: string; humanTrophies?: number; onOpen: () => void }) {
  const { locale } = useLocale();
  const hi = locale === 'hi';
  const road = stadiumRoad(player.profile, humanTrophies);
  const selected = eligibleStadiumSelection(player.profile, selectedId, humanTrophies);
  return <button type="button" className="tr-preview" onClick={onOpen} data-open-trophy-road><span className="tr-preview-icon"><Trophy size={21} aria-hidden="true" /></span><span className="tr-preview-copy"><b>{selected.name}</b><small>{road.next ? hi ? `${road.trophies} ट्रॉफ़ी · अगला मैदान ${road.next.threshold} पर` : `${road.trophies} trophies · next ground at ${road.next.threshold}` : hi ? `${road.trophies} ट्रॉफ़ी · सभी मैदान खुले` : `${road.trophies} trophies · every ground open`}</small></span><ChevronRight size={18} aria-hidden="true" /></button>;
}
