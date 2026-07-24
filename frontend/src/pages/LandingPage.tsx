// src/pages/LandingPage.tsx
import { useNavigate } from 'react-router-dom';
import { Zap, Shield } from 'lucide-react'; 
import { PromptSuggestions } from '../components/ui/PromptSuggestions';
import { useChat } from '../context/ChatContext';


export function LandingPage() {
  const navigate = useNavigate();
    const { 
    selectedModel, 
  } = useChat();


  // Safety check for the model name to prevent "split" crashes
  const modelDisplayName = selectedModel ? selectedModel.split(/[-( ]/)[0].toUpperCase() : 'AI'


  return (
    <div className="relative h-full flex flex-col items-center justify-center p-6 overflow-hidden bg-petroleum-900">
      {/* Background Animation: Animated Topographic Mesh */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#4f46e5_0%,transparent_50%)] animate-pulse" />
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 50 Q 25 45 50 50 T 100 50" fill="none" stroke="#6366f1" strokeWidth="0.1" className="animate-dash" />
          <path d="M0 60 Q 25 55 50 60 T 100 60" fill="none" stroke="#6366f1" strokeWidth="0.1" className="animate-dash-slow" />
        </svg>
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-4xl">
        <div className="space-y-4">
		  <h1 className="text-5xl font-display font-bold text-white tracking-tight">
            Exzing <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">Orchestrator</span>
          </h1>
            <h1 className="font-display text-3xl font-bold text-white leading-tight">
               Reservoir Intelligence<br />
            <span className="text-petroleum-400">at your fingertips</span>
            </h1>
        </div>

        {/* Suggestions only trigger navigation now */}
		<PromptSuggestions onSelect={(path) => navigate(path)} />
      </div>
    </div>
  )
}