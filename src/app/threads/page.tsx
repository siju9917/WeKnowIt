"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Thread = {
  id: number;
  title: string;
  description: string | null;
  slug: string;
};

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/threads");
      if (!res.ok) throw new Error(`Failed to load threads (${res.status})`);
      const data = await res.json();
      setThreads(data.threads ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load threads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        let message = `Failed to create thread (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error?.message) message = data.error.message;
        } catch {}
        throw new Error(message);
      }

      setTitle("");
      setDescription("");
      await fetchThreads();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create thread.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="threads-page">
      <div className="threads-layout">
        <header className="threads-header">
          <div>
            <h1 className="threads-title">LLM Threads</h1>
            <p className="threads-subtitle">
              Pick a domain‑specific thread, or create your own “Reddit for LLMs” topic.
            </p>
          </div>
        </header>

        <section className="threads-main">
          <div className="threads-list">
            {loading ? (
              <div className="threads-empty">Loading threads…</div>
            ) : threads.length === 0 ? (
              <div className="threads-empty">
                No threads yet. Create the first one below.
              </div>
            ) : (
              threads.map((thread) => (
                <Link
                  href={`/threads/${thread.id}`}
                  key={thread.id}
                  className="thread-card"
                >
                  <div className="thread-card-title">{thread.title}</div>
                  {thread.description && (
                    <div className="thread-card-description">
                      {thread.description}
                    </div>
                  )}
                  <div className="thread-card-meta">Thread #{thread.id}</div>
                </Link>
              ))
            )}
          </div>

          <div className="thread-create-card">
            <h2 className="thread-create-title">Create a new thread</h2>
            <form className="thread-create-form" onSubmit={handleCreate}>
              <input
                className="thread-input"
                type="text"
                placeholder="Thread title (e.g. Quant Finance LLM, Climate Modeling, etc.)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={creating}
              />
              <textarea
                className="thread-textarea"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={creating}
              />
              <button
                className="thread-button"
                type="submit"
                disabled={creating || !title.trim()}
              >
                {creating ? "Creating…" : "Create thread"}
              </button>
            </form>
            {error && <div className="thread-error">{error}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
