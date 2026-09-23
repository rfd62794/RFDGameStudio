"""
Test Ollama connection with Pydantic AI.
"""

import os
os.environ["OLLAMA_BASE_URL"] = "http://localhost:11434"

from pydantic_ai import Agent

# Test 1: Simple agent with ollama prefix
print("Test 1: Testing ollama:llama3.2:latest...")
try:
    agent = Agent(model="ollama:llama3.2:latest")
    result = agent.run_sync("Say 'hello' in one word")
    print(f"✅ Success: {result.data}")
except Exception as e:
    print(f"❌ Failed: {e}")

# Test 2: Try without :latest tag
print("\nTest 2: Testing ollama:llama3.2:3b...")
try:
    agent = Agent(model="ollama:llama3.2:3b")
    result = agent.run_sync("Say 'hello' in one word")
    print(f"✅ Success: {result.data}")
except Exception as e:
    print(f"❌ Failed: {e}")

# Test 3: Try llama3.2:1b (known to exist)
print("\nTest 3: Testing ollama:llama3.2:1b...")
try:
    agent = Agent(model="ollama:llama3.2:1b")
    result = agent.run_sync("Say 'hello' in one word")
    print(f"✅ Success: {result.data}")
except Exception as e:
    print(f"❌ Failed: {e}")
