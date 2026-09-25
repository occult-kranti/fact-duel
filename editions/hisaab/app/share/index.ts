/**
 * share/index.ts — "Forward this — it's actually sourced" (design bible §8.4). STUBS with FINAL
 * signatures: the text builders and a text-only share (Web Share → clipboard) work today; the Me lane
 * adds the 1080 × 1350 PNG cards (receipt, certificate) behind the same functions.
 *
 *   await shareReceipt(item, 'receipt');                 // answer + stamp + SOURCE + STATUS + as of
 *   await shareReceipt(item, 'challenge');               // the question and four options, NO answer
 *   await shareDailyGrid({ day: '2026-09-25', results: [true, true, false, true, true], label: 'RTI Warrior' });
 *   await shareCertificate({ name, band: 4, receipts: 214, issuedOn: Date.now(), node });
 *   await shareInvite('7K2Q-9F3A', { format: 'Triple Threat' });
 *
 * Honesty rules, enforced HERE so no screen can forget them:
 *  - an item with a legal `status` carries it verbatim with its as-of date;
 *  - a share never states a wrong option as fact (the challenge variant has no answer at all);
 *  - every share says "Satire. Every question sourced.";
 *  - a certificate name that matches anyone in the bank prints "Anonymous Janta" (data.certificateName).
 * Confirmations are inline on the button ("Copied ✓"), never a toast — callers read the outcome.
 */
import { EDITION } from '../../edition';
import { certificateName, labelDisplay, monthLabel, statusWithAsOf, type BankItem } from '../data';
import { absoluteUrl, href } from '../router';

export type ShareMethod = 'share' | 'clipboard' | 'download' | 'none';
export type ShareOutcome = Readonly<{ ok: boolean; method: ShareMethod; reason?: 'cancelled' | 'unsupported' | 'failed' | 'not-implemented' }>;
export type ReceiptShareVariant = 'challenge' | 'receipt';

export const SHARE_CTA = "Forward this — it's actually sourced";
export const SHARE_CTA_HINGLISH = 'Forward karo — iska source hai.';
export const SHARE_FOOTER = 'Satire. Every question sourced.';

const LETTERS = ['A', 'B', 'C', 'D'];
const url = (hash: string) => absoluteUrl(hash, EDITION.base);

/** The text of a receipt share. 'challenge' = question + options, no answer; 'receipt' = the answer with its receipt. */
export function receiptShareText(item: BankItem, variant: ReceiptShareVariant): string {
  const lines = [`HISAAB DO · ${item.topic}`, item.question];
  if (variant === 'challenge') {
    item.options.forEach((o, i) => lines.push(`${LETTERS[i]}. ${o}`));
    lines.push('Jawab + receipt:');
  } else {
    lines.push(`Answer: ${item.options[item.correctIndex]}`);
    lines.push(`Source: ${item.sourceLabel} ${item.sourceUrl}`);
    const status = statusWithAsOf(item);
    if (status) lines.push(`Status: ${status}`);
    lines.push(`Govt then: ${item.govt}`);
  }
  lines.push(url(href.taster(item.id)));
  lines.push(SHARE_FOOTER);
  return lines.join('\n');
}

/** The daily grid (bible §8.4): '✅✅❌✅✅ 4/5' — ✅ ❌ only, no other emoji. */
export function dailyGridText(input: { day: string; results: readonly boolean[]; label: string }): string {
  const [y, m, d] = input.day.split('-');
  const date = `${Number(d)} ${monthLabel(`${y}-${m}`)}`;
  const right = input.results.filter(Boolean).length;
  return [
    `HISAAB DO · Aaj Ka Hisaab · ${date}`,
    `${input.results.map((r) => (r ? '✅' : '❌')).join('')} ${right}/${input.results.length}`,
    `Label: ${input.label}`,
    `Har sawaal ka source hai. Khud check karo: ${url(href.aaj())}`,
  ].join('\n');
}

/** The duel invite text (bible §8.4). */
export function inviteText(code: string, opts: { format?: string } = {}): string {
  return `Muqabla? ${opts.format ?? 'A duel'} on HISAAB DO. Room ${code}: ${url(href.friend(code))}`;
}

/** A WhatsApp share link for a text (wa.me; opens the app or WhatsApp Web). */
export const whatsappUrl = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

/** Share text through the Web Share API, else copy it. Never throws. */
export async function shareText(text: string, title = EDITION.name): Promise<ShareOutcome> {
  const nav = typeof navigator === 'undefined' ? null : navigator;
  if (nav?.share) {
    try {
      await nav.share({ title, text });
      return { ok: true, method: 'share' };
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return { ok: false, method: 'share', reason: 'cancelled' };
      /* fall through to the clipboard */
    }
  }
  if (nav?.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(text);
      return { ok: true, method: 'clipboard' };
    } catch {
      return { ok: false, method: 'clipboard', reason: 'failed' };
    }
  }
  return { ok: false, method: 'none', reason: 'unsupported' };
}

/** Share one card. STUB: text today; the Me lane adds the PNG card (Web Share Level 2 files). */
export async function shareReceipt(item: BankItem, variant: ReceiptShareVariant): Promise<ShareOutcome> {
  return shareText(receiptShareText(item, variant));
}

/** Share today's grid (text, by design). */
export async function shareDailyGrid(input: { day: string; results: readonly boolean[]; label: string }): Promise<ShareOutcome> {
  return shareText(dailyGridText(input));
}

export type CertificateShareInput = {
  name: string | null | undefined;
  band: number;
  receipts: number;
  issuedOn: Date | number;
  /** The rendered <Certificate> node, for the PNG capture (Me lane). */
  node?: HTMLElement | null;
};

/** The certificate's text twin (and the caption of the PNG). */
export function certificateShareText(input: CertificateShareInput): string {
  const label = labelDisplay(input.band);
  return [
    `${certificateName(input.name)} has been officially labelled ${label.en.toUpperCase()} after ${input.receipts} sourced receipts.`,
    `"${label.line}"`,
    `${url(href.home())}`,
    'Satire. Not a government document. Every question sourced.',
  ].join('\n');
}

/** Share the certificate. STUB: text today; the Me lane renders the 1080 × 1350 PNG (always light). */
export async function shareCertificate(input: CertificateShareInput): Promise<ShareOutcome> {
  return shareText(certificateShareText(input));
}

/** Share a P2P room invite (text + link). */
export async function shareInvite(code: string, opts: { format?: string } = {}): Promise<ShareOutcome> {
  return shareText(inviteText(code, opts));
}
