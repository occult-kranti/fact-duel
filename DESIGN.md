# Team Pavilion

JHK is a cricket knowledge game made for a phone held in one hand. This direction expands Pocket Stadium into a personal and shared clubhouse: a quick solo over, a recognizable squad, and a finite team competition. It replaces the lime-led visual system with warm paper, deep ink and a decisive saffron action. Original stadium artwork and the one-tap solo contract remain product assets.

## Visual system

| Role | Colour | Use |
| --- | --- | --- |
| Paper | `#f7f1e6` | Warm page canvas |
| Surface | `#fffdf8` | Readable cards, forms and answer areas |
| Ink | `#122c35` | Headlines, structure and dark banners |
| Saffron | `#ffbd59` | The next primary action, always with ink text |
| Team teal | `#087f7a` | Identity fills, crests and non-text accents |
| Teal text | `#076f6b` | Small teal text and controls on paper |
| Muted ink | `#53656a` | Supporting text with readable contrast |
| Border | `#d9d9cc` | Quiet grouping and dividers |
| Error | `#b63d32` | Errors accompanied by clear text |

Measured WCAG relative-luminance contrast: ink on paper 13.00:1 and muted ink on paper 5.43:1. The lighter identity teal measures only 4.32:1 on paper, so it must not carry normal-sized text there. Teal text uses the darker token, measuring 5.34:1 on paper. Ink on saffron measures 8.82:1. Saffron does not carry white labels. Colour always has a label, icon or state equivalent; there is no claim that a colour causes retention.

Bricolage Grotesque supplies distinctive, compact headlines; Instrument Sans supplies calm readable body copy and controls; JetBrains Mono remains suitable for clocks, public tags and numeric receipts. All are already self-hosted. Display type has a short line length and generous line height. Body copy remains at least 14–16px on the main mobile tasks.

The visual signature is an original cricket crest inside a cloth-like team banner, a small stadium illustration and a concise scoreboard. This takes the transferable identity and collection mechanisms of clan games without copying Clash Royale assets, characters or screen composition. Decorative borders, crest depth and banner finishes never alter answers or scores. Timed questions remain visually stable.

## Mobile task hierarchy

Five compact navigation destinations: Play, Teams, Explore, My club and Answers. Existing route identities and deep links are preserved behind the clearer labels. Navigation says where a player is and stays reachable without opening a menu. Specialized controls stay in disclosures or captain settings, with status and recovery visible outside them.

Play has one primary Mini over action and a clear Full over alternative. Mini remains 3 rounds; Full remains 6. The original ground illustration is compact above or beside the start controls; it cannot push the first useful action far below a phone viewport. Team creation is optional and does not become an onboarding tax on solo practice. Headlines use plain cricket language: “One over. Make it yours.” and “Your people. Your innings.”

Teams begins with Create a team and Join with an invite. Creation asks for a name, a fixed capacity of 5 or 11, and a cosmetic banner. The service generates a unique public team tag. The tag is recognizable identity, not a secret join credential; invite codes are distinct. The captain sees the roster, capacity and invitation action before a competition is offered as ready.

Team home orders information by task: banner and public tag; roster `x / 5` or `x / 11`; next accepted fixture and contribution status; shared cabinet and optional settings. An incomplete squad sees a truthful preparation state, not an enabled competitive start that will inevitably fail. Empty states offer one useful next step. No fabricated rival activity, member avatars or scores appear as live information.

## Team match contract

Competitive fixtures require complete, equal-sized 5-versus-5 or 11-versus-11 squads. Roster snapshots lock on acceptance. Each frozen member plays one server-dealt Mini or Full over during a 24-hour fixture window; players do not have to be online simultaneously. Local practice history and browser XP are never competitive authority.

Correct answers decide the result first. Lower penalized elapsed time breaks a tied correct-answer total; wrong or missing answers contribute a 30-second penalty each. A remaining exact tie is a draw in a direct fixture. Missing member contributions are explicitly shown and score zero correct answers, with their stated time penalty. The fixture page shows completion, deadline, pending members, personal contribution and settled result. Starting an over explains the one-attempt rule before the answer clock begins.

A four-team knockout cup has two semi-finals and a final. Captains explicitly join. The owner starts only after four full squads enter. Seeds follow join order: 1 plays 4, 2 plays 3. An exact tied cup fixture advances the lower original entry seed; this deterministic rule is disclosed before entry and start, not hidden in a result. A team has one active fixture or cup at a time. Frozen lineups do not change when membership changes later.

## Identity and benefits

Team benefits are a shared public tag, preset banner, fixture history and cosmetic team milestones. A finished accepted member over earns 10 team points. At fixture settlement a team win adds 30 and a draw adds 15 when at least one member has completed an over; an entirely absent team receives no outcome bonus. Team levels rise at 100, 300 and 700 points. The Star crest unlocks at 100, Crown at 300 and the Legacy double-gold frame at level 4 / 700 points. The current earned state and next threshold are visible, and completed actions are recorded idempotently by the server. No reward requires posting to social media.

Personal Club points, browser-local titles, server human XP, team points and simulated coins retain explicit labels. They are not interchangeable. Team cosmetics do not change question access, timing, answer correctness, matchmaking odds or score. There is no purchasable performance advantage or real-money return.

Captain settings contain banner and team-name customization, deliberate Save, and clear roster controls. Active lineups remain locked through competition settlement. Public identity and private invite/recovery credentials are never combined in one share card. A team exit or captain change uses a deliberate action and explains its effect before confirmation.

## Layout and interaction

The first design target is 390×844, with a compact 320px layout and enlarged-text checks. Mobile uses 16px page gutters, 12–18px spacing, restrained 14–20px card radii, 48–56px primary controls and at least 44px chrome targets. Tap areas do not depend on tiny decorative icons. Fixed navigation accounts for the safe area and leaves room for scrolling content. Errors and busy states stay next to the action they qualify.

Desktop adapts the same information into a side rail and two content columns, rather than adding more required decisions. Team identity and roster occupy one column; next competition and contribution occupy the other. The shared action remains prominent. Very wide lines are constrained; forms remain comfortable to scan.

Motion is short and purposeful: a locked answer, completed contribution or settled win can receive feedback. Reduced motion preserves every state transition. Celebrations and GPU effects stay outside timed answer states. Network failure never converts an unknown server response into an invented success. Ad opportunities remain outside questions and disabled until existing operator requirements are met.

## Design and verification evidence

The editable local canvas at `docs/team-redesign/design-board/index.html` includes seven mobile states and a desktop adaptation. It offers 390px and 320px layout modes, copy editing, native form controls, a linked vector flow and clear illustrative-data labels. It is a design specification, not a functioning online team service. Application behavior and backend verification are recorded separately.

Figma file creation succeeded, but the Starter plan’s MCP quota blocked the first design-library discovery call. No team-screen layers were created in that blank file. `docs/team-redesign/FIGMA.md` records the exact tool boundary and fallback. Previous Pocket Stadium Figma boards remain historical references.

Research at `docs/team-redesign/RESEARCH.md` scopes official game mechanics, player reports, author resources and mobile accessibility guidance. Source-informed design decisions and AI panel reviews do not establish representative player preference, measured satisfaction or retention. Physical-phone testing and consented first-time-player research remain separate evidence.
