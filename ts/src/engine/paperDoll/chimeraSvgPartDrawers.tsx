import React from 'react';
import { Brand, QualityTier } from './chimeraTypes';
import { BRANDS } from './chimeraBrands';

interface PartDrawProps {
  brand: Brand;
  quality: QualityTier;
  cyberOrganic: number; // 0 to 100
  archetype?: string;
  isRightSide?: boolean;
  filterId?: string;
  selected?: boolean;
}

// Helper to interpolate colors or choose styling
export function getPartColors(brand: Brand, cyberOrganic: number) {
  const meta = BRANDS[brand];
  const t = cyberOrganic / 100;
  return {
    primary: meta.primaryColor,
    secondary: meta.secondaryColor,
    accent: meta.accentColor,
    glow: meta.glowColor,
    base: t > 0.5 ? meta.cyberColor : meta.organicColor,
    isCyber: t >= 0.5,
    isOrganic: t < 0.5,
    meta,
  };
}

// Render Refurbished Details (Rivets, Patches, Weld Seams)
export const RefurbishedOverlay: React.FC<{ width?: number; height?: number }> = () => (
  <g className="pointer-events-none opacity-85">
    {/* Welded metal patch */}
    <path
      d="M -12,-8 L 8,-12 L 14,4 L -6,8 Z"
      fill="#475569"
      stroke="#94a3b8"
      strokeWidth="1"
      strokeDasharray="2 1"
    />
    {/* Rivet studs */}
    <circle cx="-10" cy="-6" r="1.5" fill="#cbd5e1" stroke="#334155" strokeWidth="0.5" />
    <circle cx="6" cy="-10" r="1.5" fill="#cbd5e1" stroke="#334155" strokeWidth="0.5" />
    <circle cx="12" cy="2" r="1.5" fill="#cbd5e1" stroke="#334155" strokeWidth="0.5" />
    <circle cx="-4" cy="6" r="1.5" fill="#cbd5e1" stroke="#334155" strokeWidth="0.5" />
    {/* Suture weld seam */}
    <path
      d="M -16,14 Q -8,18 4,12"
      fill="none"
      stroke="#f59e0b"
      strokeWidth="1.5"
      strokeDasharray="1.5 2"
    />
  </g>
);

// Render Malfunctioning Spark Arcs
export const MalfunctionSparkOverlay: React.FC<{ active?: boolean }> = ({ active }) => (
  <g className={`pointer-events-none ${active ? 'opacity-100' : 'opacity-40 animate-pulse'}`}>
    <path
      d="M -10,-10 L -4,-3 L -8,4 L 2,12"
      fill="none"
      stroke="#38bdf8"
      strokeWidth="1.8"
      filter="drop-shadow(0 0 4px #00ffff)"
    />
    <path
      d="M 12,-5 L 6,2 L 14,8"
      fill="none"
      stroke="#f43f5e"
      strokeWidth="1.4"
      filter="drop-shadow(0 0 3px #ff0055)"
    />
    <circle cx="-4" cy="-3" r="2" fill="#ffffff" />
    <circle cx="6" cy="2" r="1.8" fill="#ffffff" />
  </g>
);

// Render Brand New Sheen
export const BrandNewSheenOverlay: React.FC<{ x?: number; y?: number }> = () => (
  <g className="pointer-events-none opacity-70">
    <path
      d="M -18,-15 L 12,-25"
      fill="none"
      stroke="#ffffff"
      strokeWidth="1.5"
      strokeLinecap="round"
      filter="drop-shadow(0 0 2px #ffffff)"
    />
  </g>
);

// Standard Universal Socket Collar / Joint Blend Ring
export const SocketCollar: React.FC<{
  x: number;
  y: number;
  radius?: number;
  brand: Brand;
  cyberOrganic: number;
}> = ({ x, y, radius = 14, brand, cyberOrganic }) => {
  const { accent, glow, base } = getPartColors(brand, cyberOrganic);
  return (
    <g transform={`translate(${x}, ${y})`} className="pointer-events-none">
      {/* Outer socket collar ring */}
      <circle
        cx="0"
        cy="0"
        r={radius}
        fill={base}
        stroke={accent}
        strokeWidth="2.5"
        filter="drop-shadow(0 0 3px rgba(0,0,0,0.5))"
      />
      {/* Internal magnetic bearing / bio-tendon core */}
      <circle cx="0" cy="0" r={radius * 0.65} fill="#0f172a" stroke={glow} strokeWidth="1.5" />
      {/* Core power pin */}
      <circle cx="0" cy="0" r={radius * 0.3} fill={glow} />
    </g>
  );
};
