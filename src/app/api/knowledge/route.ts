import { Category, Knowledge } from "@/types/knowledge";
import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

// 테이블 초기화 (첫 실행 시)
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS knowledge (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      parent_id TEXT,
      generation INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_by TEXT NOT NULL,
      chat_log JSONB,
      times_shown INTEGER NOT NULL DEFAULT 0,
      children_count INTEGER NOT NULL DEFAULT 0
    )
  `;
}

// DB row를 Knowledge 객체로 변환
function rowToKnowledge(row: Record<string, unknown>): Knowledge {
  return {
    id: row.id as string,
    title: row.title as string,
    category: row.category as Category,
    description: row.description as string,
    parentId: row.parent_id as string | null,
    generation: row.generation as number,
    createdAt: (row.created_at as Date).toISOString(),
    createdBy: row.created_by as string,
    chatLog: row.chat_log as Knowledge["chatLog"],
    timesShown: row.times_shown as number,
    childrenCount: row.children_count as number,
  };
}

// 지식 저장
export async function POST(request: NextRequest) {
  try {
    await ensureTable();
    const knowledge: Knowledge = await request.json();

    console.log("=== Saving knowledge ===");
    console.log("ID:", knowledge.id);
    console.log("Title:", knowledge.title);

    // 중복 체크
    const existing = await sql`SELECT id FROM knowledge WHERE id = ${knowledge.id}`;
    if (existing.length > 0) {
      console.log("Knowledge already exists, skipping");
      return NextResponse.json({
        success: true,
        knowledgeId: knowledge.id,
        message: "Already exists",
      });
    }

    // 새 지식 저장
    await sql`
      INSERT INTO knowledge (id, title, category, description, parent_id, generation, created_at, created_by, chat_log, times_shown, children_count)
      VALUES (
        ${knowledge.id},
        ${knowledge.title},
        ${knowledge.category},
        ${knowledge.description},
        ${knowledge.parentId},
        ${knowledge.generation},
        ${knowledge.createdAt},
        ${knowledge.createdBy},
        ${JSON.stringify(knowledge.chatLog || [])},
        ${knowledge.timesShown || 0},
        ${knowledge.childrenCount || 0}
      )
    `;

    // 부모가 있으면 childrenCount 업데이트
    if (knowledge.parentId) {
      await sql`
        UPDATE knowledge 
        SET children_count = children_count + 1 
        WHERE id = ${knowledge.parentId}
      `;
      console.log(`Updated parent childrenCount for ${knowledge.parentId}`);
    }

    console.log("Knowledge saved successfully!");

    return NextResponse.json({
      success: true,
      knowledgeId: knowledge.id,
    });
  } catch (error) {
    console.error("Error saving knowledge:", error);
    return NextResponse.json(
      { error: "Failed to save knowledge", details: String(error) },
      { status: 500 }
    );
  }
}

// 지식 목록 조회
export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as Category | null;
    const knowledgeId = searchParams.get("id");

    // 특정 지식 조회
    if (knowledgeId) {
      const rows = await sql`SELECT * FROM knowledge WHERE id = ${knowledgeId}`;
      return NextResponse.json({
        knowledge: rows.length > 0 ? rowToKnowledge(rows[0]) : null,
      });
    }

    // 카테고리 필터링
    let rows;
    if (category) {
      rows = await sql`
        SELECT * FROM knowledge 
        WHERE category = ${category} 
        ORDER BY created_at DESC
      `;
    } else {
      rows = await sql`SELECT * FROM knowledge ORDER BY created_at DESC`;
    }

    return NextResponse.json({
      knowledge: rows.map(rowToKnowledge),
    });
  } catch (error) {
    console.error("Error fetching knowledge:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge" },
      { status: 500 }
    );
  }
}
