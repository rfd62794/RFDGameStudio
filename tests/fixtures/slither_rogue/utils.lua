-- Slither Rogue — Utilities
-- Pure functions. No global state. No side effects.
-- Loaded first — all other files may call these.

local function clamp(v, lo, hi)
  return math.max(lo, math.min(hi, v))
end

local function dist2(x1, y1, x2, y2)
  local dx, dy = x1-x2, y1-y2
  return dx*dx + dy*dy
end

local function atan2(y, x) return math.atan(y, x) end

local function normalize_angle(a)
  while a < -math.pi do a = a + math.pi*2 end
  while a >  math.pi do a = a - math.pi*2 end
  return a
end

local function build_segments(x, y, angle, length, radius)
  local segs = {}
  for i = 1, length do
    segs[i] = {
      x     = x - math.cos(angle) * (i-1) * radius * 1.6,
      y     = y - math.sin(angle) * (i-1) * radius * 1.6,
      angle = angle,
    }
  end
  return segs
end

local function spawn_fruit_from_config(cfg)
  local a, f = cfg.arena, cfg.fruit
  local golden = math.random() < (f.golden_chance or 0.08)
  local color  = golden and (f.golden_color or "#fbbf24")
                 or f.colors[math.random(#f.colors)]
  return {
    id          = "f" .. tostring(math.random(1000000)),
    x           = math.random() * (a.map_width  - 120) + 60,
    y           = math.random() * (a.map_height - 120) + 60,
    color       = color,
    points      = golden and (f.golden_points or 3) or (f.standard_points or 1),
    is_golden   = golden,
    pulse_phase = math.random() * math.pi * 2,
  }
end
