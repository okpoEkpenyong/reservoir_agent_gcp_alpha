import React from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface AgentActionBannerProps {
  title: string;
  description: string;
  icon: LucideIcon;
  buttonText: string;
  onAction: () => void;
  isLoading?: boolean;
  color?: 'violet' | 'emerald' | 'blue'; // Restrict colors to these three keys
}

export function AgentActionBanner({
  title,
  description,
  icon: Icon,
  buttonText,
  onAction,
  isLoading,
  color = 'violet'
}: AgentActionBannerProps) { // <--- Added the Interface here

  // We explicitly type the keys so TypeScript knows we can only use violet, emerald, or blue
  const colorClasses: Record<'violet' | 'emerald' | 'blue', string> = {
    violet: 'border-violet-500/30 from-violet-900/20 to-petroleum-950 text-violet-400 bg-violet-600 hover:bg-violet-500 shadow-violet-900/20',
    emerald: 'border-emerald-500/30 from-emerald-900/20 to-petroleum-950 text-emerald-400 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20',
    blue: 'border-blue-500/30 from-blue-900/20 to-petroleum-950 text-blue-400 bg-blue-600 hover:bg-blue-500 shadow-blue-900/20',
  };

  const selectedColor = colorClasses[color];
  const classParts = selectedColor.split(' ');

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={`bg-gradient-to-br border p-4 rounded-2xl shadow-2xl backdrop-blur-md ${classParts[0]} ${classParts[1]}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-opacity-20 ${classParts[1]}`}>
              <Icon className={classParts[2]} size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-tight">{title}</h4>
              <p className="text-[10px] text-petroleum-400 font-mono">{description}</p>
            </div>
          </div>
          
          <button 
            onClick={onAction}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 text-white text-[11px] font-bold rounded-xl transition-all shadow-lg group disabled:opacity-50 ${classParts[3]} ${classParts[4]} ${classParts[6]}`}
          >
            {isLoading ? "PROCESSING..." : buttonText}
            {!isLoading && <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
          </button>
        </div>
      </div>
    </div>
  );
}