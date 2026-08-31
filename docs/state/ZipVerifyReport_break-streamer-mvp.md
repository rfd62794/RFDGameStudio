# Zip Verification Report — break-streamer-mvp

**Source:** `C:\Users\cheat\Downloads\break-streamer-mvp.zip`
**Generated:** 2026-08-31T02:51:04.642890+00:00
**Model:** deepseek/deepseek-v4-flash-0731

## Verdict: BLOCKED-INCOMPLETE IMPLEMENTATION

BLOCKED-incomplete implementation

The zip covers only 0.7 of directive concepts and lacks off-stream-ui, on-stream-ui, and other required concepts, so it does not implement the full directive.

## Component Findings

### Revision Diff
- No prior revision available; baseline diff skipped.

### Concept Grep
- Directive: `C:\Github\RFDGameStudio\docs\directives\break-streamer-mvp_Directive.md`
- Concept coverage: 0.7
- Suspiciously clean/uniform: False
- Concept matches:
  - `engine`: 1
  - `write`: 16
  - `include`: 1
  - `classes`: 1
  - `toggle`: 58
  - `hidden`: 80
  - `display`: 5
  - `controller`: 4
  - `logic`: 2
  - `handles`: 2
  - `transition`: 47
  - `office`: 19
  - `starts`: 4
  - `60-second`: 2
  - `timer`: 40
  - `reveals`: 5
  - `stream`: 50
  - `overlay`: 29
  - `exact`: 1
  - `composite`: 2
  - `relative`: 46

### Caller Check
- Changed functions: []
- Unused changed functions: []
- All changed functions called: True

### Narrative Artifact
- No completion narrative artifact found inside the zip.

## Raw LLM Response
```json
{
  "id": "gen-1788144647-EoJjyllxZ6dRZDywI8fB",
  "object": "chat.completion",
  "created": 1788144647,
  "model": "deepseek/deepseek-v4-flash-0731",
  "provider": "Together",
  "system_fingerprint": "default",
  "service_tier": null,
  "choices": [
    {
      "index": 0,
      "logprobs": null,
      "finish_reason": "stop",
      "native_finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "BLOCKED-incomplete implementation\n\nThe zip covers only 0.7 of directive concepts and lacks off-stream-ui, on-stream-ui, and other required concepts, so it does not implement the full directive.",
        "refusal": null,
        "reasoning": "We need to produce exactly one verdict line. Need to analyze. The structured findings: concept coverage 0.7, unmatched concepts list includes 'directive', 'architect', 'scaffolding', 'contains', 'off-stream-ui', 'on-stream-ui', 'required', 'clicking', 'hides'. No prior revision, no completion narrative artifact. Source directive exists. Concept coverage 0.7 means some concepts not covered. Unmatched concepts are found in directive but not in zip. That suggests the zip does not implement all concepts. However, need to determine if BLOCKED or UNVERIFIABLE. UNVERIFIABLE is correct when no prior revision to diff and no source directive to check, and nothing else contradicts narrative. But here there is a source directive, and concept coverage is 0.7 with unmatched concepts. That is concrete evidence of missing implementation? The instruction says BLOCKED is correct only if concrete evidence of fabrication, unused changed code, or contradiction between narrative and files. Missing concepts could be a contradiction if narrative claims full implementation. But we don't have narrative artifact. The findings say \"No completion narrative artifact found inside the zip.\" So we cannot compare narrative. However, the directive exists and concept coverage is 0.7, meaning 30% concepts not found. That is evidence that the zip does not fully implement the directive. But is that enough for BLOCKED? The reason would be \"incomplete implementation\" or \"missing concepts\". The instruction says BLOCKED only if concrete evidence of fabrication, unused changed code, or contradiction between narrative and files. Missing concepts is not exactly those. But \"contradiction between the narrative and the files\" - there is no narrative. So maybe UNVERIFIABLE because no narrative to contradict, and no prior revision. But there is a source directive to check, so UNVERIFIABLE condition \"no source directive to check\" is false. So UNVERIFIABLE is not correct because there is a source directive. Let's read carefully: \"UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts the narrative.\" Here there is a source directive. So UNVERIFIABLE is not correct. Then what? CERTIFIED? No, because concept coverage 0.7 and unmatched concepts. So BLOCKED. Need reason. The reason should be concrete evidence. The unmatched concepts are concrete: directive concepts not found in zip. So BLOCKED-[missing concepts] or BLOCKED-[incomplete implementation]. The instruction says \"BLOCKED-[reason]\" with reason. We need one sentence of reasoning. The verdict line should be exactly one of those. Let's craft: \"BLOCKED-incomplete implementation\" and reasoning: \"The zip covers only 0.7 of directive concepts and lacks off-stream-ui, on-stream-ui, and other required concepts, so it does not implement the full directive.\" But need to ensure \"required\" is in unmatched list. Yes. So verdict: BLOCKED-incomplete implementation. But maybe reason should be more specific: \"BLOCKED-missing required concepts\" etc. The instruction says \"BLOCKED-[reason]\" so we can put \"BLOCKED-missing concepts\" or \"BLOCKED-incomplete\". Let's output exactly one verdict line and one sentence of reasoning. The user said \"produce exactly one verdict line: CERTIFIED, BLOCKED-[reason], or UNVERIFIABLE. No other output except the verdict and one sentence of reasoning.\" So we need to output the verdict line and then a sentence. The verdict line itself should be one of those. So we can output:\n\nBLOCKED-incomplete implementation\n\nThe zip covers only 0.7 of directive concepts and lacks off-stream-ui, on-stream-ui, and other required concepts, so it does not implement the full directive.\n\nBut wait, the instruction says \"Return ONLY one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE.\" That might mean the entire output should be just that line, but then \"No other output except the verdict and one sentence of reasoning.\" So we can have the verdict line and then a sentence. Let's do that.\n\nNeed to ensure the reason is concrete. The unmatched concepts list includes 'off-stream-ui', 'on-stream-ui', 'required', 'clicking', 'hides' etc. That is concrete evidence. So BLOCKED.\n\nLet's produce.",
        "reasoning_details": [
          {
            "type": "reasoning.text",
            "text": "We need to produce exactly one verdict line. Need to analyze. The structured findings: concept coverage 0.7, unmatched concepts list includes 'directive', 'architect', 'scaffolding', 'contains', 'off-stream-ui', 'on-stream-ui', 'required', 'clicking', 'hides'. No prior revision, no completion narrative artifact. Source directive exists. Concept coverage 0.7 means some concepts not covered. Unmatched concepts are found in directive but not in zip. That suggests the zip does not implement all concepts. However, need to determine if BLOCKED or UNVERIFIABLE. UNVERIFIABLE is correct when no prior revision to diff and no source directive to check, and nothing else contradicts narrative. But here there is a source directive, and concept coverage is 0.7 with unmatched concepts. That is concrete evidence of missing implementation? The instruction says BLOCKED is correct only if concrete evidence of fabrication, unused changed code, or contradiction between narrative and files. Missing concepts could be a contradiction if narrative claims full implementation. But we don't have narrative artifact. The findings say \"No completion narrative artifact found inside the zip.\" So we cannot compare narrative. However, the directive exists and concept coverage is 0.7, meaning 30% concepts not found. That is evidence that the zip does not fully implement the directive. But is that enough for BLOCKED? The reason would be \"incomplete implementation\" or \"missing concepts\". The instruction says BLOCKED only if concrete evidence of fabrication, unused changed code, or contradiction between narrative and files. Missing concepts is not exactly those. But \"contradiction between the narrative and the files\" - there is no narrative. So maybe UNVERIFIABLE because no narrative to contradict, and no prior revision. But there is a source directive to check, so UNVERIFIABLE condition \"no source directive to check\" is false. So UNVERIFIABLE is not correct because there is a source directive. Let's read carefully: \"UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts the narrative.\" Here there is a source directive. So UNVERIFIABLE is not correct. Then what? CERTIFIED? No, because concept coverage 0.7 and unmatched concepts. So BLOCKED. Need reason. The reason should be concrete evidence. The unmatched concepts are concrete: directive concepts not found in zip. So BLOCKED-[missing concepts] or BLOCKED-[incomplete implementation]. The instruction says \"BLOCKED-[reason]\" with reason. We need one sentence of reasoning. The verdict line should be exactly one of those. Let's craft: \"BLOCKED-incomplete implementation\" and reasoning: \"The zip covers only 0.7 of directive concepts and lacks off-stream-ui, on-stream-ui, and other required concepts, so it does not implement the full directive.\" But need to ensure \"required\" is in unmatched list. Yes. So verdict: BLOCKED-incomplete implementation. But maybe reason should be more specific: \"BLOCKED-missing required concepts\" etc. The instruction says \"BLOCKED-[reason]\" so we can put \"BLOCKED-missing concepts\" or \"BLOCKED-incomplete\". Let's output exactly one verdict line and one sentence of reasoning. The user said \"produce exactly one verdict line: CERTIFIED, BLOCKED-[reason], or UNVERIFIABLE. No other output except the verdict and one sentence of reasoning.\" So we need to output the verdict line and then a sentence. The verdict line itself should be one of those. So we can output:\n\nBLOCKED-incomplete implementation\n\nThe zip covers only 0.7 of directive concepts and lacks off-stream-ui, on-stream-ui, and other required concepts, so it does not implement the full directive.\n\nBut wait, the instruction says \"Return ONLY one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE.\" That might mean the entire output should be just that line, but then \"No other output except the verdict and one sentence of reasoning.\" So we can have the verdict line and then a sentence. Let's do that.\n\nNeed to ensure the reason is concrete. The unmatched concepts list includes 'off-stream-ui', 'on-stream-ui', 'required', 'clicking', 'hides' etc. That is concrete evidence. So BLOCKED.\n\nLet's produce.",
            "format": "unknown",
            "index": 0
          }
        ]
      }
    }
  ],
  "usage": {
    "prompt_tokens": 350,
    "completion_tokens": 962,
    "total_tokens": 1312,
    "cost": 0.00031836,
    "is_byok": false,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "cache_write_tokens": 0,
      "audio_tokens": 0,
      "video_tokens": 0
    },
    "cost_details": {
      "upstream_inference_cost": 0.00031836,
      "upstream_inference_prompt_cost": 4.9e-05,
      "upstream_inference_completions_cost": 0.00026936
    },
    "completion_tokens_details": {
      "reasoning_tokens": 918,
      "image_tokens": 0,
      "audio_tokens": 0
    }
  }
}
```