import { useState, useEffect, useRef } from "react";

const GITHUB_USER = "jessic003";
const GITHUB_REPO = "my-creativebuild-app";
const CLOUDFLARE_URL = "https://my-creativebuild-app.pages.dev";
const PROXY_URL = "https://creativebuild-proxy.jessic003.workers.dev";
const HISTORY_KEY = "creativebuild_prompt_history";

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

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}

function getFileIcon(path) {
  if (path.endsWith(".jsx") || path.endsWith(".js") || path.endsWith(".tsx") || path.endsWith(".ts")) return "⚛";
  if (path.endsWith(".css")) return "🎨";
  if (path.endsWith(".json")) return "{}";
  if (path.endsWith(".md")) return "📝";
  if (path.endsWith(".html")) return "🌐";
  if (path.endsWith(".svg")) return "🖼";
  return "📄";
}

export default function Dashboard() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your CreativeBuild AI assistant. Tell me what you want to build and I'll write the code for you!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [repoFiles, setRepoFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("history");
  const [history, setHistory] = useState(loadHistory);
  const [showPreview, setShowPreview] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [iframeKey, setIframeKey] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/git/trees/main?recursive=1`)
      .then(r => r.json())
      .then(data => {
        if (data.tree) {
          const filtered = data.tree
            .filter(f => f.type === "blob" && !f.path.startsWith("node_modules") && !f.path.includes(".git"))
            .slice(0, 40);
          setRepoFiles(filtered);
        }
        setFilesLoading(false);
      })
      .catch(() => setFilesLoading(false));
  }, []);

  const handleFileAttach = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const base64 = dataUrl.split(",")[1];
        setAttachments(prev => [...prev, { name: file.name, type: file.type, base64, dataUrl }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || loading) return;
    const userText = input.trim();
    setInput("");

    if (userText) {
      const newHistory = [userText, ...history.filter(h => h !== userText)].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    }

    let userContent;
    if (attachments.length > 0) {
      userContent = [];
      attachments.forEach(att => {
        if (att.type.startsWith("image/")) {
          userContent.push({ type: "image", source: { type: "base64", media_type: att.type, data: att.base64 } });
        } else if (att.type === "application/pdf") {
          userContent.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: att.base64 } });
        }
      });
      if (userText) userContent.push({ type: "text", text: userText });
    } else {
      userContent = userText;
    }

    const userMsg = {
      role: "user",
      content: userContent,
      _display: userText || "📎 File attached",
      _attachments: attachments.map(a => ({ name: a.name, type: a.type, dataUrl: a.dataUrl }))
    };
    setAttachments([]);

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4096, system: SYSTEM_PROMPT, messages: apiMessages })
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

  const newChat = () => {
    setMessages([{ role: "assistant", content: "Hi! I'm your CreativeBuild AI assistant. Tell me what you want to build and I'll write the code for you!" }]);
    setInput("");
    setAttachments([]);
  };

  const canSend = (input.trim() || attachments.length > 0) && !loading;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0f1117", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#e2e8f0", overflow: "hidden" }}>

      {/* ── Top Bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "52px", borderBottom: "1px solid #1e2433", background: "#0a0d13", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "15px", color: "#fff", flexShrink: 0, letterSpacing: "-0.02em" }}>C</div>
          <span style={{ fontWeight: "700", fontSize: "15px", color: "#f1f5f9", letterSpacing: "-0.02em" }}>CreativeBuild</span>
          <span style={{ fontSize: "11px", color: "#6366f1", padding: "3px 10px", background: "rgba(99,102,241,0.1)", borderRadius: "20px", border: "1px solid rgba(99,102,241,0.2)", fontWeight: "600" }}>my-creativebuild-app</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <a href={`https://github.com/${GITHUB_USER}/${GITHUB_REPO}`} target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "5px 12px", borderRadius: "7px", background: "#1a1f2e", color: "#94a3b8", textDecoration: "none", border: "1px solid #2d3748", fontWeight: "500", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#252b3b"; e.currentTarget.style.color = "#e2e8f0"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#1a1f2e"; e.currentTarget.style.color = "#94a3b8"; }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            GitHub
          </a>
          <button onClick={() => setShowPreview(v => !v)}
            style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "7px", background: showPreview ? "rgba(99,102,241,0.12)" : "#1a1f2e", color: showPreview ? "#6366f1" : "#94a3b8", border: `1px solid ${showPreview ? "rgba(99,102,241,0.25)" : "#2d3748"}`, cursor: "pointer", fontWeight: "500", transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left Sidebar ── */}
        <div style={{ width: "200px", borderRight: "1px solid #1e2433", display: "flex", flexDirection: "column", flexShrink: 0, background: "#0a0d13" }}>

          <div style={{ padding: "12px 10px 10px" }}>
            <button onClick={newChat}
              style={{ width: "100%", padding: "8px 12px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.01em", transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              + New Chat
            </button>
          </div>

          <div style={{ display: "flex", borderBottom: "1px solid #1e2433" }}>
            {[["history", "History"], ["files", "Files"]].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ flex: 1, padding: "8px 0", fontSize: "10px", fontWeight: "600", background: "none", border: "none", cursor: "pointer", color: activeTab === tab ? "#6366f1" : "#475569", borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent", transition: "color 0.15s", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
            {activeTab === "history" && (
              history.length === 0
                ? <div style={{ padding: "20px 12px", fontSize: "11px", color: "#334155", textAlign: "center", lineHeight: 1.6 }}>No history yet.<br/>Start chatting!</div>
                : history.map((h, i) => (
                  <button key={i} onClick={() => setInput(h)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 12px", background: "none", border: "none", cursor: "pointer", color: "#566070", fontSize: "11px", lineHeight: "1.45", transition: "all 0.1s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#12161e"; e.currentTarget.style.color = "#94a3b8"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#566070"; }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>↩ {h}</div>
                  </button>
                ))
            )}

            {activeTab === "files" && (
              filesLoading
                ? <div style={{ padding: "20px 12px", fontSize: "11px", color: "#334155", textAlign: "center" }}>Loading...</div>
                : repoFiles.length === 0
                  ? <div style={{ padding: "20px 12px", fontSize: "11px", color: "#334155", textAlign: "center" }}>No files found</div>
                  : repoFiles.map(file => (
                    <a key={file.path} href={`https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/main/${file.path}`} target="_blank" rel="noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", textDecoration: "none", color: "#566070", fontSize: "11px", transition: "all 0.1s", lineHeight: 1.4 }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#12161e"; e.currentTarget.style.color = "#94a3b8"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#566070"; }}>
                      <span style={{ flexShrink: 0 }}>{getFileIcon(file.path)}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.path.split("/").pop()}</span>
                    </a>
                  ))
            )}
          </div>

          <div style={{ padding: "10px 12px", borderTop: "1px solid #1e2433" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", color: "#3d4f3d", fontSize: "11px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", flexShrink: 0, boxShadow: "0 0 5px rgba(34,197,94,0.6)" }}></div>
              Live on Cloudflare
            </div>
          </div>
        </div>

        {/* ── Middle Chat Panel ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0f1117", minWidth: 0 }}>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: "18px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: msg.role === "user" ? "#6366f1" : "#1e2433", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", flexShrink: 0, border: "1px solid #2d3748", color: msg.role === "user" ? "#fff" : "#6366f1", letterSpacing: "0.02em" }}>
                  {msg.role === "user" ? "YOU" : "AI"}
                </div>
                <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: "6px", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg._attachments?.map((att, ai) => (
                    att.type.startsWith("image/")
                      ? <img key={ai} src={att.dataUrl} alt={att.name} style={{ maxWidth: "220px", maxHeight: "160px", borderRadius: "10px", border: "1px solid #2d3748", objectFit: "cover" }} />
                      : <div key={ai} style={{ fontSize: "11px", padding: "5px 10px", background: "#1a1f2e", borderRadius: "6px", border: "1px solid #2d3748", color: "#94a3b8" }}>📄 {att.name}</div>
                  ))}
                  {(typeof msg.content === "string" ? msg.content : msg._display) && (
                    <div style={{ padding: "11px 15px", borderRadius: msg.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px", background: msg.role === "user" ? "#6366f1" : "#1a1f2e", fontSize: "13px", lineHeight: "1.7", color: msg.role === "user" ? "#fff" : "#cbd5e1", border: msg.role === "user" ? "none" : "1px solid #1e2433", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {typeof msg.content === "string" ? msg.content : msg._display}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#1e2433", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", border: "1px solid #2d3748", color: "#6366f1", flexShrink: 0 }}>AI</div>
                <div style={{ padding: "13px 16px", borderRadius: "4px 14px 14px 14px", background: "#1a1f2e", border: "1px solid #1e2433", display: "flex", gap: "5px", alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366f1", animation: "dotPulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.18}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div style={{ padding: "8px 20px 0", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {attachments.map((att, i) => (
                <div key={i} style={{ position: "relative" }}>
                  {att.type.startsWith("image/")
                    ? <img src={att.dataUrl} alt={att.name} style={{ width: "58px", height: "58px", objectFit: "cover", borderRadius: "8px", border: "1px solid #2d3748", display: "block" }} />
                    : <div style={{ width: "58px", height: "58px", borderRadius: "8px", border: "1px solid #2d3748", background: "#1a1f2e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                        <span style={{ fontSize: "20px" }}>📄</span>
                        <span style={{ fontSize: "9px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "52px", textAlign: "center" }}>{att.name.split(".").pop().toUpperCase()}</span>
                      </div>
                  }
                  <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                    style={{ position: "absolute", top: "-5px", right: "-5px", width: "16px", height: "16px", borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", color: "#fff", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div style={{ padding: "12px 20px 16px", borderTop: "1px solid #1e2433", background: "#0a0d13" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", background: "#1a1f2e", borderRadius: "12px", border: "1px solid #2d3748", padding: "8px 10px 8px 12px", transition: "border-color 0.2s" }}
              onFocusCapture={e => e.currentTarget.style.borderColor = "#6366f1"}
              onBlurCapture={e => e.currentTarget.style.borderColor = "#2d3748"}>
              <input type="file" ref={fileInputRef} onChange={handleFileAttach} accept="image/*,.pdf" multiple style={{ display: "none" }} />
              <button onClick={() => fileInputRef.current?.click()}
                style={{ width: "30px", height: "30px", borderRadius: "7px", background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "color 0.15s", padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = "#6366f1"}
                onMouseLeave={e => e.currentTarget.style.color = "#475569"}
                title="Attach image or PDF">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Tell me what to build..."
                rows={1}
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: "13px", resize: "none", lineHeight: "1.55", fontFamily: "inherit", minHeight: "22px", maxHeight: "120px", paddingTop: "4px" }}
              />
              <button onClick={sendMessage} disabled={!canSend}
                style={{ width: "32px", height: "32px", borderRadius: "8px", background: canSend ? "#6366f1" : "#161b27", border: "none", cursor: canSend ? "pointer" : "default", color: canSend ? "#fff" : "#2d3748", fontSize: "17px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s, color 0.15s", fontWeight: "bold" }}>
                ↑
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Preview Panel ── */}
        {showPreview && (
          <div style={{ width: "400px", borderLeft: "1px solid #1e2433", display: "flex", flexDirection: "column", flexShrink: 0, background: "#0a0d13" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", height: "44px", borderBottom: "1px solid #1e2433", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "600", color: "#7a8a9a", letterSpacing: "0.02em" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px rgba(34,197,94,0.55)", flexShrink: 0 }} />
                Live Preview
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => setIframeKey(k => k + 1)}
                  style={{ padding: "4px 10px", fontSize: "11px", borderRadius: "6px", background: "#1a1f2e", border: "1px solid #2d3748", color: "#64748b", cursor: "pointer", fontWeight: "500", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "#252b3b"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "#1a1f2e"; }}>
                  ↺ Refresh
                </button>
                <a href={CLOUDFLARE_URL} target="_blank" rel="noreferrer"
                  style={{ padding: "4px 10px", fontSize: "11px", borderRadius: "6px", background: "#1a1f2e", border: "1px solid #2d3748", color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center", fontWeight: "500", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "#252b3b"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "#1a1f2e"; }}>
                  ↗ Open
                </a>
              </div>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <iframe
                key={iframeKey}
                src={CLOUDFLARE_URL}
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                title="Live Preview"
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.25; transform: scale(0.75); }
          50% { opacity: 1; transform: scale(1); }
        }
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2433; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #2d3748; }
        textarea::placeholder { color: #374151; }
      `}</style>
    </div>
  );
}
