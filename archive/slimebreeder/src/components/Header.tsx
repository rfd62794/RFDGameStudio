export function Header() {
  return (
    <header className="bg-[#131313] flex justify-between items-center w-full px-4 h-14 border-b border-outline-variant/10 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary-container">menu</span>
        <h1 className="text-lg font-black text-primary-container font-headline uppercase tracking-widest">
          ASSET_MONITOR_v1.0
        </h1>
      </div>
    </header>
  )
}
