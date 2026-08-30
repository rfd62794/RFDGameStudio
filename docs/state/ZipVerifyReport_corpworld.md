# Zip Verification Report — corpworld

**Zip:** `C:\Github\RFDGameStudio\intake\corpworld\corpworld_v0.1.0R5.zip`
**Generated:** 2026-08-30T22:24:31.904213+00:00
**Model:** deepseek/deepseek-v4-flash-0731

## Verdict: UNVERIFIABLE

UNVERIFIABLE - No source directive/prompt was found, so the export cannot be checked against the requested implementation.

## Component Findings

### Revision Diff
- Prior revision: `C:\Github\RFDGameStudio\intake\corpworld\corpworld_v0.1.0R4.zip`
- Files changed: 4
- Changed functions: []

### Concept Grep
- No source directive/prompt found on disk for this slug.

### Caller Check
- Changed functions: []
- Unused changed functions: []
- All changed functions called: True

### Narrative Artifact
- Found: `README.md` (62 words)
> <div align="center"> <img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" /> </div> # Run and deploy your AI Studio app This contains everything you need to run your app locally. View your app in AI Studio: https://ai.studio/apps/7eaf1322-d228-4e65-9795-78f41e50822f ## Run Locally **Prerequisites:** Node.js 1. Install dependencies: `npm install` 2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key 3. Run the app: `npm run dev`

## Raw LLM Response
```json
{
  "id": "gen-1788128665-dzs1AgCXUtE741Pt8W7I",
  "object": "chat.completion",
  "created": 1788128665,
  "model": "deepseek/deepseek-v4-flash-0731",
  "provider": "Relace",
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
        "content": "UNVERIFIABLE - No source directive/prompt was found, so the export cannot be checked against the requested implementation.",
        "refusal": null,
        "reasoning": "We need to produce verdict. Need inspect findings. Diffed against prior revision exists. Files changed 4. Changed functions [] (none). No source directive/prompt found on disk. Changed functions with zero call sites: [] (none). Completion narrative README generic. Need decide. Since no source directive, but prior revision exists. We need verify if zip implements what was asked. No prompt found, so cannot verify against directive. UNVERIFIABLE is correct when no prior revision to diff and no source directive? Actually says UNVERIFIABLE correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts narrative. Here there IS prior revision. But no source directive. Hmm. Need parse instructions: \"UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts the narrative.\" This condition is AND: no prior revision AND no source directive. Here prior revision exists, so UNVERIFIABLE not strictly by that definition. But no source directive means cannot know what was asked. However diff against prior revision can show changes. Changed functions none, zero call sites none. No contradictions. Could be CERTIFIED? Need be careful. The task: \"verify whether an AI Studio zip export actually implements what was asked for.\" Without source directive, cannot know what was asked. But prior revision exists, so we can diff to see changes. But changed functions [] means no code functions changed? Maybe only config/assets? Need more info. The structured findings: Files changed 4, changed functions [] (empty). No source directive/prompt found. Changed functions with zero call sites: [] (empty). Completion narrative found in zip README generic. No evidence of fabrication, unused changed code, or contradiction. But no source directive. The verdict options: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE. BLOCKED only if concrete evidence of fabrication, unused changed code, or contradiction. None. UNVERIFIABLE if no prior revision to diff and no source directive to check, and nothing else contradicts. Here prior revision exists, so maybe not UNVERIFIABLE? But \"no source directive to check\" is true. The definition says UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check. Since prior revision exists, maybe we can diff and verify? But changed functions [] suggests no functional changes. Need maybe CERTIFIED? But \"actually implements what was asked for\" cannot be determined without prompt. However maybe the prior revision plus diff can show changes align with narrative? Narrative is generic \"Run and deploy your AI Studio app\" not a completion narrative describing what was implemented. It doesn't claim specific features. So no contradiction. But certification requires knowing what was asked. Without source directive, cannot certify. The instruction says UNVERIFIABLE is correct when no prior revision to diff and no source directive to check. But maybe the \"and\" is not strict? Let's read exact: \"UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts the narrative.\" This is a sufficient condition, not necessarily necessary? It says \"is correct when\" meaning if that condition holds, UNVERIFIABLE. But if prior revision exists, maybe still unverifiable due to no source directive? Need decide.\n\nWe need produce exactly one verdict line. Let's reason from first principles. We are verifying zip export implements what was asked. The \"asked\" is source directive/prompt. It was not found. Without it, we cannot know what was asked. Therefore cannot verify implementation. That suggests UNVERIFIABLE. The mention of prior revision exists but no source directive. The condition in prompt says UNVERIFIABLE correct when no prior revision to diff and no source directive to check. But maybe they intended UNVERIFIABLE when cannot verify due to missing directive. However they explicitly include \"no prior revision to diff\" as part. Here prior revision exists, so maybe we should not use UNVERIFIABLE? But then what? CERTIFIED? That would assert implementation matches ask, impossible. BLOCKED? No evidence. So UNVERIFIABLE is the only sensible. Need maybe mention reasoning: no source directive found, so cannot confirm what was asked. But the instruction says \"Return ONLY one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE. No other output except the verdict and one sentence of reasoning.\" So output verdict line plus reasoning. Need ensure exactly one verdict line. Could be \"UNVERIFIABLE\" then sentence. But \"No other output except the verdict and one sentence of reasoning.\" So line: \"UNVERIFIABLE - No source directive/prompt was found, so the export cannot be checked against the requested implementation.\" That is one sentence. Need maybe include \"despite prior revision\" but okay.\n\nLet's ensure not BLOCKED. BLOCKED only if concrete evidence of fabrication, unused changed code, or contradiction. None. So not BLOCKED. CERTIFIED would require confidence. No. UNVERIFIABLE.\n\nNeed produce final.",
        "reasoning_details": [
          {
            "type": "reasoning.text",
            "text": "We need to produce verdict. Need inspect findings. Diffed against prior revision exists. Files changed 4. Changed functions [] (none). No source directive/prompt found on disk. Changed functions with zero call sites: [] (none). Completion narrative README generic. Need decide. Since no source directive, but prior revision exists. We need verify if zip implements what was asked. No prompt found, so cannot verify against directive. UNVERIFIABLE is correct when no prior revision to diff and no source directive? Actually says UNVERIFIABLE correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts narrative. Here there IS prior revision. But no source directive. Hmm. Need parse instructions: \"UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts the narrative.\" This condition is AND: no prior revision AND no source directive. Here prior revision exists, so UNVERIFIABLE not strictly by that definition. But no source directive means cannot know what was asked. However diff against prior revision can show changes. Changed functions none, zero call sites none. No contradictions. Could be CERTIFIED? Need be careful. The task: \"verify whether an AI Studio zip export actually implements what was asked for.\" Without source directive, cannot know what was asked. But prior revision exists, so we can diff to see changes. But changed functions [] means no code functions changed? Maybe only config/assets? Need more info. The structured findings: Files changed 4, changed functions [] (empty). No source directive/prompt found. Changed functions with zero call sites: [] (empty). Completion narrative found in zip README generic. No evidence of fabrication, unused changed code, or contradiction. But no source directive. The verdict options: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE. BLOCKED only if concrete evidence of fabrication, unused changed code, or contradiction. None. UNVERIFIABLE if no prior revision to diff and no source directive to check, and nothing else contradicts. Here prior revision exists, so maybe not UNVERIFIABLE? But \"no source directive to check\" is true. The definition says UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check. Since prior revision exists, maybe we can diff and verify? But changed functions [] suggests no functional changes. Need maybe CERTIFIED? But \"actually implements what was asked for\" cannot be determined without prompt. However maybe the prior revision plus diff can show changes align with narrative? Narrative is generic \"Run and deploy your AI Studio app\" not a completion narrative describing what was implemented. It doesn't claim specific features. So no contradiction. But certification requires knowing what was asked. Without source directive, cannot certify. The instruction says UNVERIFIABLE is correct when no prior revision to diff and no source directive to check. But maybe the \"and\" is not strict? Let's read exact: \"UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts the narrative.\" This is a sufficient condition, not necessarily necessary? It says \"is correct when\" meaning if that condition holds, UNVERIFIABLE. But if prior revision exists, maybe still unverifiable due to no source directive? Need decide.\n\nWe need produce exactly one verdict line. Let's reason from first principles. We are verifying zip export implements what was asked. The \"asked\" is source directive/prompt. It was not found. Without it, we cannot know what was asked. Therefore cannot verify implementation. That suggests UNVERIFIABLE. The mention of prior revision exists but no source directive. The condition in prompt says UNVERIFIABLE correct when no prior revision to diff and no source directive to check. But maybe they intended UNVERIFIABLE when cannot verify due to missing directive. However they explicitly include \"no prior revision to diff\" as part. Here prior revision exists, so maybe we should not use UNVERIFIABLE? But then what? CERTIFIED? That would assert implementation matches ask, impossible. BLOCKED? No evidence. So UNVERIFIABLE is the only sensible. Need maybe mention reasoning: no source directive found, so cannot confirm what was asked. But the instruction says \"Return ONLY one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE. No other output except the verdict and one sentence of reasoning.\" So output verdict line plus reasoning. Need ensure exactly one verdict line. Could be \"UNVERIFIABLE\" then sentence. But \"No other output except the verdict and one sentence of reasoning.\" So line: \"UNVERIFIABLE - No source directive/prompt was found, so the export cannot be checked against the requested implementation.\" That is one sentence. Need maybe include \"despite prior revision\" but okay.\n\nLet's ensure not BLOCKED. BLOCKED only if concrete evidence of fabrication, unused changed code, or contradiction. None. So not BLOCKED. CERTIFIED would require confidence. No. UNVERIFIABLE.\n\nNeed produce final.",
            "format": "unknown",
            "index": 0
          }
        ]
      }
    }
  ],
  "usage": {
    "prompt_tokens": 468,
    "completion_tokens": 1079,
    "total_tokens": 1547,
    "cost": 0.00022464,
    "is_byok": false,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "cache_write_tokens": 0,
      "audio_tokens": 0,
      "video_tokens": 0
    },
    "cost_details": {
      "upstream_inference_cost": 0.00022464,
      "upstream_inference_prompt_cost": 3.042e-05,
      "upstream_inference_completions_cost": 0.00019422
    },
    "completion_tokens_details": {
      "reasoning_tokens": 1287,
      "image_tokens": 0,
      "audio_tokens": 0
    }
  }
}
```