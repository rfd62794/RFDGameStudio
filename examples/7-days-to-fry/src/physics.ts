/**
 * @file src/physics.ts
 * Steering, avoidance, rates, thresholds, contagion, decay constants.
 */

// Contagion & Morale
export const CONTAGION_EPSILON_FLOOR = 0.05;
export const CONTAGION_DECAY_RATE = 0.015;
export const CONTAGION_INCREMENT_ON_CORNER_CUT = 0.06;

export const MORALE_PER_WASTE_UNIT = 0.04;
export const MAX_STAFF_MEAL_MORALE_BOOST = 0.30;

// Station Batch Quality Tuning
export const BATCH_QUALITY_MAX = 100;
export const BATCH_QUALITY_MIN = 0;
export const BATCH_QUALITY_GAIN_PER_PROTOCOL = 12;
export const BATCH_QUALITY_LOSS_PER_CORNER_CUT = 30;
export const BATCH_QUALITY_DECAY_PER_SECOND_IDLE = 1.5;

// Quality & Customer Reaction Tiers
export const QUALITY_DEGRADATION_PER_CORNER_CUT = 0.7;
export const QUALITY_TIER_DELIGHTED = 0.85;
export const QUALITY_TIER_SATISFIED = 0.60;
export const QUALITY_TIER_NEUTRAL = 0.40;
export const QUALITY_TIER_DISAPPOINTED = 0.20;

// Simulation Tick & Arc
export const DAY_DURATION_SECONDS_DEFAULT = 60;
export const UTILITY_TICK_RATE_HZ = 2;
export const STEERING_TICK_RATE_HZ = 60;
export const TOTAL_DAYS = 7;

// Speeds & Radii
export const CUSTOMER_MAX_SPEED = 120;
export const CUSTOMER_MAX_FORCE = 220;
export const CUSTOMER_RADIUS = 9;

export const WORKER_RADIUS = 18;
export const WORKER_MAX_SPEED = 140;
export const WORKER_MAX_FORCE = 250;

// Steering Weights
export const SEEK_FORCE_WEIGHT = 1.0;
export const AVOID_WORKERS_WEIGHT = 1.4;
export const AVOID_WORKERS_DIST = 42;
export const AVOID_CLAIMED_STATION_WEIGHT = 1.8;
export const AVOID_CLAIMED_STATION_DIST = 55;

// Worker Stamina & Morale
export const STAMINA_DRAIN_PROTOCOL = 0.015;
export const STAMINA_DRAIN_CORNER_CUT = 0.007;
export const STAMINA_RECOVERY_REST = 0.06;

export const REST_URGENCY_THRESHOLD = 0.4;
export const REST_APPROACHING_THRESHOLD = 0.6;
export const MANAGER_REST_ENCOURAGEMENT_MAX = 1.6;
export const REST_CRITICAL_THRESHOLD = REST_URGENCY_THRESHOLD * 0.5;
export const REST_URGENCY_MAX_SCORE = 6.0;

export const MEAL_URGENCY_THRESHOLD = 0.5;
export const MEAL_CRITICAL_THRESHOLD = MEAL_URGENCY_THRESHOLD * 0.5;
export const MEAL_URGENCY_MAX_SCORE = 6.0;
export const MEAL_MORALE_REGEN_RATE = 0.20;
export const MEAL_CONSUMPTION_RATE = 1.0;
export const MEAL_PORTION_SIZE = 10;
export const MEAL_CONSUME_SECONDS = 5;

// Thirst & Bladder & Bathroom & Mess
export const THIRST_DECAY_PER_SECOND = 0.010;
export const THIRST_URGENCY_THRESHOLD = 0.6;
export const THIRST_URGENCY_MAX_SCORE = 6.0;
export const BLADDER_RISE_PER_MEAL_UNIT = 0.25;
export const BLADDER_RISE_PER_WATER = 0.08;
export const BLADDER_URGENCY_THRESHOLD = 0.3;
export const BLADDER_URGENCY_MAX_SCORE = 6.0;
export const BLADDER_FAILURE_THRESHOLD_SECONDS = 5.0;

export const BATHROOM_WEAR_CHANCE = 0.20;
export const BATHROOM_CLOG_CHANCE = 0.20;
export const CLEAN_BATHROOM_DURATION_SECONDS = 4.0;
export const CLEAN_BATHROOM_BASE_SCORE = 4.0;
export const BATHROOM_CLEAN_URGENCY_RISE_PER_SECOND = 0.05;
export const CLEAN_BATHROOM_MAX_SCORE = 8.0;

export const CUSTOMER_MESS_CHANCE = 0.15;
export const CLEAN_MESS_DURATION_SECONDS = 3.0;
export const CLEAN_MESS_BASE_SCORE = 2.0;

export const COFFEE_POT_CAPACITY = 10;
export const COFFEE_BREW_RATE_PER_SECOND = 0.05;
export const COFFEE_WORKER_PORTION_SIZE = 1;
export const COFFEE_STAMINA_BOOST = 0.10;
export const COFFEE_BOOST_DECAY_RATE = 0.02;
export const COFFEE_BASE_SCORE = 1.0;

// Manager Tuning
export const MANAGER_REST_APPROACHING_THRESHOLD = 0.6;
export const MANAGER_COFFEE_BASE_SCORE = 1.0;
export const MANAGER_SUPERVISION_RADIUS = 180;
export const MANAGER_SUPERVISE_BASE = 4.0;
export const MANAGER_PATROL_BASE = 3.0;
export const MANAGER_AUTO_REPAIR_BASE = 5.0;
export const MANAGER_EMERGENCY_CALL_BONUS = 9.0;
export const MANAGER_REST_URGENCY_THRESHOLD = 0.4;
export const MANAGER_REST_URGENCY_MAX_SCORE = 6.0;

export const MANAGER_TARGET_RISK_WEIGHT = 10.0;
export const MANAGER_TARGET_PROXIMITY_WEIGHT = 2.0;
export const MANAGER_TARGET_PROXIMITY_NORM_RANGE = 400;
export const MANAGER_ACTIVE_VIOLATION_TARGET_BONUS = 6.0;
export const MANAGER_TARGET_HYSTERESIS_MARGIN = 1.0;
export const MANAGER_TARGET_MAX_LOCK_SECONDS = 12;
export const BREAK_TASK_MIN_LOCK_SECONDS = 3;

// Equipment Degradation & Nudge
export const EQUIPMENT_DEGRADATION_CHANCE = 0.02;
export const REPAIR_DURATION_STAGE_1 = 4;
export const REPAIR_DURATION_STAGE_2 = 10;
export const REPAIR_DURATION_STAGE_3 = 18;
export const SITUATION_ESCALATION_INTERVAL_SECONDS = 15;

export const ATTENTION_TIER_HIGH = 0.7;
export const ATTENTION_TIER_MID = 0.4;
export const ATTENTION_TIER_LOW = 0.2;
export const ATTENTION_ACTION_STAMINA_COST = 0.08;

export const STATION_NUDGE_BOOST_MULTIPLIER = 2.0;
export const STATION_NUDGE_DURATION_SECONDS = 8;
export const PRIMARY_STATION_OWNERSHIP_BONUS = 1.35;

// Spoilage & Demand
export const DEMAND_ESCALATION_MIN_SECONDS = 60;
export const DEMAND_ESCALATION_MAX_SECONDS = 300;
export const FRIES_DEMAND_PROBABILITY = 0.6;
export const CUSTOMER_LINGER_SECONDS = 3.5;

export const SPOILAGE_CHECK_INTERVAL_SEC = 2;
export const PATTY_SPOILAGE_TIME_SEC = 25;
export const RUSH_RAMP_END_SEC = 90;
export const RUSH_PEAK_END_SEC = 270;
export const BASE_ARRIVAL_INTERVAL_MAX = 5.0;
export const BASE_ARRIVAL_INTERVAL_MIN = 1.4;
