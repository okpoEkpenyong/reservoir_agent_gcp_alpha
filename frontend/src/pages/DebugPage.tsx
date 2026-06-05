import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Message } from '../types'
import { useChat } from '../context/ChatContext';
import { MessageBubble } from '../components/ui/MessageBubble';
import { Zap, Cpu, Code, AlertCircle, Play, FileCode, Terminal } from 'lucide-react';
import { AgentChatPanel } from '../components/layout/AgentChatPanel'
import { useDebug } from '../context/DebugContext';


// --- DEFAULT TEST DATA (Matches your Streamlit placeholder spirit) ---
const EXAMPLE_DECK = `-- TEST_CASE: INCORRECT KEYWORD SYNTAX
SCHEDULE
WELSPECZ
 'PROD_01' 'G1' 15 25 1500 'OIL' /
/`;

const EXAMPLE_ERROR = `-- SIMULATOR LOG OUTPUT
@ ERROR: KEYWORD 'WELSPECZ' NOT RECOGNIZED.
@ LOCATION: SECTION 'SCHEDULE', LINE 442.
@ THE SIMULATOR WILL NOW TERMINATE.`;

export function DebugPage() {
  const { deck, setDeck, errorLog, setErrorLog, deckSource, setDeckSource, errorSource, setErrorSource } = useDebug();	
  const { sendMessage, messages, loading, selectedModel } = useChat();
  //const [deck, setDeck] = useState("");
  //const [errorLog, setErrorLog] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // Toggle states for the "Radio" behavior
  //const [deckSource, setDeckSource] = useState<'custom' | 'example'>('custom');
  //const [errorSource, setErrorSource] = useState<'custom' | 'example'>('custom');

  const hasStarted = messages.length > 0;
  const modelDisplayName = selectedModel ? selectedModel.split(/[-( ]/)[0].toUpperCase() : 'AI';

  // Handle Radio Toggles
  const toggleDeck = (type: 'custom' | 'example') => {
    setDeckSource(type);
    setDeck(type === 'example' ? EXAMPLE_DECK : "");
  };

  const toggleError = (type: 'custom' | 'example') => {
    setErrorSource(type);
    setErrorLog(type === 'example' ? EXAMPLE_ERROR : "");
  };

  const handleRunDiagnosis = async () => {
    if (!deck.trim() || !errorLog.trim()) {
      setLocalError("Both the .DATA snippet and the Error Log are required.");
      return;
    }
    setLocalError(null);
    const fullPrompt = `TECHNICAL DIAGNOSIS REQUEST:
--- ECLIPSE DECK SNIPPET ---
${deck}
--- SIMULATOR ERROR LOG ---
${errorLog}
Please analyze the syntax, identify the specific keyword causing the crash, and provide the remediated code block.
Fixed code should be well written in normal ECLIPSE/OPM format. You can attach a button for copying`;
    await sendMessage(fullPrompt);
  };

  return (
    <div className="flex h-full bg-petroleum-950">
      {!hasStarted ? (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto max-w-4xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                ACTIVE_SESSION
              </div>
              <div className="p-2 bg-red-900/30 rounded-lg border border-red-500/50">
                <Cpu className="text-red-500" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Simulator Debugger</h1>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                bg-petroleum-900 border border-petroleum-700 text-xs text-petroleum-300 font-mono mb-2">
              <Zap size={10} className="text-amber-400" />
              Agent Now Using Google ADK + {modelDisplayName}
            </div>
          </header>

          <div className="space-y-8">
            {/* INPUT A: DECK SNIPPET */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-petroleum-400 font-mono uppercase tracking-widest flex items-center gap-2">
                  <FileCode size={12} className="text-emerald-500" /> Input A: .DATA Snippet
                </label>
                {/* RADIO TOGGLE */}
                <div className="flex bg-petroleum-900 rounded-md p-1 border border-petroleum-800">
                  <button 
                    onClick={() => toggleDeck('custom')}
                    className={`px-3 py-1 text-[10px] font-mono rounded transition-colors ${deckSource === 'custom' ? 'bg-petroleum-700 text-white' : 'text-petroleum-500 hover:text-petroleum-300'}`}
                  >Custom</button>
                  <button 
                    onClick={() => toggleDeck('example')}
                    className={`px-3 py-1 text-[10px] font-mono rounded transition-colors ${deckSource === 'example' ? 'bg-emerald-900/50 text-emerald-400' : 'text-petroleum-500 hover:text-petroleum-300'}`}
                  >Example</button>
                </div>
              </div>
              <textarea 
                className="w-full h-44 p-4 bg-petroleum-900 border border-petroleum-800 rounded-xl text-xs text-emerald-400 font-mono focus:ring-1 focus:ring-petroleum-600 outline-none"
                placeholder="-- Paste keywords here (e.g. SCHEDULE, WELSPECS)..."
                value={deck}
                onChange={(e) => { setDeck(e.target.value); setDeckSource('custom'); }}
              />
            </div>

            {/* INPUT B: ERROR LOG */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-petroleum-400 font-mono uppercase tracking-widest flex items-center gap-2">
                  <Terminal size={12} className="text-red-500" /> Input B: Simulator Error Log
                </label>
                {/* RADIO TOGGLE */}
                <div className="flex bg-petroleum-900 rounded-md p-1 border border-petroleum-800">
                  <button 
                    onClick={() => toggleError('custom')}
                    className={`px-3 py-1 text-[10px] font-mono rounded transition-colors ${errorSource === 'custom' ? 'bg-petroleum-700 text-white' : 'text-petroleum-500 hover:text-petroleum-300'}`}
                  >Custom</button>
                  <button 
                    onClick={() => toggleError('example')}
                    className={`px-3 py-1 text-[10px] font-mono rounded transition-colors ${errorSource === 'example' ? 'bg-red-900/50 text-red-400' : 'text-petroleum-500 hover:text-petroleum-300'}`}
                  >Example</button>
                </div>
              </div>
              <textarea 
                className="w-full h-44 p-4 bg-petroleum-900 border border-petroleum-800 rounded-xl text-xs text-red-400 font-mono focus:ring-1 focus:ring-petroleum-600 outline-none"
                placeholder="-- Paste the error trace from your .PRT or .LOG file..."
                value={errorLog}
                onChange={(e) => { setErrorLog(e.target.value); setErrorSource('custom'); }}
              />
            </div>

            {localError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 p-3 rounded-lg border border-red-900/50 animate-pulse">
                <AlertCircle size={14} /> {localError}
              </div>
            )}

            <button 
              onClick={handleRunDiagnosis}
              disabled={loading}
              className="group w-full py-5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 disabled:from-petroleum-800 disabled:to-petroleum-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-900/20"
            >
              <Play size={18} fill="currentColor" />
              {loading ? "ARCHITECTING REMEDIATION..." : "RUN TECHNICAL DIAGNOSIS"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <AgentChatPanel isVisible={true} />
        </div>
      )}
    </div>
  );
}


export function DebugPage_() {
  const { sendMessage, messages, loading, selectedModel } = useChat();
  const [deck, setDeck] = useState("");
  const [errorLog, setErrorLog] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // Transition state: true if we have sent the initial request
  const hasStarted = messages.length > 0;
  
   // Safety check for the model name to prevent "split" crashes
  const modelDisplayName = selectedModel ? selectedModel.split(/[-( ]/)[0].toUpperCase() : 'AI'

  const handleRunDiagnosis = async () => {
    // 1. Validation
    if (!deck.trim() || !errorLog.trim()) {
      setLocalError("Both the .DATA snippet and the Error Log are required.");
      return;
    }

    setLocalError(null);

    // 2. Format the payload for the agent
    const fullPrompt = `TECHNICAL DIAGNOSIS REQUEST:
    
--- ECLIPSE DECK SNIPPET ---
${deck}

--- SIMULATOR ERROR LOG ---
${errorLog}

Please analyze the syntax, identify the specific keyword causing the crash, and provide the remediated code block.`;

    // 3. Send to ADK Orchestrator
    await sendMessage(fullPrompt);
  };

  return (
    <div className="flex h-full bg-petroleum-950">
      {/* 
         IF NOT STARTED: Show the dual-input "Streamlit-style" UI
         IF STARTED: Deactivate/Hide input UI and show the Chat Panel
      */}
      {!hasStarted ? (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto max-w-4xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
			 <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
               <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
               ACTIVE_SESSION
            </div>
              <div className="p-2 bg-red-900/30 rounded-lg border border-red-500/50">
                <Cpu className="text-red-500" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Simulator Debugger</h1>
            </div>
			   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                bg-petroleum-900 border border-petroleum-700 text-xs text-petroleum-300 font-mono mb-2">
                <Zap size={10} className="text-amber-400" />
                 Agent Now Using Google ADK + {modelDisplayName}
              </div>
            <p className="text-sm text-petroleum-400 font-mono">
              Paste your ECLIPSE/OPM data and logs to architect a technical fix.
            </p>
          </header>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-petroleum-500 font-mono uppercase tracking-widest flex items-center gap-2">
                Input A: .DATA Snippet
              </label>
              <textarea 
                className="w-full h-48 p-4 bg-petroleum-900 border border-petroleum-800 rounded-xl text-xs text-emerald-400 font-mono focus:ring-1 focus:ring-petroleum-600 outline-none transition-all"
                placeholder="-- Paste keywords here (e.g. SCHEDULE, WELSPECS)..."
                value={deck}
                onChange={(e) => setDeck(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-petroleum-500 font-mono uppercase tracking-widest flex items-center gap-2">
                Input B: Simulator Error Log
              </label>
              <textarea 
                className="w-full h-48 p-4 bg-petroleum-900 border border-petroleum-800 rounded-xl text-xs text-red-400 font-mono focus:ring-1 focus:ring-petroleum-600 outline-none transition-all"
                placeholder="-- Paste the error trace from your .PRT or .LOG file..."
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
              />
            </div>

            {localError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 p-3 rounded-lg border border-red-900/50">
                <AlertCircle size={14} /> {localError}
              </div>
            )}

            <button 
              onClick={handleRunDiagnosis}
              disabled={loading}
              className="group w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-petroleum-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
            >
              <Play size={18} fill="currentColor" />
              {loading ? "PROCESSING DATA..." : "RUN TECHNICAL DIAGNOSIS"}
            </button>
          </div>
        </div>
      ) : (
        /* 
          Once the conversation starts, we switch to the Full-Screen Chat Panel.
          The user can now send large code snippets directly in the chat.
        */
        <div className="flex-1">
          <AgentChatPanel isVisible={true} />
        </div>
      )}
    </div>
  );
}



