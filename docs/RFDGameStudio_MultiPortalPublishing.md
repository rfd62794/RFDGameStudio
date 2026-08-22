# RFDGameStudio — Multi-Portal Publishing Readiness

*v0.1 | August 2026 | Living reference — the full platform list plus the real engine-compatibility gameplan for approaching them. Companion to `RFDGameStudio_ExternalToolingCatalog.md`.*

---

## Part 1 — The Full Platform List

Every entry below is real, found via direct research, not inferred. Organized by real, distinct business model — this matters, because "publish everywhere" isn't one decision, it's several different kinds of deals.

### Tier 1 — Large-audience ad-revenue portals, real curation bar

| Platform | Real details |
|---|---|
| **Poki** | Amsterdam, est. 2014. Largest HTML5 portal by traffic — hundreds of millions of monthly plays. Real, open SDK docs. **Curated intake — apply and wait for invitation**, not open upload. Requires `gameplayStart`/`gameplayStop` + `commercialBreak`/`rewardedBreak`. |
| **CrazyGames** | Belgium, est. 2014. Confirmed 20M+ player reach. Open developer portal, more accessible than Poki (source notes this trades off against acceptance standards). Explicitly supports "any framework that outputs to HTML5." Has a curated kids sub-version with restricted ad categories. |
| **Coolmath Games** | Named directly alongside Poki/CrazyGames as one of "the three serious HTML5 portals in 2026." |

### Tier 2 — Older, larger, more open archive-style portals

| Platform | Real details |
|---|---|
| **Y8** | One of the oldest surviving portals. Real 30M-player network. Transparent revenue split (50% page-ad revenue without SDK, 50% in-game-ad revenue with SDK, +10% multiplayer bonus, +5% featured-ad bonus). **Confirmed: no exclusivity requirement** — publish elsewhere too, no penalty. |
| **Armor Games** | Established, real. Genre-fit note: specifically strong for adventure/puzzle games. |
| **Kongregate** | Real, still operating despite well-documented decline. Ads + microtransactions, badges/leaderboards already researched separately. |
| **Newgrounds** | Real, still active creator community. Native Medals API (achievements) — the one portal in this list with a real, documented achievement system of its own. |

### Tier 3 — B2B distribution / syndication networks

*Different model entirely — these embed your game into other websites/apps rather than being a single destination.*

| Platform | Real details |
|---|---|
| **GameDistribution** | Open submission (similar model to CrazyGames), own SDK requirements, syndicates across many smaller sites. |
| **GamePix** | Italy-based. Real B2B model — publishers embed GamePix's catalog via API/SDK. Real partner portal confirmed live (`partners.gamepix.com`). |
| **Gamezop** | Similar curated-catalog + ad-revenue-share B2B model, "integrate a full gaming experience within minutes." |
| **Famobi** | Real, 300+ game catalog, also offers whitelabel HTML5 portals for high-traffic sites to license and monetize. |
| **MarketJS** | B2B licensing, custom HTML5 dev, branded gaming experiences for enterprise/telecom clients. |
| **Bongiorno** | Italian company, part of NTT Docomo (Japan). Runs B!Games, Giochissimo, GamiFive — subscription-model, real mobile-carrier-billing distribution network. A genuinely different monetization category (carrier billing, not ads). |
| **Play.im** | Real, owns Yepi, Bgames, Huz — 25M monthly unique users across the family, games partly sourced from GamePix. |

### Tier 4 — Regional / niche reach

| Platform | Real details |
|---|---|
| **Minijuegos family** | Minijuegos.com (Spain-focused), MiniPlay.com, Minigiochi (Italy), Minijogos (Brazil/Portugal) — one real publisher family with regional storefronts, 4.5M+ monthly users. MiniPlay specifically confirmed to have achievements + social features. |

### Achievement-capable platforms specifically, consolidated

Newgrounds (Medals API), Kongregate (Badges, staff-curated), MiniPlay (confirmed achievements), and **GameJolt** (self-service Trophies API — bronze/silver/gold/platinum, `Fetch`/`SetAchieved`/`RemoveAchieved`, real cross-engine plugin support) — GameJolt remains the strongest, most developer-controllable option of this group.

---

## Part 2 — Real Technical Requirements, Confirmed

**The common pattern across Poki and CrazyGames, confirmed directly and described as "conceptually identical" by a real, current source:**

- A **gameplay session hook**: `gameplayStart()` fires on first input or resume; `gameplayStop()` fires on any pause/menu/level-end/cutscene. Cannot double-fire (`gameplayStart` can't follow `gameplayStart`).
- An **ad-break hook**: Poki's `commercialBreak()`/`rewardedBreak()`; CrazyGames' equivalent midgame/rewarded ad calls. Triggered at natural pause points, never mid-action.
- **Runtime environment detection**: CrazyGames requires checking `CrazySDK.IsAvailable` (and a query-param fallback for iframed contexts) before calling anything — the same build must know whether it's running on the portal, on your own site, or on itch, and behave differently in each case.
- **Package format**: ZIP with `index.html` at root — matches the output shape your existing standalone build pipeline already produces for itch.
- **Framework support confirmed broad enough for this studio's real stack**: CrazyGames explicitly covers "any other framework that outputs to HTML5" — React/Vite output is not excluded.
- **Optional, portal-specific accounts**: CrazyGames offers its own account system for cloud saves/leaderboards — a separate, per-portal identity layer, not linked to Google Auth. Reinforces that the achievements system already scoped for your own site stays website-exclusive; portal-specific engagement features (if ever pursued) would need to use each portal's own account system separately.

---

## Part 3 — The Real Gameplan

**Core idea: one shared abstraction layer, not N separate integrations.** Matching this studio's existing `engine/shared/` philosophy — a single `portalAdapter` module that exposes a small, unified interface (`notifyGameplayStart()`, `notifyGameplayStop()`, `requestAdBreak()`), detects at runtime which environment the build is actually running in, and calls the right underlying SDK — or does nothing at all when running on your own site or itch, where none of this applies.

### Phase 1 — Build the adapter shell, zero real portal integration yet
- `engine/shared/portalAdapter/` — real, testable, pure detection logic (environment → portal identity) and a real, unified interface with no-op default behavior.
- Every call is safe to make unconditionally from any game — the adapter decides whether anything actually happens.
- Zero live game wiring yet — same discipline as `personGenerator`'s v1: build and test the shared piece before touching any live UI.

### Phase 2 — Wire the interface into one real game, prove it out
- Pick one already-standalone-build-ready game (the existing `STANDALONE_BUILD_GAMES` list in `registry.ts` is the real, natural starting pool) as the first real consumer.
- Call `notifyGameplayStart`/`Stop` at the same real state transitions already tracked internally (most games already have some notion of "playing" vs. "paused/menu") — this is presentation/telemetry wiring, not new game logic.

### Phase 3 — Real per-portal SDK adapters, one at a time
- CrazyGames first — broadest framework support confirmed, most permissive acceptance bar of Tier 1.
- Then Y8 — no exclusivity requirement, lowest real friction, transparent revenue terms.
- Poki last within Tier 1 — real, competitive curated intake; worth approaching once at least one portal integration is proven working elsewhere.

### What stays explicitly out of scope
- Achievements/identity systems remain website-only, per the already-locked decision — no portal account system gets wired to Google Auth or vice versa.
- No commitment to *which* portals to actually submit to — this gameplan is about engine readiness, submission/business decisions are separate and later.

---

## Changelog

| Version | Change |
|---|---|
| v0.1 | Initial. Full platform list across 4 tiers (major ad-revenue portals, archive-style portals, B2B syndication networks, regional/niche). Real technical requirements confirmed directly from Poki and CrazyGames docs. Three-phase gameplan: build a shared, tested `portalAdapter` abstraction first, prove it on one real game, then integrate real portal SDKs one at a time, cheapest/lowest-friction first. |

---

*RFDGameStudio | One adapter, many portals. Build it once, prove it once, then repeat cheaply.*
