// src/pages/AssetPage.tsx
// Improved: dynamic charts respond to param changes, collapsible chart sections,
// input table and results remain visible after analysis, AI Advisor moved to bottom,
// modern visualizations added (EUR bar, rate forecast, time-to-abandonment gauges).

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import Papa from 'papaparse';
import { runBulkDCA } from '../services/api';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, LineChart, Line,
  BarChart, Bar, AreaChart, Area, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, ReferenceLine, Legend, LabelList,
} from 'recharts';
import {
  Info, FileSpreadsheet, Play, ChevronDown, ChevronUp, BarChart3,
  TrendingDown, ShieldAlert, Loader2, AlertTriangle, Database,
  Activity, Clock, Layers, BookOpen, Bot, CheckCircle2, XCircle,
  Zap, Cpu, Code, AlertCircle, FileCode, Terminal,
  FileText, ChevronRight, FlaskConical, BarChart2, GitMerge, Shield, Trash2, Lock,
} from 'lucide-react';
import { AgentChatPanel } from '../components/layout/AgentChatPanel'

import { useAsset } from '../context/AssetContext';
import type { WellRecord } from '../context/AssetContext'; //

import { AgentActionBanner } from '../components/ui/AgentActionBanner';



// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface WellResult {
  well_name: string;
  field?: string;
  qi_stbd: number;
  di_per_yr: number;
  b_factor: number;
  eur_mmstb: number;
  current_rate_stbd?: number;
}

interface DCAResults {
  total_eur_mmstb: number;
  b_flag_count: number;
  well_results: WellResult[];
}

interface ApiResult {
  dca_results: DCAResults;
  session_id?: string;
}

// ─────────────────────────────────────────────
// DEMO DATA
// ─────────────────────────────────────────────
const generateDemoData = () => {
  const wells = ['WELL-A', 'WELL-B', 'WELL-C'];
  const data: any[] = [];
  const startDate = new Date('2022-01-01');
  for (let i = 0; i < 60; i++) {
    const wellName = wells[i % wells.length];
    const date = new Date(startDate);
    date.setMonth(startDate.getMonth() + Math.floor(i / wells.length));
    data.push({
      Field: 'DEMO-FIELD',
      WellName: wellName,
      Date: date.toISOString().split('T')[0],
      OilRate: Math.round(4000 * Math.pow(0.96, Math.floor(i / wells.length)) + Math.random() * 50),
    });
  }
  return data;
};

const DEMO_DATA = generateDemoData();

// DCA math helpers (client-side, for dynamic chart preview)
const arpsRate = (qi: number, Di: number, b: number, t: number): number => {
  const Di_yr = Di / 100;
  if (b < 0.001) return qi * Math.exp(-Di_yr * t);
  return qi / Math.pow(1 + b * Di_yr * t, 1 / b);
};

const arpsEUR = (qi: number, Di: number, b: number, qEcon: number, maxYrs: number): number => {
  const Di_yr = Di / 100;
  let tAban = maxYrs;
  if (b < 0.001) {
    const t = -Math.log(qEcon / qi) / Di_yr;
    tAban = Math.min(t, maxYrs);
    return (qi * (1 - Math.exp(-Di_yr * tAban))) / Di_yr / 1e6;
  }
  const t = (Math.pow(qi / qEcon, b) - 1) / (b * Di_yr);
  tAban = Math.min(t, maxYrs);
  return (qi / (Di_yr * (1 - b))) * (1 - Math.pow(1 + b * Di_yr * tAban, 1 - 1 / b)) / 1e6;
};

const timeToAban = (qi: number, Di: number, b: number, qEcon: number, maxYrs: number): number => {
  const Di_yr = Di / 100;
  const t = b < 0.001
    ? -Math.log(qEcon / qi) / Di_yr
    : (Math.pow(qi / qEcon, b) - 1) / (b * Di_yr);
  return Math.min(t, maxYrs);
};

// ─────────────────────────────────────────────
// WELL COLORS
// ─────────────────────────────────────────────
const WELL_COLORS: Record<string, string> = {
  'WELL-A': '#0f766e',
  'WELL-B': '#1d4ed8',
  'WELL-C': '#b45309',
};

const getWellColor = (name: string, bFactor?: number): string => {
  if (bFactor !== undefined && bFactor > 1) return '#d97706';
  return WELL_COLORS[name] ?? '#64748b';
};

// ─────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────
const HelpTip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1 align-middle cursor-help">
    <Info size={11} className="text-slate-400" />
    <div className="invisible group-hover:visible absolute z-50 w-60 p-2.5 mt-1 text-[10px] bg-slate-900 text-slate-200 rounded-xl shadow-2xl -left-28 leading-relaxed border border-slate-700">
      {text}
    </div>
  </div>
);

const SectionHeader = ({
  icon, title, open, onToggle, count,
}: {
  icon: React.ReactNode; title: string; open: boolean; onToggle: () => void; count?: string;
}) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between px-5 py-4 text-left group"
  >
    <span className="flex items-center gap-2.5 text-xs font-bold text-slate-700 uppercase tracking-widest">
      {icon}
      {title}
      {count && (
        <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </span>
    <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
      {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
    </span>
  </button>
);

const WellFilterBar = ({
  allNames, selected, onToggle, onSelectAll, maxVisible = 8,
}: {
  allNames: string[];
  selected: string[];
  onToggle: (name: string) => void;
  onSelectAll: () => void;
  maxVisible?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? allNames : allNames.slice(0, maxVisible);
  const isAll = selected.length === allNames.length;

  return (
    <div className="flex items-center gap-1.5 flex-wrap py-1">
      {/* All toggle */}
      <button
        onClick={onSelectAll}
        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all border ${
          isAll
            ? 'bg-slate-900 text-white border-slate-900'
            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
        }`}
      >
        All
      </button>

      {visible.map(name => (
        <button
          key={name}
          onClick={() => onToggle(name)}
          className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all border ${
            selected.includes(name)
              ? 'text-white border-transparent'
              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
          }`}
          style={selected.includes(name) ? { background: getWellColor(name) } : undefined}
        >
          {name}
        </button>
      ))}

      {/* Overflow toggle */}
      {allNames.length > maxVisible && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-400 border border-slate-200 hover:border-slate-400 transition-all"
        >
          {expanded ? '− less' : `+${allNames.length - maxVisible} more`}
        </button>
      )}
    </div>
  );
};

const CollapsibleCard = ({
  icon, title, defaultOpen = true, count, controls, children,
}: {
  icon: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  count?: string;
  controls?: React.ReactNode; // ← new
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between pr-4">
        <SectionHeader
          icon={icon} title={title} open={open}
          onToggle={() => setOpen(o => !o)} count={count}
        />
        {/* Panel-level controls — always visible even when collapsed */}
        {controls && (
          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
            {controls}
          </div>
        )}
      </div>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </div>
  );
};

const KPICard = ({
  label, value, sub, icon, accent = false,
}: {
  label: string; value: string | number; sub: string; icon: React.ReactNode; accent?: boolean;
}) => (
  <div className={`p-5 rounded-2xl border shadow-sm ${accent ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 hover:border-blue-200'} transition-colors`}>
    <div className="flex justify-between items-start mb-2">
      <p className={`text-[10px] uppercase font-bold tracking-widest ${accent ? 'text-slate-400' : 'text-slate-400'}`}>{label}</p>
      {icon}
    </div>
    <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    <p className={`text-[10px] mt-1 font-mono ${accent ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</p>
  </div>
);

const ParamSlider = ({
  label, help, value, onChange, min, max, step, unit,
}: {
  label: string; help: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
        {label} <HelpTip text={help} />
      </label>
      <span className="text-sm font-bold text-slate-900 tabular-nums">
        {value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none bg-slate-200 accent-slate-900 cursor-pointer"
    />
    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
      <span>{min}{unit}</span><span>{max}{unit}</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// CHART: Rate Forecast
// ─────────────────────────────────────────────
const RateForecastChart = ({
  wells, econLimit, forecastHorizon,
}: {
  wells: WellResult[]; econLimit: number; forecastHorizon: number;
}) => {
  const data = useMemo(() => {
    const points: any[] = [];
    const steps = Math.min(forecastHorizon * 12, 300);
    for (let m = 0; m <= steps; m += 2) {
      const pt: any = { month: m };
      wells.forEach(w => {
        pt[w.well_name] = parseFloat(arpsRate(w.qi_stbd, w.di_per_yr, w.b_factor, m / 12).toFixed(1));
      });
      points.push(pt);
    }
    return points;
  }, [wells, forecastHorizon]);

  return (
    <div className="p-5">
      <div className="flex flex-wrap gap-4 mb-4">
        {wells.map(w => (
          <span key={w.well_name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
            <span className="w-3 h-1.5 rounded-full inline-block" style={{ background: getWellColor(w.well_name, w.b_factor) }} />
            {w.well_name} {w.b_factor > 1 && <span className="text-amber-500">⚠</span>}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
          <span className="w-3 h-0 border-t-2 border-dashed border-red-400 inline-block" />
          Econ. limit
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" fontSize={9} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}m`} interval={Math.floor(data.length / 6)} />
            <YAxis fontSize={9} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,.12)', fontSize: 11 }}
			  formatter={(v: any, name?: string | number) => [`${Number(v).toFixed(0)} STB/D`, String(name)]}
              labelFormatter={l => `Month ${l}`}
            />
            <ReferenceLine y={econLimit} stroke="#f87171" strokeDasharray="4 3" strokeWidth={1.5} />
            {wells.map(w => (
              <Line key={w.well_name} type="monotone" dataKey={w.well_name}
                stroke={getWellColor(w.well_name, w.b_factor)}
                strokeWidth={w.b_factor > 1 ? 2 : 1.5}
                strokeDasharray={w.b_factor > 1 ? '5 3' : undefined}
                dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CHART: EUR Bar
// ─────────────────────────────────────────────
const EURBarChart = ({
  wells, econLimit, forecastHorizon,
}: {
  wells: WellResult[]; econLimit: number; forecastHorizon: number;
}) => {
  const data = useMemo(() =>
    wells.map(w => ({
      name: w.well_name,
      eur: parseFloat(arpsEUR(w.qi_stbd, w.di_per_yr, w.b_factor, econLimit, forecastHorizon).toFixed(4)),
      fill: getWellColor(w.well_name, w.b_factor),
    })),
    [wells, econLimit, forecastHorizon]
  );

  return (
    <div className="p-5">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis fontSize={9} axisLine={false} tickLine={false}
              tickFormatter={v => `${v.toFixed(3)}`} unit=" MM" />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,.12)', fontSize: 11 }}
              formatter={(v: any) => [`${Number(v).toFixed(4)} MMSTB`, 'EUR']}
            />
            <Bar dataKey="eur" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
              <LabelList dataKey="eur" position="top" fontSize={10} fontWeight={700}
				formatter={(v: any) => (typeof v === 'number' ? v.toFixed(3) : v)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CHART: Cumulative Stacked Area
// ─────────────────────────────────────────────
const CumulativeAreaChart = ({
  wells, econLimit, forecastHorizon,
}: {
  wells: WellResult[]; econLimit: number; forecastHorizon: number;
}) => {
  const data = useMemo(() => {
    const points: any[] = [];
    for (let y = 0; y <= forecastHorizon; y += 0.5) {
      const pt: any = { year: y };
      wells.forEach(w => {
        pt[w.well_name] = parseFloat((arpsEUR(w.qi_stbd, w.di_per_yr, w.b_factor, econLimit, y) * 1000).toFixed(2));
      });
      points.push(pt);
    }
    return points;
  }, [wells, econLimit, forecastHorizon]);

  return (
    <div className="p-5">
      <div className="flex flex-wrap gap-4 mb-3">
        {wells.map(w => (
          <span key={w.well_name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
            <span className="w-3 h-3 rounded inline-block opacity-60" style={{ background: getWellColor(w.well_name, w.b_factor) }} />
            {w.well_name}
          </span>
        ))}
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="year" fontSize={9} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}yr`} interval={Math.floor(data.length / 5)} />
            <YAxis fontSize={9} axisLine={false} tickLine={false} unit=" k" />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,.12)', fontSize: 11 }}
			  formatter={(v: any, name) => [`${Number(v).toFixed(2)} MSTB`, name ?? '']}
			  
              labelFormatter={l => `Year ${Number(l).toFixed(1)}`}
            />
            {wells.map(w => (
              <Area key={w.well_name} type="monotone" dataKey={w.well_name}
                stroke={getWellColor(w.well_name, w.b_factor)}
                fill={getWellColor(w.well_name, w.b_factor)}
                fillOpacity={0.15}
                strokeWidth={1.5} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CHART: Decline Risk Scatter (dynamic axes)
// ─────────────────────────────────────────────
const AXIS_OPTIONS = [
  { value: 'di_per_yr', label: 'Decline Dᵢ (%/yr)' },
  { value: 'b_factor', label: 'b-factor' },
  { value: 'qi_stbd', label: 'Init rate (STB/D)' },
  { value: 'eur_mmstb', label: 'EUR (MMSTB)' },
];

const DeclineRiskChart = ({ wells }: { wells: WellResult[] }) => {
  const [xAxis, setXAxis] = useState('di_per_yr');
  const [yAxis, setYAxis] = useState('b_factor');

  const scatterData = useMemo(() =>
    wells.map(w => ({
      ...w,
      x: (w as any)[xAxis],
      y: (w as any)[yAxis],
    })),
    [wells, xAxis, yAxis]
  );

  const xLabel = AXIS_OPTIONS.find(o => o.value === xAxis)?.label ?? xAxis;
  const yLabel = AXIS_OPTIONS.find(o => o.value === yAxis)?.label ?? yAxis;

  return (
    <div className="p-5">
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
          <span className="text-[9px] font-bold text-slate-400 uppercase">X-axis</span>
          <select value={xAxis} onChange={e => setXAxis(e.target.value)}
            className="bg-transparent border-none text-[10px] font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none">
            {AXIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
          <span className="text-[9px] font-bold text-slate-400 uppercase">Y-axis</span>
          <select value={yAxis} onChange={e => setYAxis(e.target.value)}
            className="bg-transparent border-none text-[10px] font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none">
            {AXIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 ml-auto text-[10px] text-slate-400 font-bold">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block" />Normal</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />b &gt; 1.0</span>
        </div>
      </div>
      {yAxis === 'b_factor' && (
        <p className="text-[10px] text-slate-400 mb-3 font-mono">
          Bubble size ∝ EUR · dashed line = harmonic threshold (b = 1.0)
        </p>
      )}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis type="number" dataKey="x" name={xLabel} fontSize={9} axisLine={false} tickLine={false}
              label={{ value: xLabel, position: 'insideBottomRight', offset: -10, fontSize: 9, fill: '#94a3b8' }} />
            <YAxis type="number" dataKey="y" name={yLabel} fontSize={9} axisLine={false} tickLine={false}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 9, fill: '#94a3b8' }} />
            {yAxis === 'b_factor' && (
              <ReferenceLine y={1} stroke="#f87171" strokeDasharray="4 3" strokeWidth={1.5} />
            )}
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,.12)', fontSize: 11 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as WellResult;
                return (
                  <div className="bg-white rounded-xl shadow-xl p-3 border border-slate-100 text-xs">
                    <p className="font-bold mb-1">{d.well_name}</p>
                    <p className="text-slate-500">{xLabel}: <b>{Number((d as any)[xAxis]).toFixed(3)}</b></p>
                    <p className="text-slate-500">{yLabel}: <b>{Number((d as any)[yAxis]).toFixed(3)}</b></p>
                    {d.b_factor > 1 && <p className="text-amber-500 font-bold mt-1">⚠ b &gt; 1.0</p>}
                  </div>
                );
              }}
            />
            <Scatter data={scatterData} shape="circle">
              {scatterData.map((entry, i) => (
                <Cell key={i} fill={entry.b_factor > 1 ? '#f59e0b' : getWellColor(entry.well_name)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// COMPONENT: Time-to-Abandonment Gauges
// ─────────────────────────────────────────────
const AbandonmentGauges = ({
  wells, econLimit, abandonmentBuffer, forecastHorizon,
}: {
  wells: WellResult[]; econLimit: number; abandonmentBuffer: number; forecastHorizon: number;
}) => {
  const items = useMemo(() =>
    wells.map(w => {
      const tta = timeToAban(w.qi_stbd, w.di_per_yr, w.b_factor, econLimit, forecastHorizon);
      const bufferThreshold = tta / abandonmentBuffer;
      const pct = Math.min(100, (tta / forecastHorizon) * 100);
      const atRisk = tta <= bufferThreshold * abandonmentBuffer;
      return { ...w, tta, bufferThreshold, pct, atRisk };
    }),
    [wells, econLimit, abandonmentBuffer, forecastHorizon]
  );

  return (
    <div className="p-5 space-y-5">
      {items.map(w => (
        <div key={w.well_name}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: getWellColor(w.well_name, w.b_factor) }} />
              <span className="text-xs font-bold text-slate-800">{w.well_name}</span>
              <span className="text-[9px] text-slate-400 font-mono">{w.field ?? 'DEMO-FIELD'}</span>
              {w.b_factor > 1 && (
                <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">b &gt; 1</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-sm font-bold tabular-nums" style={{ color: getWellColor(w.well_name, w.b_factor) }}>
                {w.tta.toFixed(1)} yr
              </span>
              <span className="text-[9px] text-slate-400 ml-1">to econ. limit</span>
            </div>
          </div>
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="absolute h-full rounded-full transition-all duration-500"
              style={{ width: `${w.pct.toFixed(1)}%`, background: getWellColor(w.well_name, w.b_factor) }}
            />
            {/* Buffer marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-red-300"
              style={{ left: `${Math.min(100, (w.bufferThreshold / forecastHorizon) * 100).toFixed(1)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
            <span>Buffer zone at {w.bufferThreshold.toFixed(1)} yr</span>
            <span>Max horizon {forecastHorizon} yr</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// COMPONENT: Input data preview table (always visible after load)
// ─────────────────────────────────────────────

const InputDataTable = ({ records }: { records: any[] }) => {
  // Flatten grouped records back to row-per-date format
  const rows = useMemo(() => {
    const flat: { field: string; well: string; date: string; rate: number }[] = [];
    records.forEach((r: any) => {
      (r.oil_rates ?? []).forEach((rate: number, i: number) => {
        const date = new Date('2022-01-01');
        date.setMonth(date.getMonth() + i);
        flat.push({
          field: r.field,
          well: r.well_name,
          date: date.toISOString().split('T')[0],
          rate,
        });
      });
    });
    // Sort by date then well name
    return flat.sort((a, b) => a.date.localeCompare(b.date) || a.well.localeCompare(b.well));
  }, [records]);

  return (
    <div className="overflow-auto max-h-52 border-t border-slate-100">
      <table className="w-full text-[10px] font-mono" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '28%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '28%' }} />
          <col style={{ width: '22%' }} />
        </colgroup>
        <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
          <tr>
            {['Field', 'Well', 'Date', 'Rate (STB/D)'].map(h => (
              <th key={h} className="p-2.5 text-left font-bold text-[9px] uppercase tracking-widest text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-t border-slate-50 hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
              <td className="p-2.5 text-slate-400">{row.field}</td>
              <td className="p-2.5 font-bold text-slate-800">{row.well}</td>
              <td className="p-2.5 text-slate-500">{row.date}</td>
              <td className="p-2.5 font-bold text-blue-600">{row.rate.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


// ─────────────────────────────────────────────
// COMPONENT: Results table (always visible after analysis)
// ─────────────────────────────────────────────

const ResultsTable = ({ wells }: { wells: WellResult[] }) => (
  <div className="overflow-auto">
    <table className="w-full text-xs text-left">
      <thead className="bg-slate-900 text-white font-bold uppercase text-[9px] tracking-widest">
        <tr>
          <th className="p-3.5">Field</th>
          <th className="p-3.5">Well</th>
          <th className="p-3.5">Current rate</th>
          <th className="p-3.5">qᵢ (STB/D)</th>
          <th className="p-3.5">Dᵢ (%/yr)</th>
          <th className="p-3.5">b-factor</th>
          <th className="p-3.5">EUR (MMSTB)</th>
          <th className="p-3.5">Status</th>
        </tr>
      </thead>
      <tbody>
        {wells.map(w => (
          <tr key={w.well_name} className="border-t border-slate-100 hover:bg-slate-50">
            <td className="p-3.5 text-slate-400 font-mono text-[10px]">{w.field ?? 'DEMO-FIELD'}</td>
            <td className="p-3.5">
              <span className="font-bold text-slate-900">{w.well_name}</span>
            </td>
            <td className="p-3.5 font-mono text-[10px] text-slate-600">
              {w.current_rate_stbd?.toFixed(1) ?? '—'}
            </td>
            <td className="p-3.5 font-mono text-[10px]">{w.qi_stbd.toLocaleString()}</td>
            <td className="p-3.5 font-mono text-[10px]">{w.di_per_yr}%</td>
            <td className={`p-3.5 font-mono text-[10px] font-bold ${w.b_factor > 1 ? 'text-amber-600 bg-amber-50' : 'text-slate-700'}`}>
              {w.b_factor.toFixed(3)}
            </td>
            <td className="p-3.5 font-mono text-[10px] font-bold text-blue-700">
              {w.eur_mmstb.toFixed(4)}
            </td>
            <td className="p-3.5">
              {w.b_factor > 1
                ? <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full"><AlertTriangle size={9} />b &gt; 1</span>
                : <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full"><CheckCircle2 size={9} />OK</span>
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);



// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export function AssetPage() {

  const { messagesByPage,sendMessage, loading, selectedModel } = useChat(); 
  const messages = messagesByPage['asset'];
  
  const modelDisplayName = selectedModel ? selectedModel.split(/[-( ]/)[0].toUpperCase() : 'AI';

  const {
    wellRecords, setWellRecords,
    results, setResults,
    sourceMode, setSourceMode,
    econLimit, setEconLimit,
    abandonmentBuffer, setAbandonmentBuffer,
    forecastHorizon, setForecastHorizon,
  } = useAsset();
  
  
  const useWellFilter = (wells: WellResult[]) => {
	const allNames = useMemo(() => wells.map(w => w.well_name), [wells]);
	const [selected, setSelected] = useState<string[]>([]);

	  // Sync selection when wells change (e.g. new analysis run)
	useEffect(() => {
		setSelected(allNames.slice(0, Math.min(5, allNames.length)));
	  }, [allNames.join(',')]);

	const toggleWell = (name: string) => {
	  setSelected(prev =>
		  prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
		);
	  };
	const selectAll = () => setSelected(allNames);
	const filtered = useMemo(() => wells.filter(w => selected.includes(w.well_name)), [wells, selected]);

	return { selected, filtered, toggleWell, selectAll, allNames };
	};
  
  const activeWells = useMemo(() => results?.dca_results.well_results ?? [], [results]);
  const filter = useWellFilter(activeWells);

  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const hasStarted = messages.length > 0;

  const formatForBackend_old = useCallback((flatData: any[]) => {
    const grouped = flatData.reduce((acc: any, curr: any) => {
      const key = curr.WellName;
      if (!acc[key]) acc[key] = { well_name: key, field: curr.Field, oil_rates: [] };
      acc[key].oil_rates.push(Number(curr.OilRate));
      return acc;
    }, {});
    return Object.values(grouped);
  }, []);
  
  const formatForBackend = useCallback((flatData: any[]): WellRecord[] => {
  const grouped = flatData.reduce((acc: Record<string, WellRecord>, curr: any) => {
    const key = curr.WellName;
    if (!acc[key]) acc[key] = { well_name: key, field: curr.Field, oil_rates: [] };
    acc[key].oil_rates.push(Number(curr.OilRate));
    return acc;
  }, {});
  return Object.values(grouped);
}, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res: Papa.ParseResult<any>) => {
        const required = ['Field', 'WellName', 'Date', 'OilRate'];
        const missing = required.filter(c => !(res.meta.fields ?? []).includes(c));
        setTimeout(() => {
          if (missing.length > 0) {
            setError(`Missing required columns: ${missing.join(', ')}`);
            setWellRecords([]);
          } else {
            //setWellRecords(formatForBackend(res.data));
			setWellRecords(formatForBackend(res.data as any[]) as WellRecord[]);
            setSourceMode('upload');
            setResults(null);
          }
          setIsUploading(false);
        }, 600);
      },
      error: (err) => { setError(`CSV parse error: ${err.message}`); setIsUploading(false); },
    });
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await runBulkDCA(wellRecords, econLimit);
      setResults(data);
      //if (data.session_id && setSessionId) setSessionId(data.session_id);
    } catch {
      setError('DCA mathematics engine unreachable. Check your connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  //const handleAIAdvisor = () => sendMessage(prompt, 'asset'); // ← pass page key
  
  
  const handleAIAdvisor = () => {
  if (!results) return;
  const summary = results.dca_results.well_results.map(w => {
    const eur = arpsEUR(w.qi_stbd, w.di_per_yr, w.b_factor, econLimit, forecastHorizon).toFixed(4);
    const tta = timeToAban(w.qi_stbd, w.di_per_yr, w.b_factor, econLimit, forecastHorizon).toFixed(1);
    return `${w.well_name}: qi=${w.qi_stbd} STB/D, Di=${w.di_per_yr}%/yr, b=${w.b_factor}, EUR=${eur} MMSTB, TTA=${tta} yr`;
  }).join('\n');
  const message = `Run AI diagnosis on DCA results (econ limit=${econLimit} STB/D, buffer=${abandonmentBuffer}×, horizon=${forecastHorizon} yr):\n${summary}\n\nInterpret each well's b-factor, flag SPE-PRMS anomalies, and provide reserve booking guidance.`;
  sendMessage(message, 'asset');
};
  
 
  const detectedFields = [...new Set(wellRecords.map((r: any) => r.field))];
  const detectedWells = wellRecords.length;
  

  return (
    <div className="h-screen w-full overflow-y-auto bg-petroleum-800 custom-scrollbar">
    {!hasStarted ? (
	    <div className="max-w-5xl mx-auto p-6 pb-28 space-y-5">
        {/* ── Page header ── */}
		<header className="mb-8">
		  <div className="flex items-center gap-3 mb-2">
			<div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
			  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
				ACTIVE_SESSION
			  </div>
			<div className="p-2 bg-red-900/30 rounded-lg border border-red-500/50">
			 <BarChart2 className="text-red-500" size={24} />
			  </div>
			  <h1 className="text-xl font-bold text-white tracking-tight uppercase">Bulk Decline Curve Analysis (DCA) · Estimated Ultimate Recovery (EUR)</h1>
			</div>
			<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
				bg-petroleum-900 border border-petroleum-700 text-xs text-petroleum-300 font-mono mb-2">
			  <Zap size={10} className="text-amber-400" />
			  Agent Now Using Google ADK + {modelDisplayName}
			</div>
        </header>

        {/* ── 1. Data source ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data source</span>
              <div className="flex bg-slate-100 p-0.5 rounded-xl">
                <button
                  onClick={() => { setSourceMode('upload'); setWellRecords([]); setResults(null); }}
                  className={`px-3.5 py-1.5 rounded-[10px] text-[10px] font-bold transition-all ${sourceMode === 'upload' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  CSV upload
                </button>
                <button
                  onClick={() => { setSourceMode('demo'); setWellRecords(formatForBackend(DEMO_DATA) as WellRecord[]); setResults(null); }}
                  className={`px-3.5 py-1.5 rounded-[10px] text-[10px] font-bold transition-all ${sourceMode === 'demo' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Demo dataset
                </button>
              </div>
            </div>

            {/* CSV schema hint */}
            {sourceMode === 'upload' && wellRecords.length === 0 && !isUploading && (
              <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl flex items-start gap-3 mb-4">
                <FileSpreadsheet size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-[10px] text-blue-700">
                  <p className="font-bold uppercase tracking-tight mb-0.5">Required CSV columns</p>
                  <code className="opacity-80">Field, WellName, Date (YYYY-MM-DD), OilRate</code>
                </div>
              </div>
            )}

            {/* Upload dropzone */}
            {sourceMode === 'upload' && wellRecords.length === 0 && (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50 hover:border-slate-300 transition-colors">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-blue-500" size={36} />
                    <p className="text-xs font-bold text-slate-700">Parsing CSV…</p>
                  </div>
                ) : (
                  <>
                    <FileSpreadsheet className="mx-auto text-slate-300 mb-4" size={40} />
                    <input type="file" onChange={handleFileUpload} className="hidden" id="asset-up" accept=".csv" />
                    <label htmlFor="asset-up"
                      className="bg-slate-900 text-white px-8 py-3 rounded-xl cursor-pointer hover:bg-slate-800 text-xs font-bold transition-all inline-block shadow-md">
                      Select production file
                    </label>
                    <p className="mt-3 text-[10px] text-slate-400">Volatile memory only · Zero-data-retention</p>
                  </>
                )}
              </div>
            )}

            {/* Detected info pill */}
            {wellRecords.length > 0 && (
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                <Database size={12} className="text-teal-600" />
                Detected <b className="text-slate-800">{detectedFields.length} field(s)</b> and{' '}
                <b className="text-slate-800">{detectedWells} well(s)</b>
              </div>
            )}
          </div>

          {/* Input data table — always visible once loaded */}
          {wellRecords.length > 0 && (
            <CollapsibleCard
              icon={<Database size={13} className="text-slate-500" />}
              title="Input data preview"
              defaultOpen={!results}
              count={`${detectedWells} wells`}
            >
              <InputDataTable records={wellRecords} />
            </CollapsibleCard>
          )}
        </div>

        {/* ── 2. Parameters ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Parameters</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ParamSlider
              label="Econ. limit" help="Terminal rate for EUR integration. Well is abandoned when rate falls below this threshold."
              value={econLimit} onChange={setEconLimit} min={10} max={300} step={5} unit=" STB/D"
            />
            <ParamSlider
              label="Abandonment buffer" help="Alert multiplier — wells within (buffer × econ limit) trigger a P&A warning."
              value={abandonmentBuffer} onChange={setAbandonmentBuffer} min={1.0} max={4.0} step={0.1} unit="×"
            />
            <ParamSlider
              label="Forecast horizon" help="Maximum forecast period. Prevents runaway hyperbolic tails for b > 1 wells."
              value={forecastHorizon} onChange={setForecastHorizon} min={5} max={40} step={5} unit=" yr"
            />
          </div>
        </div>

        {/* ── 3. Run button ── */}
        {wellRecords.length > 0 && !results && (
          <button
            disabled={isAnalyzing}
            onClick={runAnalysis}
            className="w-full bg-emerald-600 text-white p-4.5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 text-sm"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
            {isAnalyzing ? 'ADK engine computing…' : 'Run Arps DCA analysis'}
          </button>
        )}

        {/* Re-run button (after results) */}
        {results && (
          <button
            disabled={isAnalyzing}
            onClick={runAnalysis}
            className="w-full bg-white border border-slate-200 text-slate-700 p-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 text-xs"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={15} /> : <Play size={15} />}
            {isAnalyzing ? 'Re-computing…' : 'Re-run analysis'}
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex gap-3 items-center">
            <AlertTriangle size={18} />
            <span className="text-xs font-bold">{error}</span>
          </div>
        )}
		
		{results && (
		  <AgentActionBanner 
			title="DCA Analysis Complete"
			description="Translate physics results into a Reserves Statement?"
			icon={BarChart2}
			buttonText="PREPARE RESERVES REPORT"
			onAction={() => sendMessage("DCA results are ready. Use the reporting specialist to create an SPE-PRMS reserves statement.", 'asset')}
			isLoading={loading}
			color="emerald"
		  />
		)}

        {/* ── 4. RESULTS ── */}
         {results && (
			<div className="space-y-5">

			  {/* Results table */}
			  <CollapsibleCard
				icon={<BarChart3 size={13} className="text-slate-500" />}
				title="Well results"
				count={`${filter.selected.length} / ${filter.allNames.length} wells`}
				controls={
				  <WellFilterBar
					allNames={filter.allNames}
					selected={filter.selected}
					onToggle={filter.toggleWell}
					onSelectAll={filter.selectAll}
				  />
				}
			  >
				<ResultsTable wells={filter.filtered} />
			  </CollapsibleCard>

			  {/* Rate forecast */}
			  <CollapsibleCard
				icon={<TrendingDown size={13} className="text-slate-500" />}
				title="Rate forecast to economic limit"
				count={`${filter.selected.length} wells`}
				controls={
				  <WellFilterBar
					allNames={filter.allNames}
					selected={filter.selected}
					onToggle={filter.toggleWell}
					onSelectAll={filter.selectAll}
				  />
				}
			  >
				<RateForecastChart wells={filter.filtered} econLimit={econLimit} forecastHorizon={forecastHorizon} />
			  </CollapsibleCard>

			  {/* EUR bar */}
			  <CollapsibleCard
				icon={<BarChart3 size={13} className="text-slate-500" />}
				title="EUR summary by well"
				count={`${filter.selected.length} wells`}
				controls={
				  <WellFilterBar
					allNames={filter.allNames}
					selected={filter.selected}
					onToggle={filter.toggleWell}
					onSelectAll={filter.selectAll}
				  />
				}
			  >
				<EURBarChart wells={filter.filtered} econLimit={econLimit} forecastHorizon={forecastHorizon} />
			  </CollapsibleCard>

			  {/* Cumulative area */}
			  <CollapsibleCard
				icon={<Layers size={13} className="text-slate-500" />}
				title="Field cumulative production forecast"
				controls={
				  <WellFilterBar
					allNames={filter.allNames}
					selected={filter.selected}
					onToggle={filter.toggleWell}
					onSelectAll={filter.selectAll}
				  />
				}
			  >
				<CumulativeAreaChart wells={filter.filtered} econLimit={econLimit} forecastHorizon={forecastHorizon} />
			  </CollapsibleCard>

			  {/* Decline risk — scatter always benefits from seeing all wells */}
			  <CollapsibleCard
				icon={<ShieldAlert size={13} className="text-slate-500" />}
				title="Decline risk matrix"
				count={`${filter.selected.length} wells`}
				controls={
				  <WellFilterBar
					allNames={filter.allNames}
					selected={filter.selected}
					onToggle={filter.toggleWell}
					onSelectAll={filter.selectAll}
				  />
				}
			  >
				<DeclineRiskChart wells={filter.filtered} />
			  </CollapsibleCard>

			  {/* Abandonment gauges */}
			  <CollapsibleCard
				icon={<Clock size={13} className="text-slate-500" />}
				title="Time to abandonment"
				controls={
				  <WellFilterBar
					allNames={filter.allNames}
					selected={filter.selected}
					onToggle={filter.toggleWell}
					onSelectAll={filter.selectAll}
				  />
				}
			  >
				<AbandonmentGauges
				  wells={filter.filtered}
				  econLimit={econLimit}
				  abandonmentBuffer={abandonmentBuffer}
				  forecastHorizon={forecastHorizon}
				/>
			  </CollapsibleCard>

			</div>
		  )}

        {/* ── 5. Theory & references ── */}
        <CollapsibleCard
          icon={<BookOpen size={13} className="text-slate-500" />}
          title="Arps theory & SPE-PRMS guidance"
          defaultOpen={false}
        >
          <div className="p-5 text-[11px] text-slate-600 space-y-4 leading-relaxed">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-900 mb-2">Mathematical formulation (Arps, 1945)</p>
              <p className="font-mono text-blue-800 text-[12px]">q(t) = qᵢ / (1 + b · Dᵢ · t)^(1/b)</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-[10px]">
                {[
                  { p: 'qᵢ', m: 'Initial rate (t = 0)', r: 'Field-dependent' },
                  { p: 'Dᵢ', m: 'Nominal decline rate', r: '0.05 – 0.50 /yr' },
                  { p: 'b', m: 'Arps b-factor', r: '0 = exp · 1 = harmonic' },
                ].map(row => (
                  <div key={row.p} className="bg-white rounded-lg p-2.5 border border-slate-100">
                    <div className="font-bold text-slate-800 font-mono text-[13px]">{row.p}</div>
                    <div className="text-slate-500 mt-0.5">{row.m}</div>
                    <div className="text-blue-600 font-mono mt-0.5">{row.r}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {[
                { b: 'b = 0', label: 'Exponential', desc: 'Constant fractional decline — most conservative. SPE-PRMS preferred for proved reserves (1P) booking.' },
                { b: '0 < b < 1', label: 'Hyperbolic', desc: 'Most common in conventional reservoirs with partial pressure support.' },
                { b: 'b = 1', label: 'Harmonic', desc: 'Strong aquifer support or gravity drainage regime.' },
                { b: 'b > 1.0', label: 'Transient / anomalous', desc: 'Tight/shale transient flow or data quality issue. Apply terminal exponential switch before booking reserves.', warn: true },
              ].map(item => (
                <div key={item.b} className={`flex gap-3 p-3 rounded-xl border ${item.warn ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                  <code className={`text-[10px] font-bold shrink-0 ${item.warn ? 'text-amber-700' : 'text-blue-700'}`}>{item.b}</code>
                  <div>
                    <span className="font-bold">{item.label} — </span>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-500 uppercase tracking-widest text-[9px] mb-2">References</p>
              <p>Arps, J.J. (1945). Analysis of Decline Curves. <i>Trans. AIME</i>, 160, 228–247.</p>
              <p>SPE-PRMS (2018) §3.4 — Decline curve analysis for reserves estimation.</p>
              <p>Lee & Wattenbarger (1996). Gas Reservoir Engineering. SPE Textbook Vol. 5, Ch. 8.</p>
            </div>
          </div>
        </CollapsibleCard>

        {/* ── 6. AI Asset Advisor (bottom) ── */}
        {results && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">AI asset advisor</p>

            {/* Anomaly warnings */}
            {activeWells.filter(w => w.b_factor > 1).map(w => (
              <div key={w.well_name} className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3 text-[11px] text-amber-800">
                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                <span>
                  <b>{w.well_name}</b> ({w.field ?? 'DEMO-FIELD'}): b = {w.b_factor.toFixed(3)} &gt; 1.0 — transient flow, natural fractures, or pressure support. Recommend aquifer/pressure review before sanctioning reserves.
                </span>
              </div>
            ))}

            {activeWells.every(w => w.b_factor <= 1) && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-3 text-[11px] text-emerald-700">
                <CheckCircle2 size={14} />
                No b-factor anomalies detected. All wells within SPE-PRMS conventional range.
              </div>
            )}

            <button
              onClick={handleAIAdvisor}
              className="w-full bg-violet-600 text-white rounded-xl p-4 flex items-center justify-center gap-3 hover:bg-violet-700 transition-all shadow-md text-sm font-bold"
			  disabled={loading}
            >
              <Bot size={18} />
			  {loading ? "ANALYSING ASSET RESULTS..." : "CONSULT AI ADVISOR"}
            </button>
            <p className="text-[9px] text-slate-400 text-center mt-2 font-mono">
              ExzingReservoirAgent is an AI-powered technical consultant. Verify all outputs before use.
            </p>
          </div>
        )}

      </div> 
	 ) : (
	  <div className="flex-1">
          <AgentChatPanel isVisible={true} />
      </div>
	 )}
    </div>
  );
}