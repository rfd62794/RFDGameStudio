export interface LaunchSite {
  fieldName: string;
  functionName: string;
  lineNumber: number;
  initialStatus: string;
}

export interface CompletionSite {
  fieldName: string;
  pattern: 'full_clear' | 'status_transition';
  lineNumber: number;
  lineText: string;
}

export interface LifecycleFinding {
  fieldName: string;
  launchSite: LaunchSite;
  completions: CompletionSite[];
  status: 'RESOLVED' | 'POTENTIALLY_UNRESOLVED_LIFECYCLE';
  nearMisses: string[];
}

export interface DetectionResult {
  luaPath: string;
  findings: LifecycleFinding[];
  flaggedCount: number;
  resolvedCount: number;
}

export function detectLifecycles(luaPath: string, luaText: string): DetectionResult {
  const lines = luaText.split('\n');
  const launches = findLaunchSites(lines);
  const findings: LifecycleFinding[] = [];

  for (const launch of launches) {
    const completions = findCompletions(lines, launch);
    const nearMisses = findNearMisses(lines, launch);

    const status = completions.length > 0
      ? 'RESOLVED' as const
      : 'POTENTIALLY_UNRESOLVED_LIFECYCLE' as const;

    findings.push({
      fieldName: launch.fieldName,
      launchSite: launch,
      completions,
      status,
      nearMisses,
    });
  }

  return {
    luaPath,
    findings,
    flaggedCount: findings.filter(f => f.status === 'POTENTIALLY_UNRESOLVED_LIFECYCLE').length,
    resolvedCount: findings.filter(f => f.status === 'RESOLVED').length,
  };
}

function findLaunchSites(lines: string[]): LaunchSite[] {
  const launches: LaunchSite[] = [];
  const launchPattern = /state\.(active_\w+)\s*=\s*\{/;
  const statusPattern = /status\s*=\s*"(\w+)"/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(launchPattern);
    if (!match) continue;

    const fieldName = match[1];

    // Look for status = "..." in the same line or nearby lines (table literal)
    let initialStatus = '';
    for (let j = i; j < Math.min(i + 5, lines.length); j++) {
      const statusMatch = lines[j].match(statusPattern);
      if (statusMatch) {
        initialStatus = statusMatch[1];
        break;
      }
    }

    if (!initialStatus) continue;

    // Find the enclosing function name
    const functionName = findEnclosingFunction(lines, i);

    launches.push({
      fieldName,
      functionName,
      lineNumber: i + 1,
      initialStatus,
    });
  }

  return launches;
}

function findEnclosingFunction(lines: string[], lineIndex: number): string {
  for (let i = lineIndex; i >= 0; i--) {
    const funcMatch = lines[i].match(/^function\s+(\w+)\s*\(/);
    if (funcMatch) return funcMatch[1];
  }
  return 'unknown';
}

function findCompletions(lines: string[], launch: LaunchSite): CompletionSite[] {
  const completions: CompletionSite[] = [];
  const field = launch.fieldName;

  for (let i = 0; i < lines.length; i++) {
    // Skip the launch function itself
    const funcName = findEnclosingFunction(lines, i);
    if (funcName === launch.functionName) continue;

    const line = lines[i];

    // Pattern A: state.active_X = nil
    const clearPattern = new RegExp(`state\\.${escapeRegex(field)}\\s*=\\s*nil`);
    if (clearPattern.test(line)) {
      completions.push({
        fieldName: field,
        pattern: 'full_clear',
        lineNumber: i + 1,
        lineText: line.trim(),
      });
    }

    // Pattern B: .status = "different_value" on the same field
    // Look for patterns like: state.active_X.status = "completed"
    // or: variable.status = "completed" where variable was assigned from state.active_X
    const statusWritePattern = new RegExp(
      `(?:state\\.${escapeRegex(field)}|(?:^|\\s)\\w+\\.status)\\s*=\\s*"([^"]*)"`,
    );
    const statusMatch = line.match(statusWritePattern);
    if (statusMatch && statusMatch[1] !== launch.initialStatus) {
      // Verify it's actually about this field — check for field reference nearby
      const fieldRefPattern = new RegExp(escapeRegex(field));
      if (fieldRefPattern.test(line) || fieldRefPattern.test(lines[Math.max(0, i - 1)] || '')) {
        completions.push({
          fieldName: field,
          pattern: 'status_transition',
          lineNumber: i + 1,
          lineText: line.trim(),
        });
      }
    }
  }

  return completions;
}

function findNearMisses(lines: string[], launch: LaunchSite): string[] {
  const nearMisses: string[] = [];
  const field = launch.fieldName;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for references to the field that aren't the launch or a clear completion
    // e.g. reading the field, checking its status, etc.
    if (line.includes(`state.${field}`) && !line.includes(`state.${field} = nil`)) {
      // Skip the launch line itself
      if (findEnclosingFunction(lines, i) === launch.functionName && line.includes(`state.${field} = {`)) {
        continue;
      }
      nearMisses.push(`Line ${i + 1}: ${line.trim()}`);
    }
  }

  return nearMisses;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
