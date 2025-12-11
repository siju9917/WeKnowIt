"use client";

import React, { useState } from "react";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const THREAD_ID = 1;

export default function SolarEnergyForecastingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I'm the Solar Energy Forecasting assistant. Ask me anything about PV forecasting, cloud impacts, nowcasting vs day‑ahead models, or how to evaluate forecast accuracy.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counter, setCounter] = useState(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setError(null);

    const userMessage: ChatMessage = {
      id: counter,
      role: "user",
      content: question,
    };
    setCounter((c) => c + 1);
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch(`/api/threads/${THREAD_ID}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        let message = `Request failed with status ${res.status}`;
        try {
          const data = await res.json();
          if (data?.error?.message) {
            message = data.error.message;
          }
        } catch {
          // ignore parse error
        }
        throw new Error(message);
      }

      const data = await res.json();
      const answer = (data.answer as string) ?? "";

      const assistantMessage: ChatMessage = {
        id: counter + 1,
        role: "assistant",
        content: answer,
      };
      setCounter((c) => c + 2);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-card">
        <header className="chat-header">
          <div>
            <div className="chat-title">Solar Energy Forecasting</div>
            <div className="chat-subtitle">
              Thread LLM tuned for PV forecasting questions.
            </div>
          </div>
          <span className="chat-tag">MVP · Thread #{THREAD_ID}</span>
        </header>

        <div className="chat-messages">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-message ${
                m.role === "user" ? "user" : "assistant"
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>

        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input
            className="chat-input"
            type="text"
            placeholder="Ask about solar forecasting, clouds, NWP, ML models..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            className="chat-button"
            type="submit"
            disabled={loading || !input.trim()}
          >
            {loading ? "Thinking…" : "Send"}
          </button>
        </form>

        {error && <div className="chat-error">{error}</div>}
      </div>
    </div>
  );
}
