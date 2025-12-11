"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";


type Thread = {
  id: number;
  title: string;
  description: string | null;
};

type KnowledgeItem = {
  id: number;
  threadId: number;
  type: string;
  title: string | null;
  rawContent: string | null;
  cachedVoteScore: number;
  createdAt: string;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export default function ThreadPage() {
  const params = useParams<{ threadId: string }>();
  const threadIdStr = params.threadId;
  const threadId = Number(threadIdStr);

  const [thread, setThread] = useState<Thread | null>(null);
  const [threadLoading, setThreadLoading] = useState(true);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(true);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [messageCounter, setMessageCounter] = useState(1);

  const [newKnowledgeTitle, setNewKnowledgeTitle] = useState("");
  const [newKnowledgeContent, setNewKnowledgeContent] = useState("");
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
  const [knowledgeSubmitting, setKnowledgeSubmitting] = useState(false);

  const [voteError, setVoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId || Number.isNaN(threadId)) return;

    const load = async () => {
      setThreadLoading(true);
      setKnowledgeLoading(true);
      try {
        const [threadRes, knowledgeRes] = await Promise.all([
          fetch(`/api/threads/${threadId}`),
          fetch(`/api/threads/${threadId}/knowledge`),
        ]);

        if (!threadRes.ok) {
          throw new Error("Failed to load thread.");
        }

        const threadData = await threadRes.json();
        setThread(threadData.thread);

        if (knowledgeRes.ok) {
          const knowledgeData = await knowledgeRes.json();
          setKnowledge(knowledgeData.items ?? []);
        } else {
          setKnowledge([]);
        }

        // Seed initial assistant greeting for this thread
        setChatMessages([
          {
            id: 1,
            role: "assistant",
            content: `Welcome to "${threadData.thread.title}". Ask anything related to this thread's domain.`,
          },
        ]);
        setMessageCounter(2);
      } catch (err: any) {
        console.error(err);
        setThread(null);
      } finally {
        setThreadLoading(false);
        setKnowledgeLoading(false);
      }
    };

    load();
  }, [threadId]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !threadId) return;

    const question = chatInput.trim();
    setChatInput("");
    setChatError(null);

    const userMsg: ChatMessage = {
      id: messageCounter,
      role: "user",
      content: question,
    };
    setMessageCounter((c) => c + 1);
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch(`/api/threads/${threadId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error?.message) msg = data.error.message;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      const answer = (data.answer as string) ?? "";

      const assistantMsg: ChatMessage = {
        id: messageCounter + 1,
        role: "assistant",
        content: answer,
      };
      setMessageCounter((c) => c + 2);
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || "Something went wrong.");
    } finally {
      setChatLoading(false);
    }
  };

  const refreshKnowledge = async () => {
    if (!threadId) return;
    try {
      const res = await fetch(`/api/threads/${threadId}/knowledge`);
      if (!res.ok) return;
      const data = await res.json();
      setKnowledge(data.items ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKnowledgeContent.trim() || !threadId) return;

    setKnowledgeSubmitting(true);
    setKnowledgeError(null);

    try {
      const res = await fetch(`/api/threads/${threadId}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "note",
          title: newKnowledgeTitle.trim() || null,
          content: newKnowledgeContent.trim(),
        }),
      });

      if (!res.ok) {
        let msg = `Failed to add knowledge (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error?.message) msg = data.error.message;
        } catch {}
        throw new Error(msg);
      }

      setNewKnowledgeTitle("");
      setNewKnowledgeContent("");
      await refreshKnowledge();
    } catch (err: any) {
      console.error(err);
      setKnowledgeError(err.message || "Failed to add knowledge.");
    } finally {
      setKnowledgeSubmitting(false);
    }
  };

  const handleVote = async (itemId: number, value: 1 | -1) => {
    setVoteError(null);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "knowledge_item",
          targetId: itemId,
          value,
        }),
      });

      if (!res.ok) {
        let msg = `Failed to vote (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error?.message) msg = data.error.message;
        } catch {}
        throw new Error(msg);
      }

      await refreshKnowledge();
    } catch (err: any) {
      console.error(err);
      setVoteError(err.message || "Failed to submit vote.");
    }
  };

  if (!threadId || Number.isNaN(threadId)) {
    return <div className="threads-page">Invalid thread id.</div>;
  }

  return (
    <div className="threads-page">
      <div className="threads-layout thread-detail-layout">
        <header className="threads-header">
          <div>
            <div style={{ marginBottom: "0.35rem" }}>
              <Link href="/threads" className="site-home-link">
                ← All threads
              </Link>
            </div>
            <h1 className="threads-title">
              {threadLoading ? "Loading thread…" : thread?.title}
            </h1>
            <p className="threads-subtitle">
              {thread?.description ||
                "Ask questions and curate knowledge for this thread."}
            </p>
          </div>
          <span className="chat-tag">Thread #{threadId}</span>
        </header>


        <section className="thread-detail-main">
          <div className="thread-chat-panel">
            <div className="chat-card">
              <div className="chat-messages">
                {chatMessages.map((m) => (
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

              <form className="chat-input-row" onSubmit={handleAsk}>
                <input
                  className="chat-input"
                  type="text"
                  placeholder={
                    thread
                      ? `Ask something about ${thread.title}…`
                      : "Ask a question…"
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                />
                <button
                  className="chat-button"
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                >
                  {chatLoading ? "Thinking…" : "Send"}
                </button>
              </form>

              {chatError && <div className="chat-error">{chatError}</div>}
            </div>
          </div>

          <div className="thread-knowledge-panel">
            <div className="knowledge-section">
              <h2 className="knowledge-title">Knowledge base</h2>
              {knowledgeLoading ? (
                <div className="threads-empty">Loading knowledge…</div>
              ) : knowledge.length === 0 ? (
                <div className="threads-empty">
                  No knowledge items yet. Add one below.
                </div>
              ) : (
                <div className="knowledge-list">
                  {knowledge.map((item) => (
                    <div key={item.id} className="knowledge-item">
                      <div className="knowledge-header">
                        <div className="knowledge-title-text">
                          {item.title || "(untitled)"}
                        </div>
                        <div className="knowledge-type">
                          {item.type.toUpperCase()}
                        </div>
                      </div>
                      {item.rawContent && (
                        <div className="knowledge-body">
                          {item.rawContent.length > 200
                            ? item.rawContent.slice(0, 200) + "…"
                            : item.rawContent}
                        </div>
                      )}
                      <div className="knowledge-footer">
                        <div className="knowledge-votes">
                          <button
                            type="button"
                            className="vote-button"
                            onClick={() => handleVote(item.id, 1)}
                          >
                            ▲
                          </button>
                          <span className="vote-score">
                            {item.cachedVoteScore}
                          </span>
                          <button
                            type="button"
                            className="vote-button"
                            onClick={() => handleVote(item.id, -1)}
                          >
                            ▼
                          </button>
                        </div>
                        <div className="knowledge-meta">
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {voteError && (
                <div className="thread-error" style={{ marginTop: "0.25rem" }}>
                  {voteError}
                </div>
              )}

              <div className="knowledge-add">
                <h3 className="knowledge-add-title">Add knowledge</h3>
                <form className="knowledge-add-form" onSubmit={handleAddKnowledge}>
                  <input
                    className="thread-input"
                    type="text"
                    placeholder="Optional title (e.g. Paper summary, observation, etc.)"
                    value={newKnowledgeTitle}
                    onChange={(e) => setNewKnowledgeTitle(e.target.value)}
                    disabled={knowledgeSubmitting}
                  />
                  <textarea
                    className="thread-textarea"
                    placeholder="Write a note, paste an abstract, or jot down a useful observation..."
                    value={newKnowledgeContent}
                    onChange={(e) =>
                      setNewKnowledgeContent(e.target.value)
                    }
                    disabled={knowledgeSubmitting}
                  />
                  <button
                    className="thread-button"
                    type="submit"
                    disabled={knowledgeSubmitting || !newKnowledgeContent.trim()}
                  >
                    {knowledgeSubmitting ? "Saving…" : "Add knowledge"}
                  </button>
                </form>
                {knowledgeError && (
                  <div className="thread-error">{knowledgeError}</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
