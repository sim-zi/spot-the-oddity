"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

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
  role: "user" | "partner";
  content: string;
  timestamp?: number;
}

type GamePhase = "waiting" | "matching" | "matched" | "playing";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isHesitating, setIsHesitating] = useState(false); // 타이핑 망설임 (썼다 지웠다)
  const [currentTime, setCurrentTime] = useState<string>("");
  const [gamePhase, setGamePhase] = useState<GamePhase>("waiting");
  const [partnerName, setPartnerName] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingMessagesRef = useRef<{ text: string; delay: number }[]>([]);
  const isProcessingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nudgeCountRef = useRef<number>(0);
  const [isDisconnected, setIsDisconnected] = useState(false);

  // 랜덤 파트너 이름 생성
  const generatePartnerName = useCallback(() => {
    const adjectives = ["익명의", "수상한", "조용한", "날카로운", "호기심많은"];
    const nouns = ["탐정", "관찰자", "분석가", "수사관", "요원"];
    const number = Math.floor(Math.random() * 999) + 1;
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}#${number}`;
  }, []);

  // 매칭 시뮬레이션
  useEffect(() => {
    if (gamePhase === "waiting") {
      const startMatchingTimer = setTimeout(() => {
        setGamePhase("matching");
      }, 1000);
      return () => clearTimeout(startMatchingTimer);
    }

    if (gamePhase === "matching") {
      const matchTime = 2000 + Math.random() * 3000; // 2-5초 사이 랜덤
      const matchTimer = setTimeout(() => {
        setPartnerName(generatePartnerName());
        setGamePhase("matched");
      }, matchTime);
      return () => clearTimeout(matchTimer);
    }

    if (gamePhase === "matched") {
      const playTimer = setTimeout(() => {
        setGamePhase("playing");
        // 파트너 첫 인사는 바로 하지 않고, 사용자가 먼저 말 걸 기회를 줌
        // 일정 시간 후에도 사용자가 말이 없으면 그때 파트너가 먼저 인사
        lastActivityRef.current = Date.now();
      }, 1500);
      return () => clearTimeout(playTimer);
    }
  }, [gamePhase, generatePartnerName]);

  // 파트너 첫 인사 (사용자가 먼저 말 안 걸었을 때)
  const sendPartnerGreeting = async () => {
    if (messages.length > 0) return; // 이미 대화가 시작됐으면 스킵

    setIsTyping(true);
    const greetings = [
      ["안녕하세요"],
      ["안녕하세요!", "혹시 뭐 보이세요?"],
      ["오 안녕하세요"],
      ["반가워요", "뭐 발견하신 거 있어요?"],
      ["안녕하세요", "같이 찾아봐요"],
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    for (let i = 0; i < greeting.length; i++) {
      const msg = greeting[i];
      // 첫 메시지는 좀 더 기다림, 이후 메시지는 자연스러운 간격
      const delay =
        i === 0 ? 1000 + Math.random() * 1500 : 1500 + Math.random() * 2000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      setMessages((prev) => [...prev, { role: "partner", content: msg }]);

      // 다음 메시지 전 타이핑 멈춤 효과
      if (i < greeting.length - 1) {
        setIsTyping(false);
        await new Promise((resolve) =>
          setTimeout(resolve, 400 + Math.random() * 600)
        );
        setIsTyping(true);
      }
    }
    setIsTyping(false);
  };

  // 파트너가 먼저 말 걸기 (오래 대화가 없을 때)
  const sendPartnerNudge = async () => {
    if (isProcessingRef.current || isTyping || isDisconnected) return;

    // 아직 대화가 시작되지 않았으면 첫 인사로 처리
    if (messages.length === 0) {
      await sendPartnerGreeting();
      return;
    }

    nudgeCountRef.current += 1;

    // 2-3번 넛지 후에도 반응 없으면 파트너가 나감
    if (nudgeCountRef.current >= 2 + Math.floor(Math.random() * 2)) {
      await sendPartnerDisconnect();
      return;
    }

    const nudges = [
      ["혹시 뭐 보이세요?"],
      ["어디 보고 계세요?"],
      ["저 여기 뭔가 이상한 거 같은데..."],
      ["뭔가 발견하신 거 있어요?"],
      ["음...", "저쪽 살펴봐요"],
      ["계세요?"],
    ];
    const nudge = nudges[Math.floor(Math.random() * nudges.length)];

    setIsTyping(true);
    isProcessingRef.current = true;

    for (let i = 0; i < nudge.length; i++) {
      const msg = nudge[i];
      const delay =
        i === 0 ? 1500 + Math.random() * 2000 : 1000 + Math.random() * 1500;
      await new Promise((resolve) => setTimeout(resolve, delay));
      setMessages((prev) => [...prev, { role: "partner", content: msg }]);

      if (i < nudge.length - 1) {
        setIsTyping(false);
        await new Promise((resolve) =>
          setTimeout(resolve, 400 + Math.random() * 600)
        );
        setIsTyping(true);
      }
    }

    setIsTyping(false);
    isProcessingRef.current = false;
    lastActivityRef.current = Date.now();
  };

  // 파트너 연결 종료 (오랫동안 답장 없을 때)
  const sendPartnerDisconnect = async () => {
    if (isDisconnected) return;

    const farewells = [
      ["음...", "저 먼저 나갈게요"],
      ["답장이 없으시네요", "다음에 또 해요"],
      ["혼자 하기 힘드네요...", "다른 파트너 찾아볼게요"],
      ["저 나갈게요", "수고하세요"],
      ["...", "나갑니다"],
    ];
    const farewell = farewells[Math.floor(Math.random() * farewells.length)];

    setIsTyping(true);
    isProcessingRef.current = true;

    for (let i = 0; i < farewell.length; i++) {
      const msg = farewell[i];
      const delay =
        i === 0 ? 2000 + Math.random() * 2000 : 1500 + Math.random() * 1500;
      await new Promise((resolve) => setTimeout(resolve, delay));
      setMessages((prev) => [...prev, { role: "partner", content: msg }]);

      if (i < farewell.length - 1) {
        setIsTyping(false);
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 800)
        );
        setIsTyping(true);
      }
    }

    setIsTyping(false);
    isProcessingRef.current = false;

    // 잠시 후 연결 종료 표시
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsDisconnected(true);

    // 타이머 정리
    if (idleTimerRef.current) {
      clearInterval(idleTimerRef.current);
    }
  };

  // 활동 없음 감지 및 파트너 넛지 트리거
  useEffect(() => {
    if (gamePhase !== "playing") return;

    const checkIdle = () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      // 15-40초 사이 랜덤 (대화 컨텍스트에 따라 자연스럽게)
      const idleThreshold = 15000 + Math.random() * 25000;

      if (timeSinceLastActivity > idleThreshold && !isProcessingRef.current) {
        sendPartnerNudge();
      }
    };

    // 10초마다 체크
    idleTimerRef.current = setInterval(checkIdle, 10000);

    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [gamePhase, isTyping]);

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
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim() || gamePhase !== "playing") return;

    const now = Date.now();
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: now,
    };
    const userInput = input;

    // 이전 사용자 메시지와의 간격 계산
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    const timeSinceLastMessage = lastUserMessage?.timestamp
      ? now - lastUserMessage.timestamp
      : null;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    lastActivityRef.current = now; // 활동 시간 갱신
    nudgeCountRef.current = 0; // 넛지 카운트 리셋

    // 사용자가 끼어들면 현재 진행 중인 파트너 메시지 큐를 비움
    if (isProcessingRef.current) {
      pendingMessagesRef.current = [];
      // 잠시 후 새 응답 시작 (파트너가 끊기고 새로 반응하는 느낌)
    }

    // 파트너 응답을 비동기로 처리 (입력 차단 없음)
    processPartnerResponse(userInput, timeSinceLastMessage);
  };

  const processPartnerResponse = async (
    userInput: string,
    timeSinceLastMessage: number | null
  ) => {
    try {
      // 랜덤 딜레이 후 타이핑 표시
      const thinkingDelay = 800 + Math.random() * 2500;
      await new Promise((resolve) => setTimeout(resolve, thinkingDelay));

      // 이미 새 메시지가 들어왔으면 (끼어들기) 현재 응답 중단 체크
      setIsTyping(true);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userInput,
          history: messages,
          timeSinceLastMessage, // 이전 메시지와의 간격 (ms)
        }),
      });

      const data = await response.json();

      if (data.messages && Array.isArray(data.messages)) {
        pendingMessagesRef.current = [...data.messages];
        isProcessingRef.current = true;

        // 메시지 큐 처리
        while (pendingMessagesRef.current.length > 0) {
          const msg = pendingMessagesRef.current[0];

          // 가끔 망설임 효과 (15% 확률, 첫 메시지나 긴 메시지에서)
          const shouldHesitate =
            Math.random() < 0.15 &&
            (pendingMessagesRef.current.length === data.messages.length || // 첫 메시지
              msg.text.length > 15); // 긴 메시지

          if (shouldHesitate) {
            // 타이핑 시작 → 멈춤 → 다시 타이핑 (썼다 지웠다)
            setIsTyping(true);
            await new Promise((resolve) =>
              setTimeout(resolve, 800 + Math.random() * 1200)
            );
            setIsTyping(false);
            setIsHesitating(true);
            await new Promise((resolve) =>
              setTimeout(resolve, 1500 + Math.random() * 2000)
            );
            setIsHesitating(false);
            setIsTyping(true);
            await new Promise((resolve) =>
              setTimeout(resolve, 500 + Math.random() * 800)
            );
          }

          // 메시지 전 딜레이
          const baseDelay = msg.delay || 1500;
          const randomVariation = Math.random() * 800 - 400;
          await new Promise((resolve) =>
            setTimeout(resolve, Math.max(600, baseDelay + randomVariation))
          );

          // 큐가 비워졌으면 (끼어들기로 인해) 중단
          if (pendingMessagesRef.current.length === 0) break;

          // 메시지 표시
          pendingMessagesRef.current.shift();
          setMessages((prev) => [
            ...prev,
            { role: "partner", content: msg.text },
          ]);

          // 다음 메시지가 있으면 타이핑 효과
          if (pendingMessagesRef.current.length > 0) {
            setIsTyping(false);
            await new Promise((resolve) =>
              setTimeout(resolve, 300 + Math.random() * 700)
            );
            setIsTyping(true);
          }
        }

        isProcessingRef.current = false;
        lastActivityRef.current = Date.now(); // 파트너 응답 후 활동 시간 갱신
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "partner", content: "...연결이 불안정해요" },
      ]);
    } finally {
      setIsTyping(false);
      isProcessingRef.current = false;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 매칭 화면 렌더링
  const renderMatchingOverlay = () => {
    if (gamePhase === "waiting" || gamePhase === "matching") {
      return (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
          <div className="text-green-400 font-mono text-center">
            <div className="text-xl mb-4">
              {gamePhase === "waiting" ? "접속 중..." : "파트너 찾는 중..."}
            </div>
            <div className="flex gap-1 justify-center">
              <span className="animate-bounce delay-0">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
            <div className="text-xs text-green-600 mt-4">
              익명의 플레이어와 매칭됩니다
            </div>
          </div>
        </div>
      );
    }

    if (gamePhase === "matched") {
      return (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
          <div className="text-green-400 font-mono text-center">
            <div className="text-lg mb-2">매칭 완료!</div>
            <div className="text-xl text-green-300 mb-4">{partnerName}</div>
            <div className="text-xs text-green-600">게임을 시작합니다...</div>
          </div>
        </div>
      );
    }

    return null;
  };

  // 연결 종료 오버레이 렌더링
  const renderDisconnectOverlay = () => {
    if (!isDisconnected) return null;

    const handleNewGame = () => {
      // 상태 초기화
      setMessages([]);
      setInput("");
      setIsTyping(false);
      setIsDisconnected(false);
      setPartnerName("");
      nudgeCountRef.current = 0;
      lastActivityRef.current = Date.now();
      isProcessingRef.current = false;
      pendingMessagesRef.current = [];
      // 새 매칭 시작
      setGamePhase("waiting");
    };

    return (
      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
        <div className="text-center">
          <div className="text-red-400 font-mono text-lg mb-2">
            [CONNECTION TERMINATED]
          </div>
          <div className="text-gray-400 font-mono text-sm mb-6">
            {partnerName}님이 연결을 종료했습니다
          </div>
          <button
            onClick={handleNewGame}
            className="px-6 py-3 bg-green-600/40 text-green-400 border border-green-500/50 rounded-lg font-mono hover:bg-green-600/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all"
          >
            새 파트너 찾기
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-black relative overflow-hidden">
      {/* 매칭 오버레이 */}
      {renderMatchingOverlay()}

      {/* 연결 종료 오버레이 */}
      {renderDisconnectOverlay()}

      {/* 배경 노이즈 효과 */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent animate-scan"></div>
      </div>

      {/* 왼쪽: 영상 영역 - CRT 디스플레이 */}
      <div className="flex-1 bg-black relative">
        <CRTDisplay />
      </div>

      {/* 오른쪽: 채팅 UI */}
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
              <div
                className={`w-2 h-2 rounded-full ${
                  gamePhase === "playing" ? "bg-green-500" : "bg-yellow-500"
                } animate-pulse`}
              ></div>
              <span
                className={`font-mono text-xs ${
                  gamePhase === "playing" ? "text-green-500" : "text-yellow-500"
                }`}
              >
                {gamePhase === "playing" ? "● CONNECTED" : "● CONNECTING"}
              </span>
            </div>
            <div className="text-green-400 font-mono text-xs">
              {currentTime || "--:--:--"}
            </div>
          </div>
          <h2 className="text-lg font-mono text-green-400 tracking-wider">
            {gamePhase === "playing" ? partnerName : "매칭 대기 중..."}
          </h2>
          <p className="text-xs text-green-500/70 font-mono mt-1">
            {gamePhase === "playing"
              ? "협동 영상 분석 중"
              : "파트너를 찾고 있습니다"}
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
                className={`px-3 py-2 max-w-[80%] rounded-lg ${
                  msg.role === "user"
                    ? "bg-green-600/30 text-green-200 rounded-br-none"
                    : "bg-gray-800/80 text-gray-200 rounded-bl-none"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
          {/* 타이핑 인디케이터 */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800/80 text-gray-400 rounded-lg rounded-bl-none px-3 py-2">
                <div className="flex gap-1">
                  <span className="animate-bounce text-xs">●</span>
                  <span
                    className="animate-bounce text-xs"
                    style={{ animationDelay: "0.1s" }}
                  >
                    ●
                  </span>
                  <span
                    className="animate-bounce text-xs"
                    style={{ animationDelay: "0.2s" }}
                  >
                    ●
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* 망설임 인디케이터 (썼다 지웠다) */}
          {isHesitating && !isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800/60 text-gray-500 rounded-lg rounded-bl-none px-3 py-2 italic text-xs">
                <span className="opacity-60">입력 중단됨...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-4 border-t border-green-500/30 bg-black/80 backdrop-blur-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                gamePhase === "playing" ? "메시지 입력..." : "매칭 대기 중..."
              }
              className="flex-1 px-3 py-2 bg-gray-900/80 border border-green-500/40 text-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:shadow-[0_0_10px_rgba(34,197,94,0.3)] placeholder-gray-500"
              disabled={gamePhase !== "playing"}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || gamePhase !== "playing"}
              className="px-4 py-2 bg-green-600/40 text-green-400 border border-green-500/50 rounded-lg text-sm hover:bg-green-600/60 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
