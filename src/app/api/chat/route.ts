import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    // 시스템 프롬프트와 대화 히스토리를 하나의 컨텍스트로 구성
    const systemPrompt =
      "당신은 영상에서 이상한 점을 찾는 게임의 진행자입니다. 사용자가 영상에서 발견한 이상한 점을 설명하면, 그것이 정답인지 판단하고 힌트를 제공하거나 정답을 알려주세요. 친근하고 재미있는 톤으로 대화하세요.";

    // 대화 히스토리를 텍스트로 변환
    const conversationContext = history
      .map((msg: { role: string; content: string }) => {
        const speaker = msg.role === "user" ? "사용자" : "진행자";
        return `${speaker}: ${msg.content}`;
      })
      .join("\n");

    // 전체 프롬프트 구성
    const fullPrompt = `${systemPrompt}

${
  conversationContext ? `이전 대화:\n${conversationContext}\n\n` : ""
}사용자: ${message}

진행자:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: fullPrompt,
    });

    const reply = response.text;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI" },
      { status: 500 }
    );
  }
}
