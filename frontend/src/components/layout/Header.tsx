import { Layers, ExternalLink, Menu, X } from 'lucide-react'

interface HeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="h-12 flex-shrink-0 flex items-center justify-between px-4
      border-b border-petroleum-800 bg-petroleum-950 z-20 relative">

      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <div
		  role="button"
		  tabIndex={0}
		  onClick={onToggleSidebar}
		  onKeyDown={e => e.key === 'Enter' && onToggleSidebar()}
		  className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg
			text-petroleum-400 hover:text-petroleum-200 hover:bg-petroleum-800 
			transition-colors cursor-pointer"
		  aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}>
		  {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
		</div>

        {/* Tech stack — desktop only */}
        <div className="hidden md:flex items-center gap-2">
          <Layers size={14} className="text-petroleum-500" />
          <span className="text-xs font-mono text-petroleum-500">
            Multi-Agent · ADK · A2A · Gemini 2.5
          </span>
        </div>

        {/* App name — mobile only */}
        <span className="md:hidden text-sm font-display font-bold text-white">
          Exzing
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <a
          href="https://marketplace.microsoft.com/en-us/product/okpo-exzing-research.exzing-reservoir-agent"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs text-petroleum-500
            hover:text-petroleum-300 transition-colors whitespace-nowrap">
          <ExternalLink size={11} />
          Azure Marketplace
        </a>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-petroleum-500">LIVE</span>
        </div>
      </div>
    </header>
  )
}