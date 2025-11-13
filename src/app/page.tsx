"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const CRTDisplay = dynamic(() => import("@/components/CRTDisplay"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <p className="text-green-400 font-mono animate-pulse">
        [LOADING SURVEILLANCE FEED...]
      </p>
    </div>
  ),
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `[SYSTEM_BOOT]
>>> Surveillance AI v2.1 initialized
>>> Neural network: ONLINE
>>> Video analysis module: READY
>>> Encryption protocols: BYPASSED
>>> Access level: FULL

[STATUS] 감시 피드 분석 시스템 가동.
영상 내 변칙사항 보고를 대기 중입니다.
모든 anomaly를 기록하고 분석하겠습니다.

> Awaiting operator input...`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          history: messages,
        }),
      });

      const data = await response.json();

      if (data.reply) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.reply,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "[ERROR] Connection lost. Retrying...",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-black relative overflow-hidden">
      {/* 배경 노이즈 효과 */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent animate-scan"></div>
      </div>

      {/* 왼쪽: 영상 영역 - CRT 디스플레이 */}
      <div className="flex-1 bg-black relative">
        <CRTDisplay />
      </div>

      {/* 오른쪽: 해커 터미널 UI */}
      <div className="w-96 bg-black border-l-2 border-green-500/30 flex flex-col relative">
        {/* 스캔라인 효과 */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 255, 0, 0.03) 2px,
                rgba(0, 255, 0, 0.03) 4px
              )`,
            }}
          ></div>
        </div>

        {/* 헤더 */}
        <div className="p-4 border-b border-green-500/30 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-500 font-mono text-xs">● REC</span>
            </div>
            <div className="text-green-400 font-mono text-xs">
              {currentTime || "--:--:--"}
            </div>
          </div>
          <h2 className="text-lg font-mono text-green-400 tracking-wider">
            [SURVEILLANCE_TERMINAL]
          </h2>
          <p className="text-xs text-green-500/70 font-mono mt-1">
            &gt; ANOMALY DETECTION SYSTEM v2.1
          </p>
        </div>

        {/* 채팅 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-2 max-w-[85%] font-mono text-xs ${
                  msg.role === "user"
                    ? "bg-green-900/40 text-green-300 border border-green-500/30"
                    : "bg-black/60 text-green-400 border border-green-500/20"
                }`}
              >
                <div className="text-[10px] opacity-60 mb-1">
                  {msg.role === "user" ? "[OPERATOR]" : "[AI_SYSTEM]"}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-black/60 border border-green-500/20 px-3 py-2 font-mono text-xs">
                <p className="text-green-400 animate-pulse">
                  [ANALYZING]<span className="animate-ping">...</span>
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-4 border-t border-green-500/30 bg-black/80 backdrop-blur-sm">
          <div className="mb-2 text-green-500/50 font-mono text-[10px]">
            &gt; INPUT COMMAND:
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type observation here..."
              className="flex-1 px-3 py-2 bg-black/80 border border-green-500/40 text-green-400 font-mono text-sm focus:outline-none focus:border-green-500 focus:shadow-[0_0_10px_rgba(34,197,94,0.3)] placeholder-green-700"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-green-900/40 text-green-400 border border-green-500/50 font-mono text-sm hover:bg-green-900/60 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isLoading ? "..." : "SEND"}
            </button>
          </div>
          <div className="mt-2 flex gap-2 text-[10px] font-mono text-green-600">
            <span>STATUS: ACTIVE</span>
            <span>|</span>
            <span>FEED: LIVE</span>
            <span>|</span>
            <span className="text-yellow-500 animate-pulse">⚠ MONITORING</span>
          </div>
        </div>
      </div>
    </div>
  );
}
