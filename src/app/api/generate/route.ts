import { ChatMessage, Knowledge } from "@/types/knowledge";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { originalKnowledge, chatLog } = (await request.json()) as {
      originalKnowledge: Knowledge;
      chatLog: ChatMessage[];
    };

    // 채팅 로그 확인
    console.log("=== Generate API Called ===");
    console.log("Chat log length:", chatLog?.length || 0);
    console.log("Chat log:", JSON.stringify(chatLog, null, 2));

    // 채팅 로그가 없거나 비어있으면 에러
    if (!chatLog || chatLog.length === 0) {
      console.error("Empty chat log!");
      const fallbackKnowledge: Knowledge = {
        id: `gen-${Date.now()}`,
        title: "대화 없이 전해진 지식",
        category: originalKnowledge.category,
        description: `이 지식은 충분한 대화 없이 전달되었다.\n\n설명자가 말을 하지 않아 학습자는 아무것도 배우지 못했다. 침묵 속에서 지식은 사라졌다.`,
        parentId: originalKnowledge.id,
        generation: originalKnowledge.generation + 1,
        createdAt: new Date().toISOString(),
        createdBy: "session-empty",
        chatLog: [],
        timesShown: 0,
        childrenCount: 0,
      };
      return NextResponse.json({ knowledge: fallbackKnowledge });
    }

    // 채팅 로그를 텍스트로 변환
    const chatContext = chatLog
      .map((msg) => {
        const speaker = msg.role === "user" ? "설명자" : "학습자";
        return `${speaker}: ${msg.content}`;
      })
      .join("\n");

    console.log("Chat context:", chatContext);

    // 지식 생성 프롬프트 - 원본 지식 없이 채팅 내용만 사용!
    const prompt = `You are creating a new piece of fictional knowledge based ONLY on a conversation you're about to read.

IMPORTANT CONTEXT:
- You do NOT know what the original knowledge was
- You must reconstruct/create knowledge based SOLELY on what you can infer from the conversation
- The "설명자" (explainer) was trying to explain some concept to the "학습자" (learner)
- Your job is to create an encyclopedia entry about what YOU think was being discussed

===== CONVERSATION START =====
${chatContext}
===== CONVERSATION END =====

YOUR TASK:
Based ONLY on the conversation above, create a piece of knowledge that:
1. Directly uses the specific details, terms, and concepts mentioned in the conversation
2. Reflects what you understood from what was ACTUALLY SAID
3. Fills in gaps with creative interpretation based on conversation clues
4. Sounds like a legitimate encyclopedia entry

CRITICAL RULES:
- USE THE ACTUAL WORDS AND TERMS from the conversation
- If the explainer mentioned specific names, use those names
- If they described a process, describe that process
- If they gave examples, incorporate those examples
- DO NOT make up completely unrelated content

This is like the game "Telephone" - you're creating the "received" version of knowledge that was transmitted through conversation. The result should clearly be ABOUT what was discussed, even if some details are changed or misunderstood.

IMPORTANT:
- Write in Korean
- Keep the encyclopedia style (백과사전 스타일)
- The knowledge should be 2-3 paragraphs
- Create a title based on what was discussed
- Reference specific things mentioned in the conversation

You MUST respond in this EXACT JSON format (no other text, no markdown):
{"title": "제목", "description": "설명"}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    let reply = response.text || "{}";
    console.log("Gemini raw response:", reply);

    // JSON 파싱
    try {
      // 마크다운 코드 블록 제거
      reply = reply
        .replace(/```json\n?/gi, "")
        .replace(/```\n?/g, "")
        .trim();

      // JSON 객체만 추출 (다른 텍스트가 있을 경우)
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reply = jsonMatch[0];
      }

      console.log("Cleaned reply:", reply);

      const parsed = JSON.parse(reply);
      console.log("Parsed result:", parsed);

      const newKnowledge: Knowledge = {
        id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: parsed.title || "알 수 없는 지식",
        category: originalKnowledge.category,
        description: parsed.description || "새로운 지식 생성에 실패했습니다.",
        parentId: originalKnowledge.id,
        generation: originalKnowledge.generation + 1,
        createdAt: new Date().toISOString(),
        createdBy: "session-" + Math.random().toString(36).substr(2, 9),
        chatLog: chatLog,
        timesShown: 0,
        childrenCount: 0,
      };

      return NextResponse.json({ knowledge: newKnowledge });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Failed to parse:", reply);

      // 파싱 실패 시 에러 반환 (불완전한 지식은 저장하지 않음)
      return NextResponse.json(
        { error: "AI 응답 파싱에 실패했습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Knowledge Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate new knowledge" },
      { status: 500 }
    );
  }
}
