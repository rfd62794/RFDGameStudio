# ADJ System Layers

## Quick Reference

| Command | Layer Used | Cost | Speed |
|---------|-----------|------|-------|
| `status` | 1-2 | FREE | Instant |
| `phase 3` | 1-2 | FREE | Instant |
| `priorities` | 1-2 | FREE | Instant |
| `strategy 3` | 1-3 | FREE | Fast |
| `analyze` | 1-3 | FREE | Fast |

## How It Works

```bash
python adj.py status
  → Load files (Layer 1)
  → Analyze locally (Layer 2)
  → Print result + layers used
  → Done. No remote calls.
```

```bash
python adj.py strategy 3
  → Load files (Layer 1)
  → Analyze locally (Layer 2)
  → Ask Ollama if available (Layer 3)
  → Print result + layers used
  → Falls back to Layer 2 if Ollama unavailable
```

## Layer Architecture

### Layer 1: Data Files (FREE)
- **Purpose**: Load data from documentation files
- **Files**: `MILESTONES.md`, `TASKS.md`, `journal.yaml`
- **Speed**: Instant
- **Cost**: FREE
- **Fallback**: None (source of truth)

### Layer 2: Local Analysis (FREE)
- **Purpose**: Pure Python analysis of loaded data
- **Processing**: Status calculation, blocker detection
- **Speed**: Instant
- **Cost**: FREE
- **Fallback**: Always available

### Layer 3: Ollama (Local) (FREE/CHEAP)
- **Purpose**: Local AI model for complex analysis
- **Model**: Mistral (configurable)
- **Speed**: Fast
- **Cost**: FREE/CHEAP (local compute)
- **Fallback**: Layer 2 if unavailable

### Layer 4: Remote (OpenRouter) (EXPENSIVE)
- **Purpose**: Remote models for advanced analysis
- **Models**: GPT-4, Claude, etc.
- **Speed**: Variable
- **Cost**: EXPENSIVE (tokens)
- **Fallback**: Layer 3 if unavailable

## Setup Ollama

```bash
# Install: https://ollama.ai
# Run: ollama serve
# Pull: ollama pull mistral

# Verify:
curl http://localhost:11434/api/tags
```

## Cost Transparency

Every command shows which layers it used:

```bash
$ python adj.py status

[output]

🔧 Layers Used:
  Layer 1: Data Files (FREE)
  Layer 2: Local Analysis (FREE)
```

vs.

```bash
$ python adj.py strategy 3

[output]

🔧 Layers Used:
  Layer 1: Data Files (FREE)
  Layer 2: Local Analysis (FREE)
  Layer 3: Ollama (Local) (FREE)
```

## Layer Selection Logic

The system automatically selects the cheapest layer that can handle the request:

1. **Basic commands** (`status`, `phase`, `priorities`) → Layer 1 + 2
2. **Strategy commands** (`strategy`) → Layer 1 + 2 + 3 (if available)
3. **Complex analysis** → Layer 1 + 2 + 3 + 4 (if needed)

## Fallback Behavior

- **Ollama unavailable** → Falls back to Layer 2
- **Remote unavailable** → Falls back to Layer 3
- **All unavailable** → Uses Layer 1 + 2 only

## Performance Impact

- **Layer 1**: File I/O only (negligible)
- **Layer 2**: Pure Python (instant)
- **Layer 3**: Local AI inference (fast, < 5 seconds)
- **Layer 4**: Remote API calls (variable, 10-30 seconds)

## Configuration

### Model Selection
```python
# In ollama_layer.py
self.model = "mistral"  # Change to preferred model
```

### Base URL
```python
# In ollama_layer.py
self.base_url = "http://localhost:11434"  # Change if needed
```

## Troubleshooting

### Ollama Not Available
```bash
# Check if running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Pull model
ollama pull mistral
```

### Layer Not Used
- Check command type (basic vs strategy)
- Verify Ollama is running
- Check network connectivity for remote

## Examples

### Basic Status (Layers 1-2)
```bash
$ python adj.py status

📊 TEST FLOOR: 685 / 462
🏗️ PHASE STATUS: Phase 1 ✅, Phase 2 ✅, Phase 3 🔄
🔧 Layers Used:
  Layer 1: Data Files (FREE)
  Layer 2: Local Analysis (FREE)
```

### Strategy Analysis (Layers 1-3)
```bash
$ python adj.py strategy 3

📊 PHASE DATA: Tower Defense Integration
🤖 AI Analysis: Strategic importance is high...
🔧 Layers Used:
  Layer 1: Data Files (FREE)
  Layer 2: Local Analysis (FREE)
  Layer 3: Ollama (Local) (FREE)
```

### Fallback (Layers 1-2 only)
```bash
$ python adj.py strategy 3

📊 PHASE DATA: Tower Defense Integration
🤖 AI Analysis: Local analysis only
🔧 Layers Used:
  Layer 1: Data Files (FREE)
  Layer 2: Local Analysis (FREE)
```

## Future Enhancements

### Layer 4: Remote Models
- Add OpenRouter integration
- Implement token cost tracking
- Add model selection options

### Advanced Caching
- Cache Ollama responses
- Persist analysis results
- Smart cache invalidation

### Performance Monitoring
- Track layer usage statistics
- Monitor response times
- Optimize layer selection

---

**Status**: ✅ **Layered Architecture Operational** - adj.py now uses intelligent layer selection with cost transparency.
