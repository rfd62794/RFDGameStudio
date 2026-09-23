import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGameStore } from '../store/gameStore'

// Mock the database
vi.mock('../db/db', () => ({
  db: {
    gameState: {
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
    },
    discovery: {
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
    },
  },
}))

beforeEach(() => {
  // Reset store to defaults
  useGameStore.setState({
    gold: 50,
    penCapacity: 5,
    slimes: [],
    tanks: [null],
    tankCount: 1,
    displaySlots: [null, null],
    discoveredColors: ['Red', 'Yellow', 'Blue'],
    discoveredShapes: ['Circle', 'Square', 'Triangle'],
    regents: 0,
    wandererRequests: [],
  })
})

describe('startHatch', () => {
  it('puts a hatch slot in tanks[0]', () => {
    useGameStore.getState().startHatch()
    const slot = useGameStore.getState().tanks[0]
    expect(slot).not.toBeNull()
    expect(slot!.type).toBe('hatch')
  })

  it('is a no-op when pen is full', () => {
    // Fill pen
    useGameStore.setState({ penCapacity: 0 })
    useGameStore.getState().startHatch()
    expect(useGameStore.getState().tanks[0]).toBeNull()
  })

  it('is a no-op when tank is already occupied', () => {
    useGameStore.getState().startHatch()
    const slot1 = useGameStore.getState().tanks[0]
    useGameStore.getState().startHatch() // no free tank
    expect(useGameStore.getState().tanks[0]).toBe(slot1)
  })
})

describe('resolveHatch', () => {
  it('adds a slime and clears tanks[0]', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    expect(useGameStore.getState().slimes).toHaveLength(1)
    expect(useGameStore.getState().tanks[0]).toBeNull()
  })

  it('slime has a color from discovered pool', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const slime = useGameStore.getState().slimes[0]
    expect(['Red', 'Yellow', 'Blue']).toContain(slime.color)
  })

  it('slime has a shape from discovered pool', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const slime = useGameStore.getState().slimes[0]
    expect(['Circle', 'Square', 'Triangle']).toContain(slime.shape)
  })
})

describe('sellSlime', () => {
  it('removes slime and adds its value to Gold', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const slime = useGameStore.getState().slimes[0]
    useGameStore.getState().sellSlime(slime.id)
    expect(useGameStore.getState().slimes).toHaveLength(0)
    expect(useGameStore.getState().gold).toBe(50 + slime.actualValue)
  })
})

describe('buyPenUpgrade', () => {
  it('increases penCapacity by 1 and deducts gold', () => {
    useGameStore.getState().buyPenUpgrade()
    expect(useGameStore.getState().penCapacity).toBe(6) // 5 + 1
    expect(useGameStore.getState().gold).toBe(30) // 50 - 20
  })

  it('does not buy when gold < cost', () => {
    useGameStore.setState({ gold: 5 })
    useGameStore.getState().buyPenUpgrade()
    expect(useGameStore.getState().penCapacity).toBe(5)
  })
})

describe('buyTankUpgrade', () => {
  it('adds a null slot to tanks and increments tankCount', () => {
    useGameStore.getState().buyTankUpgrade()
    expect(useGameStore.getState().tankCount).toBe(2)
    expect(useGameStore.getState().tanks).toHaveLength(2)
  })

  it('does not buy when gold < TANK_UPGRADE_COST', () => {
    useGameStore.setState({ gold: 10 })
    useGameStore.getState().buyTankUpgrade()
    expect(useGameStore.getState().tankCount).toBe(1)
  })
})

describe('assignToDisplay', () => {
  it('removes slime from slimes[]', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const slime = useGameStore.getState().slimes[0]
    useGameStore.getState().assignToDisplay(slime.id, 0)
    expect(useGameStore.getState().slimes).toHaveLength(0)
  })

  it('puts slime in correct slot index', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const slime = useGameStore.getState().slimes[0]
    useGameStore.getState().assignToDisplay(slime.id, 0)
    expect(useGameStore.getState().displaySlots[0]?.slimeId).toBe(slime.id)
  })

  it('is a no-op when target slot is already occupied', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const [s1, s2] = useGameStore.getState().slimes
    useGameStore.getState().assignToDisplay(s1.id, 0)
    useGameStore.getState().assignToDisplay(s2.id, 0) // slot 0 occupied
    expect(useGameStore.getState().slimes).toHaveLength(1) // s2 still in pen
  })
})

describe('unassignFromDisplay', () => {
  it('puts slime back in slimes[] with original variance preserved', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const slime = useGameStore.getState().slimes[0]
    useGameStore.getState().assignToDisplay(slime.id, 0)
    useGameStore.getState().unassignFromDisplay(0)
    const restored = useGameStore.getState().slimes[0]
    expect(restored.id).toBe(slime.id)
    expect(restored.variance).toBe(slime.variance)
    expect(useGameStore.getState().displaySlots[0]).toBeNull()
  })
})

describe('startBreed', () => {
  it('removes donor from slimes[] immediately', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const [host, donor] = useGameStore.getState().slimes
    useGameStore.getState().startBreed(host.id, donor.id)
    const ids = useGameStore.getState().slimes.map((s) => s.id)
    expect(ids).not.toContain(donor.id)
  })

  it('occupies the first free tank as a breed slot', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const [host, donor] = useGameStore.getState().slimes
    useGameStore.getState().startBreed(host.id, donor.id)
    const slot = useGameStore.getState().tanks[0]
    expect(slot?.type).toBe('breed')
  })

  it('is a no-op when no free tank exists', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const [host, donor] = useGameStore.getState().slimes
    // Occupy the only tank
    useGameStore.getState().startHatch()
    useGameStore.getState().startBreed(host.id, donor.id)
    // Donor should NOT be consumed since breed failed
    expect(useGameStore.getState().slimes).toHaveLength(2)
  })
})

describe('resolveBreed', () => {
  it('adds offspring to slimes[] and clears the breed tank', () => {
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    useGameStore.getState().startHatch(); useGameStore.getState().resolveHatch(0)
    const [host, donor] = useGameStore.getState().slimes
    useGameStore.getState().startBreed(host.id, donor.id)
    useGameStore.getState().resolveBreed(0)
    // Host stays, donor consumed, offspring added
    expect(useGameStore.getState().slimes.length).toBeGreaterThanOrEqual(2)
    expect(useGameStore.getState().tanks[0]).toBeNull()
  })
})

describe('loadGame', () => {
  it('loads discovery state', async () => {
    const { db } = await import('../db/db')
    vi.mocked(db.discovery.get).mockResolvedValueOnce({
      id: 1,
      colors: ['Red', 'Yellow', 'Blue', 'Orange'],
      shapes: ['Circle', 'Square', 'Triangle', 'Star'],
      regents: 15,
    })
    await useGameStore.getState().loadGame()
    expect(useGameStore.getState().discoveredColors).toContain('Orange')
    expect(useGameStore.getState().discoveredShapes).toContain('Star')
    expect(useGameStore.getState().regents).toBe(15)
  })
})
