import { describe, it, expect, vi, afterEach } from 'vitest'
import { breedSlimes } from '../utils/breedSlimes'
import type { Slime } from '../types'
import type { PersistedSlime } from '../db/db'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'

const DISCOVERED_COLORS = new Set<SlimeColor>(['Red', 'Yellow', 'Blue', 'Orange', 'Green', 'Purple'])
const DISCOVERED_SHAPES = new Set<SlimeShape>(['Circle', 'Square', 'Triangle', 'Star', 'Diamond', 'Teardrop'])

function makeHost(color: SlimeColor, shape: SlimeShape): Slime {
  return { id: 'host-1', color, shape, variance: 0, actualValue: 10, createdAt: 1000 }
}

function makeDonor(color: SlimeColor, shape: SlimeShape): PersistedSlime {
  return { id: 'donor-1', color, shape, variance: 0, actualValue: 10, createdAt: 2000 }
}

describe('breedSlimes', () => {
  afterEach(() => vi.restoreAllMocks())

  it('offspring inherits parent color when parents share the same color', () => {
    const host = makeHost('Red', 'Circle')
    const donor = makeDonor('Red', 'Square')
    const result = breedSlimes(host, donor, DISCOVERED_COLORS, DISCOVERED_SHAPES)
    expect(result.offspring.color).toBe('Red')
    expect(result.newColorDiscovery).toBeNull()
  })

  it('offspring inherits parent shape when parents share the same shape', () => {
    const host = makeHost('Red', 'Circle')
    const donor = makeDonor('Blue', 'Circle')
    const result = breedSlimes(host, donor, DISCOVERED_COLORS, DISCOVERED_SHAPES)
    expect(result.offspring.shape).toBe('Circle')
    expect(result.newShapeDiscovery).toBeNull()
  })

  it('can produce a discovery color from recipe parents (Red + Blue = Purple)', () => {
    // Force discovery chance to fire
    vi.spyOn(Math, 'random').mockReturnValue(0.1) // < 0.40 BREED_DISCOVERY_CHANCE
    const host = makeHost('Red', 'Circle')
    const donor = makeDonor('Blue', 'Circle')
    const undiscovered = new Set<SlimeColor>(['Red', 'Yellow', 'Blue'])
    const result = breedSlimes(host, donor, undiscovered, DISCOVERED_SHAPES)
    expect(result.offspring.color).toBe('Purple')
    expect(result.newColorDiscovery).toBe('Purple')
  })

  it('can produce a discovery shape from recipe parents (Circle + Triangle = Teardrop)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const host = makeHost('Red', 'Circle')
    const donor = makeDonor('Red', 'Triangle')
    const undiscovered = new Set<SlimeShape>(['Circle', 'Square', 'Triangle'])
    const result = breedSlimes(host, donor, DISCOVERED_COLORS, undiscovered)
    expect(result.offspring.shape).toBe('Teardrop')
    expect(result.newShapeDiscovery).toBe('Teardrop')
  })

  it('does not flag discovery if trait was already discovered', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const host = makeHost('Red', 'Circle')
    const donor = makeDonor('Blue', 'Circle')
    const result = breedSlimes(host, donor, DISCOVERED_COLORS, DISCOVERED_SHAPES)
    // Purple already in DISCOVERED_COLORS
    expect(result.offspring.color).toBe('Purple')
    expect(result.newColorDiscovery).toBeNull()
  })

  it('inherits from parent when recipe does not fire', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99) // > 0.40, recipe won't fire
    const host = makeHost('Red', 'Circle')
    const donor = makeDonor('Blue', 'Square')
    const result = breedSlimes(host, donor, DISCOVERED_COLORS, DISCOVERED_SHAPES)
    // Should inherit from one parent (no recipe result)
    expect(['Red', 'Blue']).toContain(result.offspring.color)
    expect(['Circle', 'Square']).toContain(result.offspring.shape)
    expect(result.newColorDiscovery).toBeNull()
    expect(result.newShapeDiscovery).toBeNull()
  })

  it('produces offspring with valid structure', () => {
    const host = makeHost('Red', 'Circle')
    const donor = makeDonor('Yellow', 'Square')
    const result = breedSlimes(host, donor, DISCOVERED_COLORS, DISCOVERED_SHAPES)
    expect(result.offspring.id).toBeDefined()
    expect(result.offspring.actualValue).toBeGreaterThanOrEqual(1)
    expect(result.offspring.createdAt).toBeLessThanOrEqual(Date.now())
  })

  it('unique offspring IDs', () => {
    const host = makeHost('Red', 'Circle')
    const donor = makeDonor('Blue', 'Square')
    const r1 = breedSlimes(host, donor, DISCOVERED_COLORS, DISCOVERED_SHAPES)
    const r2 = breedSlimes(host, donor, DISCOVERED_COLORS, DISCOVERED_SHAPES)
    expect(r1.offspring.id).not.toBe(r2.offspring.id)
  })
})
