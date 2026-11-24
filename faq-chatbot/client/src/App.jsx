import { useState, useEffect, useRef } from "react";

export default function App() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! Ask me anything about orders, shipping, returns or payments." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Always scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { from: "bot", text: data.reply || data.error }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Cannot reach the server. Is it running?" },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="chat">
      <header className="chat-header">FAQ Chatbot</header>

      <div className="chat-body">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.from}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="bubble bot">Typing...</div>}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
        />
        <button type="submit" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
}
