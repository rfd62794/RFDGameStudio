# Zip Verification Report — break-streamer

**Source:** `C:\Users\cheat\Downloads\break-streamer.zip`
**Generated:** 2026-08-31T02:03:34.560468+00:00
**Model:** deepseek/deepseek-v4-flash-0731

## Verdict: BLOCKED-INCOMPLETE IMPLEMENTATION (CONCEPT COVERAGE 0.63) - THE NARRATIVE CLAIMS COMPLETENESS BUT THE ZIP ONLY COVERS 63% OF THE DIRECTIVE'S CONCEPTS.

BLOCKED-incomplete implementation (concept coverage 0.63) - the narrative claims completeness but the zip only covers 63% of the directive's concepts.

## Component Findings

### Revision Diff
- No prior revision available; baseline diff skipped.

### Concept Grep
- Directive: `C:\Github\RFDGameStudio\docs\directives\break-streamer-mvp_Directive.md`
- Concept coverage: 0.63
- Suspiciously clean/uniform: False
- Concept matches:
  - `current`: 71
  - `state`: 129
  - `ready`: 3
  - `break`: 37
  - `streamer`: 3
  - `divert`: 1
  - `selling`: 11
  - `mechanic`: 1
  - `engine`: 3
  - `scaffolding`: 3
  - `contains`: 1
  - `include`: 2
  - `classes`: 2
  - `toggle`: 14
  - `controller`: 2
  - `logic`: 1
  - `handles`: 2
  - `transition`: 38
  - `office`: 15

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
  "id": "gen-1788141789-3xqjfiRJ8hHmeL2vGIzk",
  "object": "chat.completion",
  "created": 1788141789,
  "model": "deepseek/deepseek-v4-flash-0731",
  "provider": "Mancer 2",
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
        "content": "BLOCKED-incomplete implementation (concept coverage 0.63) - the narrative claims completeness but the zip only covers 63% of the directive's concepts.",
        "refusal": null,
        "reasoning": "We need to produce a verdict based on the given information. The instructions: \"Return ONLY one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE.\" Also \"UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts the narrative.\" Here we have a source directive path, but we don't have its content. Also concept coverage is 0.63, which is low. But we need to see if there is concrete evidence of fabrication, unused changed code, or contradiction. The completion narrative is just a generic AI Studio template, not specific to the directive. The concept coverage is 0.63, meaning only 63% of concepts from the directive are covered. That suggests the implementation is incomplete. Also there is no prior revision to diff, but we have a source directive to check. However, we don't have the directive content, but we have concept coverage. The fact that coverage is 0.63 indicates that the implementation does not fully meet the directive. That is a contradiction between the narrative (which claims it's a complete app) and the actual coverage. So we can point to concrete evidence: concept coverage is 0.63, meaning missing concepts. Also the narrative is generic, not specific to the directive. So we can say BLOCKED because of incomplete implementation. But we need to be careful: the instruction says \"BLOCKED is correct only if you can point to concrete evidence of fabrication, unused changed code, or a contradiction between the narrative and the files.\" Here we have a contradiction: the narrative says it's a complete app, but concept coverage is 0.63, so it's missing 37% of concepts. That is a contradiction. Also the narrative is generic, not specific to the directive. So we can say BLOCKED-incomplete implementation. But we need to specify reason. Also note: \"Suspiciously clean/uniform: False\" and \"Changed functions with zero call sites: []\" so no unused code. But the low coverage is enough. So verdict: BLOCKED-incomplete concept coverage. But we need to output exactly one line: \"BLOCKED-[reason]\" so we can write \"BLOCKED-incomplete implementation (concept coverage 0.63)\". However, the instruction says \"Return ONLY one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE.\" So we output that. Also we need to include one sentence of reasoning. So final output: \"BLOCKED-incomplete implementation (concept coverage 0.63) because the narrative claims a complete app but only 63% of directive concepts are covered.\" But we need to be concise. Let's produce: \"BLOCKED-incomplete implementation (concept coverage 0.63) - the narrative claims completeness but the zip only covers 63% of the directive's concepts.\" That is one sentence. So final answer.",
        "reasoning_details": [
          {
            "type": "reasoning.text",
            "text": "We need to produce a verdict based on the given information. The instructions: \"Return ONLY one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE.\" Also \"UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts the narrative.\" Here we have a source directive path, but we don't have its content. Also concept coverage is 0.63, which is low. But we need to see if there is concrete evidence of fabrication, unused changed code, or contradiction. The completion narrative is just a generic AI Studio template, not specific to the directive. The concept coverage is 0.63, meaning only 63% of concepts from the directive are covered. That suggests the implementation is incomplete. Also there is no prior revision to diff, but we have a source directive to check. However, we don't have the directive content, but we have concept coverage. The fact that coverage is 0.63 indicates that the implementation does not fully meet the directive. That is a contradiction between the narrative (which claims it's a complete app) and the actual coverage. So we can point to concrete evidence: concept coverage is 0.63, meaning missing concepts. Also the narrative is generic, not specific to the directive. So we can say BLOCKED because of incomplete implementation. But we need to be careful: the instruction says \"BLOCKED is correct only if you can point to concrete evidence of fabrication, unused changed code, or a contradiction between the narrative and the files.\" Here we have a contradiction: the narrative says it's a complete app, but concept coverage is 0.63, so it's missing 37% of concepts. That is a contradiction. Also the narrative is generic, not specific to the directive. So we can say BLOCKED-incomplete implementation. But we need to specify reason. Also note: \"Suspiciously clean/uniform: False\" and \"Changed functions with zero call sites: []\" so no unused code. But the low coverage is enough. So verdict: BLOCKED-incomplete concept coverage. But we need to output exactly one line: \"BLOCKED-[reason]\" so we can write \"BLOCKED-incomplete implementation (concept coverage 0.63)\". However, the instruction says \"Return ONLY one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE.\" So we output that. Also we need to include one sentence of reasoning. So final output: \"BLOCKED-incomplete implementation (concept coverage 0.63) because the narrative claims a complete app but only 63% of directive concepts are covered.\" But we need to be concise. Let's produce: \"BLOCKED-incomplete implementation (concept coverage 0.63) - the narrative claims completeness but the zip only covers 63% of the directive's concepts.\" That is one sentence. So final answer.",
            "format": "unknown",
            "index": 0
          }
        ]
      }
    }
  ],
  "usage": {
    "prompt_tokens": 385,
    "completion_tokens": 642,
    "total_tokens": 1027,
    "cost": 0.0003875,
    "is_byok": false,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "cache_write_tokens": 0,
      "audio_tokens": 0,
      "video_tokens": 0
    },
    "cost_details": {
      "upstream_inference_cost": 0.0003875,
      "upstream_inference_prompt_cost": 6.722320566462826e-05,
      "upstream_inference_completions_cost": 0.00032027679433537177
    },
    "completion_tokens_details": {
      "reasoning_tokens": 681,
      "image_tokens": 0,
      "audio_tokens": 0
    }
  }
}
```