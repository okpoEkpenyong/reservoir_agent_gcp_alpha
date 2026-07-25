import React, { useState } from 'react'
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle";
import { Routes, Route , useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { AssetPage } from './pages/AssetPage'
import { LandingPage } from './pages/LandingPage'
import { DebugPage } from './pages/DebugPage'
import { RelPermPage } from './pages/RelPermPage'
import { FeedbackPage } from './pages/FeedbackPage'
import { GovernanceAuditPage } from './pages/GovernanceAuditPage'
import { FlareMonitorPage } from './pages/FlareMonitorPage'
import { useChat } from './context/ChatContext'
import { AssetProvider } from './context/AssetContext'; 
import { DebugProvider } from './context/DebugContext';
import { MessageProvider } from "./context/MessageContext";
import Navbar from "./components/navbars/Navbar";


export default function App() {
  const { messagesByPage, clearChat, selectedModel, setSelectedModel } = useChat()
  //const isSessionActive = messagesByPage.length > 0;
  const isSessionActive = Object.values(messagesByPage).some(msgs => msgs.length > 0);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const location = useLocation()

  // Don't show sidebar/header on the landing page — it has its own full-screen layout
  const isLanding = location.pathname === '/' || location.pathname === '/chat'
  
  if (isLanding) {
    return (
      <div className="h-screen overflow-hidden bg-petroleum-950">
	   	<Navbar />
        <Routes>
          <Route path="/*" element={<LandingPage />} />
        </Routes>
	    <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />
      </div>
    )
  }
  
  return (
    <AssetProvider>
      <DebugProvider>
	   <MessageProvider>
        <div className="flex h-screen overflow-hidden bg-blue-50">
          
          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar — hidden on mobile unless open */}
          <div className={`
            fixed lg:relative z-30 h-full transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <Sidebar onClear={clearChat} selectedModel={selectedModel} onModelChange={setSelectedModel} />
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            {/* Mobile top bar */}
            <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
              <button onClick={() => setSidebarOpen(o => !o)} className="p-2 rounded-lg hover:bg-slate-100">
                <Header
				  sidebarOpen={sidebarOpen}
				  onToggleSidebar={() => setSidebarOpen(o => o)}
				/>
              </button>
              <span className="text-sm font-bold text-slate-800">Subsurface Intelligent Agent</span>
            </div>

            <main className="flex-1 overflow-hidden">
              <Routes>
                <Route path="/*" element={<LandingPage />} />
                <Route path="/asset" element={<AssetPage />} />
                <Route path="/debug" element={<DebugPage />} />
                <Route path="/relperm" element={<RelPermPage />} />
				<Route path="/flare" element={<FlareMonitorPage />} />
				<Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/audit" element={<GovernanceAuditPage />} />
              </Routes>
            </main>
          </div>
        </div>
	   </MessageProvider>
      </DebugProvider>
    </AssetProvider>
  );
}
