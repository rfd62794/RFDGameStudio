# Zip Verification Report — break-streamer-mvp

**Source:** `C:\Users\cheat\Downloads\break-streamer-mvp.zip`
**Generated:** 2026-08-31T02:04:57.080837+00:00
**Model:** deepseek/deepseek-v4-flash-0731

## Verdict: BLOCKED-CONCEPT COVERAGE IS ONLY 0.63, INDICATING INCOMPLETE IMPLEMENTATION OF THE DIRECTIVE.

BLOCKED-Concept coverage is only 0.63, indicating incomplete implementation of the directive.

## Component Findings

### Revision Diff
- No prior revision available; baseline diff skipped.

### Concept Grep
- Directive: `C:\Github\RFDGameStudio\docs\directives\break-streamer-mvp_Directive.md`
- Concept coverage: 0.63
- Suspiciously clean/uniform: False
- Concept matches:
  - `current`: 87
  - `state`: 251
  - `ready`: 10
  - `break`: 27
  - `streamer`: 16
  - `divert`: 1
  - `selling`: 1
  - `economic`: 1
  - `engine`: 1
  - `write`: 16
  - `include`: 1
  - `classes`: 1
  - `toggle`: 58
  - `controller`: 4
  - `logic`: 2
  - `handles`: 2
  - `transition`: 47
  - `office`: 19
  - `starts`: 4

### Caller Check
- Changed functions: []
- Unused changed functions: []
- All changed functions called: True

### Narrative Artifact
- No completion narrative artifact found inside the zip.

## Raw LLM Response
```json
{
  "id": "gen-1788141861-wSJeX7ZQPQ7ItN3Dxpj4",
  "object": "chat.completion",
  "created": 1788141861,
  "model": "deepseek/deepseek-v4-flash-0731",
  "provider": "OpenInference",
  "system_fingerprint": "vllm-dev-ep-8b5ae245",
  "service_tier": null,
  "choices": [
    {
      "index": 0,
      "logprobs": null,
      "finish_reason": "stop",
      "native_finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": " BLOCKED-Concept coverage is only 0.63, indicating incomplete implementation of the directive.",
        "refusal": null,
        "reasoning": "We are given a scenario: verifying whether an AI Studio zip export implements what was asked. The provided information includes:\n\n- No prior revision exists to diff against.\n- Source directive: C:\\RFDGameStudio\\docs\\directives\\break-streamer-mvp_Directive.md\n- Concept coverage in zip: 0.63 (presumably a metric indicating how much of the directive is covered)\n- Suspiciously clean/uniform: False (meaning the code is not suspiciously clean/uniform, so that's not a red flag)\n- Changed functions with zero call sites: [] (empty list, so no unused changed functions)\n- No completion narrative artifact found inside the zip.\n\nWe need to output one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE.\n\nThe instructions say: \"UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts the narrative.\" But here we have a source directive (the directive file) and we have a concept coverage of 0.63, which suggests that the implementation does not fully cover the directive. Also, there is no completion narrative artifact, which might be expected. However, the key point: we have a source directive to check, so we can verify against it. The concept coverage is 0.63, meaning only 63% of the concepts are covered. That suggests that the implementation does not fully meet the directive. So we should not certify it. Also, we have no prior revision, but we have a directive. So UNVERIFIABLE is not appropriate because we have a directive to check. BLOCKED is appropriate if there is concrete evidence of a contradiction. The concept coverage of 0.63 is a concrete metric indicating that the implementation does not fully implement the directive. So we can block it with reason: \"Concept coverage is only 0.63, indicating incomplete implementation of the directive.\" Also, there is no completion narrative artifact, which might be a requirement, but we don't know. The directive might require a narrative. But the main issue is the low coverage.\n\nThus, the verdict should be BLOCKED with a reason.\n\nWe need to output exactly one line: \"BLOCKED-[reason]\". So we can say \"BLOCKED-Incomplete implementation: concept coverage is 0.63, below expected full coverage.\"\n\nBut we should be precise. The instructions say: \"BLOCKED is correct only if you can point to concrete evidence of fabrication, unused changed code, or a contradiction between the narrative and the files.\" Here we have a contradiction: the directive expects full implementation, but coverage is only 0.63. That is a contradiction. So we can block.\n\nThus, output: BLOCKED-Incomplete implementation: concept coverage is 0.63, not meeting directive requirements.\n\nBut we need to ensure we follow the format: \"BLOCKED-[reason]\". So I'll write: \"BLOCKED-Concept coverage is only 0.63, indicating incomplete implementation of the directive.\"\n\nAlternatively, we could say \"BLOCKED-Missing completion narrative artifact\" but that might not be a direct contradiction. The coverage is more concrete.\n\nGiven the information, I'll go with that.\n\nFinal answer: BLOCKED-Concept coverage is only 0.63, indicating incomplete implementation of the directive.",
        "reasoning_details": [
          {
            "type": "reasoning.text",
            "text": "We are given a scenario: verifying whether an AI Studio zip export implements what was asked. The provided information includes:\n\n- No prior revision exists to diff against.\n- Source directive: C:\\RFDGameStudio\\docs\\directives\\break-streamer-mvp_Directive.md\n- Concept coverage in zip: 0.63 (presumably a metric indicating how much of the directive is covered)\n- Suspiciously clean/uniform: False (meaning the code is not suspiciously clean/uniform, so that's not a red flag)\n- Changed functions with zero call sites: [] (empty list, so no unused changed functions)\n- No completion narrative artifact found inside the zip.\n\nWe need to output one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE.\n\nThe instructions say: \"UNVERIFIABLE is correct when there is no prior revision to diff and no source directive to check, and nothing else contradicts the narrative.\" But here we have a source directive (the directive file) and we have a concept coverage of 0.63, which suggests that the implementation does not fully cover the directive. Also, there is no completion narrative artifact, which might be expected. However, the key point: we have a source directive to check, so we can verify against it. The concept coverage is 0.63, meaning only 63% of the concepts are covered. That suggests that the implementation does not fully meet the directive. So we should not certify it. Also, we have no prior revision, but we have a directive. So UNVERIFIABLE is not appropriate because we have a directive to check. BLOCKED is appropriate if there is concrete evidence of a contradiction. The concept coverage of 0.63 is a concrete metric indicating that the implementation does not fully implement the directive. So we can block it with reason: \"Concept coverage is only 0.63, indicating incomplete implementation of the directive.\" Also, there is no completion narrative artifact, which might be a requirement, but we don't know. The directive might require a narrative. But the main issue is the low coverage.\n\nThus, the verdict should be BLOCKED with a reason.\n\nWe need to output exactly one line: \"BLOCKED-[reason]\". So we can say \"BLOCKED-Incomplete implementation: concept coverage is 0.63, below expected full coverage.\"\n\nBut we should be precise. The instructions say: \"BLOCKED is correct only if you can point to concrete evidence of fabrication, unused changed code, or a contradiction between the narrative and the files.\" Here we have a contradiction: the directive expects full implementation, but coverage is only 0.63. That is a contradiction. So we can block.\n\nThus, output: BLOCKED-Incomplete implementation: concept coverage is 0.63, not meeting directive requirements.\n\nBut we need to ensure we follow the format: \"BLOCKED-[reason]\". So I'll write: \"BLOCKED-Concept coverage is only 0.63, indicating incomplete implementation of the directive.\"\n\nAlternatively, we could say \"BLOCKED-Missing completion narrative artifact\" but that might not be a direct contradiction. The coverage is more concrete.\n\nGiven the information, I'll go with that.\n\nFinal answer: BLOCKED-Concept coverage is only 0.63, indicating incomplete implementation of the directive.",
            "format": "unknown",
            "index": 0
          }
        ]
      }
    }
  ],
  "usage": {
    "prompt_tokens": 221,
    "completion_tokens": 712,
    "total_tokens": 933,
    "cost": 0.00012055,
    "is_byok": false,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "cache_write_tokens": 0,
      "audio_tokens": 0,
      "video_tokens": 0
    },
    "cost_details": {
      "upstream_inference_cost": 0.00012055,
      "upstream_inference_prompt_cost": 6.63e-06,
      "upstream_inference_completions_cost": 0.00011392
    },
    "completion_tokens_details": {
      "reasoning_tokens": 690,
      "image_tokens": 0,
      "audio_tokens": 0
    }
  }
}
```