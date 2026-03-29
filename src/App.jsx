import { useState, useEffect, useRef } from "react";

const GITHUB_USER = "jessic003";
const GITHUB_REPO = "my-creativebuild-app";
const CLOUDFLARE_URL = "https://my-creativebuild-app.pages.dev";

const SYSTEM_PROMPT = `You are CreativeBuild AI, a coding assistant helping build and improve a React + Vite web app called "my-creativebuild-app".

The project uses:
- React + Vite
- Tailwind CSS
- Deployed on Cloudflare Pages via GitHub

When the user asks you to build or change something:
1. Explain clearly what code changes to make
2. Show the exact code they need
3. Tell them which file to put it in
4. Remind them to save and push to GitHub when done

Be friendly, clear, and explain things simply. The user is learning.`;

export default function Dashboard() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your CreativeBuild AI assistant. Tell me what you want to build and I'll write the code for you! 🚀" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setFiles(data);
        setFilesLoading(false);
      })
      .catch(() => setFilesLoading(false));
  }, []);

  const getFileIcon = (file) => {
    if (file.type === "dir") return "📁";
    if (file.name.endsWith(".jsx") || file.name.endsWith(".js")) return "⚛";
    if (file.name.endsWith(".css")) return "🎨";
    if (file.name.endsWith(".json")) return "{}";
    if (file.name.endsWith(".md")) return "📝";
    if (file.name.endsWith(".html")) return "🌐";
    return "📄";
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setHistory(h => [userMsg, ...h]);
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages
        })
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "Sorry, something went wrong. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "600px", background: "#0f1117", borderRadius: "12px", overflow: "hidden", fontFamily: "ui-monospace, 'Cascadia Code', monospace", color: "#e2e8f0" }}>

      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: "52px", borderBottom: "1px solid #1e2433", background: "#0a0d13", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>C</div>
          <span style={{ fontWeight: "600", fontSize: "14px", color: "#f1f5f9" }}>CreativeBuild</span>
          <span style={{ fontSize: "12px", color: "#475569", padding: "2px 8px", background: "#1e2433", borderRadius: "6px" }}>my-creativebuild-app</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <a href={`https://github.com/${GITHUB_USER}/${GITHUB_REPO}`} target="_blank" rel="noreferrer"
            style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "6px", background: "#1e2433", color: "#94a3b8", textDecoration: "none", border: "1px solid #2d3748" }}>
            GitHub
          </a>
          <a href={CLOUDFLARE_URL} target="_blank" rel="noreferrer"
            style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "6px", background: "#6366f1", color: "#fff", textDecoration: "none", fontWeight: "500" }}>
            Live Preview ↗
          </a>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left Sidebar */}
        <div style={{ width: "200px", borderRight: "1px solid #1e2433", display: "flex", flexDirection: "column", flexShrink: 0, background: "#0a0d13" }}>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #1e2433" }}>
            {["files", "history"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ flex: 1, padding: "10px 0", fontSize: "11px", fontWeight: "500", background: "none", border: "none", cursor: "pointer", color: activeTab === tab ? "#6366f1" : "#475569", borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent", transition: "color 0.15s", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {activeTab === "files" && (
              <>
                {filesLoading ? (
                  <div style={{ padding: "12px 16px", fontSize: "12px", color: "#475569" }}>Loading files...</div>
                ) : files.length === 0 ? (
                  <div style={{ padding: "12px 16px", fontSize: "12px", color: "#475569" }}>No files found</div>
                ) : files.map(file => (
                  <a key={file.name} href={`https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/main/${file.path}`} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "7px", padding: "6px 14px", textDecoration: "none", color: "#94a3b8", fontSize: "12px", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#1a1f2e"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <span style={{ fontSize: "12px" }}>{getFileIcon(file)}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                  </a>
                ))}
              </>
            )}

            {activeTab === "history" && (
              <>
                {history.length === 0 ? (
                  <div style={{ padding: "12px 16px", fontSize: "12px", color: "#475569" }}>No prompts yet</div>
                ) : history.map((h, i) => (
                  <button key={i} onClick={() => setInput(h)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "11px", lineHeight: "1.4", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#1a1f2e"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h}</div>
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Cloudflare status */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid #1e2433", fontSize: "11px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", flexShrink: 0 }}></div>
              Deployed on Cloudflare
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: msg.role === "user" ? "#6366f1" : "#1e2433", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, border: "1px solid #2d3748" }}>
                  {msg.role === "user" ? "U" : "C"}
                </div>
                <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px", background: msg.role === "user" ? "#6366f1" : "#1a1f2e", fontSize: "13px", lineHeight: "1.6", color: msg.role === "user" ? "#fff" : "#cbd5e1", border: msg.role === "user" ? "none" : "1px solid #1e2433", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#1e2433", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", border: "1px solid #2d3748" }}>C</div>
                <div style={{ padding: "10px 14px", borderRadius: "4px 12px 12px 12px", background: "#1a1f2e", border: "1px solid #1e2433", display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1", animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }}></div>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #1e2433", background: "#0a0d13" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", background: "#1a1f2e", borderRadius: "10px", border: "1px solid #2d3748", padding: "8px 12px" }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder="Tell me what to build... (Enter to send)"
                rows={1}
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: "13px", resize: "none", lineHeight: "1.5", fontFamily: "inherit", minHeight: "20px", maxHeight: "80px" }} />
              <button onClick={sendMessage} disabled={!input.trim() || loading}
                style={{ width: "32px", height: "32px", borderRadius: "8px", background: input.trim() && !loading ? "#6366f1" : "#1e2433", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", color: "#fff", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
                ↑
              </button>
            </div>
            <div style={{ fontSize: "10px", color: "#334155", textAlign: "center", marginTop: "6px" }}>
              Powered by Claude · Deployed to {CLOUDFLARE_URL}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
