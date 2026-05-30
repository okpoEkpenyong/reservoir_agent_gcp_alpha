import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { ChatPage } from './pages/ChatPage'
import { useChat } from './hooks/useChat'

export default function App() {
  const { clearChat } = useChat()
  return (
    <div className="flex h-screen overflow-hidden bg-petroleum-950 text-petroleum-100">
      <Sidebar onClear={clearChat} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/*" element={<ChatPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
