/**
 * @file src/layout.ts
 * Kitchen Layout Geometry, Station Configs, Waypoints, HUD Rects, Visual Palettes.
 */

import { StationId } from './types';

export type VisualZone = 'lineCook' | 'csr' | 'support';

export interface StationConfig {
  id: StationId;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bufferCapacity: number;
  protocolWorkTime: number; // seconds
  cornerCutWorkTime: number; // seconds
  color: string;
  hasEquipmentWear: boolean;
  hasProductQuality: boolean;
  visualZone: VisualZone;
}

export const KITCHEN_WIDTH = 800;
export const KITCHEN_HEIGHT = 500;

export const STATION_CONFIGS: Record<StationConfig['id'], StationConfig> = {
  queue: {
    id: 'queue',
    name: '1. Order Counter',
    x: 60,
    y: 60,
    width: 128,
    height: 68,
    bufferCapacity: 8,
    protocolWorkTime: 2.2,
    cornerCutWorkTime: 1.1,
    color: '#3b82f6',
    hasEquipmentWear: false,
    hasProductQuality: false,
    visualZone: 'csr',
  },
  grill: {
    id: 'grill',
    name: '2. Patty Grill',
    x: 290,
    y: 60,
    width: 94,
    height: 68,
    bufferCapacity: 8,
    protocolWorkTime: 3.8,
    cornerCutWorkTime: 1.8,
    color: '#ef4444',
    hasEquipmentWear: true,
    hasProductQuality: true,
    visualZone: 'lineCook',
  },
  assembly: {
    id: 'assembly',
    name: '3. Burger Assembly',
    x: 450,
    y: 60,
    width: 94,
    height: 68,
    bufferCapacity: 8,
    protocolWorkTime: 3.0,
    cornerCutWorkTime: 1.4,
    color: '#f59e0b',
    hasEquipmentWear: true,
    hasProductQuality: true,
    visualZone: 'lineCook',
  },
  window: {
    id: 'window',
    name: '4. Pickup Window',
    x: 60,
    y: 280,
    width: 128,
    height: 68,
    bufferCapacity: 10,
    protocolWorkTime: 2.0,
    cornerCutWorkTime: 0.9,
    color: '#10b981',
    hasEquipmentWear: false,
    hasProductQuality: true,
    visualZone: 'csr',
  },
  fryer: {
    id: 'fryer',
    name: '5. Fryer Station',
    x: 610,
    y: 60,
    width: 94,
    height: 68,
    bufferCapacity: 8,
    protocolWorkTime: 3.2,
    cornerCutWorkTime: 1.5,
    color: '#eab308',
    hasEquipmentWear: true,
    hasProductQuality: true,
    visualZone: 'lineCook',
  },
  coffee: {
    id: 'coffee',
    name: 'Coffee Station',
    x: 550,
    y: 280,
    width: 119,
    height: 77,
    bufferCapacity: 0,
    protocolWorkTime: 0,
    cornerCutWorkTime: 0,
    color: '#a855f7',
    hasEquipmentWear: false,
    hasProductQuality: true,
    visualZone: 'support',
  },
  bathroom: {
    id: 'bathroom',
    name: 'Staff Restroom',
    x: 30,
    y: 400,
    width: 68,
    height: 77,
    bufferCapacity: 0,
    protocolWorkTime: 0,
    cornerCutWorkTime: 0,
    color: '#06b6d4',
    hasEquipmentWear: false,
    hasProductQuality: false,
    visualZone: 'support',
  },
};

export const STAFF_AREA = {
  x: 290,
  y: 280,
  width: 136,
  height: 77,
  name: 'Staff Break & Meal Area',
};

export const ENTRANCE_POS = { x: 25, y: 135 };
export const EXIT_POS = { x: 25, y: 195 };

export const QUEUE_WAYPOINTS = [
  { x: 135, y: 175 },
  { x: 110, y: 175 },
  { x: 85, y: 175 },
  { x: 60, y: 175 },
  { x: 35, y: 175 },
];

export const BATHROOM_QUEUE_WAYPOINTS = [
  { x: 125, y: 438 },
  { x: 150, y: 438 },
  { x: 175, y: 438 },
];

export const CUSTOMER_WAIT_QUEUE_ORIGIN = ENTRANCE_POS;

export const HUD_RECTS = {
  brandEquity: { x: 12, y: 12, width: 170, height: 42 },
  demandTimer: { x: 190, y: 12, width: 130, height: 42 },
  dayTimer: { x: 328, y: 12, width: 120, height: 42 },
  policyDial: { x: 456, y: 12, width: 332, height: 42, trackX: 470, trackWidth: 300 },
};

export const MANAGER_DEFAULT_POS = {
  x: 400,
  y: 260,
};

// Visual Language Palette & Outlines
export const WARM_OUTLINE_COLOR = '#1E1B24';
export const SHADOW_COLOR = 'rgba(40, 20, 10, 0.15)';
export const SHADOW_OFFSET_X = 2;
export const SHADOW_OFFSET_Y = 3;
export const SHADOW_BLUR = 4;

export const ZONE_PALETTE: Record<VisualZone, { fill: string; stroke: string; hex: string }> = {
  lineCook: {
    fill: 'rgba(242, 184, 75, 0.20)',
    stroke: 'rgba(242, 184, 75, 0.50)',
    hex: '#F2B84B',
  },
  support: {
    fill: 'rgba(82, 196, 154, 0.20)',
    stroke: 'rgba(82, 196, 154, 0.50)',
    hex: '#52C49A',
  },
  csr: {
    fill: 'rgba(72, 169, 197, 0.20)',
    stroke: 'rgba(72, 169, 197, 0.50)',
    hex: '#48A9C5',
  },
};
