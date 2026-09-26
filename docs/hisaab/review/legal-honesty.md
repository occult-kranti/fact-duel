# HISAAB DO — legal and honesty review

Reviewer: legal-honesty lane. Date: 26 Sep 2026.

**Scope.** This review covers what the UI *shows*, not the bank facts. It checks:
- status lines on every surface;
- share cards and certificates;
- the certificate name rule and the rule that labels never apply to real people, parties or outlets;
- party marks, colours, emblems, logos and maps;
- the bot label, presence and counts;
- the P2P trust and privacy copy;
- the Rules page, with its editorial policy and corrections route;
- charter §2, §2.7 and §4b as they appear in UI copy.

**Inputs.** CHARTER §1, §2, §4a/§4b, §6 and §7. Design bible §2–§12, especially §2.4, §8.4, §8.5, §9 and §11. ENGINE.md, `editions/hisaab/app/README.md`, the `hisaab-design` and `juice` skills, and `docs/hisaab/review/advisor-loop1.md`.

**Build reviewed.** The working tree at about 05:00 IST, frozen with `HISAAB_OUT=<scratch>/dist pnpm build:hisaab` and served by `vite preview` on :5197. A dev server on :5196 was used only to import `share/card.ts` for the card audit. Both servers were stopped afterwards.

## Evidence

- `pnpm exec tsc --noEmit`: 0 errors. `node --test tests/hisaab-*.test.mjs`: 40 of 40 pass.
- **Share-card audit.** Every bank item's card was rendered in Chromium through the real `renderReceiptCard`, with `fillText` instrumented. That is 485 items × 2 variants = 970 cards. Results:
  - Every card with a `status` prints it verbatim, with "as of", in the legal block.
  - Nothing is drawn below the receipt panel.
  - The smallest status text is 21 px on the 1080 px card.
  - No challenge card prints ANSWER.
  - The data is in `…/ui/legal-honesty/card-audit.json`.
- **Walk.** I checked 360×740, 390×844, 414×896 and 1440×900, in light and dark, plus Hindi at 390 in both themes. Each cell covered:
  - a status receipt on the taster;
  - Vault rows;
  - the Forward Court docket;
  - the Rules page (status, privacy, art, corrections and report sections);
  - duel setup with the Friend and Bot options;
  - the name field and the certificate;
  - Kiska Media?, the P2P join form, Chunav Se Pehle and the cartogram.

  The flows ran at 390 light: eight Quick Draws against Babu-Bot until a case item came up, then the result minis. Results:
  - 0 horizontal overflow and 0 console errors in every cell.
  - **0 requests to any origin other than the site** during solo play, P2P setup and sharing.
- **Certificate names.** I probed `certificateName` in node with 85 names; the output is summarised in P0-1. I also rendered certificate PNGs from the card module, and downloaded one through the app's own "Share certificate" path (`390x844-light/07b-certificate-download.png`).
- **PNGs I read.** They are in `/tmp/claude-0/-home-user-fact-duel/4f9f5da0-78f8-567b-872f-cf9ad0f26ac3/scratchpad/ui/legal-honesty/`:
  - `cert-*.png` and `card-*.png`;
  - `<cell>/01…13-*.png`;
  - `flows-390-light/09a-round-receipt-with-status.png` and `09b-result-minis-status-item.png`.
- The scripts are in `…/scratchpad/legal/`: `card-audit.mjs`, `card-png.mjs`, `walk.mjs`, `walk-hi.mjs`, `walk2.mjs`, `probe-names.mjs`, `probe-fwd.mjs` and `probe-bank.mjs`.

---

## Verdict: **FIX-FIRST**

The receipt itself is in very good legal shape:
- There is one neutral legal block, with the status verbatim and its as-of date, on every primary receipt and on every share card.
- There are no party marks, logos or maps.
- There are no fake counts.
- Every edition surface calls the bot "Babu-Bot · BOT".
- Solo play makes no third-party requests.

Three things block release:

1. **The certificate labels real people, parties and outlets (P0-1).** The name rule checks only the 116 names that happen to be in the bank's `people` lists, and only their exact full-name forms. Two examples came through the app's own share path:
   - "This is to certify that **MAMATA BANERJEE** has … been officially labelled **URBAN NAXAL**";
   - "**नरेंद्र मोदी** … labelled **CERTIFIED ANTI-NATIONAL**".

   "PM Modi", "Kejriwal", "Yogi Adityanath", "BJP" and "NDTV" all print too.
2. **Two recap surfaces titled as receipts drop the legal status (P0-2).**
   - The match result's "Round receipts" show case stems with a ✓ answer and a source link, but no STATUS. For example, "The ABG Shipyard case … alleged a ₹22,842-crore fraud …" appears with no "chargesheeted; trial pending".
   - Pass & Play's recap does the same.
3. **The Rules page still misstates two rules (P0-3).** This was raised as advisor-loop1 P0-1, I re-checked it today, and it is still open.

Each of the three is a small, contained change.

---

## Findings

Each finding gives the file (and owning lane per `app/README.md`), what is wrong, the rule it breaks, and the exact fix.

### P0 — blocks release

**P0-1. Certificates and certificate shares print real politicians', parties' and outlets' names under a label.**

Where: `editions/hisaab/app/data.ts` lines 499–587 (`HONORIFICS`, `people()`, `mentionsBankPerson`, `certificateName`), owned by the foundation lane. It surfaces in:
- `ui/certificate.tsx:46`;
- `share/card.ts:645`;
- `share/index.ts:203`;
- `screens/me/name-field.tsx:25`.

What:
- The rule matches only names in the registered lanes' `people` and `enactedBy`, in exact or reordered full-name form. The bank has 116 such names.
- My probe prints the following **unchanged** on a certificate:
  - *Name variants:* `PM Modi`, `Modi`, `Modi ji`, `NaMo`, `N. Modi`, `Shri Modi`.
  - *Devanagari:* `नरेंद्र मोदी`, `मोदी`.
  - *Homoglyph:* `Nаrendra Modi` with a Cyrillic "а".
  - *People missing from the bank, or surname-only:* `Mamata Banerjee`, `Yogi Adityanath`, `Akhilesh Yadav`, `Manmohan Singh`, `Smriti Irani`, `Kejriwal`, `Adani`.
  - *Parties and outlets:* `BJP`, `Congress`, `AAP`, `TMC`, `RSS`, `NDTV`, `Republic TV`, `Zee News`, `Aaj Tak`, `Godi Media`.
  - *Nicknames:* `Pappu`, `Feku`, `Didi`.
- The name field then reassures the player: "Prints as: **Mamata Banerjee**." (`390x844-dark/07-certificate-real-person.png`).
- The downloaded PNG reads "This is to certify that MAMATA BANERJEE has, after 3 sourced receipts, been officially labelled ANDHBHAKT".

Why:
- Bible §8.5 lists "no label applied to a real person" among the edition-specific refusals.
- The `hisaab-design` skill lists "Honesty and legal (blocking in review)".
- The brief says labels never apply to "real people, parties, outlets".
- Bible §8.4 wording is met to the letter ("matches a person in the bank's people lists"), but the gate is not. The certificate is the one artefact that attaches "Urban Naxal", "Tukde-Tukde Gang" or "Anti-National" to a typed name, on an official-looking page built to be forwarded on WhatsApp.

Fix (foundation, `data.ts`):
1. **Normalise harder.**
   - Apply NFKC, strip zero-width characters (`​-‍﻿`), and fold common Cyrillic and Greek confusables to Latin (а→a, е→e, о→o, р→p, с→c, у→y, х→x, і→i, ј→j, ѕ→s, ԁ→d, ɡ→g). Alternatively, treat any name that mixes scripts as blocked.
   - Transliterate Devanagari to Latin before matching. A small table with schwa deletion at word end is enough, so that नरेंद्र मोदी → narendra modi and ममता बनर्जी → mamata banarji. Then compare with doubled vowels collapsed (ee→i, oo→u, aa→a) and ph/f, v/w, j/z folded.
2. **Titles are honorifics.** Add `pm cm dy deputy minister mp mla hon honble ji jee sahab saheb bhai didi behenji amma anna netaji` to `HONORIFICS`, so that "PM Modi" normalises to "modi".
3. **Lone surnames.** If what remains is a single token equal to the **last name** of any listed person, return `ANONYMOUS`, unless that token is in a short `COMMON_SURNAMES` allow-list (kumar, singh, sharma, yadav, patel, gupta, das, devi, khan, reddy, rao, verma, jain, mishra). A false positive only prints "Anonymous Janta". A false negative certifies a Chief Minister.
4. **Look beyond the bank.**
   - Add `PUBLIC_NAMES` in a new `editions/hisaab/app/public-names.ts` (foundation), matched the same way, with a test. It lists:
     - every `govt` value in charter §3, plus party full names (Bharatiya Janata Party, Indian National Congress, Aam Aadmi Party, All India Trinamool Congress, Samajwadi Party, Bahujan Samaj Party, Shiv Sena, Nationalist Congress Party, DMK, AIADMK, TDP, YSRCP, BRS, BJD, JMM, RJD, JD(U), CPI, CPI(M), CPM, AIMIM) and RSS;
     - outlet names, taken from the Media & Speech items' `subtopic` parts plus the charter §2.1 outlet list;
     - agencies and courts (CBI, ED, SEBI, CAG, ECI, RBI, Supreme Court);
     - the satire words themselves (Godi Media, IT Cell);
     - common epithets for public figures (NaMo, RaGa, Pappu, Feku, Didi, Chowkidar, Shehzada, Behenji).
   - Ask the editorial lane for a names-only `bank/public-figures.mjs`. It should list sitting and former PMs, the CMs of all 30 states since 2014, Union ministers, party presidents, Leaders of Opposition and the anchors and owners named in the media lane. `people()` should read it too.
5. **Say the rule as it now works.** Replace the copy in `screens/rules/index.tsx:183` and `screens/me/name-field.tsx:52` with: "A certificate whose name is, or looks like, a public figure, party, outlet or institution prints 'Anonymous Janta'." (Hindi: "…किसी सार्वजनिक हस्ती, पार्टी, मीडिया या संस्था जैसा दिखे तो…").
6. **Add regression tests** in `tests/hisaab-ui-foundation.test.mjs` (the foundation or code lens adds them; my lens adds no tests):
   - `certificateName(x) === 'Anonymous Janta'` for PM Modi, Modi ji, Kejriwal, Mamata Banerjee, Yogi Adityanath, नरेंद्र मोदी, `Nаrendra Modi`, BJP, Congress, NDTV, Republic TV, Godi Media, Pappu;
   - `certificateName(x) === x` for Asha, Rahul, Priya Sharma and Riya.

**P0-2. "Round receipts" on the match result, and the Pass & Play recap, show case items without their legal status.**

Where:
- `editions/hisaab/app/screens/room/result.tsx:362–392` (duel lane). The mini renders the stem, the ✓ answer, the seats and the source, with no STATUS.
- `editions/hisaab/app/screens/pass/index.tsx:573–590` (duel lane), the same pattern.

Evidence: `flows-390-light/09b-result-minis-status-item.png` shows "The ABG Shipyard case, registered by the CBI in Feb 2022, alleged a ₹22,842-crore fraud … ✓ 28" with no legal block. The walk found 0 `.h-legal` inside `.h-result__mini`. The round receipt just before it (`09a`) does carry "chargesheeted by CBI (Nov 2022); trial pending, no verdict reported".

Why:
- Charter §2.2 is a release gate ("a violation is a P0 finding in review").
- The brief says "every place a status line appears keeps it verbatim with the as-of date and the neutral chip".
- Bible §5: a receipt's rows include STATUS.
- These cards are titled **receipts**, sit on a screen with a Share button, and state the answer about a named case as fact.
- (advisor-loop1 rated the duel half P1-3 on its own lens. On the legal lens it is a gate.)

Fix:
- In `result.tsx`, import `itemById` and `LegalStatus` (`../../data`, `../../ui/chip`). Inside the `rounds.map`, after the `.h-result__answer` paragraph, add:
  ```tsx
  const item = itemById(r.question.factId ?? null);
  {item?.status ? <LegalStatus status={item.status} asOf={item.asOf} className="h-result__legal" /> : null}
  ```
- In `pass/index.tsx`, inside `game.rounds.map`, add:
  ```tsx
  const it = itemById(r.question.id);
  {it?.status ? <LegalStatus status={it.status} asOf={it.asOf} /> : null}
  ```
- Let both wrap; do not clamp them. Add `.h-result__legal { margin-top: var(--h-s-2) }` in `result.css`.
- A cheap regression test (code lens): statically assert that every `.tsx` under `screens/` that renders `options[…correctIndex…]` also references `LegalStatus` or `<Receipt`.

**P0-3. The Rules page still misstates two rules (carried from advisor-loop1 P0-1; re-verified on this tree).**

Where: `editions/hisaab/app/screens/rules/index.tsx` (me lane).
- Line 366 says a Surprise Audit "is announced on the receipt before the round". Round 1 has no receipt before it.
- Line 391 says "A day counts when you play". In fact `lib/progression.mjs` credits any event, including the `visit` event dispatched on app open.

Why: N6 (bible §8.5): "every XP number is on the Rules page". A trust page that misstates its own rules undercuts the Corrections promise.

Fix: as advisor-loop1 P0-1 specifies, with the changes logged in `screens/rules/corrections.ts` `CHANGELOG` with today's date. It is listed here only so the legal sign-off does not pass while it is open.

### P1 — must fix before launch

**P1-1. Vault rows show a "Legal status · as of Sep 2026" chip but not the status words.**

Where: `editions/hisaab/app/screens/receipts/index.tsx:81–88` (me lane).

What: stems such as "Former Rajasthan minister Mahesh Joshi was arrested by the ED…" list with a chip that announces a status exists, without saying what it is (`360x740-light/02-vault-rows.png`). The words are one tap away in the detail sheet.

Why: charter §2.2, and the Rules page's own promise (`screens/rules/index.tsx:235–236`) that the as-of date prints beside the status "on every receipt and every share card".

Fix: render the words under the chip:
```tsx
<span className="h-vrow__status" lang="en">{row.status}</span>
```
Style `h-vrow__status` in `receipts.css` with `font-size: var(--h-fs-xs)` and `color: var(--h-legal-ink)` on `--h-legal`, with no `overflow:hidden` and no line clamp. Keep the chip.

**P1-2. Receipt shares drop "the other side".**

Where:
- `editions/hisaab/app/share/index.ts:57–62` (text twin);
- `editions/hisaab/app/share/card.ts:455–515` (PNG rows: SOURCE, STATUS and GOVT THEN only).

Both are in the me lane.

What:
- The other side lives only in `explanation`; no bank item has `otherSide`, so `Receipt`'s OTHER SIDE row never renders.
- Only 44 of 185 status lines carry the counterpoint themselves.
- Example: the shared `hst145` card says "Answer: Jal Jeevan Mission / Status: … Not convicted." It does not include "Joshi has denied wrongdoing and called the case a conspiracy" (`card-hst145-receipt.png`).

Why: charter §2.3: "The other side's answer is part of the fact." A share is a republication, so the counterpoint must travel with it.

Fix:
1. **Now:** in `receiptShareText` (receipt variant), after the Status line, add
   ```ts
   lines.push(`Noting: ${item.explanation}`);
   ```
   The explanation is ≤ 420 characters, and the text twin has room.
2. **Editorial lane (bank):** add an optional one-clause `otherSide` field (≤ 140 characters) to every item with `people` or `status` whose explanation carries a denial, clearance or contest. Add it to the schema and to `hisaab-validate`.
3. **Then:**
   - `card.ts`: draw an `OTHER SIDE` key and its wrapped text after STATUS in both variants, and extend the audit's fit loop.
   - `share/index.ts`: add `Other side: …`.
   - `route/lib.ts` `otherSideOf` and `room/receipt.tsx` `otherSideOf` already pass it to `Receipt`.

**P1-3. Forward Court prints viral claims about named people in "Forwarded many times" bubbles with no marker that they are disputed.**

Where:
- `editions/hisaab/app/screens/files/register.tsx:152–163` (`SealedBubble`);
- `editions/hisaab/app/screens/files/forwards.tsx:97–104` (the "First case" bubble).

Both are in the files lane.

What: 22 of the 40 forwards name people. Sealed bubbles print the claim only. Examples:
- "…'UNESCO has declared Narendra Modi the best Prime Minister in the world.'"
- "A viral clip … shows Rahul Gandhi promising a machine that turns potatoes into gold."
- `hfw007` (a doctored Amit Shah video) and `hfw035` (a deepfake investment pitch with Nirmala Sitharaman's face).

The ruling appears only after the card is answered (`390x844-light/03-forward-docket.png`). A cropped screenshot reads as the app circulating the claim. advisor-loop1 P2-13 raised this. Named people and deepfake scams make it a legal risk, not a nicety.

Fix: inside the bubble, above the claim, render a neutral legal-style chip:
```tsx
<Chip kind="legal" icon={<Scale size={12} strokeWidth={2.6} />}>{t('Claim on trial · ruling sealed', 'दावा · फ़ैसला बंद')}</Chip>
```
Add the same words to the link's accessible name. Do the same in the `forwards.tsx` file-brief bubble. It sits inside the bubble so that no crop can separate the two.

**P1-4. Friend duels do change Babu rank (at 1.5×), while the UI says "no ranking".**

Where the copy is:
- `editions/hisaab/p2p/protocol.mjs:32–37` `P2P_TRUST.body` ("No coins, no ranking"), shown on `screens/duel/setup.tsx:156–162` and in `friend.tsx` `TrustNote`;
- `screens/room/result.tsx:311` ("no coins, no ranking");
- `screens/rules/index.tsx:416` ("no stakes and no ranking between friends").

Where the mechanics are:
- `friend.tsx:565` files the P2P room with `useRecordRoom`;
- `lib/journal.mjs:389` sets `bot: false` because both seats are human;
- `lib/progression.mjs:1217–1224` then applies `rankWin × humanMultiplier`.

The Rules page's own XP list (the Babu rank line, "× 1.5 against a person") contradicts its privacy section. The friend result hides the rank delta (`result.tsx:289`), so the change is silent.

Why:
- It is a false statement at the point of decision.
- N6 (hidden rule): times in a friend duel are self-reported and forgeable, which is exactly why P2P was promised to be unranked.

Fix, preferred (engine lane, default-preserving):
- The P2P host creates rooms with `config.p2p: true` (`protocol.mjs` host `create`).
- `lib/journal.mjs` copies `p2p` onto the match record.
- `lib/progression.mjs` skips the rank delta, and optionally the human multiplier, when `e.p2p` is set, behind an option the edition turns on in `main.tsx`.

Fallback (copy only, today): change all four strings to "Casual · trust-based … Counts toward your XP and your Babu rank on this device (×1.5 against a person), but each browser reports its own times." Also show the rank delta on the friend result.

**P1-5. The P2P privacy copy is incomplete: "No server." and "go to the other player only".**

Where:
- `editions/hisaab/app/screens/duel/setup.tsx:94` ("Peer-to-peer room code. No server." / "कोई सर्वर नहीं।");
- `screens/rules/index.tsx:406–413` (the privacy section, titled "Privacy: no server");
- `screens/duel/friend.tsx:517`;
- `screens/settings/index.tsx:231`.

What:
- `p2p/trystero.mjs` uses trystero 0.25.4's defaults: public Nostr relays for signalling, plus STUN at `stun.l.google.com`, `stun1`, `stun2` and `stun.cloudflare.com`.
- The relays and STUN operators see the player's IP address. The other player's browser sees it too, from the ICE candidates, as with any direct WebRTC connection.
- The Rules page says only the name, answers and times go to the other player.

Why: the brief asks for honest P2P trust copy. The charter's no-invented-presence spirit applies to privacy claims too.

Fix:
- `setup.tsx:94`: "Peer-to-peer room code. No server of ours." / "पीयर-टू-पीयर रूम कोड। हमारा कोई सर्वर नहीं।"
- Rules privacy section: retitle it "8. Privacy: no server of ours", and add after the relay sentence: "To connect directly, your browser asks public STUN servers (Google's and Cloudflare's) for its internet address, and the other player's browser learns that address — as with any video call. The relays see your address and a scrambled room id. Nothing reaches us."
- `friend.tsx:517`: add "…and learn each other's internet (IP) address".
- Optional (p2p lane): pin `relayUrls` and `rtcConfig.iceServers` in `trystero.mjs`, so the Rules page can name exactly which servers are contacted.

**P1-6. The corrections route is missing from the receipts people actually read, and the Rules page says the item id is "on every receipt".**

Where:
- `editions/hisaab/app/ui/receipt.tsx:57–61` (foundation): the RECEIPT row has the journal number and no item id.
- `screens/route/card.tsx:268` `h-cardres__actions` (route lane): no report link and no id.
- `screens/room/receipt.tsx:314` `h-rreceipt__actions` (duel lane): the same.
- `screens/pass/index.tsx:453` (duel lane): the same.
- The false claim itself is at `screens/rules/index.tsx:494` ("its id is on every receipt, like hsc001") and `screens/rules/report.tsx:77` ("(on every receipt, e.g. hsc001)").

The id appears only on the taster, the Vault detail, the finish strip and the share card.

Why: bible §11.17 makes "Report an error" the trust primary. A named person or reader who spots an error on a route or duel receipt has no id and no link.

Fix:
- `Receipt`: when `item` is set, print `F.No. ${item.id.toUpperCase()}` in the RECEIPT row. It is mono and Latin, beside `RECEIPT #0001`.
- In `CardResult` and `RoundReceipt` actions, add a ghost link:
  ```tsx
  <Button variant="ghost" size="s" href={`${href.rules()}${queryString({ s: 'report', id: item.id })}`} icon={<Flag size={18} strokeWidth={2.4} />} trailing={null}>{t('Report an error', 'ग़लती बताओ')}</Button>
  ```
  Keep one violet primary per screen.

**P1-7. There is no private corrections or right-of-reply channel.**

Where: `editions/hisaab/app/screens/rules/report.tsx:20` (`CORRECTIONS_EMAIL = null`), line 139 ("Copy the report and send it however you reach us"), and `REASONS` at lines 22–28. The me lane owns the file; the address itself is an owner decision.

What: the only working route is a **public** GitHub issue that needs an account. "However you reach us" points nowhere: no address or form is published anywhere in the app.

Why:
- A person named in a case item, or their lawyer, needs a non-public way to ask for a correction or to add their reply.
- Charter §2.3 makes the reply part of the fact.
- This is the minimum defamation-risk hygiene for a site naming living people.

Fix:
- The owner publishes a corrections address. Set `CORRECTIONS_EMAIL` so the "Mail draft" button appears.
- Replace "however you reach us" with that address.
- Add a reason `{ id: 'reply', en: 'I am named in this question — my reply', hi: 'इस सवाल में मेरा नाम है — मेरा जवाब' }`.
- In Rules §10, add one line: "Named in a question? Write to <address>. We add your reply to the item and log the change."

**P1-8. Withdrawn items keep being shown as fact and dealt as quizzes.**

Where (me lane):
- `editions/hisaab/app/screens/receipts/lib.ts:307–309` (`reviewQueue` keeps any row with four options, including `withdrawn`);
- `screens/receipts/detail.tsx:42–60, 105–110` (a withdrawn row still shows "Answer ✓ …" and the old explanation);
- `screens/receipts/index.tsx:81` (the stem).

What:
- The journal's own copy has no `status`.
- An item pulled for being wrong or unfair keeps appearing on every player's device indefinitely. It still has a ✓ answer, no legal block, and is still playable in Dobara Jaanch.
- The corrections log is empty today, so the risk is latent. It fires with the first withdrawal.

Why: charter §2.2 and §2.3, and the Corrections promise. Continuing to display withdrawn content is the problem a withdrawal exists to stop.

Fix:
- `reviewQueue`: `rows.filter((r) => r.options.length === 4 && !r.withdrawn)`.
- `ReceiptDetail`: when `row.withdrawn`:
  - render only the kicker, the stem wrapped in `<del>`, and the note "Withdrawn from the files — see the Corrections log", linking to `href.rules('corrections')`;
  - hide the Answer block, the noting and the Open-source button.
- Vault row: show "Withdrawn question" in place of the stem.

### P2 — backlog

**P2-1. The challenge-share copy says "no answer", but the status line (which must travel) often gives it away.**

Where:
- `screens/receipts/detail.tsx:131` ("Send as a challenge (no answer)");
- `screens/aaj/index.tsx:365` ("sends the question without its answer").

Example: `hfw035`'s challenge card prints "Deepfake per Factly…" in its legal block (`card-hfw035-challenge.png`). Legal wins, so keep the status.

Fix: change the copy to "Send as a challenge (answer not marked; its legal status goes with it)" / "without marking the answer".

**P2-2. The match-result share text drops "· BOT".**

Where: `screens/room/result.tsx:165–181` ("Beat Babu-Bot 2–1 on HISAAB DO.").

This is N7 outside the app: a forward should not read as beating a person.

Fix: `Beat Babu-Bot · BOT (picks at random) ${mine}–${theirs} on HISAAB DO.` Make the same change on the loss and draw lines.

**P2-3. The certificate can label a private individual.**

Charter §2.7 and §1 say the satire is never aimed at a private citizen. The name field accepts anyone's name, and the certificate does not say the name is self-chosen.

Where: `screens/me/name-field.tsx:49–56`, `ui/certificate.tsx:63–66` and `share/card.ts:706–720`.

Fix:
- Add a field hint: "Your own name or a nickname — never someone else's."
- Print "(name as typed by the holder)" in 14 px ink-2 under the certify line, in both the frame and the PNG.

**P2-4. The certificate PNG's "Satire. Not a government document." is 24 px mono ink-2 on a 1080 px card.**

That is about 8 px when the forward is viewed on a phone.

Where: `share/card.ts:805–809` (footer) and `686–700` (header).

Fix:
- Draw the footer at 30 px in `t.ink`.
- Make the header `CERTIFICATE OF LABELLING · SATIRE`, so the disclaimer survives a crop to the top half.

**P2-5. In duels the other side sits behind a tap.**

Where: `screens/room/receipt.tsx:297–301` (the noting is collapsed, "Read the noting"). Dobara Jaanch opens it only when the answer was wrong (`dobara.tsx` `defaultOpen={!right}`).

Fix: `defaultOpen={!!item?.status}` in both places, so that for case items the explanation, which carries the denial or clearance, is visible. Once P1-2's `otherSide` lands, it shows in the receipt anyway.

**P2-6. The name hint on Me says "Stored on this device only."**

It is also shown to a friend in a duel room. Settings already says so.

Where: `screens/me/name-field.tsx:56`.

Fix: "Stored on this device; shown to a friend in a duel room." / "इसी फ़ोन पर; मुक़ाबले में दोस्त को दिखता है।"

**Concur with advisor-loop1, not re-listed:**
- P2-6: older-rung certificates print today's date as ISSUED and today's receipt count.
- P2-10: "same for everyone today" uses the local date.
- P2-11: "Image saved · text copied ✓" appears even when the copy failed.

All three are small factual inaccuracies in UI copy.

---

## Gate audit (what passes, with evidence)

| Check | Result | Evidence |
|---|---|---|
| Status verbatim + as-of + neutral chip on primary receipts | **pass** | `ui/receipt.tsx:80–84` → `LegalStatus` (`ui/chip.tsx:67–82`). It is used by the route card, Aaj, the taster, the duel and P2P round receipt, the Pass & Play reveal, Dobara, the Vault detail, the finish strips (`route/receipt-strip.tsx:97`) and the Kiska/Forward registers (`files/register.tsx:181`). `01-taster-receipt-legal.png` and `09a` show it in 8 cells plus Hindi, with "Sep 2026 तक" and the status kept `lang="en"`. |
| One neutral token pair for every status | **pass** | `.h-chip--legal` and `.h-legal` use only `--h-legal` / `--h-legal-ink` (`ui/chip.css:29–85`), in both themes. |
| Recap surfaces keep the status | **fail** | P0-2 (result and Pass & Play minis), P1-1 (Vault rows). |
| Share cards keep the status, both variants | **pass** | 970 of 970 cards audited. The text twin (`share/index.ts:52–61`) carries `Status:` / `Legal status:` with "(as of …)". |
| A share never states a wrong option as fact | **pass** | The receipt variant prints only `options[correctIndex]`. The challenge variant prints all four options unmarked, with no ANSWER on any of the 970 cards. |
| The other side travels with a share | **fail** | P1-2. |
| Certificate name rule (bank people → Anonymous Janta) | pass to the letter, **fail on the gate** | P0-1. |
| Labels never applied to real people / parties / outlets elsewhere | **pass** | Labels render only for the player's own standing (top bar, Home, Me, Aaj, the taster). Duel seats, TARAZU pans and the P2P lobby carry names, never labels. Kiska Media prints outlet names as plain mono chips (`1440x900-dark/10-kiska-media.png`). |
| No party symbols, colours, emblem, logos or India outline | **pass** | Emoji scan of the edition: only ✅ ❌ ↗ ⏳ ↔. No emoji in the bank. The 70 lucide icons were checked against ECI symbols: no lotus, hand, broom, bicycle, elephant, clock, bow, lantern, sun-over-hills or leaves. `favicon.svg` is a manila file with tape and a stamp. The manifest and theme colour are the ground grey. The cartogram is a tile grid (`360x740-dark/13-cartogram.png`). The 3D scenes have no map or emblem. Watch item: `Swords` on the taster CTA is generic, but avoid it on any party-context surface. |
| Government-document styling | **pass** (see P2-4) | The certificate says "Satire. Not a government document." in the frame (`ui/certificate.tsx:18`) and in the PNG. There is no seal, letterhead or "भारत सरकार". |
| Bot always labelled | **pass** (P2-2 outside the app) | `data.ts` `BOT_NAME`/`seatName`. The disclosure line appears on setup, countdown, receipt and result, and the randomness is on the Rules page. TARAZU pan names fit ("Babu-Bot · BOT" is 14 characters and the pan limit is 14). |
| No fake presence or counts | **pass** | There are no live counts. Duel topic chips show real bank counts with "Numbers are the questions in each file". The P2P lobby shows only transport and seat state. |
| No third-party requests in solo play | **pass** | 0 non-site requests across all 8 cells and the flows. The fonts are self-hosted. |
| P2P trust copy honest | **fail** | P1-4 (ranking), P1-5 (servers and IP). "Casual · trust-based" with the forgeable-times disclosure is shown on setup, lobby, countdown and result. |
| Rules: editorial policy | **pass** (P0-3 open) | Sections 1–6 and 9: sourcing order, the nine status words, "Nobody named here is guilty unless convicted.", the other side, balance with live `govt` counts, distractors never smear, the §4b.1 exception, timing vs motive ("vote-buying" only ever quoted), and the art policy. |
| Rules: corrections route | **partial** | The Corrections log is honest: it is empty and says so, and no entry is invented. The change log is dated. The report form builds a prefilled public issue and warns about private people. Gaps: P1-6 and P1-7. |
| Charter §2 / §4b in UI copy | **pass** | A grep of all edition UI copy finds no "revdi / freebie / vote-buying / bribe / loot / stole / corrupt / guilty" outside the Rules definitions. Money-mode copy is neutral. `pollLine` is timing and result only. |
| §2.7 private individuals | **pass** in content surfaces; P2-3 on the certificate | The report text asks for no personal details about private people. Pass & Play and P2P names are the players' own choice. |
| N5 / no shaming | **pass** | Decline and leave buttons are neutral ("Keep", "Stay", "Not now"). |
| Withdrawn content | **fail** (latent) | P1-8. |

---

## Requests to other lanes (I edit no app code)

- **Foundation:**
  - P0-1: `data.ts` and a new `public-names.ts`, plus tests;
  - P1-6: the `ui/receipt.tsx` id.
- **Duel:** P0-2 (`room/result.tsx`, `pass/index.tsx`), P1-6 (`room/receipt.tsx` link), P2-2, P2-5.
- **Me:** P0-3, P1-1, P1-2 (share), P1-7 (copy and reason), P1-8, P2-1, P2-3, P2-4, P2-6; P1-4 and P1-5 copy on the Rules page.
- **Files:** P1-3.
- **Route:** P1-6 (`route/card.tsx` link).
- **Engine / P2P:** P1-4 (`p2p` flag and the default-preserving progression option), P1-5 (optionally pin relays and ICE); `P2P_TRUST` copy.
- **Editorial (bank):** `otherSide` field (P1-2); names-only `public-figures.mjs` (P0-1).
- **Owner:** the corrections address (P1-7).
