import { describe, it, expect, vi } from 'vitest'
import { generateSlime } from '../utils/slimeGenerator'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'

const STARTING_COLORS: SlimeColor[] = ['Red', 'Yellow', 'Blue']
const STARTING_SHAPES: SlimeShape[] = ['Circle', 'Square', 'Triangle']

describe('generateSlime', () => {
  it('produces a valid slime with id, color, shape, variance, and value', () => {
    const s = generateSlime(STARTING_COLORS, STARTING_SHAPES)
    expect(s.id).toBeDefined()
    expect(STARTING_COLORS).toContain(s.color)
    expect(STARTING_SHAPES).toContain(s.shape)
    expect(typeof s.variance).toBe('number')
    expect(s.actualValue).toBeGreaterThanOrEqual(1)
    expect(s.createdAt).toBeLessThanOrEqual(Date.now())
  })

  it('picks from discovered pool only (custom pool)', () => {
    const customColors: SlimeColor[] = ['Purple']
    const customShapes: SlimeShape[] = ['Star']
    const s = generateSlime(customColors, customShapes)
    expect(s.color).toBe('Purple')
    expect(s.shape).toBe('Star')
  })

  it('respects locked color', () => {
    const s = generateSlime(STARTING_COLORS, STARTING_SHAPES, 'Blue')
    expect(s.color).toBe('Blue')
  })

  it('respects locked shape', () => {
    const s = generateSlime(STARTING_COLORS, STARTING_SHAPES, undefined, 'Triangle')
    expect(s.shape).toBe('Triangle')
  })

  it('respects both locks', () => {
    const s = generateSlime(STARTING_COLORS, STARTING_SHAPES, 'Red', 'Square')
    expect(s.color).toBe('Red')
    expect(s.shape).toBe('Square')
  })

  it('computes a non-negative actualValue', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // min variance
    const s = generateSlime(STARTING_COLORS, STARTING_SHAPES)
    expect(s.actualValue).toBeGreaterThanOrEqual(1)
    vi.restoreAllMocks()
  })

  it('generates unique ids', () => {
    const s1 = generateSlime(STARTING_COLORS, STARTING_SHAPES)
    const s2 = generateSlime(STARTING_COLORS, STARTING_SHAPES)
    expect(s1.id).not.toBe(s2.id)
  })
})
