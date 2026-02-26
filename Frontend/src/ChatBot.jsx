import { useState, useRef, useEffect } from "react";
import "./ChatBot.css";
import API_URL from "./config";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I am your Book Assistant. Looking for something specific? 🤖📚", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to latest message
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. User Message Add karo
    const userMsg = { text: input, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // 2. API Call (Server.js wala route)
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await res.json();
      
      // 3. Bot Reply Add karo
      setMessages(prev => [...prev, { text: data.reply, sender: "bot" }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Network Error! 😵", sender: "bot" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
      {/* --- Chat Window --- */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="bot-info">
                <span className="bot-avatar">🤖</span>
                <div>
                    <h4>AI Assistant</h4>
                    <span className="status-dot">● Online</span>
                </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>✖</button>
          </div>

          <div className="chat-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isTyping && <div className="message bot typing">Typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input 
                type="text" 
                placeholder="Suggest me a mystery book..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={!input.trim()}>➤</button>
          </div>
        </div>
      )}

      {/* --- Floating Bubble Button --- */}
      {!isOpen && (
        <button className="chat-bubble-btn" onClick={() => setIsOpen(true)}>
          💬
        </button>
      )}
    </div>
  );
}