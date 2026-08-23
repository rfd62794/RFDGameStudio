// Temporary script to capture pre-extraction expected values.
// Runs Shoal's real steering functions with fixed inputs and prints
// the exact outputs, so we can verify behavioral equivalence after
// extraction.
import { initGameState, tickGameInternal, CONFIG } from '../src/games/shoal/simulation/shoalSimulation';

// We can't directly import the private functions, but we CAN run the
// simulation with a fixed seed and capture the deterministic state
// after a fixed number of ticks. The steering functions are called
// internally during tickGameInternal, so if the outputs change after
// extraction, the state will diverge.
//
// We capture fish/shark positions after N ticks as the equivalence proof.

const st = initGameState(42, 60, 8, 6);
const dt = CONFIG.world.discrete_tick;

// Run 100 ticks — enough for steering to produce measurable movement
for (let i = 0; i < 100; i++) {
  tickGameInternal(st, dt);
}

// Print first 5 fish and first 3 sharks with full state
console.log('=== PRE-EXTRACTION EXPECTED VALUES (seed=42, 100 ticks) ===');
console.log(`Fish count: ${st.fish.length}`);
console.log(`Shark count: ${st.sharks.length}`);
console.log('--- First 5 fish ---');
for (let i = 0; i < Math.min(5, st.fish.length); i++) {
  const f = st.fish[i];
  console.log(`fish[${i}]: id=${f.id} x=${f.x.toFixed(10)} depth=${f.depth.toFixed(10)} vx=${f.vx.toFixed(10)} vd=${f.vd.toFixed(10)} alive=${f.alive}`);
}
console.log('--- First 3 sharks ---');
for (let i = 0; i < Math.min(3, st.sharks.length); i++) {
  const s = st.sharks[i];
  console.log(`shark[${i}]: id=${s.id} x=${s.x.toFixed(10)} depth=${s.depth.toFixed(10)} vx=${s.vx.toFixed(10)} vd=${s.vd.toFixed(10)} alive=${s.alive}`);
}
console.log('--- Aggregate stats ---');
console.log(`totalFishX=${st.fish.reduce((s, f) => s + f.x, 0).toFixed(10)}`);
console.log(`totalFishDepth=${st.fish.reduce((s, f) => s + f.depth, 0).toFixed(10)}`);
console.log(`totalSharkX=${st.sharks.reduce((s, sh) => s + sh.x, 0).toFixed(10)}`);
console.log(`totalSharkDepth=${st.sharks.reduce((s, sh) => s + sh.depth, 0).toFixed(10)}`);
