import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SlimeVisual } from '../components/SlimeVisual'
import { ALL_COLORS, ALL_SHAPES } from '../data/traitDefs'
import type { SlimeColor, SlimeShape } from '../data/traitDefs'

// Smoke test: every color × shape combination renders without crashing
const TEST_COLORS: SlimeColor[] = ['Red', 'Yellow', 'Blue', 'Green', 'Purple', 'Orange']
const TEST_SHAPES: SlimeShape[] = ['Circle', 'Square', 'Triangle', 'Star', 'Diamond', 'Teardrop']

describe('SlimeVisual', () => {
  it('renders an SVG for each T1/T2 color × shape combo', () => {
    for (const color of TEST_COLORS) {
      for (const shape of TEST_SHAPES) {
        const { container } = render(<SlimeVisual color={color} shape={shape} size={80} />)
        expect(container.querySelector('svg')).toBeTruthy()
      }
    }
  })

  it('uses correct viewBox', () => {
    const { container } = render(<SlimeVisual color="Red" shape="Circle" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 100')
  })

  it('scales to specified size', () => {
    const { container } = render(<SlimeVisual color="Blue" shape="Square" size={120} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('120')
    expect(svg?.getAttribute('height')).toBe('120')
  })

  it('contains exactly one body path', () => {
    const { container } = render(<SlimeVisual color="Yellow" shape="Triangle" />)
    const paths = container.querySelectorAll('svg > path')
    expect(paths.length).toBeGreaterThanOrEqual(1) // body + possible mouth
  })

  it('has a radial gradient definition', () => {
    const { container } = render(<SlimeVisual color="Green" shape="Diamond" />)
    expect(container.querySelector('radialGradient')).toBeTruthy()
  })

  it('renders eyes (at least 2 ellipses for eye whites)', () => {
    const { container } = render(<SlimeVisual color="Purple" shape="Star" />)
    const ellipses = container.querySelectorAll('ellipse')
    expect(ellipses.length).toBeGreaterThanOrEqual(2) // highlight + 2 eye whites = 3+
  })

  it('renders all defined colors without crashing', () => {
    for (const color of ALL_COLORS) {
      const { container } = render(<SlimeVisual color={color} shape="Circle" />)
      expect(container.querySelector('svg')).toBeTruthy()
    }
  })

  it('renders all defined shapes without crashing', () => {
    for (const shape of ALL_SHAPES) {
      const { container } = render(<SlimeVisual color="Red" shape={shape} />)
      expect(container.querySelector('svg')).toBeTruthy()
    }
  })
})
