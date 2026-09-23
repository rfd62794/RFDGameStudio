# RFDGameStudio — Multi-Portal Publishing Readiness

*v0.2 — supersedes v0.1 (same week) | August 2026 | Living reference. Companion to `RFDGameStudio_ExternalToolingCatalog.md`.*

*Change from v0.1: real, live correction from Y8's actual developer dashboard — a real Shoal entry already exists there (Game ID 281135), with real, first-party SDK documentation that contradicts v0.1's characterization of Y8 as a lower-friction, SDK-optional portal. Corrected below, not glossed over.*

---

## Part 1 — The Full Platform List

*(Tiers unchanged from v0.1 except Y8's entry, corrected below.)*

### Tier 2 — Y8, corrected

| Platform | Real details |
|---|---|
| **Y8** | **Correction from v0.1:** previously characterized as closer to itch's open-upload model with SDK integration as optional. That was wrong. Y8's real developer dashboard shows a genuine, modern SDK on par with CrazyGames/Poki: `y8Sdk.init(appConfig, adConfig)`, real auth (`onAuth`), real ad breaks via `showAd({ type: 'reward'\|'next'\|'start'\|'pause'\|'browse', ... })` — the same "ad calls at natural gameplay breaks" pattern already confirmed for Poki/CrazyGames, just a different function shape. **Real, native, self-service Achievements** (title, description, 256×256px+ icon, secret flag, Easy/Medium/Hard difficulty) and **native Leaderboards** (sort direction, a score-limit cheat guard) are built directly into the platform — not staff-curated like Kongregate's badges, and rendered on Y8's own game page, not inside the game's own UI. A real QA review step runs after a build upload, checking SDK and ad integration specifically. Local dev is genuinely well-supported: `localhost`/`127.0.0.1` on any port work automatically with no config; `file://` explicitly does not (SDK network calls are blocked on file-protocol pages). Exclusivity/revenue-split details from v0.1 remain accurate. |

---

## Part 2 — Real Technical Requirements, Confirmed

*(Poki/CrazyGames section unchanged from v0.1 — see prior version for detail.)*

**New in v0.2 — Y8's real, confirmed SDK shape, from a live developer dashboard, not a search result:**

```html
<script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js" async></script>
<script>
  let y8Sdk;
  window.addEventListener("y8sdk.ready", function () {
    y8Sdk = y8.sdk();
    y8Sdk.init(
      { appId: 'YOUR_APP_ID', autoLogin: true },
      { gameId: 'YOUR_GAME_ID', preloadAdBreaks: 'on', sound: 'on', onReady: () => {} }
    );
    y8Sdk.onAuth((user, error) => {});
  }, { once: true });
  if (window.y8 && window.y8.emitReadyEvent) { window.y8.emitReadyEvent(); }
</script>
```

**Real, confirmed alignment with the already-designed `portalAdapter` interface, and one real gap to design around:** Y8's `showAd({ type })` takes five real values (`reward`, `next`, `start`, `pause`, `browse`) rather than the simpler binary "commercial vs. rewarded" shape Poki/CrazyGames use. The adapter's planned `requestAdBreak()` will need real internal logic mapping context (game start, returning from a menu, a reward moment) to the correct Y8 `type` — this is a real, concrete design input for whenever Y8's real SDK gets wired into the adapter, not solvable generically across all three portals with one dumb pass-through.

---

## Part 3 — The Real Gameplan, Corrected

**Real, live update: Y8 is no longer "second in the Tier-1 sequence" — it's already in progress, ahead of the original plan.** A real Shoal entry already exists on Y8's dashboard with real credentials (Game ID `281135`, App ID `6a8a38fd3daf0b765651b797`). This is real, concrete progress, not a future step.

**Revised near-term sequence:**
1. **Now, in progress:** Finish Shoal's real Y8 listing — Basic Info fields, Content Safety flags, a real build upload, the SDK script tag integrated into that build.
2. **Real, open decision, not yet made:** integrate Y8's real SDK snippet directly into Shoal's build now (fast, concrete, matches where you already are), or wait for the `portalAdapter` shell (already directed, not yet confirmed landed) to exist and route through it. Given real, live progress already in motion, direct integration now is the more honest path — the adapter can absorb this specific, already-working integration retroactively once it exists, rather than blocking real progress on an abstraction that isn't built yet.
3. **CrazyGames, Poki:** unchanged from v0.1 — later, after Y8 is genuinely live and proven.

**New, real finding worth weighing against the earlier Google-Auth achievement plan:** Y8's achievement system is native, self-service, and rendered by the platform itself — a meaningfully lower-effort path to *some* real achievements than the custom Firebase-backed system already scoped. Not a replacement — Y8's achievements only exist on Y8, tied to Y8's own accounts, still don't reach your own site or itch — but worth knowing this exists as a real, cheap, already-available option specifically for whatever ships to Y8.

---

## Changelog

| Version | Change |
|---|---|
| v0.1 | Initial. Full platform list, real technical requirements from Poki/CrazyGames docs, three-phase adapter gameplan. |
| v0.2 | Real correction from Y8's live developer dashboard: Y8 has a genuine, modern SDK (auth, ad breaks, native self-service achievements/leaderboards), not the lighter-touch integration v0.1 assumed. Sequencing updated to reflect real, already-in-progress work on a live Shoal entry (Game ID 281135) — Y8 moved from "second in the planned sequence" to "already happening." Real design gap flagged: Y8's 5-value `showAd` type doesn't map 1:1 onto the simpler Poki/CrazyGames pattern the adapter interface was designed against. |

---

*RFDGameStudio | One adapter, many portals — corrected against real evidence as it shows up, not just as planned.*
