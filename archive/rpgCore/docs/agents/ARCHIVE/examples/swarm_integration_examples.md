# Swarm Integration Examples

This document shows how to use the enhanced swarm system with existing agents, tools, child agents, and A2A communication.

## Basic Swarm Usage

```python
from src.tools.apj.agents.swarm_agent import SwarmCoordinator
from src.tools.apj.agents.base_agent import AgentConfig

# Initialize swarm coordinator
config = AgentConfig.from_config("swarm_coordinator")
swarm = SwarmCoordinator(config)

# Process a request
result = swarm.process_request("Analyze the codebase", context)
print(result)
```

## Using Existing Agents

The swarm now integrates existing agents:

```python
# Get available agents
agents = swarm.get_available_agents()
print(agents)
# Output: {'swarm': [...], 'existing': ['strategist', 'archivist', 'herald'], 'children': []}

# Use existing agent directly
strategist = AGENT_REGISTRY.get_agent_instance("strategist")
if strategist:
    result = strategist.run("Create a strategic plan for the next phase")
```

## Tool Usage

Agents can now use tools:

```python
from src.tools.apj.agents.tools import TOOL_REGISTRY

# Use file tool
file_tool = TOOL_REGISTRY.get_tool("file_ops")
result = file_tool.read_file("src/main.py")

# Use code analysis tool
code_tool = TOOL_REGISTRY.get_tool("code_ops")
result = code_tool.analyze_code("src/main.py")

# Use testing tool
test_tool = TOOL_REGISTRY.get_tool("test_ops")
result = test_tool.run_tests()
```

## Child Agent Creation

Create specialized child agents for specific tasks:

```python
# Create a child agent for documentation
child_id = swarm.create_child_agent(
    purpose="Generate API documentation",
    capabilities=["documentation", "analysis"],
    tools=["file_ops", "code_ops"],
    lifespan=50  # expires after 50 operations
)

# Use the child agent
child_agent = CHILD_AGENT_MANAGER.get_child_agent(child_id)
if child_agent:
    result = child_agent.use_tool("file_ops", "read_file", "src/api.py")
```

## Agent-to-Agent Communication

Enable direct communication between agents:

```python
from src.tools.apj.agents.a2a_communication import A2A_MANAGER, MessageType, MessagePriority

# Send a message from coordinator to strategist
message_id = swarm.send_a2a_message(
    recipient="strategist",
    message_type=MessageType.REQUEST,
    content={"task": "Review current project status"},
    priority=MessagePriority.HIGH
)

# Broadcast to all agents
broadcast_id = swarm.broadcast_to_all_agents({
    "announcement": "New project phase starting",
    "phase": "Phase 3"
})

# Process messages
processed = A2A_MANAGER.process_messages()
```

## Enhanced Swarm Status

Get comprehensive swarm status:

```python
status = swarm.get_swarm_status()
print(status)
# Output includes:
# - Basic swarm info
# - Ecosystem status (existing agents, child agents, tools)
# - Communication status (messages, A2A agents)
```

## Advanced Example: Multi-Agent Workflow

```python
# 1. Create specialized child agents
doc_child = swarm.create_child_agent(
    purpose="Document code changes",
    capabilities=["documentation"],
    tools=["file_ops", "code_ops"]
)

test_child = swarm.create_child_agent(
    purpose="Run specific tests",
    capabilities=["testing"],
    tools=["test_ops", "system_ops"]
)

# 2. Coordinate through A2A communication
swarm.send_a2a_message(
    recipient="strategist",
    message_type=MessageType.TASK,
    content={
        "task": "Plan implementation",
        "assign_to": ["coder", "test_child", "doc_child"]
    }
)

# 3. Process messages and execute
A2A_MANAGER.process_messages()

# 4. Check results
for child_id in [doc_child, test_child]:
    child = CHILD_AGENT_MANAGER.get_child_agent(child_id)
    if child:
        print(f"Child {child_id} status: {child.get_status()}")
```

## Tool Integration in Agents

Agents can be configured to use specific tools:

```python
# Create agent with tool access
agent_config = AgentConfig(
    name="tool_enabled_agent",
    role="Agent with tool access",
    department="execution",
    model_preference="local",
    prompts={
        "system": "You have access to file and code analysis tools",
        "fewshot": "docs/agents/prompts/generic_system.md"
    },
    schema_name="GenericResponse",
    fallback={...},
    tools=["file_ops", "code_ops", "test_ops"]  # Available tools
)
```

## Cleanup and Management

```python
# Clean up expired child agents
expired = CHILD_AGENT_MANAGER.cleanup_expired_agents()
print(f"Cleaned up {len(expired)} expired agents")

# Clear expired messages
expired_messages = A2A_MANAGER.clear_expired_messages()
print(f"Cleared {expired_messages} expired messages")
```

## Best Practices

1. **Child Agents**: Use for specific, temporary tasks
2. **A2A Communication**: Use for complex multi-agent workflows
3. **Tools**: Provide agents with relevant tools for their domain
4. **Existing Agents**: Leverage existing specialist agents
5. **Cleanup**: Regularly clean up expired agents and messages

## Error Handling

```python
try:
    result = swarm.process_request("Complex task", context)
except Exception as e:
    # Fallback to single agent
    fallback_agent = AGENT_REGISTRY.get_agent_instance("analyzer")
    result = fallback_agent.run("Analyze task instead")
```
