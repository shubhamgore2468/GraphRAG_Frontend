"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type Message = { sender: "user" | "bot"; text: string };

export default function ChatBox() {
  const { data: session } = useSession();
  const accessToken = (session as { accessToken?: string })?.accessToken;
  const router = useRouter();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="w-full z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                className="text-2xl font-bold text-gray-900"
                onClick={() => router.push("/")}
              >
                GraphRAG
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {session?.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!analysisComplete ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
                Compare Products
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Enter two product URLs to get started with AI-powered comparison
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product URL 1
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/product1"
                    value={url1}
                    onChange={(e) => setUrl1(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product URL 2
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/product2"
                    value={url2}
                    onChange={(e) => setUrl2(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={submitUrls}
                  disabled={submittingUrls || !url1 || !url2}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingUrls ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing Products...
                    </div>
                  ) : (
                    "Start Analysis"
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h3 className="text-xl font-semibold text-gray-900">
                  Product Comparison Chat
                </h3>
                <p className="text-gray-600 text-sm">
                  Ask questions about your product comparison
                </p>
              </div>

              {/* Messages Area */}
              <div
                className="p-6 overflow-auto space-y-4 bg-gray-50"
                style={{ height: "500px" }}
              >
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Ready to help!
                    </h4>
                    <p className="text-gray-600">
                      Ask me anything about the products you want to compare
                    </p>
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
                      className={`max-w-[70%] px-4 py-3 rounded-2xl text-base whitespace-pre-wrap shadow-sm ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-white text-gray-900 rounded-bl-md border"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={sendMessage}
                className="flex border-t bg-white p-4 gap-3"
                autoComplete="off"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about features, pricing, pros and cons..."
                  className="flex-grow border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    "Send"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
