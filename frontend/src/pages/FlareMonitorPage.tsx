import { useEffect, useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext';
import { AgentChatPanel } from '../components/layout/AgentChatPanel';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts';
import {
  Flame, Activity, AlertCircle, ChevronDown, ChevronUp, Bot, Zap
} from 'lucide-react';

interface SensorReading {
  reading_id: string;
  flow_rate: number;
  unit: string;
  status: 'normal' | 'elevated' | 'waste_detected';
  rationale: string;
  timestamp: string;
}

const EXAMPLE_READINGS: SensorReading[] = [
  { reading_id: 'demo-1', flow_rate: 3.2, unit: 'L/min', status: 'normal', rationale: 'Normal range.', timestamp: new Date(Date.now() - 480000).toISOString() },
  { reading_id: 'demo-2', flow_rate: 3.6, unit: 'L/min', status: 'normal', rationale: 'Normal range.', timestamp: new Date(Date.now() - 420000).toISOString() },
  { reading_id: 'demo-3', flow_rate: 4.8, unit: 'L/min', status: 'normal', rationale: 'Normal range.', timestamp: new Date(Date.now() - 360000).toISOString() },
  { reading_id: 'demo-4', flow_rate: 6.1, unit: 'L/min', status: 'elevated', rationale: 'Elevated.', timestamp: new Date(Date.now() - 300000).toISOString() },
  { reading_id: 'demo-5', flow_rate: 7.3, unit: 'L/min', status: 'elevated', rationale: 'Elevated.', timestamp: new Date(Date.now() - 240000).toISOString() },
  { reading_id: 'demo-6', flow_rate: 8.9, unit: 'L/min', status: 'waste_detected', rationale: 'Exceeds threshold.', timestamp: new Date(Date.now() - 180000).toISOString() },
  { reading_id: 'demo-7', flow_rate: 9.4, unit: 'L/min', status: 'waste_detected', rationale: 'Valve adjustment active.', timestamp: new Date(Date.now() - 120000).toISOString() },
  { reading_id: 'demo-8', flow_rate: 5.2, unit: 'L/min', status: 'elevated', rationale: 'Declining post-adj.', timestamp: new Date(Date.now() - 60000).toISOString() },
  { reading_id: 'demo-9', flow_rate: 3.9, unit: 'L/min', status: 'normal', rationale: 'Normal post-adj.', timestamp: new Date().toISOString() },
];

const WASTE_THRESHOLD = 8.0;
const ELEVATED_THRESHOLD = 5.0;
const API_BASE = import.meta.env.VITE_API_URL ?? '';
type DataSource = 'live' | 'example';

const CollapsibleSection = ({
  icon, title, defaultOpen = true, children,
}: { icon: React.ReactNode; title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-petroleum-900 border border-petroleum-800 rounded-2xl overflow-hidden shadow-sm">
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

export function FlareMonitorPage() {
  const { messagesByPage, sendMessage, loading, selectedModel } = useChat();
  const messages = messagesByPage['flare'];
  const hasStarted = messages.length > 0;
  const modelDisplayName = selectedModel ? selectedModel.split(/[-( ]/)[0].toUpperCase() : 'AI';

  const [dataSource, setDataSource] = useState<DataSource>('example');
  const [liveReadings, setLiveReadings] = useState<SensorReading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(true);
  const [liveDataError, setLiveDataError] = useState<string | null>(null);

  const readings = dataSource === 'example' ? EXAMPLE_READINGS : liveReadings;

  // FIX: Data must be Oldest -> Newest. Removed .reverse()
  const chartData = useMemo(
    () => readings.map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      flow: r.flow_rate,
      status: r.status,
      id: r.reading_id
    })),
    [readings]
  );

  const fetchLiveReadings = async () => {
    try {
      const res = await fetch(`${API_BASE}/sensor/readings/recent`);
      if (!res.ok) { setLiveDataError(`Server error ${res.status}`); return; }
      const data = await res.json();
      setLiveReadings(data);
      setLiveDataError(data.length === 0 ? 'No readings found.' : null);
    } catch {
      setLiveDataError('Could not reach sensor feed.');
    } finally {
      setLoadingReadings(false);
    }
  };

  useEffect(() => {
    if (dataSource === 'live') {
      fetchLiveReadings();
      const interval = setInterval(fetchLiveReadings, 10000);
      return () => clearInterval(interval);
    }
  }, [dataSource]);

  const requestSummary = () => {
    const recentSummary = readings.slice(-5)
      .map(r => `${r.timestamp}: ${r.flow_rate}${r.unit} — ${r.status}`).join('\n');
    sendMessage(`Summarize flare readings and flag waste conditions:\n${recentSummary}`, 'flare');
  };

  const latestStatus = readings[readings.length - 1]?.status;
  const wasteCount = readings.filter(r => r.status === 'waste_detected').length;
  const avgFlow = readings.length > 0 ? (readings.reduce((s, r) => s + r.flow_rate, 0) / readings.length).toFixed(2) : '—';

  return (
    <div className="flex h-full bg-petroleum-950">
      {!hasStarted ? (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto max-w-5xl mx-auto space-y-5 custom-scrollbar">
          <header className="mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> ACTIVE_MONITOR
              </div>
              <div className="p-2 bg-orange-900/30 rounded-lg border border-orange-500/50">
                <Flame className="text-orange-500" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Flare Monitor</h1>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-petroleum-900 border border-petroleum-700 text-xs text-petroleum-300 font-mono">
              <Zap size={10} className="text-amber-400" /> GCP Edition — {modelDisplayName} Logic Layer
            </div>
          </header>

          <div className="flex items-center justify-between">
            <label className="text-[10px] text-petroleum-400 font-mono uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="text-emerald-500" /> Source Selection
            </label>
            <div className="flex bg-petroleum-900 rounded-md p-1 border border-petroleum-800">
              <button onClick={() => setDataSource('live')}
                className={`px-3 py-1 text-[10px] font-mono rounded transition-colors ${dataSource === 'live' ? 'bg-petroleum-700 text-white' : 'text-petroleum-500'}`}>Live</button>
              <button onClick={() => setDataSource('example')}
                className={`px-3 py-1 text-[10px] font-mono rounded transition-colors ${dataSource === 'example' ? 'bg-orange-900/50 text-orange-400' : 'text-petroleum-500'}`}>Example</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-petroleum-900 border border-petroleum-800 rounded-xl">
              <p className="text-[10px] text-petroleum-500 font-mono uppercase">Status</p>
              <p className={`text-lg font-bold font-mono mt-1 ${latestStatus === 'waste_detected' ? 'text-red-400' : 'text-emerald-400'}`}>
                {latestStatus?.replace('_', ' ').toUpperCase() ?? '—'}
              </p>
            </div>
            <div className="p-4 bg-petroleum-900 border border-petroleum-800 rounded-xl">
              <p className="text-[10px] text-petroleum-500 font-mono uppercase">Avg Rate</p>
              <p className="text-lg font-bold font-mono mt-1 text-petroleum-200">{avgFlow} L/m</p>
            </div>
            <div className="p-4 bg-petroleum-900 border border-petroleum-800 rounded-xl">
              <p className="text-[10px] text-petroleum-500 font-mono uppercase">Waste Events</p>
              <p className={`text-lg font-bold font-mono mt-1 ${wasteCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{wasteCount}</p>
            </div>
          </div>

          {/* Time-series chart using AssetPage pattern */}
          <CollapsibleSection icon={<Activity size={13} className="text-orange-400" />} title="Flow Rate Analysis">
            <div className="p-5">
              <div className="flex flex-wrap gap-4 mb-4 text-[10px] font-bold">
                <span className="flex items-center gap-1.5 text-petroleum-400">
                  <span className="w-3 h-0 border-t-2 border-dashed border-red-400 inline-block" /> Waste Limit ({WASTE_THRESHOLD})
                </span>
                <span className="flex items-center gap-1.5 text-petroleum-400">
                  <span className="w-3 h-0 border-t-2 border-dashed border-amber-400 inline-block" /> Elevated ({ELEVATED_THRESHOLD})
                </span>
              </div>
              
              {/* FIX: Set a height using Tailwind class like AssetPage */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis 
                      dataKey="time" 
                      fontSize={9} 
                      axisLine={false} 
                      tickLine={false} 
                      stroke="#64748b" 
                    />
                    <YAxis 
                      fontSize={9} 
                      axisLine={false} 
                      tickLine={false} 
                      stroke="#64748b" 
                      domain={[0, 'auto']} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                      itemStyle={{ color: '#fb923c' }}
                    />
                    <ReferenceLine y={WASTE_THRESHOLD} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5} />
                    <ReferenceLine y={ELEVATED_THRESHOLD} stroke="#f59e0b" strokeDasharray="4 3" />
                    
                    <Line 
                      type="monotone" 
                      dataKey="flow" 
                      stroke="#fb923c" 
                      strokeWidth={2} 
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (!cx || !cy || !payload) return <g key={Math.random()} />;
                        const color = payload.status === 'waste_detected' ? '#ef4444' :
                                      payload.status === 'elevated' ? '#f59e0b' : '#10b981';
                        return (
                          <circle 
                            key={`dot-${payload.id}-${cx}`} 
                            cx={cx} cy={cy} r={4} 
                            fill={color} 
                            stroke="#0f172a" 
                            strokeWidth={1} 
                          />
                        );
                      }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CollapsibleSection>

          <button onClick={requestSummary} disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-orange-700 to-orange-600 hover:from-orange-600 hover:to-orange-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl">
            <Bot size={18} /> {loading ? "ANALYZING..." : "GENERATE EXECUTIVE SUMMARY"}
          </button>
        </div>
      ) : (
        <div className="flex-1"><AgentChatPanel isVisible={true} /></div>
      )}
    </div>
  );
}