import { useState } from 'react'
import { Header } from './components/Header'
import { StatsBar } from './components/StatsBar'
import { HatchButton } from './components/HatchButton'
import { InventoryList } from './components/InventoryList'
import { DisplayRooms } from './components/DisplayRooms'
import { ExpandFacility } from './components/ExpandFacility'
import { BottomNav } from './components/BottomNav'
import { MutatePage } from './components/MutatePage'
import { DiscoveryPage } from './components/DiscoveryPage'
import { MarketPage } from './components/MarketPage'

type Tab = 'chamber' | 'mutate' | 'codex' | 'market'

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chamber')

  return (
    <div className="min-h-screen bg-surface-container-lowest max-w-lg mx-auto flex flex-col">
      <Header />
      <main className="flex-grow overflow-y-auto space-y-0">
        <StatsBar />
        {activeTab === 'chamber' ? (
          <>
            <HatchButton />
            <InventoryList />
            <DisplayRooms />
            <ExpandFacility />
          </>
        ) : activeTab === 'mutate' ? (
          <MutatePage />
        ) : activeTab === 'market' ? (
          <MarketPage />
        ) : (
          <DiscoveryPage />
        )}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
