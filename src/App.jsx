import { useState } from 'react'

const GITHUB_URL = 'https://github.com/jessic003/my-creativebuild-app'
const CLOUDFLARE_URL = 'https://my-creativebuild-app.pages.dev'

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! How can I help you today?' },
  ])
  const [input, setInput] = useState('')

  const sendMessage = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 flex flex-col border-r border-gray-800">
        <div className="px-5 py-6">
          <h1 className="text-lg font-bold tracking-tight text-white">CreativeBuild</h1>
          <p className="text-xs text-gray-500 mt-1">Dashboard</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <SidebarLink label="Chat" active />
          <SidebarLink label="Projects" />
          <SidebarLink label="Settings" />
        </nav>

        <div className="px-4 py-5 border-t border-gray-800 space-y-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <GitHubIcon />
            GitHub Repo
          </a>
          <a
            href={CLOUDFLARE_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <CloudIcon />
            Live Site
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300">Chat</h2>
          <span className="text-xs text-gray-500">claude-sonnet-4-6</span>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900">
          <div className="flex items-end gap-3 bg-gray-800 rounded-2xl px-4 py-3">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              className="flex-1 resize-none bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none"
            />
            <button
              onClick={sendMessage}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function SidebarLink({ label, active }) {
  return (
    <button
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-gray-800 text-white font-medium'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

function GitHubIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.467-1.332-5.467-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.51 11.51 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  )
}

export default App
