const SUGGESTIONS = [
  { label: 'QC a simulation deck', prompt: 'QC this ECLIPSE deck snippet:\n\nRUNSPEC\nDIMENZ\n10 10 3 /\nGRID\nPORO\n300*0.25 /\nPROPS\nSOLUTION\nSCHEDULE\nEND', icon: '🛠' },
  { label: 'Analyse production decline', prompt: 'Run DCA on these 3 wells:\n- WELL-A: [4500,4200,3900,3600,3300,3000,2700,2400] STB/D monthly\n- WELL-B: [3000,2700,2400,2100,1800,1500,1200,900] STB/D monthly\n- WELL-C: [1500,1450,1400,1350,1300,1250,1200,1150] STB/D monthly\nEconomic limit: 50 STB/D', icon: '📈' },
  { label: 'Generate RelPerm table', prompt: 'Generate a SWOF ECLIPSE table for Niger Delta shallow marine sand. Swc=0.22, Sorw=0.18, nw=2.8, no=3.5, Krw_max=0.45, Kro_max=0.92', icon: '🧪' },
  { label: 'Executive summary', prompt: 'Generate a board-ready executive summary for an asset with 3 wells, total EUR of 2.1 MMSTB, one well (WELL-C) showing b-factor of 1.2 requiring SPE-PRMS correction, and simulation QC safety score of 85%.', icon: '📋' },
]

export function PromptSuggestions({ onSelect }: { onSelect: (p: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-2xl">
      {SUGGESTIONS.map(s => (
        <button key={s.label} onClick={() => onSelect(s.prompt)}
          className="text-left p-3 rounded-lg border border-petroleum-700 bg-petroleum-900
            hover:border-petroleum-500 hover:bg-petroleum-800 transition-all group">
          <div className="text-lg mb-1">{s.icon}</div>
          <div className="text-xs font-medium text-petroleum-200 group-hover:text-white">{s.label}</div>
        </button>
      ))}
    </div>
  )
}
