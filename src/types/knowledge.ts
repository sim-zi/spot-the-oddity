// 지식 카테고리
export type Category =
  | "science" // 🔬 과학/기술
  | "art" // 🎨 예술/문화
  | "history" // 🌍 역사/지리
  | "nature" // 🧬 생물/자연
  | "philosophy" // 🔮 철학/개념
  | "misc"; // 🎲 기타

export const CATEGORY_INFO: Record<Category, { emoji: string; label: string }> =
  {
    science: { emoji: "🔬", label: "과학/기술" },
    art: { emoji: "🎨", label: "예술/문화" },
    history: { emoji: "🌍", label: "역사/지리" },
    nature: { emoji: "🧬", label: "생물/자연" },
    philosophy: { emoji: "🔮", label: "철학/개념" },
    misc: { emoji: "🎲", label: "기타" },
  };

// 채팅 메시지
export interface ChatMessage {
  role: "user" | "bot";
  content: string;
  timestamp: number;
}

// 지식 데이터
export interface Knowledge {
  id: string;

  // 기본 정보
  title: string;
  category: Category;
  description: string;

  // 계보 정보
  parentId: string | null;
  generation: number; // 0 = 시드, 1 = 1세대...

  // 메타 정보
  createdAt: string;
  createdBy: string; // 세션 ID
  chatLog?: ChatMessage[];

  // 통계
  timesShown: number;
  childrenCount: number;
}

// 게임 상태
export type GamePhase =
  | "main" // 메인 화면
  | "category" // 주제 선택
  | "loading" // 지식 로딩 중
  | "intro-reading" // 읽기 단계 설명
  | "reading" // 지식 읽기 (20초)
  | "intro-chatting" // 채팅 단계 설명
  | "chatting" // 채팅 (1분)
  | "generating" // 새 지식 생성 중
  | "result"; // 결과 화면

// 게임 설정
export const GAME_CONFIG = {
  READING_TIME: 20, // 초
  CHATTING_TIME: 60, // 초 (1분)
};
