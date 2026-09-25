/**
 * editions/hisaab/engine/content.mjs — the edition's stand-in for lib/content.mjs.
 *
 * Same exports as the JHK module (the build aliases one for the other, so every shared importer
 * reads these): one domain, 'civics', and a topic table whose keys are the charter's thirteen
 * SECTORS. The journal, passport and progression sanitisers keep a fact only when its topic is a key
 * of TOPIC_DOMAINS, so a bank item whose `topic` is a SECTOR is journalled, counted per topic and can
 * be picked by the "Play a {topic} duel" quest. Pure and dependency-free apart from the vocabulary.
 */
import { SECTORS } from '../bank/schema.mjs';

export const ALL_DOMAINS = Object.freeze(['civics']);

/** Every charter sector, each in the one domain. */
export const TOPIC_DOMAINS = Object.freeze(Object.fromEntries(SECTORS.map((sector) => [sector, 'civics'])));

export const ENABLED_DOMAINS = Object.freeze(['civics']);

export const domainEnabled = (domain) => ENABLED_DOMAINS.includes(domain);

export const SINGLE_DOMAIN = ENABLED_DOMAINS.length === 1;

/** Filter anything carrying a `.domain` down to the enabled set, preserving order and identity. */
export const enabledOnly = (list) => {
  const out = (list ?? []).filter((item) => domainEnabled(item?.domain));
  return out.length === (list ?? []).length ? list : out;
};

export const DOMAIN_CHIPS = Object.freeze([{ id: 'civics', label: 'Civics' }]);

export const SUBJECT_LINE = 'PUBLIC MONEY';
