
## 2026-02-25 — archivist
Model: deepseek/deepseek-r1
Confidence: high
Weaknesses identified:
  - Output format instruction appears after empty JSON template, risking prose additions
  - Missing concrete example with real values for model imitation
  - No explicit prohibition against explanatory text outside JSON
Changes:
  - Added explicit 'ONLY JSON' prohibition first in output section [CHANGE: prevents prose leakage]
  - Included filled example with realistic violation data [CHANGE: better few-shot guidance]
  - Added negative instruction 'DO NOT COPY EXAMPLE VALUES' [CHANGE: prevents placeholder replication]

## 2026-02-25 — strategist
Model: deepseek/deepseek-r1
Confidence: high
Weaknesses identified:
  - Output format instructions appear after content requirements, allowing markdown bleed-through
  - Missing explicit JSON schema example showing required structure
  - No validation for task specificity in recent outputs (e.g. 'Read docs/session_logs/')
  - Corpus_hash handling unclear between prompt rules and output examples
Changes:
  - Added JSON schema example with concrete field requirements [CHANGE: prevents markdown formatting]
  - Moved output format directive to very first line [CHANGE: prevents prose bleed]
  - Added explicit validation criteria for task specificity [CHANGE: addresses vague 'read docs' tasks]
  - Standardized corpus_hash handling in schema [CHANGE: resolves empty vs hash confusion]

## 2026-02-25 — herald
Model: deepseek/deepseek-r1
Confidence: high
Weaknesses identified:
  - Output format instruction appears after example prose creating ambiguity
  - Example uses bracket placeholders that models might literally reproduce
  - Missing concrete example of pytest verification syntax
  - No demonstration of confidence scoring in sample output
Changes:
  - Moved output format instruction before any examples [CHANGE: prevents prose generation]
  - Replaced [demo] placeholder with concrete 'demo' folder name [CHANGE: prevents bracket literals]
  - Added explicit pytest path example with -k flag [CHANGE: clarifies verification]
  - Included full example with realistic values in all fields [CHANGE: better few-shot]
