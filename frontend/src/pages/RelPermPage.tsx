// pages/RelPermPage.tsx

import { useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext';
import { AgentChatPanel } from '../components/layout/AgentChatPanel';
import { AgentActionBanner } from '../components/ui/AgentActionBanner';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import {
  FlaskConical, Zap, FileText, AlertCircle, Droplet, Wind,
  ChevronDown, ChevronUp, BookOpen, Bot,
} from 'lucide-react';

type DataSource = 'custom' | 'example';
type RockType = 'sandstone' | 'carbonate' | 'unconsolidated';

interface CoreyParams {
  swc: number; sor: number; krwMax: number; kroMax: number; nw: number; now: number;
  sgc: number; sorg: number; krgMax: number; krogMax: number; ng: number; nog: number;
}

const ROCK_TYPE_PRESETS: Record<RockType, CoreyParams> = {
  sandstone: {
    swc: 0.20, sor: 0.25, krwMax: 0.35, kroMax: 0.85, nw: 2.5, now: 2.0,
    sgc: 0.05, sorg: 0.15, krgMax: 0.75, krogMax: 0.85, ng: 1.8, nog: 2.2,
  },
  carbonate: {
    swc: 0.15, sor: 0.30, krwMax: 0.20, kroMax: 0.90, nw: 3.5, now: 3.0,
    sgc: 0.03, sorg: 0.20, krgMax: 0.65, krogMax: 0.90, ng: 2.2, nog: 2.8,
  },
  unconsolidated: {
    swc: 0.25, sor: 0.20, krwMax: 0.45, kroMax: 0.80, nw: 2.0, now: 1.8,
    sgc: 0.08, sorg: 0.10, krgMax: 0.80, krogMax: 0.80, ng: 1.5, nog: 1.9,
  },
};

function computeSWOF(p: CoreyParams, steps = 21) {
  const rows = [];
  for (let i = 0; i < steps; i++) {
    const sw = p.swc + (i / (steps - 1)) * (1 - p.swc - p.sor);
    const swNorm = (sw - p.swc) / (1 - p.swc - p.sor);
    const soNorm = 1 - swNorm;
    const krw = p.krwMax * Math.pow(Math.max(swNorm, 0), p.nw);
    const kro = p.kroMax * Math.pow(Math.max(soNorm, 0), p.now);
    rows.push({ sw: +sw.toFixed(4), krw: +krw.toFixed(4), kro: +kro.toFixed(4) });
  }
  return rows;
}

function computeSGOF(p: CoreyParams, steps = 21) {
  const rows = [];
  for (let i = 0; i < steps; i++) {
    const sg = p.sgc + (i / (steps - 1)) * (1 - p.sgc - p.sorg);
    const sgNorm = (sg - p.sgc) / (1 - p.sgc - p.sorg);
    const soNorm = 1 - sgNorm;
    const krg = p.krgMax * Math.pow(Math.max(sgNorm, 0), p.ng);
    const krog = p.krogMax * Math.pow(Math.max(soNorm, 0), p.nog);
    rows.push({ sg: +sg.toFixed(4), krg: +krg.toFixed(4), krog: +krog.toFixed(4) });
  }
  return rows;
}

// Crossover saturation — engineering-relevant point where krw = kro
function findCrossover(swofTable: ReturnType<typeof computeSWOF>) {
  for (let i = 0; i < swofTable.length - 1; i++) {
    const a = swofTable[i], b = swofTable[i + 1];
    if ((a.krw - a.kro) * (b.krw - b.kro) <= 0) {
      const t = (a.kro - a.krw) / ((b.krw - a.krw) - (b.kro - a.kro) || 1);
      return +(a.sw + t * (b.sw - a.sw)).toFixed(3);
    }
  }
  return null;
}

const CollapsibleSection = ({
  icon, title, defaultOpen = true, children,
}: { icon: React.ReactNode; title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-petroleum-900 border border-petroleum-800 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4">
        <span className="flex items-center gap-2.5 text-xs font-bold text-petroleum-300 uppercase tracking-widest">
          {icon} {title}
        </span>
        {open ? <ChevronUp size={15} className="text-petroleum-500" /> : <ChevronDown size={15} className="text-petroleum-500" />}
      </button>
      {open && <div className="border-t border-petroleum-800">{children}</div>}
    </div>
  );
};

export function RelPermPage() {
  const { messagesByPage, sendMessage, loading, selectedModel } = useChat();
  const messages = messagesByPage['relperm'];
  const hasStarted = messages.length > 0;
  const modelDisplayName = selectedModel ? selectedModel.split(/[-( ]/)[0].toUpperCase() : 'AI';

  const [dataSource, setDataSource] = useState<DataSource>('example');
  const [rockType, setRockType] = useState<RockType>('sandstone');
  const [params, setParams] = useState<CoreyParams>(ROCK_TYPE_PRESETS.sandstone);
  const [localError, setLocalError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const toggleSource = (type: DataSource) => {
    setDataSource(type);
    if (type === 'example') setParams(ROCK_TYPE_PRESETS[rockType]);
  };

  const handleRockTypeChange = (type: RockType) => {
    setRockType(type);
    if (dataSource === 'example') setParams(ROCK_TYPE_PRESETS[type]);
  };

  const updateParam = (key: keyof CoreyParams, value: string) => {
    setDataSource('custom');
    setParams(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const validate = (): string | null => {
    if (params.swc + params.sor >= 1) return 'Swc + Sor must be less than 1.';
    if (params.sgc + params.sorg >= 1) return 'Sgc + Sorg must be less than 1.';
    if (params.krwMax > 1 || params.kroMax > 1 || params.krgMax > 1 || params.krogMax > 1) {
      return 'Relative permeability endpoints cannot exceed 1.0.';
    }
    return null;
  };

  const swofTable = useMemo(() => computeSWOF(params), [params]);
  const sgofTable = useMemo(() => computeSGOF(params), [params]);
  const crossoverSw = useMemo(() => findCrossover(swofTable), [swofTable]);

  const handleGenerate = () => {
  console.log('handleGenerate called, params:', params);
  const err = validate();
  console.log('validation result:', err);
  if (err) { setLocalError(err); return; }
  setLocalError(null);
  setGenerated(true);
  console.log('generated set to true');
};

  const handleAIReview = async () => {
    const prompt = `RELPERM GENERATION REQUEST (Corey Correlation):
--- ROCK TYPE ---
${rockType}
--- SWOF PARAMETERS ---
Swc=${params.swc}, Sor=${params.sor}, krwMax=${params.krwMax}, kroMax=${params.kroMax}, Nw=${params.nw}, Now=${params.now}
--- SGOF PARAMETERS ---
Sgc=${params.sgc}, Sorg=${params.sorg}, krgMax=${params.krgMax}, krogMax=${params.krogMax}, Ng=${params.ng}, Nog=${params.nog}
--- CROSSOVER ---
Sw at krw=kro: ${crossoverSw ?? 'not found in range'}
--- COMPUTED SWOF TABLE (sample) ---
${swofTable.filter((_, i) => i % 4 === 0).map(r => `Sw=${r.sw} Krw=${r.krw} Kro=${r.kro}`).join('\n')}
--- COMPUTED SGOF TABLE (sample) ---
${sgofTable.filter((_, i) => i % 4 === 0).map(r => `Sg=${r.sg} Krg=${r.krg} Krog=${r.krog}`).join('\n')}

Please review these Corey-derived relative permeability tables for physical consistency (monotonicity, endpoint validity, crossover point plausibility), format them as ECLIPSE-ready SWOF/SGOF keyword blocks, and flag any anomalies.`;
    await sendMessage(prompt, 'relperm');
  };

  return (
    <div className="flex h-full bg-petroleum-950">
      {!hasStarted ? (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto max-w-5xl mx-auto space-y-5">
          <header className="mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> ACTIVE_SESSION
              </div>
              <div className="p-2 bg-emerald-900/30 rounded-lg border border-emerald-500/50">
                <FlaskConical className="text-emerald-500" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight uppercase">RelPerm Generator</h1>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-petroleum-900 border border-petroleum-700 text-xs text-petroleum-300 font-mono mb-2">
              <Zap size={10} className="text-amber-400" /> Corey Correlation + {modelDisplayName} Review
            </div>
            <p className="text-xs text-petroleum-500 mt-2">
              Deterministic Corey-model computation, reviewed and formatted for ECLIPSE SWOF/SGOF export.
            </p>
          </header>

          {/* Inputs */}
          <div className="bg-petroleum-900 border border-petroleum-800 rounded-2xl p-5 space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-petroleum-400 font-mono uppercase tracking-widest">Rock Type</label>
              <div className="flex bg-petroleum-950 rounded-md p-1 border border-petroleum-800">
                {(['sandstone', 'carbonate', 'unconsolidated'] as RockType[]).map((type) => (
                  <button key={type} onClick={() => handleRockTypeChange(type)}
                    className={`px-3 py-1 text-[10px] font-mono rounded transition-colors capitalize ${rockType === type ? 'bg-emerald-900/50 text-emerald-400' : 'text-petroleum-500 hover:text-petroleum-300'}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[10px] text-petroleum-400 font-mono uppercase tracking-widest">Parameters</label>
              <div className="flex bg-petroleum-950 rounded-md p-1 border border-petroleum-800">
                <button onClick={() => toggleSource('custom')}
                  className={`px-3 py-1 text-[10px] font-mono rounded transition-colors ${dataSource === 'custom' ? 'bg-petroleum-700 text-white' : 'text-petroleum-500 hover:text-petroleum-300'}`}>Custom</button>
                <button onClick={() => toggleSource('example')}
                  className={`px-3 py-1 text-[10px] font-mono rounded transition-colors ${dataSource === 'example' ? 'bg-emerald-900/50 text-emerald-400' : 'text-petroleum-500 hover:text-petroleum-300'}`}>Preset ({rockType})</button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-petroleum-400 font-mono uppercase tracking-widest">
                <Droplet size={12} className="text-blue-400" /> Water-Oil (SWOF)
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {([['swc', 'Swc'], ['sor', 'Sor'], ['krwMax', 'Krw Max'], ['kroMax', 'Kro Max'], ['nw', 'Nw'], ['now', 'Now']] as [keyof CoreyParams, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-[9px] text-petroleum-500 font-mono">{label}</label>
                    <input type="number" step="0.01" value={params[key]} onChange={(e) => updateParam(key, e.target.value)}
                      className="w-full p-2 bg-petroleum-950 border border-petroleum-800 rounded-lg text-xs text-blue-300 font-mono focus:ring-1 focus:ring-petroleum-600 outline-none" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-petroleum-400 font-mono uppercase tracking-widest">
                <Wind size={12} className="text-amber-400" /> Gas-Oil (SGOF)
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {([['sgc', 'Sgc'], ['sorg', 'Sorg'], ['krgMax', 'Krg Max'], ['krogMax', 'Krog Max'], ['ng', 'Ng'], ['nog', 'Nog']] as [keyof CoreyParams, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-[9px] text-petroleum-500 font-mono">{label}</label>
                    <input type="number" step="0.01" value={params[key]} onChange={(e) => updateParam(key, e.target.value)}
                      className="w-full p-2 bg-petroleum-950 border border-petroleum-800 rounded-lg text-xs text-amber-300 font-mono focus:ring-1 focus:ring-petroleum-600 outline-none" />
                  </div>
                ))}
              </div>
            </div>

            {localError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 p-3 rounded-lg border border-red-900/50">
                <AlertCircle size={14} /> {localError}
              </div>
            )}

            <button onClick={handleGenerate}
              className="w-full py-4 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20">
              <FileText size={18} /> GENERATE CURVES
            </button>
          </div>

          {/* Visualizations — only after Generate is clicked */}
          {generated && (
            <>
			{(() => {
			  console.log('swofTable:', swofTable);
			  console.log('swofTable length:', swofTable.length);
			  console.log('sgofTable:', sgofTable);
			  console.log('sgofTable length:', sgofTable.length);
			  return null;
			})()}
              <CollapsibleSection icon={<Droplet size={13} className="text-blue-400" />} title="SWOF Curve — Water-Oil Relative Permeability">
                <div className="p-5">
                  {crossoverSw !== null && (
                    <p className="text-[10px] text-petroleum-400 font-mono mb-3">Krw = Kro crossover at Sw ≈ {crossoverSw}</p>
                  )}
                  <div style={{ width: '100%', height: 288 }}> 
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={swofTable} margin={{ top: 8, right: 20, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="sw" fontSize={9} stroke="#64748b" tickFormatter={v => v.toFixed(2)}
                          label={{ value: 'Sw', position: 'insideBottomRight', offset: -5, fontSize: 9, fill: '#64748b' }} />
                        <YAxis fontSize={9} stroke="#64748b" domain={[0, 1]}
                          label={{ value: 'Kr', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#64748b' }} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                          labelFormatter={(v) => `Sw = ${Number(v).toFixed(3)}`} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {crossoverSw !== null && <ReferenceLine x={crossoverSw} stroke="#f59e0b" strokeDasharray="4 3" />}
                        <Line type="monotone" dataKey="krw" name="Krw" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="kro" name="Kro" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection icon={<Wind size={13} className="text-amber-400" />} title="SGOF Curve — Gas-Oil Relative Permeability">
                <div className="p-5">
                  <div style={{ width: '100%', height: 288 }}> 
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sgofTable} margin={{ top: 8, right: 20, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="sg" fontSize={9} stroke="#64748b" tickFormatter={v => v.toFixed(2)}
                          label={{ value: 'Sg', position: 'insideBottomRight', offset: -5, fontSize: 9, fill: '#64748b' }} />
                        <YAxis fontSize={9} stroke="#64748b" domain={[0, 1]}
                          label={{ value: 'Kr', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#64748b' }} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                          labelFormatter={(v) => `Sg = ${Number(v).toFixed(3)}`} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Line type="monotone" dataKey="krg" name="Krg" stroke="#f59e0b" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="krog" name="Krog" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CollapsibleSection>

              <div className="bg-petroleum-900 border border-petroleum-800 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-petroleum-400 uppercase tracking-widest mb-3">AI Review</p>
                <button onClick={handleAIReview} disabled={loading}
                  className="w-full bg-violet-600 text-white rounded-xl p-4 flex items-center justify-center gap-3 hover:bg-violet-700 transition-all shadow-md text-sm font-bold disabled:opacity-50">
                  <Bot size={18} /> {loading ? "REVIEWING TABLES..." : "REVIEW & EXPORT SWOF/SGOF"}
                </button>
              </div>
            </>
          )}

          <CollapsibleSection icon={<BookOpen size={13} className="text-petroleum-500" />} title="Corey Correlation Reference" defaultOpen={false}>
            <div className="p-5 text-[11px] text-petroleum-400 space-y-3 leading-relaxed">
              <p className="font-mono text-emerald-400 text-[12px]">Krw = Krw_max · ((Sw − Swc)/(1 − Swc − Sor))^Nw</p>
              <p className="font-mono text-emerald-400 text-[12px]">Kro = Kro_max · ((1 − Sw − Sor)/(1 − Swc − Sor))^Now</p>
              <p>Corey, A.T. (1954). The Interrelation Between Gas and Oil Relative Permeabilities. <i>Producers Monthly</i>.</p>
            </div>
          </CollapsibleSection>
        </div>
      ) : (
        <div className="flex-1"><AgentChatPanel isVisible={true} /></div>
      )}
    </div>
  );
}