"use client";

import React, { useState, useRef, useEffect } from "react";

interface ChatBoxProps {
  accessToken?: string;
}

type Message = { sender: "user" | "bot"; text: string };

export default function ChatBox({ accessToken }: ChatBoxProps) {
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittingUrls, setSubmittingUrls] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function submitUrls() {
    if (!url1 || !url2) {
      alert("Please enter both URLs.");
      return;
    }

    setSubmittingUrls(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/urls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken ?? ""}`,
        },
        body: JSON.stringify({ url1, url2 }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze URLs");
      }

      const data = await res.json();
      console.log("URL Analysis Response:", data);
      setAnalysisComplete(true);
    } catch (err) {
      console.error(err);
      alert("Error analyzing URLs.");
    } finally {
      setSubmittingUrls(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken ?? ""}`,
        },
        body: JSON.stringify({ prompt: userMsg.text }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data = await res.json();
      const botMsg: Message = { sender: "bot", text: data.content };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, there was an error sending your message.",
        },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8">
      {!analysisComplete ? (
        <div className="w-full max-w-xl space-y-4">
          <h2 className="text-2xl font-semibold text-center">
            Enter Product URLs
          </h2>
          <input
            type="text"
            placeholder="Product URL 1"
            value={url1}
            onChange={(e) => setUrl1(e.target.value)}
            className="w-full border rounded-xl px-4 py-2"
          />
          <input
            type="text"
            placeholder="Product URL 2"
            value={url2}
            onChange={(e) => setUrl2(e.target.value)}
            className="w-full border rounded-xl px-4 py-2"
          />
          <button
            onClick={submitUrls}
            disabled={submittingUrls}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            {submittingUrls ? "Analyzing..." : "Submit URLs"}
          </button>
        </div>
      ) : (
        <div className="max-w-2xl w-full flex flex-col bg-white rounded-xl shadow-xl border min-h-[512px]">
          <div
            className="p-6 overflow-auto flex-1 space-y-3"
            style={{ maxHeight: 400 }}
          >
            {messages.length === 0 && (
              <div className="text-gray-400 text-center">
                Ask something about the products.
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-base whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="flex border-t gap-1 p-3 bg-white"
            autoComplete="off"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-all"
            >
              {loading ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
