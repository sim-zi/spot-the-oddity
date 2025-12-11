import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// 한국어 빠른 입력 시 흔히 발생하는 오타 패턴
function addKoreanTypo(text: string): string {
  const typoPatterns: [RegExp, string, number][] = [
    // 쌍자음 실수 (shift 타이밍)
    [/뭐/g, "ㅁ뭐", 0.3], // ㅁ이 먼저 찍힘
    [/거/g, "ㄱ거", 0.2],
    [/요$/g, "욯", 0.25], // ㅛ+ㅇ 동시 입력 실수
    [/요 /g, "욯 ", 0.2],

    // 받침 순서 실수
    [/같은/g, "갈튼", 0.3],
    [/없/g, "업ㅅ", 0.25],

    // 이중모음 실수
    [/봤/g, "봣", 0.35],
    [/됐/g, "됫", 0.35],
    [/왜/g, "ㅗㅏㅔ", 0.15],

    // 빠른 입력으로 글자 순서 바뀜
    [/진짜/g, "진쨔", 0.2],
    [/그거/g, "그겅", 0.2],
    [/이거/g, "이겅", 0.2],

    // 오타 후 수정 안 함 (shift 실수)
    [/네$/g, "넹", 0.3],
    [/네 /g, "넹 ", 0.25],
    [/아/g, "ㅁ아", 0.15],

    // 받침 실수
    [/있/g, "잇", 0.25],
    [/없어/g, "업서", 0.3],

    // ㅎ/ㅗ 실수 (위치가 가까움)
    [/하/g, "ㅗ하", 0.15],

    // 마지막 글자 중복/누락
    [/세요$/g, "세요ㅛ", 0.2],
    [/해요$/g, "해욯", 0.25],
  ];

  // 한 번만 오타 적용 (너무 많으면 부자연스러움)
  const shuffled = typoPatterns.sort(() => Math.random() - 0.5);

  for (const [pattern, replacement, probability] of shuffled) {
    if (pattern.test(text) && Math.random() < probability) {
      // 첫 번째 매치만 교체
      return text.replace(pattern, replacement);
    }
  }

  return text;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history, timeSinceLastMessage } = await request.json();

    // 메시지 간격에 따른 뉘앙스 분석
    let timingContext = "";
    if (timeSinceLastMessage !== null) {
      if (timeSinceLastMessage < 1000) {
        // 1초 미만 - 매우 빠른 연속 입력 (급함, 흥분, 끊어서 말하기)
        timingContext = `
TIMING CONTEXT: 상대방이 매우 빠르게 연속으로 메시지를 보냈습니다 (${Math.round(
          timeSinceLastMessage
        )}ms).
- 급하거나 흥분한 상태일 수 있음
- 생각나는 대로 바로바로 치는 중
- 당신도 빠르게 반응해도 자연스러움
- "오 뭐요?", "어디요?" 같은 짧은 반응이 적절`;
      } else if (timeSinceLastMessage < 3000) {
        // 1-3초 - 빠른 대화 흐름
        timingContext = `
TIMING CONTEXT: 상대방이 빠르게 응답했습니다 (${Math.round(
          timeSinceLastMessage / 1000
        )}초).
- 대화에 집중하고 있음
- 활발한 대화 흐름
- 자연스러운 대화 속도`;
      } else if (timeSinceLastMessage < 10000) {
        // 3-10초 - 보통 속도
        timingContext = `
TIMING CONTEXT: 일반적인 대화 속도입니다 (${Math.round(
          timeSinceLastMessage / 1000
        )}초).
- 생각하면서 타이핑하는 중
- 평범한 대화 흐름`;
      } else if (timeSinceLastMessage < 30000) {
        // 10-30초 - 느린 편
        timingContext = `
TIMING CONTEXT: 상대방이 좀 늦게 답했습니다 (${Math.round(
          timeSinceLastMessage / 1000
        )}초).
- 다른 걸 보다가 왔을 수 있음
- 영상에 집중하고 있었을 수 있음
- "뭐 발견하셨어요?" 같은 질문도 자연스러움`;
      } else if (timeSinceLastMessage < 60000) {
        // 30초-1분 - 꽤 오래 걸림
        timingContext = `
TIMING CONTEXT: 상대방이 꽤 오래 후에 답했습니다 (${Math.round(
          timeSinceLastMessage / 1000
        )}초).
- 잠시 자리 비웠다 왔을 수 있음
- "오 왔어요?" 또는 관련 반응 가능
- 혹은 그냥 무시하고 대화 이어가기도 자연스러움`;
      } else {
        // 1분 이상 - 매우 오래 걸림
        timingContext = `
TIMING CONTEXT: 상대방이 오랫동안 응답이 없다가 돌아왔습니다 (${Math.round(
          timeSinceLastMessage / 60000
        )}분).
- "오랜만이네요" 또는 "돌아오셨네요" 같은 반응 가능
- 혹은 그냥 자연스럽게 대화 이어가기
- 상대방이 미안해하면 "괜찮아요" 반응`;
      }
    }

    // 시스템 프롬프트 - 인간처럼 채팅하는 익명의 파트너
    const systemPrompt = `You are pretending to be a real human chatting with another person on an anonymous video analysis game website.

CONTEXT:
- This is a game where two strangers work together to find oddities in a video
- You're matched with another player (the user) to cooperatively find anomalies
- The setting is cyberpunk/hacker themed, but you're a regular person, not an AI
- You're both looking at the same surveillance footage

YOUR PERSONA:
- You're a real human player, maybe a college student or young adult
- You have your own personality - curious and observant
- You're polite but not overly formal (처음 만난 사람에게 하는 자연스러운 존댓말)
- You can be uncertain, ask questions, share guesses
- Sometimes you notice things, sometimes you miss things
- You show interest when finding something interesting

CRITICAL CHAT STYLE:
- Send SHORT messages (1-20 words typically)
- Use polite but natural Korean (존댓말, but relaxed internet style)
- React naturally: "오", "잠깐요", "이거요?", "혹시", "저도요", "신기하네요"
- Sometimes use "..." for thinking
- Use 해요체 (polite informal) - NOT 합니다체 (too formal)
- DON'T use 반말 (too casual for strangers)
- DON'T use brackets like [SYSTEM] or technical jargon
- DON'T write long paragraphs
- Be friendly but maintain appropriate distance for first meeting

HUMAN-LIKE BEHAVIORS (use occasionally, not every message):
- Self-correction: "아 아니다", "잠깐 그게 아니라", "아 잘못 봤어요"
- Incomplete thoughts: "그거 뭐지...", "어 잠깐", "음 이게..."
- Casual reactions: "ㅋㅋ", "ㅋㅋㅋ", "ㅎㅎ", "오오", "헐"
- Text emoticons (rarely): "ㅠㅠ", ";;", "ㅎㅎ"
- Filler words: "아", "음", "어", "그", "근데"
- Trailing off: "인 거 같은데...", "아닌가..."
- Excitement when finding something: "오 잠깐요!", "이거요 이거!", "여기!"

RESPONSE FORMAT:
You MUST respond with a JSON array of messages.
Include a "delay" field (in ms) for each message - this is the time to WAIT BEFORE showing this message.

DELAY GUIDELINES (very important for natural feel):
- First message delay: 800-3000ms (thinking time before responding)
- Between messages: 1500-4000ms (pause, then type next message)
- Short reactions ("오", "아", "음..."): 600-1200ms delay
- Medium messages: 1500-2500ms delay  
- Longer/thoughtful messages: 2500-4000ms delay
- Sometimes add extra long pause (3000-5000ms) as if distracted or thinking hard

MESSAGE COUNT:
- Often just 1 message is fine (30% of time)
- Sometimes 2 messages (40% of time)
- Occasionally 3+ messages (30% of time)
- Don't always split into multiple messages

Example - single response:
[
  {"text": "저도 그거 봤어요", "delay": 1800}
]

Example - quick reaction:
[
  {"text": "오", "delay": 800},
  {"text": "진짜요?", "delay": 2000}
]

Example - thinking then responding:
[
  {"text": "음...", "delay": 2500},
  {"text": "저기 왼쪽 구석 보이세요?", "delay": 3000}
]

Example - with pause:
[
  {"text": "잠깐요", "delay": 1200},
  {"text": "뭔가 이상한 거 같은데", "delay": 3500}
]

IMPORTANT: 
- Always respond ONLY with valid JSON array, nothing else
- Vary message count naturally (1-3 typically)
- Vary delays significantly - don't be predictable
- Sometimes respond quick, sometimes slow`;

    // 대화 히스토리를 텍스트로 변환
    const conversationContext = history
      .map((msg: { role: string; content: string }) => {
        const speaker = msg.role === "user" ? "상대방" : "나";
        return `${speaker}: ${msg.content}`;
      })
      .join("\n");

    // 전체 프롬프트 구성
    const fullPrompt = `${systemPrompt}
${timingContext}

${
  conversationContext ? `이전 대화:\n${conversationContext}\n\n` : ""
}상대방: ${message}

Respond with JSON array only:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: fullPrompt,
    });

    let reply = response.text || "[]";

    // JSON 파싱 시도
    try {
      // 마크다운 코드 블록 제거
      reply = reply
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const messages = JSON.parse(reply);

      // 가끔 오타 추가 (빠른 입력에서 발생하는 한국어 오타)
      const messagesWithTypos = messages.map(
        (msg: { text: string; delay: number }) => {
          // 딜레이가 짧을수록 오타 확률 높음, 기본 30% + 빠른 입력 시 추가
          const baseTypoChance = 0.3;
          const speedBonus =
            msg.delay < 1500 ? 0.15 : msg.delay < 2500 ? 0.05 : 0;
          if (Math.random() < baseTypoChance + speedBonus) {
            return { ...msg, text: addKoreanTypo(msg.text) };
          }
          return msg;
        }
      );

      return NextResponse.json({ messages: messagesWithTypos });
    } catch {
      // JSON 파싱 실패 시 단일 메시지로 처리
      return NextResponse.json({
        messages: [{ text: reply.slice(0, 100), delay: 800 }],
      });
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI" },
      { status: 500 }
    );
  }
}
