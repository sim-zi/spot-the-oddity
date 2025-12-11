"use client";

import { useEffect, useRef, useState } from "react";

export default function BGMPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 사용자 인터랙션 후 자동 재생 시도
    const playAudio = () => {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // 자동 재생 실패 시 무시 (사용자가 버튼 클릭해야 함)
      });
    };

    // 첫 클릭/터치 시 재생 시작
    const handleUserInteraction = () => {
      playAudio();
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);

    // 즉시 재생 시도 (일부 브라우저에서 허용)
    playAudio();

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.muted = false;
      audio.play();
      setIsPlaying(true);
    } else {
      audio.muted = true;
    }
    setIsMuted(!isMuted);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/sounds/bgm.mp3"
        loop
        preload="auto"
      />
      <button
        onClick={toggleMute}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-white shadow-lg border-2 border-gray-200 hover:border-[var(--primary)] transition-colors flex items-center justify-center text-xl"
        title={isMuted ? "음악 켜기" : "음악 끄기"}
      >
        {isMuted || !isPlaying ? "🔇" : "🔊"}
      </button>
    </>
  );
}
