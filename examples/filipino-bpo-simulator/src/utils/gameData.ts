import { GridTile, Agent, ClientCampaign, CallScriptConfig, ITInfrastructure, HRPolicy } from '../types';
import { getRandomName } from './names';

export const INITIAL_CAMPAIGNS: ClientCampaign[] = [
  {
    id: 'camp_1',
    name: 'MegaTel USA (Billing & Inbound)',
    clientCountry: 'USA',
    serviceType: 'Customer Support',
    payoutPerCall: 145, // PHP
    targetAHT: 240, // 4 mins
    targetCSAT: 80,
    difficulty: 2,
    active: true,
    totalCallsReceived: 1240,
    totalCallsHandled: 1218,
  },
  {
    id: 'camp_2',
    name: 'Apex Cloud Hosting (Tier 2 Tech)',
    clientCountry: 'USA / Canada',
    serviceType: 'Technical Support',
    payoutPerCall: 310,
    targetAHT: 420, // 7 mins
    targetCSAT: 88,
    difficulty: 4,
    active: true,
    totalCallsReceived: 560,
    totalCallsHandled: 542,
  },
  {
    id: 'camp_3',
    name: 'Aussie Retail Express (Orders & VIP)',
    clientCountry: 'Australia',
    serviceType: 'eCommerce Order Care',
    payoutPerCall: 180,
    targetAHT: 200,
    targetCSAT: 85,
    difficulty: 3,
    active: false,
    totalCallsReceived: 0,
    totalCallsHandled: 0,
  },
  {
    id: 'camp_4',
    name: 'OmniBank Fraud & Card Verification',
    clientCountry: 'UK / Europe',
    serviceType: 'Financial Verification',
    payoutPerCall: 450,
    targetAHT: 360,
    targetCSAT: 92,
    difficulty: 5,
    active: false,
    totalCallsReceived: 0,
    totalCallsHandled: 0,
  }
];

export const INITIAL_SCRIPT_CONFIG: CallScriptConfig = {
  greeting: 'friendly',
  empathyLevel: 'balanced',
  objectionStrategy: 'active_listening',
  surveyPrompt: 'enthusiastic',
  upsellAttempt: true,
};

export const INITIAL_IT_CONFIG: ITInfrastructure = {
  ispProvider: 'GLOBE_CORP',
  serverHealth: 94,
  serverLoad: 68,
  coolingActive: true,
  pcTier: 2,
  headsetTier: 2,
  bandwidthMbps: 500,
};

export const INITIAL_HR_CONFIG: HRPolicy = {
  basePayMultiplier: 1.05,
  nightDiffPercent: 15,
  hmoPlan: 'SILVER',
  freeCoffeeEnabled: true,
  freeMealsEnabled: false,
  monthly13thAccrued: 48000,
};

// Generate default office grid layout (20 x 20) matching the screenshot
export function generateInitialGrid(): GridTile[] {
  const grid: GridTile[] = [];
  const width = 20;
  const height = 20;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let type: GridTile['type'] = 'FLOOR';
      let label: string | undefined = undefined;
      let qualityLevel = 1;

      // Outer perimeter walls
      if (y === 0 || x === 0) {
        type = 'WALL';
      } 
      // Top Left: Reception area
      else if (x >= 2 && x <= 4 && y >= 2 && y <= 3) {
        if (x === 3 && y === 2) {
          type = 'RECEPTION_DESK';
          label = 'RECEPTION';
        } else if (x === 2 && y === 2) {
          type = 'PLANT';
        } else {
          type = 'FLOOR';
        }
      }
      // Bottom Left: Server Room (X: 1-4, Y: 15-18)
      else if (x >= 1 && x <= 4 && y >= 15 && y <= 18) {
        if ((x === 2 || x === 3) && (y === 16 || y === 17)) {
          type = 'SERVER_RACK';
          label = 'SRV';
          qualityLevel = 2;
        } else if (x === 4 && y === 15) {
          type = 'DOOR';
        } else if (x === 4 || y === 15) {
          type = 'WALL';
        } else {
          type = 'FLOOR';
        }
      }
      // Top Right: Pantry & Break Room (X: 15-19, Y: 1-5)
      else if (x >= 15 && x <= 19 && y >= 1 && y <= 5) {
        if (x === 15 && y === 3) {
          type = 'DOOR';
        } else if (x === 15) {
          type = 'WALL';
        } else if (x === 17 && y === 2) {
          type = 'PANTRY_TABLE';
          label = 'PANTRY';
        } else if (x === 18 && y === 2) {
          type = 'PANTRY_TABLE';
        } else if (x === 19 && y === 1) {
          type = 'WATER_DISPENSER';
        } else if (x === 19 && y === 2) {
          type = 'COFFEE_MAKER';
        } else if (x === 16 && y === 4) {
          type = 'VENDING_MACHINE';
        } else {
          type = 'FLOOR';
        }
      }
      // Bottom Right: Sleeping Quarters (X: 16-19, Y: 15-18)
      else if (x >= 16 && x <= 19 && y >= 15 && y <= 18) {
        if (x === 16 && y === 16) {
          type = 'DOOR';
        } else if (x === 16) {
          type = 'WALL';
        } else if ((x === 18 || x === 19) && (y === 16 || y === 17)) {
          type = 'SLEEPING_POD';
          label = 'BED';
        } else {
          type = 'FLOOR';
        }
      }
      // Main Floor Cubicle Pods A, B, C, D, E, F
      // Cluster columns and rows
      else {
        // Pod A: (x: 4-6, y: 5-7)
        if (x >= 4 && x <= 6 && y >= 5 && y <= 7) {
          if (x === 5 && y === 5) {
            type = 'CUBICLE';
            label = 'A';
          } else if (x !== 5 || y !== 6) {
            type = 'CUBICLE';
          }
        }
        // Pod B: (x: 8-10, y: 5-7)
        else if (x >= 8 && x <= 10 && y >= 5 && y <= 7) {
          if (x === 9 && y === 5) {
            type = 'CUBICLE';
            label = 'B';
          } else if (x !== 9 || y !== 6) {
            type = 'CUBICLE';
          }
        }
        // Pod C: (x: 12-14, y: 5-7)
        else if (x >= 12 && x <= 14 && y >= 5 && y <= 7) {
          if (x === 13 && y === 5) {
            type = 'CUBICLE';
            label = 'C';
          } else if (x !== 13 || y !== 6) {
            type = 'CUBICLE';
          }
        }
        // Pod D: (x: 5-7, y: 10-12)
        else if (x >= 5 && x <= 7 && y >= 10 && y <= 12) {
          if (x === 6 && y === 10) {
            type = 'CUBICLE';
            label = 'D';
          } else if (x !== 6 || y !== 11) {
            type = 'CUBICLE';
          }
        }
        // Pod E: (x: 9-11, y: 10-12)
        else if (x >= 9 && x <= 11 && y >= 10 && y <= 12) {
          if (x === 10 && y === 10) {
            type = 'CUBICLE';
            label = 'E';
          } else if (x !== 10 || y !== 11) {
            type = 'CUBICLE';
          }
        }
        // Pod F: (x: 13-15, y: 10-12)
        else if (x >= 13 && x <= 15 && y >= 10 && y <= 12) {
          if (x === 14 && y === 10) {
            type = 'CUBICLE';
            label = 'F';
          } else if (x !== 14 || y !== 11) {
            type = 'CUBICLE';
          }
        }
        // Decorative plants at aisle ends
        else if ((x === 2 && y === 9) || (x === 14 && y === 3) || (x === 12 && y === 14)) {
          type = 'PLANT';
        }
      }

      grid.push({
        x,
        y,
        type,
        label,
        qualityLevel,
        status: 'OK',
        id: `tile_${x}_${y}`,
        assignedAgentId: null,
      });
    }
  }

  return grid;
}

// Generate starting agents for the cubicles
export function generateInitialAgents(grid: GridTile[]): Agent[] {
  const cubicles = grid.filter(t => t.type === 'CUBICLE');
  const agents: Agent[] = [];

  const roles: Agent['role'][] = ['CSR', 'CSR', 'CSR', 'TSR', 'CSR', 'CSR', 'SALES', 'CSR', 'TSR'];
  const shifts: Agent['shift'][] = ['MORNING', 'MORNING', 'MID', 'MID', 'GRAVEYARD', 'GRAVEYARD'];

  cubicles.forEach((tile, index) => {
    // Fill ~80% of cubicles
    if (Math.random() < 0.85) {
      const { name, gender } = getRandomName();
      const role = index % 8 === 0 ? 'TL' : roles[index % roles.length];
      const shift = shifts[index % shifts.length];

      const agent: Agent = {
        id: `agent_${index + 1}`,
        name,
        avatarSeed: Math.floor(Math.random() * 1000),
        gender,
        role,
        shift,
        state: Math.random() < 0.7 ? 'ON_CALL' : (Math.random() < 0.6 ? 'ACW' : 'IDLE'),
        deskId: tile.id || null,
        energy: 70 + Math.floor(Math.random() * 28),
        stress: 15 + Math.floor(Math.random() * 35),
        morale: 72 + Math.floor(Math.random() * 25),
        englishSkill: 65 + Math.floor(Math.random() * 30),
        empathySkill: 70 + Math.floor(Math.random() * 28),
        techSkill: role === 'TSR' ? 82 + Math.floor(Math.random() * 15) : 55 + Math.floor(Math.random() * 30),
        speed: 70 + Math.floor(Math.random() * 25),
        callsHandledToday: Math.floor(Math.random() * 24),
        totalCallsHandled: 120 + Math.floor(Math.random() * 800),
        csat: 82 + Math.floor(Math.random() * 16),
        avgHandleTime: 220 + Math.floor(Math.random() * 90),
        salary: role === 'TL' ? 38000 : 26000,
        bonusEarned: Math.floor(Math.random() * 4500),
        activeCallDuration: Math.floor(Math.random() * 180),
        gridX: tile.x,
        gridY: tile.y,
      };

      tile.assignedAgentId = agent.id;
      agents.push(agent);
    }
  });

  // Add 1 IT Specialist roaming
  const itPerson = getRandomName('M');
  agents.push({
    id: 'agent_it_1',
    name: `${itPerson.name} (IT)`,
    avatarSeed: 42,
    gender: 'M',
    role: 'IT',
    shift: 'MID',
    state: 'WALKING',
    deskId: null,
    energy: 90,
    stress: 20,
    morale: 85,
    englishSkill: 75,
    empathySkill: 60,
    techSkill: 95,
    speed: 88,
    callsHandledToday: 0,
    totalCallsHandled: 0,
    csat: 95,
    avgHandleTime: 120,
    salary: 34000,
    bonusEarned: 2000,
    activeCallDuration: 0,
    gridX: 3,
    gridY: 14,
    targetGridX: 8,
    targetGridY: 8,
  });

  // Add 1 QA Specialist roaming
  const qaPerson = getRandomName('F');
  agents.push({
    id: 'agent_qa_1',
    name: `${qaPerson.name} (QA)`,
    avatarSeed: 99,
    gender: 'F',
    role: 'QA',
    shift: 'MORNING',
    state: 'COACHING',
    deskId: null,
    energy: 88,
    stress: 25,
    morale: 82,
    englishSkill: 95,
    empathySkill: 90,
    techSkill: 70,
    speed: 80,
    callsHandledToday: 0,
    totalCallsHandled: 0,
    csat: 98,
    avgHandleTime: 0,
    salary: 32000,
    bonusEarned: 3500,
    activeCallDuration: 0,
    gridX: 7,
    gridY: 7,
  });

  return agents;
}
