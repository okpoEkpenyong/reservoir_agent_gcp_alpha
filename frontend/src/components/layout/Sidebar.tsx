import { Cpu, BarChart2, FileText, GitMerge, Shield, Info, Trash2 } from 'lucide-react'

const AGENTS = [
  { id: 'orchestrator', label: 'Orchestrator', sub: 'Routes all requests', Icon: GitMerge, color: 'text-violet-400' },
  { id: 'sim_qc', label: 'Simulation QC', sub: 'ECLIPSE / OPM decks', Icon: Cpu, color: 'text-petroleum-400' },
  { id: 'prod', label: 'Production Analyst', sub: 'DCA · EUR · RelPerm', Icon: BarChart2, color: 'text-amber-400' },
  { id: 'reporting', label: 'Reporting Agent', sub: 'A2A · Executive summaries', Icon: FileText, color: 'text-emerald-400' },
]

interface SidebarProps { onClear: () => void }

export function Sidebar({ onClear }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 bg-petroleum-950 border-r border-petroleum-800 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-petroleum-800">
        <div className="font-display font-bold text-xl text-white tracking-tight">EXZING</div>
        <div className="text-xs text-petroleum-400 font-mono mt-0.5">Reservoir Agent · Alpha</div>
      </div>

      {/* Agent status */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="text-xs text-petroleum-500 uppercase tracking-widest font-mono mb-3">Agent Team</div>
        <div className="space-y-1">
          {AGENTS.map(({ id, label, sub, Icon, color }) => (
            <div key={id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-petroleum-900 transition-colors">
              <div className={`mt-0.5 flex-shrink-0 ${color}`}><Icon size={14} /></div>
              <div>
                <div className="text-xs font-medium text-petroleum-100">{label}</div>
                <div className="text-xs text-petroleum-500 font-mono">{sub}</div>
              </div>
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Safety */}
        <div className="mt-4 p-3 rounded-lg bg-petroleum-900 border border-petroleum-800">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={12} className="text-emerald-400" />
            <span className="text-xs text-petroleum-300 font-medium">Safety Active</span>
          </div>
          <div className="space-y-1 text-xs text-petroleum-500 font-mono">
            <div>✓ before_model_callback</div>
            <div>✓ before_tool_callback</div>
            <div>✓ ZDR policy</div>
            <div>✓ Physics validation</div>
          </div>
        </div>

        {/* Model */}
        <div className="mt-3 p-3 rounded-lg bg-petroleum-900 border border-petroleum-800">
          <div className="text-xs text-petroleum-500 font-mono mb-1">Model</div>
          <div className="text-xs text-petroleum-200 font-mono">gemini-flash-latest</div>
          <div className="text-xs text-petroleum-500 font-mono">Gemini · Vertex AI</div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-petroleum-800 space-y-2">
        <button onClick={onClear}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-petroleum-400
            hover:text-petroleum-200 hover:bg-petroleum-900 transition-colors">
          <Trash2 size={12} /> Clear session
        </button>
        <a href="/info" target="_blank"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-petroleum-400
            hover:text-petroleum-200 hover:bg-petroleum-900 transition-colors">
          <Info size={12} /> API info
        </a>
      </div>
    </aside>
  )
}
