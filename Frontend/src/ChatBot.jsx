import { useState, useRef, useEffect, useCallback } from "react";
import "./ChatBot.css";
import API_URL from "./config";

// ─── Quick reply chips shown at start ───
const QUICK_REPLIES = [
  { label: "📚 Recommend a book", text: "Can you recommend me a good book?" },
  { label: "📦 What's in stock?",  text: "What books are currently in stock?" },
  { label: "💰 Cheapest books",    text: "What are your cheapest books?" },
  { label: "🔖 Fiction picks",     text: "What fiction books do you have?" },
  { label: "📦 My orders",         text: "Can you check my recent orders?" },
  { label: "🤖 AI features",       text: "What AI features does this store have?" },
];

const MAX_CHARS    = 200;
const MAX_HISTORY  = 12; // messages sent as context to Gemini

// ─── Simple Markdown → HTML renderer ───
const renderMarkdown = (text) => {
  if (!text) return "";

  // Escape HTML first
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold, italic, inline code
  html = html
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g,     "<em>$1</em>")
    .replace(/`(.*?)`/g,       "<code>$1</code>");

  // Bullet lists
  const lines = html.split("\n");
  let inList = false;
  const result = lines.map((line) => {
    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      const li = `<li>${bullet[1]}</li>`;
      if (!inList) { inList = true; return `<ul>${li}`; }
      return li;
    }
    if (inList) { inList = false; return `</ul>${line}`; }
    return line || "<br/>";
  });
  if (inList) result.push("</ul>");

  return result.join("").replace(/\n/g, "");
};

// ─── Strip markdown for plain-text clipboard copy ───
const stripMarkdown = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g,     "$1")
    .replace(/`(.*?)`/g,       "$1")
    .replace(/^[-*•]\s+/gm,   "• ");

// ─── Initial welcome message ───
const WELCOME = {
  text: "Hi! I'm **Shelly** 📚, your personal book assistant at BOOKSHELF!\n\nI can help you find books, check stock, prices, your orders, and much more. What can I help you with today?",
  sender: "bot",
  id: 0,
};

export default function ChatBot() {
  const [isOpen,         setIsOpen]         = useState(false);
  const [messages,       setMessages]       = useState([WELCOME]);
  const [input,          setInput]          = useState("");
  const [isTyping,       setIsTyping]       = useState(false);
  const [hasUnread,      setHasUnread]      = useState(false);
  const [copiedId,       setCopiedId]       = useState(null);
  const [showQuickReply, setShowQuickReply] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const token          = localStorage.getItem("token");

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen, scrollToBottom]);

  // Focus input & clear unread badge when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Build history array to send to backend (excludes welcome msg)
  const buildHistory = (currentMessages) =>
    currentMessages
      .slice(1)                      // skip welcome message
      .slice(-MAX_HISTORY)           // last N messages only
      .map((m) => ({ role: m.sender, text: m.text }));

  const sendMessage = async (text) => {
    if (!text.trim() || isTyping) return;
    setShowQuickReply(false);

    const userMsg = { text, sender: "user", id: Date.now() };
    setMessages((prev) => {
      const next = [...prev, userMsg];

      // Fire request inside updater so we have the latest messages
      (async () => {
        setIsTyping(true);
        try {
          const res = await fetch(`${API_URL}/api/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              message: text,
              history: buildHistory(prev),
            }),
          });
          const data = await res.json();
          const botMsg = { text: data.reply, sender: "bot", id: Date.now() + 1 };
          setMessages((m) => [...m, botMsg]);
          if (!isOpen) setHasUnread(true);
        } catch {
          setMessages((m) => [
            ...m,
            { text: "⚠️ Network error. Please check your connection.", sender: "bot", id: Date.now() + 1 },
          ]);
        } finally {
          setIsTyping(false);
        }
      })();

      return next;
    });

    setInput("");
  };

  const handleCopy = async (msg) => {
    await navigator.clipboard.writeText(stripMarkdown(msg.text));
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    setShowQuickReply(true);
    setInput("");
  };

  const charCount   = input.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className="chatbot-wrapper">

      {/* ══════ CHAT WINDOW ══════ */}
      {isOpen && (
        <div className="chat-window">

          {/* Header */}
          <div className="chat-header">
            <div className="bot-info">
              <div className="bot-avatar-wrap">
                <span className="bot-emoji">📚</span>
                <span className="online-ring" />
              </div>
              <div className="bot-text-info">
                <h4>Shelly</h4>
                <span className="bot-status">● AI Book Assistant · Online</span>
              </div>
            </div>
            <div className="header-actions">
              <button className="hdr-btn" onClick={clearChat} title="Clear chat">🗑️</button>
              <button className="hdr-btn" onClick={() => setIsOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`msg-row ${msg.sender}`}>
                {msg.sender === "bot" && (
                  <span className="msg-avatar">📚</span>
                )}
                <div className="bubble-wrap">
                  <div
                    className={`message ${msg.sender}`}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                  />
                  {msg.sender === "bot" && (
                    <button
                      className={`copy-btn ${copiedId === msg.id ? "copied" : ""}`}
                      onClick={() => handleCopy(msg)}
                      title={copiedId === msg.id ? "Copied!" : "Copy"}
                    >
                      {copiedId === msg.id ? "✅" : "📋"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Animated typing dots */}
            {isTyping && (
              <div className="msg-row bot">
                <span className="msg-avatar">📚</span>
                <div className="typing-bubble">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}

            {/* Quick reply chips */}
            {showQuickReply && !isTyping && (
              <div className="quick-chips">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q.text}
                    className="chip"
                    onClick={() => sendMessage(q.text)}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <div className="input-wrap">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about books, orders, prices…"
                value={input}
                maxLength={MAX_CHARS + 20}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={isTyping}
              />
              {charCount > 120 && (
                <span className={`char-counter ${isOverLimit ? "over" : ""}`}>
                  {charCount}/{MAX_CHARS}
                </span>
              )}
            </div>
            <button
              className="send-btn"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping || isOverLimit}
              title="Send"
            >
              ➤
            </button>
          </div>

        </div>
      )}

      {/* ══════ FLOATING BUBBLE ══════ */}
      <button
        className={`chat-bubble-btn ${isOpen ? "is-open" : ""}`}
        onClick={() => { setIsOpen((o) => !o); setHasUnread(false); }}
        title="Chat with Shelly"
      >
        <span className="bubble-icon">{isOpen ? "✕" : "💬"}</span>
        {hasUnread && !isOpen && <span className="unread-badge" />}
      </button>

    </div>
  );
}