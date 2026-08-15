---
title: "Studio Status"
category: Games/Engines/Systems
date: 2026-08-15
tagline: "Real, current status of every active RFDGameStudio project thread — live, in progress, designed, and complete"
type: system
consulting: false
problem: "A multi-thread game studio with games in five different categories and infrastructure in three tech stacks needs a single, honest view of what's actually happening right now — not a flattened list, not a backlog, just the real state of each active thread."
approach:
  - "One hub page with a card per active project thread"
  - "Each card links to a dedicated breakdown page with the full real history"
  - "Status badges (Live / In Progress / Designed / Complete) make state visible at a glance"
  - "Content pre-verified from the August 2026 studio session, not re-derived or guessed"
highlights:
  - "5 real project threads, each with verified current state"
  - "Shoal and Planet of Greed both live on itch.io + arcade"
  - "Mutant Battle Ball mid major creative overhaul"
  - "Facility Escape Chapter 2 design locked, implementation not started"
  - "Studio infrastructure complete — ADR-013, GameShell compliance, shared engine established"
stack: ["TypeScript", "Lua", "Python", "Rust"]
---

Two years of game development produces a lot of real work at very different stages. This page is the honest current-state view of RFDGameStudio's active threads — not the full back-catalog (that's [Legacy Projects](/projects/legacy-projects/)), not the playable arcade (that's [The Arcade](/games/)), just what's actually happening right now across the studio.

Each card below links to a dedicated breakdown page with the full real history and current state of that project thread.

<div class="grid md:grid-cols-2 gap-8 mt-8">

<!-- Card: Shoal -->
<article class="bg-gray-900 rounded-lg border border-gray-800 hover:border-cyan-500 transition overflow-hidden">
    <div class="p-8">
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-bold text-white">Shoal</h3>
            <span class="px-3 py-1 bg-green-500 bg-opacity-20 text-green-400 rounded-full text-sm font-semibold">Live</span>
        </div>
        <p class="text-gray-400 mb-4">Wa-Tor-inspired reef sandbox — six-stage performance investigation to production TS-native migration</p>
        <p class="text-gray-300 mb-6">Live on itch.io + rfditservices.com arcade. TS-native migration complete (151.7x speedup). artGen fully consumed. Devlog posted. No current open items.</p>
        <a href="/projects/studio-status-shoal/" class="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center">
            Full Breakdown <span class="ml-2">&rarr;</span>
        </a>
    </div>
</article>

<!-- Card: Planet of Greed -->
<article class="bg-gray-900 rounded-lg border border-gray-800 hover:border-cyan-500 transition overflow-hidden">
    <div class="p-8">
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-bold text-white">Planet of Greed</h3>
            <span class="px-3 py-1 bg-green-500 bg-opacity-20 text-green-400 rounded-full text-sm font-semibold">Live</span>
        </div>
        <p class="text-gray-400 mb-4">Dark-corporate boardroom strategy game — the fusion of CorpWorld, KingMaker Squads, and Genesis Ore narrative</p>
        <p class="text-gray-300 mb-6">Live on itch.io + rfditservices.com arcade. Five-chapter canon locked. CorpWorld and KingMaker Squads retired (source preserved). Devlog posted. Two items explicitly deferred: culture stat asymmetry, Signal's authored Boardroom Event content.</p>
        <a href="/projects/studio-status-planet-of-greed/" class="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center">
            Full Breakdown <span class="ml-2">&rarr;</span>
        </a>
    </div>
</article>

<!-- Card: Mutant Battle Ball -->
<article class="bg-gray-900 rounded-lg border border-gray-800 hover:border-cyan-500 transition overflow-hidden">
    <div class="p-8">
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-bold text-white">Mutant Battle Ball</h3>
            <span class="px-3 py-1 bg-yellow-500 bg-opacity-20 text-yellow-400 rounded-full text-sm font-semibold">In Progress</span>
        </div>
        <p class="text-gray-400 mb-4">Mutant sports combat game mid major creative overhaul — Neo Battlopolis, six-Brand Trinity, Body Part Synergy</p>
        <p class="text-gray-300 mb-6">Not deployed. Match engine bugs fixed, TS-native migration done, Minimal Real Game Loop built. Paper Doll module with 8 ChimeraLab patterns ported, Character Viewer built, 10-technique comparison completed. Real designed-not-built game systems: Brand/Trinity naming, OEM Quality tiers, Frame/Forge economy, Gravekeeper, Tournament structure. Roster-meaning question deliberately left open.</p>
        <a href="/projects/studio-status-mutant-battle-ball/" class="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center">
            Full Breakdown <span class="ml-2">&rarr;</span>
        </a>
    </div>
</article>

<!-- Card: Facility Escape (Chapter 2) -->
<article class="bg-gray-900 rounded-lg border border-gray-800 hover:border-cyan-500 transition overflow-hidden">
    <div class="p-8">
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-bold text-white">Facility Escape (Chapter 2)</h3>
            <span class="px-3 py-1 bg-cyan-500 bg-opacity-20 text-cyan-400 rounded-full text-sm font-semibold">Designed</span>
        </div>
        <p class="text-gray-400 mb-4">Stealth-infiltration chapter with locked July infrastructure and new Loud/Rush design from tonight's session</p>
        <p class="text-gray-300 mb-6">Real, locked infrastructure from July: turnEngine, guardAI, physicsEngine, roomGenerator, levelSolver (real Dijkstra). New design: Loud meter (FF7 Shinra Tower model), Rush system (fortify room, goal never changes), Trinity Siege RPS skeleton reused for Rush-enemy resolution. Real open items: exit-reachability during Rush, intensity curve, discrete-juncture placement.</p>
        <a href="/projects/studio-status-facility-escape/" class="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center">
            Full Breakdown <span class="ml-2">&rarr;</span>
        </a>
    </div>
</article>

<!-- Card: Studio Infrastructure -->
<article class="bg-gray-900 rounded-lg border border-gray-800 hover:border-cyan-500 transition overflow-hidden">
    <div class="p-8">
        <div class="flex items-center justify-between mb-3">
            <h3 class="text-2xl font-bold text-white">Studio Infrastructure</h3>
            <span class="px-3 py-1 bg-cyan-500 bg-opacity-20 text-cyan-400 rounded-full text-sm font-semibold">Complete</span>
        </div>
        <p class="text-gray-400 mb-4">The shared engine, compliance audits, and cross-game duplication resolution that underpins everything else</p>
        <p class="text-gray-300 mb-6">ADR-013 (TS-native default locked, Lua retired as mandatory). GameShell/TitleScreen compliance audit complete (6 games fixed, 833/833 confirmed clean). TS-Native Cross-Game Duplication Audit complete (CorpWorld/Planet of Greed 7-of-12-byte-identical fork resolved, ts/src/engine/shared/ established). ChimeraLab investigation complete, 8 portable patterns ported.</p>
        <a href="/projects/studio-status-infrastructure/" class="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center">
            Full Breakdown <span class="ml-2">&rarr;</span>
        </a>
    </div>
</article>

</div>

---

### Deferred / Routed Elsewhere

**Succession** — a persuasion-sim redesign, handed to Gemini/AI Studio directly. Not part of RFDGameStudio's active thread. Tracked in the [studio status board data](https://github.com/rfd62794/RFDGameStudio/blob/main/docs/state/StatusBoard.md) but not a full card here.

---

*This page is the hub. Each card links to a dedicated breakdown page with the full real history. [&larr; Back to Projects](/projects/)*