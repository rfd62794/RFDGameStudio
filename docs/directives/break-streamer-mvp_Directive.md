**Current State of Play:** Ready to code the Break Streamer MVP UI and Loop. We are utilizing the 'Divert' (Slot Selling) mechanic for maximum economic realism.

**Directive:** You are the Lead Engine Architect.
1. Write the HTML/CSS scaffolding that contains BOTH the `div#off-stream-ui` and `div#on-stream-ui`. Include the CSS classes required to toggle them (`.hidden { display: none; }`).
2. Write the TS/JS controller logic that handles the FSM transition: clicking "GO LIVE" hides the back office, starts the 60-second timer, and reveals the stream overlay.
3. Write the exact CSS required to composite a card: A relative container `div`, an absolute `img` for the Base Creature (Layer 1), and an absolute `img` for the Variant Frame (Layer 2) stacked exactly on top of each other.
