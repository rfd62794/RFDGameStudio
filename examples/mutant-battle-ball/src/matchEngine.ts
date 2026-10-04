/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatchSimulation, SimAgent, Mutant, MutantRole, PartVariant } from "./types";

// Setup match agents and ball
export function initMatch(
  playerMutants: Mutant[], // healthy mutants sent to match (must be 2)
  opponentTeam: {
    name: string;
    mutants: Array<{
      name: string;
      role: MutantRole;
      accuracy: number;
      endurance: number;
      power: number;
      speed: number;
    }>;
  }
): MatchSimulation {
  const agents: SimAgent[] = [];

  // Player mutants (starting on the left side)
  playerMutants.forEach((mut, idx) => {
    const isCarrier = idx === 0;
    agents.push({
      id: `p_agent_${idx}_${Date.now()}`,
      name: mut.name,
      role: isCarrier ? MutantRole.Carrier : MutantRole.Escort,
      team: "player",
      x: 15,
      y: 25 + idx * 50,
      vx: 0,
      vy: 0,
      currentEndurance: mut.currentEndurance,
      maxEndurance: mut.maxEndurance,
      accuracy: mut.accuracy,
      power: mut.power,
      speed: mut.speed,
      state: "active",
      recoveryTime: 0,
      isPlayerMutant: true,
      mutantId: mut.id
    });
  });

  // Opponent mutants (starting on the right side)
  opponentTeam.mutants.forEach((mut, idx) => {
    const isCarrier = idx === 0;
    agents.push({
      id: `o_agent_${idx}_${Date.now()}`,
      name: mut.name,
      role: isCarrier ? MutantRole.Carrier : MutantRole.Escort, // opponent roles will flip too
      team: "opponent",
      x: 85,
      y: 25 + idx * 50,
      vx: 0,
      vy: 0,
      currentEndurance: mut.endurance * 15,
      maxEndurance: mut.endurance * 15,
      accuracy: mut.accuracy,
      power: mut.power,
      speed: mut.speed,
      state: "active",
      recoveryTime: 0,
      isPlayerMutant: false
    });
  });

  return {
    scorePlayer: 0,
    scoreOpponent: 0,
    ballX: 50,
    ballY: 50,
    ballVx: 0,
    ballVy: 0,
    ballCarrierId: null, // Ball starts loose
    scorchMarks: [],
    agents,
    state: "prematch",
    statusText: "Assemble on court. Match starting...",
    timeRemaining: 180 // 3 minutes total
  };
}

// Tick update for the real-time simulation
export function updateMatch(
  match: MatchSimulation,
  deltaTime: number = 0.016 // default ~60fps step
): {
  updatedMatch: MatchSimulation;
  events: string[];
} {
  const events: string[] = [];
  if (match.state !== "playing") {
    return { updatedMatch: match, events };
  }

  // Decay match clock
  match.timeRemaining = Math.max(0, match.timeRemaining - deltaTime);
  if (match.timeRemaining <= 0) {
    match.state = "ended";
    match.statusText = "Time expired! Match ended.";
    return { updatedMatch: match, events: ["Match time expired!"] };
  }

  const COURT_WIDTH = 100;
  const COURT_HEIGHT = 100;

  // Helper distance function
  const dist = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  };

  // 1. BALL CARRIER AND ROLES RESOLUTION
  // Find which agent currently has the ball
  let carrier = match.ballCarrierId
    ? match.agents.find((a) => a.id === match.ballCarrierId && a.state === "active")
    : null;

  if (!carrier) {
    match.ballCarrierId = null;
  }

  // Adjust roles dynamic: If player has possession, player has 1 Carrier, 1 Escort. Opponent has Interceptor, Blocker.
  if (match.ballCarrierId) {
    const carrierAgent = match.agents.find((a) => a.id === match.ballCarrierId)!;
    const carrierTeam = carrierAgent.team;

    match.agents.forEach((agent) => {
      if (agent.state !== "active") return;

      if (agent.team === carrierTeam) {
        if (agent.id === match.ballCarrierId) {
          agent.role = MutantRole.Carrier;
        } else {
          agent.role = MutantRole.Escort;
        }
      } else {
        // Opposing team is defending
        // The closer defender is the Interceptor, the other is Blocker
        const defenderAgents = match.agents.filter((a) => a.team !== carrierTeam && a.state === "active");
        if (defenderAgents.length === 2) {
          const dist0 = dist(defenderAgents[0].x, defenderAgents[0].y, carrierAgent.x, carrierAgent.y);
          const dist1 = dist(defenderAgents[1].x, defenderAgents[1].y, carrierAgent.x, carrierAgent.y);
          if (dist0 < dist1) {
            defenderAgents[0].role = MutantRole.Interceptor;
            defenderAgents[1].role = MutantRole.Blocker;
          } else {
            defenderAgents[1].role = MutantRole.Interceptor;
            defenderAgents[0].role = MutantRole.Blocker;
          }
        } else if (defenderAgents.length === 1) {
          defenderAgents[0].role = MutantRole.Interceptor;
        }
      }
    });
  }

  // 2. AGENT AI AND PHYSICS
  match.agents.forEach((agent) => {
    // If agent is knocked-out, resolve recovery animation
    if (agent.state === "knocked-out") {
      agent.vx *= 0.8;
      agent.vy *= 0.8;
      agent.x += agent.vx;
      agent.y += agent.vy;
      agent.recoveryTime -= deltaTime;
      if (agent.recoveryTime <= 0) {
        // Sub from bench or recover slightly if it was just a stun
        // Let's make it a long KO that lasts the rest of the play, or recovers with 1 HP
        // Actually, we'll keep KO until next point scored, or let them get up if they have remaining HP
        if (agent.currentEndurance > 1) {
          agent.state = "active";
          agent.currentEndurance = Math.floor(agent.maxEndurance * 0.25); // get up with 25% health
          events.push(`${agent.name} recovers from the stun and gets up!`);
        }
      }
      return;
    }

    if (agent.state === "pulled") {
      return; // Pulled fighters are off court
    }

    // Determine target based on Role & Possession
    let targetX = 50;
    let targetY = 50;
    const isLoose = match.ballCarrierId === null;

    if (isLoose) {
      // Chase the ball
      targetX = match.ballX;
      targetY = match.ballY;
    } else {
      const ballCarrier = match.agents.find((a) => a.id === match.ballCarrierId)!;

      if (agent.role === MutantRole.Carrier) {
        // Carry ball to opponent's endzone (Player scores Right x=98, Opponent scores Left x=2)
        targetX = agent.team === "player" ? 100 : 0;
        targetY = 50 + Math.sin(Date.now() / 1000) * 15; // zigzag slightly to dodge
      } else if (agent.role === MutantRole.Escort) {
        // Lead the way in front of the Carrier to block incoming defenders
        const directionX = agent.team === "player" ? 1 : -1;
        targetX = ballCarrier.x + directionX * 12;
        targetY = ballCarrier.y;
      } else if (agent.role === MutantRole.Interceptor) {
        // Hunt the Ball Carrier!
        targetX = ballCarrier.x;
        targetY = ballCarrier.y;
      } else if (agent.role === MutantRole.Blocker) {
        // Target the Escort to take them out of the play
        const escort = match.agents.find((a) => a.team !== agent.team && a.role === MutantRole.Escort && a.state === "active");
        if (escort) {
          targetX = escort.x;
          targetY = escort.y;
        } else {
          targetX = ballCarrier.x;
          targetY = ballCarrier.y;
        }
      }
    }

    // Move toward target
    const dx = targetX - agent.x;
    const dy = targetY - agent.y;
    const d = Math.max(0.1, dist(agent.x, agent.y, targetX, targetY));

    // Speed multiplier. Carrier is slowed by ball weight.
    const speedMultiplier = agent.role === MutantRole.Carrier ? 0.6 : 1.0;
    const baseSpeed = 0.5 + (agent.speed / 10) * 0.6; // speed range roughly 0.5 to 1.1

    // Steering force
    const desiredVx = (dx / d) * baseSpeed * speedMultiplier;
    const desiredVy = (dy / d) * baseSpeed * speedMultiplier;

    // Apply inertia
    agent.vx += (desiredVx - agent.vx) * 0.15;
    agent.vy += (desiredVy - agent.vy) * 0.15;

    // Magnetic Court Fluctuations (Interference)
    // Random magnetic drift adds visual flavor and tactical variance
    if (Math.random() < 0.05) {
      agent.vx += (Math.random() - 0.5) * 0.1;
      agent.vy += (Math.random() - 0.5) * 0.1;
    }

    // Apply movement
    agent.x += agent.vx;
    agent.y += agent.vy;

    // Keep on court
    agent.x = Math.max(2, Math.min(COURT_WIDTH - 2, agent.x));
    agent.y = Math.max(4, Math.min(COURT_HEIGHT - 4, agent.y));
  });

  // 3. BALL PHYSICS
  if (match.ballCarrierId) {
    // Ball stays stuck to the carrier
    const ballCarrier = match.agents.find((a) => a.id === match.ballCarrierId)!;
    match.ballX = ballCarrier.x;
    match.ballY = ballCarrier.y;
    match.ballVx = ballCarrier.vx;
    match.ballVy = ballCarrier.vy;

    // Generate Scorch Marks from dragging heavy ball on magnetic court
    if (Math.random() < 0.12) {
      match.scorchMarks.push({
        x: match.ballX,
        y: match.ballY + (Math.random() - 0.5) * 3,
        opacity: 0.9
      });
    }

    // Carrier Random Throw Decisions (tactical passes or clearing attempts)
    // Head accuracy determines throw frequency and quality
    const carrierAgent = ballCarrier;
    if (Math.random() < 0.005 * (carrierAgent.accuracy / 10)) {
      // Find a healthy teammate to throw to
      const teammate = match.agents.find(
        (a) => a.team === carrierAgent.team && a.id !== carrierAgent.id && a.state === "active"
      );
      if (teammate) {
        // Execute dynamic throw
        const tDx = teammate.x - carrierAgent.x;
        const tDy = teammate.y - carrierAgent.y;
        const tDist = Math.max(0.1, dist(carrierAgent.x, carrierAgent.y, teammate.x, teammate.y));

        // Power determines throw velocity
        const throwForce = 1.2 + (carrierAgent.power / 10) * 1.5;
        match.ballVx = (tDx / tDist) * throwForce;
        match.ballVy = (tDy / tDist) * throwForce;
        match.ballCarrierId = null; // Ball is free!

        events.push(`${carrierAgent.name} passes the iron ball to ${teammate.name}!`);
      }
    }
  } else {
    // Ball is loose! Let's update ball physics with magnetic friction
    match.ballX += match.ballVx;
    match.ballY += match.ballVy;

    // Court friction & magnetic force pulls ball slightly back to center plates
    match.ballVx *= 0.96;
    match.ballVy *= 0.96;

    // Keep ball on court
    if (match.ballX < 1 || match.ballX > COURT_WIDTH - 1) {
      match.ballVx *= -0.8;
      match.ballX = Math.max(1, Math.min(COURT_WIDTH - 1, match.ballX));
    }
    if (match.ballY < 1 || match.ballY > COURT_HEIGHT - 1) {
      match.ballVy *= -0.8;
      match.ballY = Math.max(1, Math.min(COURT_HEIGHT - 1, match.ballY));
    }

    // Decaying Scorch Marks
    if (Math.abs(match.ballVx) + Math.abs(match.ballVy) > 0.5 && Math.random() < 0.2) {
      match.scorchMarks.push({
        x: match.ballX,
        y: match.ballY,
        opacity: 0.7
      });
    }

    // Ball pickup check: is any active agent close enough to claim?
    let closestAgent: SimAgent | null = null;
    let minPickupDist = 4.0; // pickup range

    match.agents.forEach((agent) => {
      if (agent.state !== "active") return;
      const d = dist(agent.x, agent.y, match.ballX, match.ballY);
      if (d < minPickupDist) {
        minPickupDist = d;
        closestAgent = agent;
      }
    });

    if (closestAgent) {
      const picker: SimAgent = closestAgent;
      match.ballCarrierId = picker.id;
      picker.role = MutantRole.Carrier;
      events.push(`${picker.name} claims the heavy iron ball!`);
    }
  }

  // Decay Scorch Marks opacity
  match.scorchMarks = match.scorchMarks
    .map((m) => ({ ...m, opacity: m.opacity - 0.005 }))
    .filter((m) => m.opacity > 0);

  // 4. TACKLES AND CONTACT COLLISIONS
  match.agents.forEach((attacker) => {
    if (attacker.state !== "active") return;

    // Defenders look to tackle Ball Carrier
    if (match.ballCarrierId && attacker.team !== "opponent" && match.ballCarrierId.startsWith("o_agent")) {
      // Player defender pursuing AI carrier
      handleCollision(attacker, match.agents.find(a => a.id === match.ballCarrierId)!);
    } else if (match.ballCarrierId && attacker.team === "opponent" && match.ballCarrierId.startsWith("p_agent")) {
      // AI defender pursuing Player carrier
      handleCollision(attacker, match.agents.find(a => a.id === match.ballCarrierId)!);
    } else {
      // General contact (Escorts vs Blockers)
      match.agents.forEach((target) => {
        if (target.id !== attacker.id && target.state === "active" && target.team !== attacker.team) {
          const colDist = dist(attacker.x, attacker.y, target.x, target.y);
          if (colDist < 3.2) {
            handleCollision(attacker, target);
          }
        }
      });
    }
  });

  function handleCollision(attacker: SimAgent, target: SimAgent) {
    const colDist = dist(attacker.x, attacker.y, target.x, target.y);
    if (colDist >= 3.5) return;

    // Resolve contact: Tackle attempt!
    const isTargetCarrier = target.role === MutantRole.Carrier;
    
    // Attacker's Power + Speed momentum vs Target's Endurance
    const attackPower = attacker.power * 1.5 + Math.random() * 5;
    const defenseEndurance = target.currentEndurance * 0.15 + (target.power * 0.5) + Math.random() * 5;

    // Push away slightly (repulsion physics)
    const pushDx = target.x - attacker.x;
    const pushDy = target.y - attacker.y;
    const pushD = Math.max(0.1, dist(attacker.x, attacker.y, target.x, target.y));

    attacker.vx -= (pushDx / pushD) * 0.3;
    attacker.vy -= (pushDy / pushD) * 0.3;
    target.vx += (pushDx / pushD) * 0.4;
    target.vy += (pushDy / pushD) * 0.4;

    if (attackPower > defenseEndurance + 2) {
      // TACKLE SUCCESS!
      const damage = Math.floor(attacker.power * 3 + Math.random() * 10);
      target.currentEndurance = Math.max(0, target.currentEndurance - damage);

      // Trigger visual shake or fumble
      if (isTargetCarrier) {
        match.ballCarrierId = null; // fumble ball!
        match.ballVx = (pushDx / pushD) * 1.5;
        match.ballVy = (pushDy / pushD) * 1.5;
        events.push(`BRUTAL TACKLE! ${attacker.name} tackles ${target.name}, forcing a FUMBLE! (-${damage} Endurance)`);
      } else {
        events.push(`${attacker.name} slams into ${target.name}, dealing ${damage} impact damage!`);
      }

      // Check for KO
      if (target.currentEndurance <= 0) {
        target.state = "knocked-out";
        target.recoveryTime = 5.0; // 5 seconds KO stun
        events.push(`CRITICAL! ${target.name} has been KNOCKED OUT on the magnetic field!`);
        attacker.vx += (pushDx / pushD) * 0.5; // triumph momentum
      }
    }
  }

  // 5. GOAL LINE DETECTION & SCORING
  // Player scores Right: x >= 96
  // Opponent scores Left: x <= 4
  if (match.ballCarrierId) {
    const ballCarrier = match.agents.find((a) => a.id === match.ballCarrierId)!;
    if (ballCarrier.team === "player" && ballCarrier.x >= 95.5) {
      match.scorePlayer++;
      triggerScoreReset("player");
    } else if (ballCarrier.team === "opponent" && ballCarrier.x <= 4.5) {
      match.scoreOpponent++;
      triggerScoreReset("opponent");
    }
  } else {
    // Loose ball crosses goal line
    if (match.ballX >= 97) {
      // Last touched by who? If loose ball enters right end zone, player scores if player was holding or AI fumbled
      match.scorePlayer++;
      triggerScoreReset("player");
    } else if (match.ballX <= 3) {
      match.scoreOpponent++;
      triggerScoreReset("opponent");
    }
  }

  function triggerScoreReset(scoringTeam: "player" | "opponent") {
    events.push(`SCORE! Team ${scoringTeam === "player" ? "Player" : "Opponent"} scores a point!`);
    
    // Check match completion (First to 3 scores)
    if (match.scorePlayer >= 3 || match.scoreOpponent >= 3) {
      match.state = "ended";
      match.statusText = match.scorePlayer >= 3 ? "VICTORY! You won the GridIron battle!" : "DEFEAT. Your stable lost.";
    } else {
      match.state = "scored";
      match.statusText = `GOAL! Score is ${match.scorePlayer} - ${match.scoreOpponent}. Resetting play...`;
    }
  }

  return { updatedMatch: match, events };
}

// Reset positions after a score or at kickoff
export function resetKickoff(match: MatchSimulation): MatchSimulation {
  match.ballX = 50;
  match.ballY = 50;
  match.ballVx = 0;
  match.ballVy = 0;
  match.ballCarrierId = null;

  let playerIdx = 0;
  let oppIdx = 0;

  match.agents.forEach((agent) => {
    agent.vx = 0;
    agent.vy = 0;

    if (agent.team === "player") {
      agent.x = 15;
      agent.y = 25 + playerIdx * 50;
      agent.role = playerIdx === 0 ? MutantRole.Carrier : MutantRole.Escort;
      playerIdx++;
    } else {
      agent.x = 85;
      agent.y = 25 + oppIdx * 50;
      agent.role = oppIdx === 0 ? MutantRole.Carrier : MutantRole.Escort;
      oppIdx++;
    }

    if (agent.state === "knocked-out") {
      agent.state = "active";
      agent.currentEndurance = Math.max(15, Math.floor(agent.maxEndurance * 0.4)); // gets up on kickoff reset with 40% health
    }
  });

  match.state = "playing";
  match.statusText = "Play restarted. Claim the ball!";
  return match;
}

// Perform active sub during match
export function substituteActiveAgent(
  match: MatchSimulation,
  pulledAgentId: string,
  newMutant: Mutant
): {
  updatedMatch: MatchSimulation;
  success: boolean;
  message: string;
} {
  const index = match.agents.findIndex((a) => a.id === pulledAgentId && a.team === "player");
  if (index === -1) {
    return { updatedMatch: match, success: false, message: "Fighter not found on court." };
  }

  const oldAgent = match.agents[index];
  
  // Create replacement SimAgent
  const replacementAgent: SimAgent = {
    id: `p_agent_sub_${Date.now()}`,
    name: newMutant.name,
    role: oldAgent.role === MutantRole.Carrier ? MutantRole.Carrier : MutantRole.Escort,
    team: "player",
    x: 5, // spawns from the sidelines/dugout on left
    y: oldAgent.y,
    vx: 0.5,
    vy: 0,
    currentEndurance: newMutant.currentEndurance,
    maxEndurance: newMutant.maxEndurance,
    accuracy: newMutant.accuracy,
    power: newMutant.power,
    speed: newMutant.speed,
    state: "active",
    recoveryTime: 0,
    isPlayerMutant: true,
    mutantId: newMutant.id
  };

  // If old agent had ball, release it
  if (match.ballCarrierId === oldAgent.id) {
    match.ballCarrierId = null;
    match.ballVx = -0.5;
  }

  // Remove old agent, append sub
  match.agents[index] = replacementAgent;

  return {
    updatedMatch: match,
    success: true,
    message: `${oldAgent.name} pulled back to dugout. ${newMutant.name} enters the court!`
  };
}
