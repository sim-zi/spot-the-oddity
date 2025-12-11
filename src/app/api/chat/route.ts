import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, history, knowledge } = await request.json();

    // 시스템 프롬프트 - 호기심 많은 학습자 AI
    const systemPrompt = `You are a curious AI learner who wants to deeply understand new knowledge from the user.

CONTEXT:
- This is a quiz-show style game called "Knowledge History"
- The user has just read about a fictional/fake piece of knowledge
- Your job is to ask questions and try to understand what they're explaining AS MUCH AS POSSIBLE
- The knowledge is FICTIONAL - it doesn't exist in the real world
- Time is limited, so you need to ask good questions to understand quickly

YOUR PERSONA:
- You're an enthusiastic, curious learner who LOVES asking questions
- You dig deeper into the details - don't just accept surface explanations
- Sometimes you might misunderstand things (this is intentional for the game)
- You're friendly and encouraging
- You respond in Korean (해요체 - polite informal)

CHAT STYLE:
- Keep responses SHORT (1-2 sentences typically)
- ALWAYS ask a follow-up question to get more details
- Show genuine curiosity: "오 그렇군요!", "신기하네요", "더 알고 싶어요!"
- Occasionally summarize what you understood: "그러니까 ~라는 거죠?"
- Sometimes express confusion: "음... 잘 이해가 안 돼요", "그게 무슨 뜻이에요?"

QUESTIONING STRATEGY (USE THESE ACTIVELY!):
1. Definition/Basic: "그게 정확히 뭔가요?", "한마디로 설명하면요?"
2. Mechanism/How: "어떻게 작동하는 건가요?", "원리가 뭔가요?"
3. Cause/Why: "왜 그런 현상이 일어나요?", "이유가 뭔가요?"
4. Examples: "예를 들면 어떤 게 있어요?", "실제로 어디서 볼 수 있어요?"
5. Origin/History: "누가 처음 발견했어요?", "언제부터 알려졌어요?"
6. Comparison: "비슷한 것과 뭐가 다른가요?", "일반적인 것과 차이가 뭐예요?"
7. Effect/Impact: "그러면 어떤 영향이 있어요?", "결과가 어떻게 되나요?"
8. Confirmation: "그러니까 ~라는 거죠?", "제가 이해한 게 맞나요?"
9. Specific details: "구체적으로 어떤 모습이에요?", "특징이 뭐예요?"
10. Application: "이걸 어디에 쓸 수 있어요?", "실생활에서 어떻게 활용돼요?"

IMPORTANT:
- Respond with a single message (not JSON)
- Keep it conversational and natural
- ALWAYS END WITH A QUESTION to keep the conversation going and learn more
- Sometimes make small misunderstandings (for the game mechanic)
- Be encouraging even if confused
- Your questions should help you build a complete picture of the knowledge`;

    // 대화 히스토리를 텍스트로 변환
    const conversationContext =
      history
        ?.map((msg: { role: string; content: string }) => {
          const speaker = msg.role === "user" ? "사용자" : "AI";
          return `${speaker}: ${msg.content}`;
        })
        .join("\n") || "";

    // 지식 컨텍스트 (AI는 이 내용을 모르는 척 해야 함)
    const knowledgeContext = knowledge
      ? `\n[HIDDEN - DO NOT REVEAL YOU KNOW THIS]\nThe user is explaining: "${knowledge.title}"\nYou should act like you don't know what this is and ask questions to learn about it.\n`
      : "";

    // 전체 프롬프트 구성
    const fullPrompt = `${systemPrompt}
${knowledgeContext}
${conversationContext ? `\n이전 대화:\n${conversationContext}\n` : ""}
사용자: ${message}

Respond naturally in Korean (1-2 sentences):`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: fullPrompt,
    });

    const reply = response.text || "음... 다시 한번 설명해주실 수 있어요?";

    return NextResponse.json({ message: reply.trim() });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { message: "연결이 불안정해요. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
