// new: Phase 1 D1.4 -- generic standalone config; tools/build-demo.ts sets DEMO_ID.
import { makeStandaloneConfig } from './vite.standalone.factory';

export default makeStandaloneConfig(process.env.DEMO_ID ?? '');
