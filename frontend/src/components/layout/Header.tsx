import { Layers, ExternalLink } from 'lucide-react'

export function Header() {
  return (
    <header className="h-12 flex-shrink-0 flex items-center justify-between px-6
      border-b border-petroleum-800 bg-petroleum-950">
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-petroleum-400" />
        <span className="text-sm font-mono text-petroleum-300">
          Multi-Agent · ADK · A2A · Gemini 2.0
        </span>
      </div>
      <div className="flex items-center gap-4">
        <a href="https://marketplace.microsoft.com/en-us/product/okpo-exzing-research.exzing-reservoir-agent"
          target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-petroleum-400 hover:text-petroleum-200 transition-colors">
          <ExternalLink size={11} /> Azure Marketplace
        </a>
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-mono text-petroleum-400">LIVE</span>
      </div>
    </header>
  )
}
