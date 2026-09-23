import { describe, it, expect } from 'vitest'
import { computeBaseValue } from '../utils/economics'

describe('computeBaseValue', () => {
  it('returns 10 for T1+T1 at 0 variance (Red + Circle)', () => {
    expect(computeBaseValue('Red', 'Circle', 0)).toBe(10)
  })

  it('returns 44 for T2+T2 at 0 variance (Green + Star)', () => {
    expect(computeBaseValue('Green', 'Star', 0)).toBe(44)
  })

  it('returns 190 for T3+T3 at 0 variance (Amber + Pentagon)', () => {
    expect(computeBaseValue('Amber', 'Pentagon', 0)).toBe(190)
  })

  it('returns 600 for T4+T4 at 0 variance (Rust + Crown)', () => {
    expect(computeBaseValue('Rust', 'Crown', 0)).toBe(600)
  })

  it('applies positive variance', () => {
    expect(computeBaseValue('Red', 'Circle', 0.1)).toBe(11) // 10 * 1.1
  })

  it('applies negative variance but never below 1', () => {
    expect(computeBaseValue('Red', 'Circle', -0.1)).toBe(9) // 10 * 0.9
  })
})
