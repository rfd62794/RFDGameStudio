# Zip Verification Report — break-streamer

**Source:** `C:\Users\cheat\Downloads\break-streamer.zip`
**Generated:** 2026-08-31T02:18:33.755550+00:00
**Model:** deepseek/deepseek-v4-flash-0731

## Verdict: BLOCKED-INCOMPLETE IMPLEMENTATION AGAINST DIRECTIVE; README IS A GENERIC AI STUDIO TEMPLATE AND DOES NOT COVER REQUIRED FEATURES LIKE 60-SECOND REVEALS.

BLOCKED-incomplete implementation against directive; README is a generic AI Studio template and does not cover required features like 60-second reveals.

## Component Findings

### Revision Diff
- No prior revision available; baseline diff skipped.

### Concept Grep
- Directive: `C:\Github\RFDGameStudio\docs\directives\break-streamer-mvp_Directive.md`
- Concept coverage: 0.67
- Suspiciously clean/uniform: False
- Concept matches:
  - `engine`: 3
  - `scaffolding`: 3
  - `contains`: 1
  - `off-stream-ui`: 2
  - `on-stream-ui`: 2
  - `include`: 2
  - `classes`: 2
  - `toggle`: 14
  - `hidden`: 14
  - `display`: 2
  - `controller`: 2
  - `logic`: 1
  - `handles`: 2
  - `transition`: 38
  - `office`: 15
  - `timer`: 29
  - `stream`: 147
  - `overlay`: 8
  - `composite`: 11
  - `relative`: 13

### Caller Check
- Changed functions: []
- Unused changed functions: []
- All changed functions called: True

### Narrative Artifact
- Found: `README.md` (62 words)
> <div align="center"> <img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" /> </div> # Run and deploy your AI Studio app This contains everything you need to run your app locally. View your app in AI Studio: https://ai.studio/apps/7ab10ffc-957e-46e6-8832-13cf11406851 ## Run Locally **Prerequisites:** Node.js 1. Install dependencies: `npm install` 2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key 3. Run the app: `npm run dev`

## Raw LLM Response
```json
{
  "id": "gen-1788142691-FXcqu5VW0uQtycY1Rel4",
  "object": "chat.completion",
  "created": 1788142691,
  "model": "deepseek/deepseek-v4-flash-0731",
  "provider": "DigitalOcean",
  "system_fingerprint": null,
  "service_tier": null,
  "choices": [
    {
      "index": 0,
      "logprobs": null,
      "finish_reason": "stop",
      "native_finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "BLOCKED-incomplete implementation against directive; README is a generic AI Studio template and does not cover required features like 60-second reveals.",
        "refusal": null,
        "reasoning": "We are given structured findings. Need to output one verdict line. Need to decide among CERTIFIED, BLOCKED-[reason], UNVERIFIABLE. \n\nKey points:\n- No prior revision exists to diff against.\n- Source directive exists: C:\\Github\\RFDGameStudio\\docs\\directives\\break-streamer-mvp_Directive.md\n- Concept coverage in zip: 0.67 (partial coverage)\n- Unmatched concepts list: many directives like 'directive', 'architect', etc. These are words from the directive not covered in zip.\n- Changed functions with zero call sites: [] (none)\n- Completion narrative found in zip: It is a generic AI Studio boilerplate README, not specific to the directive. It talks about running app, prerequisites, etc. Not a real completion narrative about the break-streamer MVP.\n\nThe directive is present, so we have a source to check. The concept coverage is 0.67, meaning not fully implemented. But is that enough to block? The instructions: BLOCKED is correct only if you can point to concrete evidence of fabrication, unused changed code, or a contradiction between the narrative and the files. Here we have a narrative (README) that does not mention the directive at all. It is just a template. So the narrative does not align with the directive. Also, concept coverage is incomplete. But we need to check if that is a contradiction. The README claims \"This contains everything you need to run your app locally.\" but it doesn't mention the MVP features. That is a contradiction? Possibly. Also, the directive lists specific features like \"60-second\", \"reveals\", etc. and the zip doesn't cover them. So the implementation is incomplete. That could be evidence of not meeting requirements, but the verdict options: CERTIFIED means it fully implements? Probably not. BLOCKED or UNVERIFIABLE? Since we have a directive and we can check coverage, we can determine it's incomplete. But the verdict says UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts the narrative. Here we have a directive, so we can verify against it. And the narrative contradicts? The narrative is not about the directive, so it's not a proper completion narrative. So it's likely BLOCKED.\n\nAlso, the note says: \"Changed functions with zero call sites: []\" meaning no unused changed functions, so no fabrication of code. But the incomplete coverage suggests that the zip does not implement the directive fully. So we can point to concrete evidence: the directive lists specific concepts that are not found in the zip, and the README does not mention them. So BLOCKED.\n\nReason: incomplete implementation relative to directive, and README is generic template not reflecting the MVP.\n\nSo verdict: BLOCKED-incomplete implementation per directive, README is generic.\n\nBut the instruction: \"Return ONLY one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE.\" So we need to output exactly that.\n\nI'll output: BLOCKED-incomplete implementation against directive; README does not describe break-streamer MVP.\n\nBut ensure it's one sentence. The verdict line should be followed by one sentence of reasoning? The instruction says: \"produce exactly one verdict line: CERTIFIED, BLOCKED-[reason], or UNVERIFIABLE. No other output except the verdict and one sentence of reasoning.\" So we output the verdict line, then a sentence.\n\nSo: BLOCKED-incomplete implementation against directive; README is a generic AI Studio template and does not cover required features like 60-second reveals.\n\nThat is the final.",
        "reasoning_details": [
          {
            "type": "reasoning.text",
            "text": "We are given structured findings. Need to output one verdict line. Need to decide among CERTIFIED, BLOCKED-[reason], UNVERIFIABLE. \n\nKey points:\n- No prior revision exists to diff against.\n- Source directive exists: C:\\Github\\RFDGameStudio\\docs\\directives\\break-streamer-mvp_Directive.md\n- Concept coverage in zip: 0.67 (partial coverage)\n- Unmatched concepts list: many directives like 'directive', 'architect', etc. These are words from the directive not covered in zip.\n- Changed functions with zero call sites: [] (none)\n- Completion narrative found in zip: It is a generic AI Studio boilerplate README, not specific to the directive. It talks about running app, prerequisites, etc. Not a real completion narrative about the break-streamer MVP.\n\nThe directive is present, so we have a source to check. The concept coverage is 0.67, meaning not fully implemented. But is that enough to block? The instructions: BLOCKED is correct only if you can point to concrete evidence of fabrication, unused changed code, or a contradiction between the narrative and the files. Here we have a narrative (README) that does not mention the directive at all. It is just a template. So the narrative does not align with the directive. Also, concept coverage is incomplete. But we need to check if that is a contradiction. The README claims \"This contains everything you need to run your app locally.\" but it doesn't mention the MVP features. That is a contradiction? Possibly. Also, the directive lists specific features like \"60-second\", \"reveals\", etc. and the zip doesn't cover them. So the implementation is incomplete. That could be evidence of not meeting requirements, but the verdict options: CERTIFIED means it fully implements? Probably not. BLOCKED or UNVERIFIABLE? Since we have a directive and we can check coverage, we can determine it's incomplete. But the verdict says UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts the narrative. Here we have a directive, so we can verify against it. And the narrative contradicts? The narrative is not about the directive, so it's not a proper completion narrative. So it's likely BLOCKED.\n\nAlso, the note says: \"Changed functions with zero call sites: []\" meaning no unused changed functions, so no fabrication of code. But the incomplete coverage suggests that the zip does not implement the directive fully. So we can point to concrete evidence: the directive lists specific concepts that are not found in the zip, and the README does not mention them. So BLOCKED.\n\nReason: incomplete implementation relative to directive, and README is generic template not reflecting the MVP.\n\nSo verdict: BLOCKED-incomplete implementation per directive, README is generic.\n\nBut the instruction: \"Return ONLY one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE.\" So we need to output exactly that.\n\nI'll output: BLOCKED-incomplete implementation against directive; README does not describe break-streamer MVP.\n\nBut ensure it's one sentence. The verdict line should be followed by one sentence of reasoning? The instruction says: \"produce exactly one verdict line: CERTIFIED, BLOCKED-[reason], or UNVERIFIABLE. No other output except the verdict and one sentence of reasoning.\" So we output the verdict line, then a sentence.\n\nSo: BLOCKED-incomplete implementation against directive; README is a generic AI Studio template and does not cover required features like 60-second reveals.\n\nThat is the final.",
            "format": "unknown",
            "index": 0
          }
        ]
      }
    }
  ],
  "usage": {
    "prompt_tokens": 436,
    "completion_tokens": 789,
    "total_tokens": 1225,
    "cost": 0.000233706256,
    "is_byok": false,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "cache_write_tokens": 0,
      "audio_tokens": 0,
      "video_tokens": 0
    },
    "cost_details": {
      "upstream_inference_cost": 0.000233706256,
      "upstream_inference_prompt_cost": 3.4878256e-05,
      "upstream_inference_completions_cost": 0.000198828
    },
    "completion_tokens_details": {
      "reasoning_tokens": 739,
      "image_tokens": 0,
      "audio_tokens": 0
    }
  }
}
```