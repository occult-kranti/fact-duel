# HISAAB DO — the app foundation (for screen engineers)

Everything the screen lanes build on. Read with `docs/hisaab/design-bible.md` (the look, §11 per
screen, §9 the notification budget, §10 the 3D rules), `docs/hisaab/ENGINE.md` (the engine API) and
`docs/hisaab/CHARTER.md` (wins on conflict). Load the `hisaab-design` and `juice` skills first.

```
editions/hisaab/
  index.html, main.tsx        entry: theme before first paint, font preloads, mounts app/app.tsx
  public/                     favicon.svg (LAL FEETA mark), manifest.webmanifest
  edition.ts                  EDITION, ROUTES, routesOfKind, routeById, standing, todaysFive, DUEL_FORMATS,
                              MONEY_MODES, moneyRoutes, yearRoutes, routeForYear, MONEY_ERAS …
  theme/tokens.css            the --h- tokens (design lane; do not edit)
  app/
    app.tsx                   providers + the shell
    router.ts                 hash router: useRoute, navigate, Link, href, parseHash, absoluteUrl
    budget.ts                 the notification budget: useBudget, useQuietRound, useHoldToasts, useVisit …
    data.ts                   bank + label + legal helpers (itemById, statusLine, sourceKind, seatName …)
    base.css, fonts.css       global layer and self-hosted fonts (foundation; do not edit)
    shell/                    top bar, nav/rail, theme, player context, chrome, fx bridge, progression watch
    ui/                       the component library (ui/index.ts)
    three/                    TIJORI, TARAZU, THAPPA, FILE PILE (+ SceneHost) — 2D stubs, final props
    share/                    shareReceipt, shareDailyGrid, shareCertificate, shareInvite — text stubs
    screens/<name>/index.tsx  one lazily loaded module per screen (STUBS until each lane lands)
```

## Lanes, files and ports

Each lane edits **only** its own files. Need a change in a shared file (ui/, shell/, budget, data,
router, base.css)? Wrap it locally in your screen folder and list the request in your report.

| lane | owns | dev port |
|---|---|---|
| foundation | `app.tsx`, `router.ts`, `budget.ts`, `data.ts`, `base.css`, `fonts.css`, `shell/**`, `ui/**`, `README.md`, `main.tsx`, `index.html`, `public/**` | 5181 |
| home | `screens/home`, `screens/start` | 5182 |
| files | `screens/files` (hub, cartogram, sectors, Kiska Media?, Forward Court), `screens/money` (money-trail hub, the three modes, Saal-dar-Saal) | 5183 |
| route | `screens/route` (route player + route finish), `screens/aaj`, `screens/taster` | 5184 |
| duel | `screens/duel` (setup + P2P lobby), `screens/room` (live duel, round receipt, match result), `screens/pass` | 5185 |
| me | `screens/me` (profile, ladder, certificate), `screens/receipts`, `screens/settings`, `screens/rules`, `share/**` | 5186 |
| three | `three/**` (keep the props below) | 5187 |

Run your own dev server: `pnpm dev:hisaab --port <PORT> --strictPort`
(→ `http://localhost:<PORT>/fact-duel/hisaab/`). Build without colliding with other agents:
`HISAAB_OUT=/tmp/<you>/dist pnpm build:hisaab`. The component gallery is at **`#/dev/ui`** and the
engine's debug page at **`#/dev`** (neither is linked).

## Where CSS goes

- One CSS file per screen/component, **next to it**, imported from the component
  (`import './home.css'`). Classes are `h-<screen>-…` (e.g. `h-home__label`), tokens only (`--h-…`
  from `theme/tokens.css`): no raw hex, no Tailwind utilities, no `fd-` classes, no `!important`.
  `tests/hisaab-ui-foundation.test.mjs` fails on raw hex, `fd-` and `!important` anywhere in the edition.
- Mobile first; breakpoints 600 / 900 (bottom bar ↔ rail) / 1200; `100dvh`, never bare `vh`; targets
  ≥ 44px; inputs ≥ 16px; sentences ≥ 14px (`--h-fs-xs`); no horizontal overflow at 320–414px.
- Global helpers from `base.css`: `.h-sr` (visually hidden), `.h-kicker`, `.h-mono`, `.h-tnum`,
  `.h-display`, `.h-meta`, `.h-link` / `.h-link--tap`, `.h-stack`, `.h-row`, `.h-grid` (set `--h-gap`,
  `--h-min`), `.h-hi`. The `--fx-1…5` particle palette is re-inked to manila/syahi/tape/paper/brass.
- `<html>` carries `data-theme="light|dark"` (always the resolved theme), `data-theme-pref`,
  `data-motion="reduced"` (Effects = Reduced or Off), `data-effects="full|reduced|off"`, `lang`,
  and `data-chrome="full|top|none"`.
- Put an animated stamp inside a container with class **`h-stamp-stage`** (clips sideways): the slam's
  1.6× frames would otherwise scroll a phone page sideways for 400 ms.

## The router (`app/router.ts`)

Hash routes (static Pages site, every URL survives a reload). Every screen gets `{ route }`
(`ScreenProps`):

```ts
type AppRoute = { name; view; params; query; path; hash; tab; chrome };
const route = useRoute();                   // re-renders on hash change
navigate(href.route('state-up'));           // push; navigate(x, { replace: true }) for filters/redirects
<Link to={href.files('states', { s: 'UP' })}>Uttar Pradesh</Link>
goBack('#/files');                          // back inside the app, else the fallback
absoluteUrl(href.taster('hsc001'))          // https://…/fact-duel/hisaab/#/q/hsc001 (for shares)
```

| hash | screen (`name` / `view`) | nav tab | chrome |
|---|---|---|---|
| `#/` | home | home | full |
| `#/start` | start (first run) | — | top |
| `#/files`, `#/files/states` · `sectors` · `media` · `forwards` | files / hub · states · sectors · media · forwards | files | full |
| `#/money`, `#/money/distribution` · `relief` · `pre-election` · `years` | money / hub · … · years | files | full |
| `#/route/:id` | route (`params.id` = route id) | files | full |
| `#/aaj` (also `#aaj`) | aaj | home | full |
| `#/q/:id` (also `#q=<id>`) | taster (`params.id` = bank item id) | home | full |
| `#/duel`, `#/duel/friend?code=` | duel / setup · friend (P2P lobby) | duel | full |
| `#/duel/pass` | pass | duel | none |
| `#/room` | room (live duel) | duel | none |
| `#/receipts` | receipts | receipts | full |
| `#/me`, `#/me/certificate` | me / profile · certificate | me | full |
| `#/settings` | settings | me | full |
| `#/rules?s=` | rules | me | full |
| `#/dev`, `#/dev/ui` | engine debug · component gallery | — | none · full |

`href.home/start/files/money/route/aaj/taster/duel/friend/pass/room/receipts/me/certificate/settings/rules`
build these. `parseHash(hash)` is pure (tested). `route.path` (no query) is the **visit key** for the
notification budget; a query change is not a new visit.

## The shell (`app/shell/`)

- **Top bar** `h-top`: wordmark हिसाब दो (→ Home), level chip (→ Me; "LV 7", the label from 600px),
  mute (`lib/fx/prefs` sound), settings (→ `#/settings`). Safe-area aware.
- **Nav** `h-nav`: bottom bar on phones, 88px rail at ≥ 900px: Home, Files, Duel, Receipts, Me.
  Hidden when chrome is `top`/`none` and while a ceremony is open (the rest of the page is `inert`).
- `useChrome(mode | null)` (`shell/chrome.tsx`): override the route's chrome while mounted — e.g. the
  duel lobby's 3·2·1 calls `useChrome('none')`; `null` restores the default.
- `useScreenTitle('Rajya Rounds')` → `document.title = 'Rajya Rounds · HISAAB DO'`.
- `useTheme()` (`shell/theme.ts`): `{ pref: 'light'|'dark'|'system', resolved, setTheme }` — for Settings.
- **Player**: `useAppPlayer()` (`shell/player.tsx`) is the app's one `usePlayer()` (profile, progression,
  journal, dispatch, fold, exportAll, clear, …; see ENGINE §10). **Never call `usePlayer()` in a
  screen** (a second instance double-counts the analytics heartbeat). To file a duel room to the
  profile: `useRecordRoom(room, epoch)` with the `player.epoch()` captured when the room was created.
  Pass & Play never records.
- The shell mounts the toast and ceremony hosts and a **progression watcher**: a new band → the
  `label` ceremony; quests done / a CL used → the visit's toast; level-in-band, Stamp Register,
  Babu rank, streak → Activity (in place). Screens do not re-implement this.
- A screen that throws shows "File missing. Babu is on leave." + Retry; the rest of the app lives.
- The shell reserves JHK's Google-Fonts Devanagari link id with an inert placeholder: the edition
  self-hosts Mukta/Akshar, so the Hindi locale makes no third-party font request.

## The notification budget (`app/budget.ts`) — binding

```ts
const b = useBudget();
b.toast({ title: '+2 quests · 110 XP', body: 'Aaj ke 3 kaam', tone: 'quest' });   // → id | null
b.ceremony({ kind: 'file', kicker: 'File cleared', title: 'Uttar Pradesh ki file clear.',
             stamp: 'FILE CLEARED · 18/24', seed: route.id });                    // → id | null
b.note('Best: 14 → 18');                  // an in-place update, logged to Activity only
useQuietRound(live);                      // countdown → round.result (and the pass-and-play hand-over)
useHoldToasts(onCard);                    // untimed route cards: toasts/ceremonies wait for the finish
useVisit(sheetOpen, 'receipt-sheet');     // a sheet counts as a new visit while open
const activity = useActivity();           // Profile › Activity (newest first)
const live = useLiveRound();              // true while a round is live
```

- **Toasts: ≤ 1 per screen visit.** While the visit's toast is waiting or up, later asks merge into it
  (`merge(items)` on the first ask writes the words; default "first · +n more"). After it is dismissed,
  later asks go unshown to Activity. A toast still waiting when the player leaves is logged, not carried.
  Settings › Quiet everything → `budget.setToastsOff(true)` (every toast goes to Activity).
- **Ceremonies: only `label` and `file`.** Anything else (`level`, `achievement`, `stamp`, `streak`,
  `rank`) returns null and is logged. A label + a file pending together become **one** ceremony with two
  stamps (label first). Raise `file` only for the FIRST clear of a state/sector/Kiska/Forward file;
  replays update in place ("Best: 14 → 18"). Match result: raise nothing — the watcher raises `label`;
  hold `useHoldToasts(true)` for ~1.2 s after the result renders if it must wait.
- **Quiet:** while live, nothing opens and `three/SceneHost` refuses to mount; the fx layer's own budget
  is quieted too. `useJuice().toast/ceremony` are routed into this budget by the shell's bridge, but
  call `useBudget()` directly. `useJuice()` stays the API for sound/haptics/particles (skill `juice`).
- Inline, never toast: "Copied ✓" on the button, offline banners, errors. Never: push, badges, "come
  back", streak-risk copy, sound before the first tap, auto-queued next duel.

## Data helpers (`app/data.ts`)

| export | what |
|---|---|
| `BankItem` (type), `BANK_ITEMS`, `itemById(id)`, `itemForCard({ factId })` | the bank, typed |
| `statusLine(item)` | the legal status **verbatim**, or null |
| `statusWithAsOf(item)` | `"<status> (as of Sep 2026)"` — for shares and aria text |
| `asOfText(asOf, locale)`, `monthLabel('2026-09')`, `formatNumber(n)` (en-IN) | dates, numbers |
| `sourceKind(item)`, `SOURCE_KINDS`, `SOURCE_KIND_TEXT`, `sourceHost(url)` | COURT · CAG · SANSAD · PIB · ECI · RBI · AGENCY · OFFICIAL · FILING · RESEARCH · FACT-CHECK · PRESS |
| `stateName(code)` ('IN' → 'Centre'), `stateNameHi`, `STATE_NAMES_HI`, `STATE_CODES` | states |
| `SECTOR_LIST`, `SECTOR_NAMES_HI` | sectors (Hindi names are drafts for review) |
| `CARTOGRAM` (7×7 rows), `CARTOGRAM_CENTRE` | the records-room layout (bible §11.3) |
| `standing(xp)`, `labelFor(band)`, `labelForLevel`, `LADDER` | label maths (from edition.ts) |
| `labelDisplay(band)`, `LADDER_DISPLAY`, `FIRST_LABEL_NOTE` | `{ hi, en, aside?, line, hinglish, from, to }` |
| `goalCopy(xp)`, `bandProgress(xp)` | "2 levels to …" → "180 XP to …" → "One good file away."; `{ value, max: 5 }` |
| `BOT_NAME` ('Babu-Bot · BOT'), `BOT_LINE`, `seatName(player)`, `ANONYMOUS` | the bot is always labelled BOT |
| `babuRank(tier)`, `BABU_RANKS`, `BABU_RANK_LADDER` | LDC → Section Officer → Under Secretary → Joint Secretary → Secretary |
| `CONFIDENCE_DISPLAY` | Shayad +2/0 · Lagta hai +3/−1 · Pakka +4/−3 (engine ids and points) |
| `enactedLine(e)`, `pollLine(item)`, `govtText(govt)` | money-trail rows: "Name · Role · Party"; "MP Assembly 2023 · 160 days before polling · BJP won 163 of 230" |
| `normalizePersonName`, `isBankPerson`, `mentionsBankPerson`, `certificateName(name)`, `NAME_MAX` | a name that is (or contains) anyone in the bank's `people`/`enactedBy` prints "Anonymous Janta" |

## Routes, including the money trail (`edition.ts`)

`ROUTES` holds, in order: states (`kind: 'state'`), sectors, Kiska Media, Forward Court, then the
money trail — `kind` `'distribution' | 'relief' | 'pre-election'` (from item `tags`) and `'year'`.

- `moneyRoutes(tag)` → for that tag: `scope: 'all'` (id `money-<tag>`), then each **era** with ≥ 6
  items (`money-<tag>-2020-2026`, `era`, `years: [from, to]`), then each **state** with ≥ 6 (the Centre
  first: `money-<tag>-in`, `money-<tag>-mp`, `state`). Six cards, never padded; `poolSize` is the slice.
  `MONEY_MODES` (title, `titleDevanagari`, gloss, line), `moneyMode(tag)`, `MONEY_ERAS`, `MONEY_YEARS`.
- `yearRoutes()` → Saal-dar-Saal: one per year with ≥ 6 items (`year-2019`); thinner adjacent years are
  merged into a labelled range (`year-2004-2010`, `merged: true`, `years: [2004, 2010]`, title
  '2004–2010', subtitle "2004 to 2010 share one file: 7 cards between them."). Never padded with other
  years. `routeForYear(y)` finds the file holding a year. `YEAR_MODE` has the copy.
- A route is played exactly as ENGINE §7 shows (`request({ action: 'expedition', routeId })`).

## Components (`app/ui/`, import from `ui/index.ts`)

| component | props (all typed in the file) |
|---|---|
| `Button` | `variant: 'primary' \| 'paper' \| 'ghost'` (ONE primary per screen), `size: 'm' \| 's'`, `icon`, `trailing` (default arrow on primary; `null` = none), `block`, `busy`, `href` (renders `<a>`) or button attrs. `buttonClass(...)` for other elements. |
| `IconButton` | `label` (required), `icon`, `href?`, `pressed?` — 44 × 44 |
| `FileCard` | `fno`, `title`, `titleHi?`, `meta?`, `icon?`, `state: 'sealed' \| 'open' \| 'cleared'`, `progress?: { value, max, label, copy? }`, `tape?`, `tapeSnapping?`, `emphasis?` (shadow-3), `seed?`, `clearedText?`, `children?`, `href` \| `onClick`, `current?`, `ariaLabel?` — whole card is the link; nothing interactive inside |
| `Tape` | `state: 'idle' \| 'snapping'`, `placement: 'card' \| 'edge'`, `onSnapped?` |
| `Option` / `OptionList` | `OptionList { options, chosen, correctIndex (ONLY after the result), onChoose, disabled, keys (1–4 / A–D), label }`; `Option { index, label, state }`; `optionState(i, chosen, correct)`; states idle · locked · correct · wrong-chosen · correct-unchosen · other. Live-surface safe (no mount animation). |
| `ConfidenceSwitch` | `value: 'steady' \| 'bold' \| 'called'`, `onChange`, `disabled?`, `legend?` |
| `Stamp` | `kind: 'pass' \| 'fail' \| 'wait' \| 'noted'`, `seed` (item id → tilt), `text?`, `size: 's' \| 'm' \| 'l'` (l on manila), `animate?` (never on the live surface), `label?` |
| `Receipt` | `item` (BankItem), `receiptNo?`, `xp?`, `xpNote?`, `otherSide?`, `printing?`, `extra?`. Rows: RECEIPT # · XP / SOURCE (chip + label ↗) / STATUS (legal block + as of) / OTHER SIDE / GOVT THEN / ENACTED BY / RESULT (outcome + poll line) |
| `NotingSheet` | `children`, `title?`, `collapsible?` + `summary?` ("Read the noting"), `defaultOpen?`, `hand?` (one Kalam line; font lazy) |
| `Chip`, `SourceChip`, `GovtChip`, `LegalStatus` | `Chip { kind: 'legal' \| 'source' \| 'govt' \| 'kind' \| 'plain', icon? }`; `SourceChip { kind }`; `GovtChip { govt, bare? }`; `LegalStatus { status, asOf }` — neutral for every status |
| `Meter` | `value`, `max`, `label` (aria), `ticks?`, `copy?` (goal-gradient slot), `valueText?` |
| `Tile` | `code`, `name`, `state: 'sealed' \| 'progress' \| 'cleared'`, `progress?: { done, total }`, `selected?`, `onSelect?`, `showName?`, `wide?` (the Centre drawer); `tileLabel(...)` |
| `Certificate` | `name` (raw — the frame applies `certificateName`), `receipts`, `band`, `issuedOn`, `fno?`, `id?` (for PNG capture). Always light, 4:5, scales with its container. |
| `Poster` | `hi`, `en`, `swipe?` (one word), `overprint?`, `as?`, `size?` — the ONE poster line per screen |
| `Page`, `ScreenHeader` | `Page { width: 'wide' \| 'read' \| 'play', screen (data-screen id) }`; `ScreenHeader { kicker?, titleHi?, title (h1), lead?, aside?, id? }` |
| `EmptyState`, `ErrorState`, `InlineNote` | `{ line, action? }`; `{ title?, detail?, onRetry? }` ("File missing. Babu is on leave."); inline status notes |
| `Skeleton` | `lines?`, `label?` — ruled paper, no shimmer |
| `Hi`, `Kicker`, `Mono`, `SrOnly` | `lang="hi"` span; mono kicker (author writes the case); tabular mono; visually hidden |
| `useLang()` | `{ locale, isHi, setLocale, t(en, hi?) }` — Hinglish stays Latin in English; Devanagari UI in Hindi |
| `loadHandFont()` | lazy Kalam |
| `ToastHost`, `CeremonyHost` | mounted by the shell — never render them yourself |

## Set pieces (`app/three/`) — stubs with FINAL props

Each renders its 2D fallback today through `SceneHost`; the three lane plugs a lazy Rapier scene in
(default the `scene` prop to a module-scope `React.lazy`) without changing callers. `SceneHost` renders 2D when a round is live (and unmounts a
mounted scene), when Effects ≠ Full, with Save-Data, with `deviceMemory < 4`, and keeps one canvas at a
time. Every box is `role="img"` with the true numbers.

| component | props | a11y label |
|---|---|---|
| `Tijori` | `count`, `newCount?` (≤ 12 animate), `height?`, `scene?` | "Tijori: 214 receipts. 1 coin = 1 sourced receipt. Not money." |
| `Tarazu` | `scores: [a, b]`, `names: [a, b]` (use `seatName`), `winner: 0 \| 1 \| null`, `height?`, `scene?`; angle = diff × 6°, max 24° (`tarazuAngle`) | "Scale tips to You: 2 rounds to 1." |
| `Thappa` | `text`, `kind`, `seed?`, `onDone?`, `height?`, `scene?` | "Stamped: ISSUED — …" |
| `FilePile` | `results: ('pass' \| 'fail' \| 'wait')[]` (six), `title`, `score?: { got, max }`, `height?`, `scene?` | "File cleared: Uttar Pradesh, 18 of 24." |
| `SceneHost` | `label`, `fallback`, `scene?` (a `lazy(() => import('./x-scene'))` made at module scope), `props?`, `height?` | — |

## Sharing (`app/share/`) — stubs with FINAL signatures

```ts
shareReceipt(item, 'challenge' | 'receipt'): Promise<ShareOutcome>   // text today; PNG card = Me lane
shareDailyGrid({ day, results: boolean[], label }): Promise<ShareOutcome>
shareCertificate({ name, band, receipts, issuedOn, node? }): Promise<ShareOutcome>
shareInvite(code, { format? }): Promise<ShareOutcome>
// text builders: receiptShareText, dailyGridText, inviteText, certificateShareText; whatsappUrl(text); shareText(text)
type ShareOutcome = { ok: boolean; method: 'share' | 'clipboard' | 'download' | 'none'; reason? };
```

The receipt text carries the status line verbatim with its as-of date; the challenge variant has no
answer; every share ends "Satire. Every question sourced."; certificate names go through
`certificateName`. Show the outcome inline on the button ("Copied ✓"), never as a toast. The CTA is
`SHARE_CTA` ("Forward this — it's actually sourced").

## The live question (quiet surface) — checklist

Mount the card `visibility:hidden` until the double-rAF reveal marker (`useQuestionShown`), fixed option
order, no correctness styling before `round.result`, `useQuietRound(true)` from the countdown,
`useChrome('none')`, no `animate` stamps / tape / toasts / 3D / share buttons during the round, only
`tap`/`select` sounds. The timer is a 6px ink bar above the answers driven by rAF with `transition: none`.

## Verify

`pnpm exec tsc --noEmit` (zero errors in your files) · `node --test tests/hisaab-*.test.mjs` ·
screenshot your screens at 360×740, 390×844, 414×896 and 1440×900, light and dark (Chromium lives at
`/opt/pw-browsers`; see `scripts/screens.mjs`) and **read the PNGs**; no horizontal overflow, no
console errors. Kill your dev server when done.
