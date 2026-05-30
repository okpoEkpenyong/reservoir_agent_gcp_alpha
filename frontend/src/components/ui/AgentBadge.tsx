import { Cpu, BarChart2, FileText, GitMerge } from 'lucide-react'

const AGENT_META: Record<string, { label: string; color: string; Icon: any }> = {
  simulation_qc_agent:       { label: 'Simulation QC', color: 'text-petroleum-300 bg-petroleum-900 border-petroleum-700', Icon: Cpu },
  production_analyst_agent:  { label: 'Production Analyst', color: 'text-amber-300 bg-amber-950 border-amber-800', Icon: BarChart2 },
  reporting_agent_remote:    { label: 'Reporting (A2A)', color: 'text-emerald-300 bg-emerald-950 border-emerald-800', Icon: FileText },
  exzing_reservoir_orchestrator: { label: 'Orchestrator', color: 'text-violet-300 bg-violet-950 border-violet-800', Icon: GitMerge },
}

export function AgentBadge({ agent }: { agent?: string }) {
  if (!agent) return null
  const meta = AGENT_META[agent] ?? { label: agent, color: 'text-slate-300 bg-slate-900 border-slate-700', Icon: Cpu }
  const { label, color, Icon } = meta
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${color}`}>
      <Icon size={10} />
      {label}
    </span>
  )
}
