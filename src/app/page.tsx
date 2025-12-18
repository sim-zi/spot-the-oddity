"use client";

import {
  Category,
  CATEGORY_INFO,
  ChatMessage,
  GAME_CONFIG,
  GamePhase,
  Knowledge,
} from "@/types/knowledge";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  // 게임 상태
  const [gamePhase, setGamePhase] = useState<GamePhase>("main");
  const [currentKnowledge, setCurrentKnowledge] = useState<Knowledge | null>(
    null
  );
  const [timeLeft, setTimeLeft] = useState(0);

  // 채팅 상태
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // 결과 상태
  const [generatedKnowledge, setGeneratedKnowledge] =
    useState<Knowledge | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const isGeneratingRef = useRef<boolean>(false);

  // messages 상태가 변경될 때 ref도 업데이트
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // AI 봇 첫 인사
  const sendBotGreeting = async () => {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

    const greetings = [
      "안녕하세요! 오늘은 어떤 지식을 알려주실 건가요?",
      "반가워요! 새로운 걸 배울 준비가 됐어요.",
      "안녕하세요~ 무엇에 대해 설명해주실 건가요?",
    ];

    setMessages([
      {
        role: "bot",
        content: greetings[Math.floor(Math.random() * greetings.length)],
        timestamp: Date.now(),
      },
    ]);
    setIsTyping(false);
  };

  // 새 지식 생성
  const generateNewKnowledge = async () => {
    // 중복 호출 방지
    if (isGeneratingRef.current) {
      console.log("Already generating, skipping...");
      return;
    }
    isGeneratingRef.current = true;

    // ref에서 최신 messages 가져오기 (클로저 문제 해결)
    const currentMessages = messagesRef.current;
    console.log("Generating with messages:", currentMessages.length);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalKnowledge: currentKnowledge,
          chatLog: currentMessages,
        }),
      });

      const data = await response.json();

      if (data.knowledge) {
        setGeneratedKnowledge(data.knowledge);

        // DB에 새 지식 저장
        try {
          const saveResponse = await fetch("/api/knowledge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.knowledge),
          });
          const saveResult = await saveResponse.json();
          console.log("Save result:", saveResult);
          if (!saveResponse.ok) {
            console.error("Save failed:", saveResult);
          }
        } catch (saveError) {
          console.error("Error saving to DB:", saveError);
        }
      }
    } catch (error) {
      console.error("Error generating knowledge:", error);
      // 에러 시 임시 결과
      setGeneratedKnowledge({
        ...currentKnowledge!,
        id: `gen-${Date.now()}`,
        title: currentKnowledge!.title + " (변형)",
        description: "새로운 지식 생성에 실패했습니다.",
        parentId: currentKnowledge!.id,
        generation: currentKnowledge!.generation + 1,
      });
    }

    setGamePhase("result");
  };

  // 타이머 관리
  useEffect(() => {
    if (gamePhase === "reading" || gamePhase === "chatting") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            if (gamePhase === "reading") {
              setGamePhase("intro-chatting");
            } else if (gamePhase === "chatting") {
              setGamePhase("generating");
              generateNewKnowledge();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase]);

  // 스크롤 관리
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 게임 시작
  const startGame = () => {
    setGamePhase("category");
  };

  // 카테고리 선택 - DB에서 지식도 가져옴
  const selectCategory = async (category: Category) => {
    setGamePhase("loading"); // 로딩 상태 추가

    try {
      // DB에서 해당 카테고리의 지식 가져오기 (시드 포함)
      const response = await fetch(`/api/knowledge?category=${category}`);
      const data = await response.json();
      const allKnowledge: Knowledge[] = data.knowledge || [];

      if (allKnowledge.length === 0) {
        alert("지식이 없습니다. 잠시 후 다시 시도해주세요.");
        setGamePhase("category");
        return;
      }

      // 랜덤 선택
      const selected =
        allKnowledge[Math.floor(Math.random() * allKnowledge.length)];

      console.log(
        `Selected knowledge from ${allKnowledge.length} options`
      );

      setCurrentKnowledge(selected);
      setGamePhase("intro-reading");
    } catch (error) {
      console.error("Error fetching knowledge:", error);
      alert("지식을 불러오는데 실패했습니다.");
      setGamePhase("category");
    }
  };

  // 읽기 단계 시작
  const startReading = () => {
    setTimeLeft(GAME_CONFIG.READING_TIME);
    setGamePhase("reading");
  };

  // 채팅 단계 시작
  const startChatting = () => {
    setTimeLeft(GAME_CONFIG.CHATTING_TIME);
    setGamePhase("chatting");
    sendBotGreeting();
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (!input.trim() || gamePhase !== "chatting") return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // AI 응답
    await processBotResponse(userMessage.content);
  };

  // AI 봇 응답 처리
  const processBotResponse = async (userInput: string) => {
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userInput,
          history: messages,
          knowledge: currentKnowledge,
        }),
      });

      const data = await response.json();

      // 응답 딜레이
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 1500));

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: data.message,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  // 다시 하기
  const resetGame = () => {
    setGamePhase("main");
    setCurrentKnowledge(null);
    setMessages([]);
    setGeneratedKnowledge(null);
    setTimeLeft(0);
    isGeneratingRef.current = false; // 중복 호출 방지 플래그 초기화
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 타이머 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ========== 렌더링 ==========

  // 메인 화면
  if (gamePhase === "main") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-semibold text-[var(--secondary)] mb-4 quiz-title">
            Knowledge History
          </h1>
          <p className="text-lg text-[var(--accent)] mb-2">지식 계보 게임</p>
          <p className="text-base text-gray-500 mb-10 leading-relaxed">
            지식을 AI에게 설명하고,
            <br />
            새롭게 탄생하는 지식의 흐름을 확인하세요.
          </p>

          <button
            onClick={startGame}
            className="btn-gold px-10 py-3 text-base mb-6"
          >
            시작하기
          </button>

          <div className="mt-8">
            <a
              href="/history"
              className="text-[var(--muted)] hover:text-[var(--secondary)] transition-colors"
            >
              지식 계보 보기 →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 지식 로딩 화면
  if (gamePhase === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-medium text-[var(--secondary)] mb-2">
            지식을 불러오는 중
          </h2>
          <p className="text-sm text-gray-400">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  // 카테고리 선택 화면
  if (gamePhase === "category") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-medium text-[var(--secondary)] mb-8">
          주제 선택
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
          {(Object.keys(CATEGORY_INFO) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => selectCategory(cat)}
              className="category-card"
            >
              <span className="text-4xl mb-2 block">
                {CATEGORY_INFO[cat].emoji}
              </span>
              <span className="text-lg font-medium">
                {CATEGORY_INFO[cat].label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setGamePhase("main")}
          className="mt-8 text-gray-500 hover:text-gray-700"
        >
          ← 돌아가기
        </button>
      </div>
    );
  }

  // 읽기 단계 설명 화면
  if (gamePhase === "intro-reading" && currentKnowledge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <p className="text-sm text-[var(--muted)] mb-2">STEP 1</p>
          <h2 className="text-2xl font-medium text-[var(--secondary)] mb-8">
            지식 읽기
          </h2>

          <div className="bg-[var(--paper)] border border-gray-200 rounded-lg p-6 mb-8 text-left">
            <ul className="space-y-3 text-gray-600 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-[var(--primary)] mt-0.5">1</span>
                <span>화면에 지식이 표시됩니다</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--primary)] mt-0.5">2</span>
                <span>
                  <strong>{GAME_CONFIG.READING_TIME}초</strong> 동안 내용을 읽고
                  기억하세요
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--primary)] mt-0.5">3</span>
                <span>다음 단계에서 AI에게 이 내용을 설명합니다</span>
              </li>
            </ul>
          </div>

          <button
            onClick={startReading}
            className="btn-gold px-10 py-3 text-base"
          >
            시작
          </button>
        </div>
      </div>
    );
  }

  // 지식 읽기 화면
  if (gamePhase === "reading" && currentKnowledge) {
    return (
      <div className="min-h-screen flex flex-col items-center p-8">
        <div className="w-full max-w-3xl">
          {/* 타이머 */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-1">읽기 시간</p>
            <p className={`timer ${timeLeft <= 5 ? "timer-urgent" : ""}`}>
              {formatTime(timeLeft)}
            </p>
          </div>

          {/* 지식 카드 */}
          <div className="encyclopedia-page">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">
                {CATEGORY_INFO[currentKnowledge.category].emoji}
              </span>
              <span className="text-sm text-gray-500">
                {CATEGORY_INFO[currentKnowledge.category].label}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-[var(--secondary)] mb-6">
              {currentKnowledge.title}
            </h1>

            <div className="encyclopedia-text text-lg whitespace-pre-line">
              {currentKnowledge.description}
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            시간이 지나면 자동으로 다음 단계로 넘어갑니다
          </p>
        </div>
      </div>
    );
  }

  // 채팅 단계 설명 화면
  if (gamePhase === "intro-chatting" && currentKnowledge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <p className="text-sm text-[var(--muted)] mb-2">STEP 2</p>
          <h2 className="text-2xl font-medium text-[var(--secondary)] mb-8">
            AI에게 설명하기
          </h2>

          <div className="bg-[var(--paper)] border border-gray-200 rounded-lg p-6 mb-8 text-left">
            <ul className="space-y-3 text-gray-600 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-[var(--primary)] mt-0.5">1</span>
                <span>AI가 방금 읽은 지식에 대해 질문합니다</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--primary)] mt-0.5">2</span>
                <span>
                  <strong>{GAME_CONFIG.CHATTING_TIME}초</strong> 동안 기억한
                  내용을 설명하세요
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--primary)] mt-0.5">3</span>
                <span>
                  AI는 원본 지식을 모릅니다. 당신의 설명만이 유일한 정보입니다.
                </span>
              </li>
            </ul>
          </div>

          <button
            onClick={startChatting}
            className="btn-gold px-10 py-3 text-base"
          >
            시작
          </button>
        </div>
      </div>
    );
  }

  // 채팅 화면
  if (gamePhase === "chatting" && currentKnowledge) {
    return (
      <div className="min-h-screen flex flex-col p-4 md:p-8">
        <div className="w-full max-w-2xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b">
            <div>
              <h2 className="font-bold text-[var(--secondary)]">
                {currentKnowledge.title}
              </h2>
              <p className="text-sm text-gray-500">
                이 지식을 AI에게 설명하세요
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">남은 시간</p>
              <p
                className={`timer text-2xl ${
                  timeLeft <= 10 ? "timer-urgent" : ""
                }`}
              >
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          {/* 채팅 영역 */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 ${
                    msg.role === "user" ? "chat-bubble-user" : "chat-bubble-bot"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="chat-bubble-bot px-4 py-2">
                  <span className="animate-pulse">입력 중...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="지식에 대해 설명해주세요..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--primary)] focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="btn-gold px-6 py-3 disabled:opacity-50"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 생성 중 화면
  if (gamePhase === "generating") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-medium text-[var(--secondary)] mb-2">
            새로운 지식 생성 중
          </h2>
          <p className="text-sm text-gray-400">
            AI가 설명을 바탕으로 새로운 지식을 만들고 있습니다
          </p>
        </div>
      </div>
    );
  }

  // 결과 화면
  if (gamePhase === "result" && currentKnowledge && generatedKnowledge) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-medium text-center text-[var(--secondary)] mb-8">
            새로운 지식이 탄생했습니다
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 원본 지식 */}
            <div className="encyclopedia-page">
              <p className="text-xs text-[var(--muted)] mb-3 uppercase tracking-wide">
                원본
              </p>
              <h3 className="text-lg font-medium text-[var(--secondary)] mb-3">
                {currentKnowledge.title}
              </h3>
              <p className="encyclopedia-text text-sm text-gray-600">
                {currentKnowledge.description}
              </p>
            </div>

            {/* 새 지식 */}
            <div className="encyclopedia-page border-l-2 border-l-[var(--primary)]">
              <p className="text-xs text-[var(--primary)] mb-3 uppercase tracking-wide">
                새로운 지식
              </p>
              <h3 className="text-lg font-medium text-[var(--secondary)] mb-3">
                {generatedKnowledge.title}
              </h3>
              <p className="encyclopedia-text text-sm text-gray-600">
                {generatedKnowledge.description}
              </p>
            </div>
          </div>

          <div className="text-center mt-10 space-x-4">
            <button onClick={resetGame} className="btn-gold px-8 py-3">
              다시 하기
            </button>
            <a
              href="/history"
              className="inline-block px-8 py-3 border border-gray-300 text-[var(--secondary)] rounded-lg hover:border-[var(--secondary)] transition-colors"
            >
              지식 계보 보기
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
