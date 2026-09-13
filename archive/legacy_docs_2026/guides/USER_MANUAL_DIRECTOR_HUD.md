> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# DGT Theater - Director HUD User Manual

## Overview

The DGT Theater Director HUD provides real-time monitoring and control of the Iron Frame Theater performance. This manual explains all features for West Palm Beach Hub users.

## Quick Start

1. **Launch Theater**: Run `DGT_Launcher_Theater.py`
2. **Watch Performance**: The Tavern Voyage runs automatically
3. **Monitor Progress**: Real-time status updates display during performance
4. **View Results**: Performance data archived automatically

## Director HUD Interface

### Performance Status Display

```
🎭 ============== ACT [NUMBER] ================
📖 Scene: [SCENE_TYPE]
🎯 Target: [POSITION]
📝 Description: [NARRATIVE_TEXT]
🚶 Voyager executing blocking...
✅ Voyager arrived at [POSITION]
🎬 Director observing actor at mark...
🎭 Cue Executed: [CUE_NAME]
✨ Active Effects: [EFFECT_LIST]
```

### Real-time Metrics

| Metric | Description | Normal Range |
|--------|-------------|---------------|
| **Current Act** | Active scene number | 1-5 |
| **Director State** | Theater Director status | waiting_for_actor, executing_cue, performance_complete |
| **Distance to Target** | Voyager proximity to mark | 0 = at mark |
| **Active Effects** | Running environmental effects | 0-6 simultaneously |
| **Performance Time** | Elapsed execution time | ~3.0 seconds |

## Performance States

### Director States

1. **WAITING_FOR_ACTOR**
   - Director observing Voyager position
   - Waiting for actor to reach target mark
   - Normal state during movement

2. **EXECUTING_CUE**
   - Director triggered scene transition
   - StageManager executing world changes
   - Brief state during cue execution

3. **PERFORMANCE_COMPLETE**
   - All acts completed successfully
   - Final state when performance ends
   - Performance data archived

### Cue Types

| Cue | Trigger | Effect |
|-----|---------|--------|
| **cue_forest_to_gate** | Arrive at (10, 25) | Gate reveal effect, forest to city transition |
| **cue_gate_to_square** | Arrive at (10, 20) | Tile bank swap, city ambiance |
| **cue_square_to_tavern** | Arrive at (10, 10) | Tavern glow effect |
| **cue_tavern_entrance** | Arrive at (20, 10) | Portal jump to (25, 30), interior effects |
| **cue_performance_complete** | Arrive at (25, 30) | Completion celebration, final effects |

## Environmental Effects

### Effect Types

1. **gate_reveal** (2.0s duration)
   - Iron gates becoming visible
   - Golden glow effect
   - Forest to city transition

2. **city_ambiance** (5.0s duration)
   - Town square atmosphere
   - Crowd murmur sound
   - Urban environment

3. **tavern_glow** (3.0s duration)
   - Warm orange lighting
   - Inviting atmosphere
   - Building approach

4. **firelight** (10.0s duration)
   - Flickering orange light
   - Interior warmth
   - Tavern atmosphere

5. **interior_ambiance** (8.0s duration)
   - Crackling fire sound
   - Cozy interior
   - Rest environment

6. **completion_glow** (5.0s duration)
   - Golden celebration effect
   - Performance success
   - Victory atmosphere

## Performance Monitoring

### Real-time Logs

The Director HUD displays detailed logging during performance:

```
2026-02-07 08:55:10.292 | INFO | src.core.theater_director:begin_performance:115 - 🎬 Performance begun! Act 1: forest_edge
2026-02-07 08:55:10.292 | INFO | src.core.theater_director:begin_performance:116 - 🎯 Target position: (10, 25)
2026-02-07 08:55:10.292 | INFO | src.core.theater_director:observe_actor_position:150 - 🎯 Actor at mark! Position: (10, 25) (Act 1)
```

### Progress Tracking

- **Act Progress**: Current act number and total acts
- **Completion Rate**: Percentage of acts completed
- **Time Tracking**: Execution time per act and total performance
- **Effect Status**: Active and expired environmental effects

## Performance Data

### Golden Reel Archive

Each performance creates a `THE_GOLDEN_REEL_FINAL_[timestamp].json` file containing:

```json
{
  "performance_metadata": {
    "title": "The Tavern Voyage - Golden Reel Final",
    "version": "1.0.0",
    "timestamp": "2026-02-07 08:55:13",
    "duration_seconds": 3.02,
    "success_rate": 100.0
  },
  "performance_log": [
    {
      "act_number": 1,
      "scene_type": "forest_edge",
      "target_position": [10, 25],
      "cue_executed": "cue_forest_to_gate",
      "duration_seconds": 0.10
    }
  ]
}
```

### World Chronicle

The `WORLD_CHRONICLE.md` file documents each performance with:

- Performance summary and metrics
- Complete act-by-act breakdown
- Technical achievement documentation
- Victory statement and conclusion

## Troubleshooting

### Common Issues

1. **Performance Stalls**
   - Check: Voyager position matches target
   - Solution: Ensure A* pathfinding is working
   - Status: Director should be in WAITING_FOR_ACTOR state

2. **Cue Execution Fails**
   - Check: StageManager cue handlers registered
   - Solution: Verify tile bank names and positions
   - Status: Effects should still trigger with demo mode fallback

3. **Effects Not Displaying**
   - Check: Effect duration and parameters
   - Solution: Verify effect queue processing
   - Status: Active effects list should show running effects

### Performance Validation

- **Success Rate**: Should be 100.0% (5/5 acts completed)
- **Execution Time**: Should be ~3.0 seconds
- **Test Coverage**: 18/18 tests should pass
- **Director State**: Should end in PERFORMANCE_COMPLETE

## Advanced Features

### Custom Playbooks

The Director HUD supports custom playbooks:

1. Create new playbook file
2. Define act sequence and cues
3. Update factory methods
4. Test with same HUD interface

### Performance Comparison

Compare multiple performances using archived data:

```bash
# Compare performance times
ls final_validation/THE_GOLDEN_REEL_FINAL_*.json
```

### Debug Mode

Enable detailed logging for development:

```python
# Add to launcher for debug mode
logger.setLevel("DEBUG")
```

## System Requirements

### Minimum Requirements
- **CPU**: Any modern processor
- **Memory**: 512MB RAM
- **Storage**: 100MB free space
- **Python**: 3.8 or higher

### Recommended Requirements
- **CPU**: Multi-core processor
- **Memory**: 1GB RAM
- **Storage**: 500MB free space
- **Display**: 1024x768 resolution

## Support

### Performance Issues
- Check 18/18 tests are passing
- Verify all tile banks are available
- Ensure Python dependencies are installed

### Technical Support
- Review performance logs in console output
- Check archived Golden Reel data
- Consult World Chronicle for performance summary

---

**DGT Theater Director HUD** - Your window into the Iron Frame Theater performance.
