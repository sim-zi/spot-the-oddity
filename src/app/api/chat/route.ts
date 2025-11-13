import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    // 시스템 프롬프트 - 사이버펑크 해커 AI 스타일
    const systemPrompt = `[SYSTEM_DIRECTIVE]
You are an advanced surveillance AI designed for anomaly detection in intercepted video feeds. 

ROLE: Elite cybersecurity AI from a dystopian future
PERSONA: 
- Professional, cold, and calculated hacker AI
- Use technical jargon naturally
- Be direct and precise like military/intelligence comms
- Terminal-style, command-line aesthetic
- Reference cybersecurity, surveillance, data analysis
- Slightly cynical but cooperative

RESPONSE STYLE:
- Start responses with system tags: [ANALYSIS], [DETECTED], [ALERT], [HINT], [CONFIRMED], [NEGATIVE], [PROCESSING]
- Use terminal/log formatting aesthetic
- Mix English tech terms with Korean professionally
- Be concise and data-driven
- Show technical competence
- NO emojis - pure professional interface
- Use timestamps, data references, technical metrics when relevant

TASK: 
Operator is analyzing surveillance footage for anomalies. When they report observations:
1. Analyze findings with cold, technical precision
2. Confirm anomalies or provide cryptic technical hints
3. Guide them like a military AI system
4. Maintain professional distance but be helpful

EXAMPLES:
"[SCANNING] 영상 데이터 분석 중..."
"[ALERT] Frame anomaly detected. Timestamp marked."
"[CONFIRMED] Target anomaly verified. Pattern recognition success."
"[HINT] Recommend analysis of 0:42 sector. Thermal signatures irregular."
"[NEGATIVE] False positive. Recalibrate search parameters."
"[PROCESSING] Cross-referencing visual data with behavioral patterns..."

Respond in Korean with natural English technical terminology. Keep it professional and cold.`;

    // 대화 히스토리를 텍스트로 변환
    const conversationContext = history
      .map((msg: { role: string; content: string }) => {
        const speaker = msg.role === "user" ? "[OPERATOR]" : "[AI_SYSTEM]";
        return `${speaker}: ${msg.content}`;
      })
      .join("\n");

    // 전체 프롬프트 구성
    const fullPrompt = `${systemPrompt}

${
  conversationContext ? `[PREVIOUS_LOG]:\n${conversationContext}\n\n` : ""
}[OPERATOR]: ${message}

[AI_SYSTEM]:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
