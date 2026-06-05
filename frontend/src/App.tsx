import { Routes, Route , useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { AssetPage } from './pages/AssetPage'
import { AgentChatPanel } from './components/layout/AgentChatPanel'
import { LandingPage } from './pages/LandingPage'
import { DebugPage } from './pages/DebugPage'
import { RelPermPage } from './pages/RelPermPage'
import { useChat } from './context/ChatContext'
import { AssetProvider } from './context/AssetContext'; 
import { DebugProvider } from './context/DebugContext';

export default function App() {
  const { messages, clearChat, selectedModel, setSelectedModel } = useChat()
  const isSessionActive = messages.length > 0;

  return (
  <AssetProvider>
  <DebugProvider>
    <div className="flex h-screen overflow-hidden bg-blue-50 text-petroleum-100">
      <Sidebar 
        onClear={clearChat} 
        selectedModel={selectedModel} 
        onModelChange={setSelectedModel} 
      />
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/*" element={<LandingPage />} />
			<Route path="/asset" element={<AssetPage />} />
			<Route path="/debug" element={<DebugPage />} /> 
            <Route path="/relperm" element={<RelPermPage />} />
			<Route path="/audit" element={<div className="p-10">Governance View</div>} />
			<Route path="/*" element={<Navigate to="/" />} />
          </Routes>
        </main>
		
		{/* PERSISTENT CHAT PANEL: Appears across all pages */}
        
      </div>
    </div>
	</DebugProvider>
   </AssetProvider>	
  )
}
