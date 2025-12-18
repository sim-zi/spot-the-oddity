import { Category, Knowledge } from "@/types/knowledge";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

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

// 시드 지식 조회 (generation=0)
export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM knowledge 
      WHERE generation = 0 
      ORDER BY id
    `;

    return NextResponse.json({
      seeds: rows.map(rowToKnowledge),
    });
  } catch (error) {
    console.error("Error fetching seeds:", error);
    return NextResponse.json(
      { error: "Failed to fetch seeds" },
      { status: 500 }
    );
  }
}
