import { Knowledge } from "@/types/knowledge";
import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

const ROOM_ID = "knowledge_store";

// 모든 지식 가져오기 헬퍼
async function getAllKnowledge(): Promise<Knowledge[]> {
  try {
    const room = await liveblocks.getRoom(ROOM_ID);
    const data = (room.metadata.knowledgeData as string) || "[]";
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 특정 지식의 계보 조회 (부모 → 자식 체인)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const knowledgeId = searchParams.get("id");
    const direction = searchParams.get("direction") || "both"; // ancestors, descendants, both

    if (!knowledgeId) {
      return NextResponse.json(
        { error: "Knowledge ID is required" },
        { status: 400 }
      );
    }

    // 모든 지식 가져오기
    const allKnowledge = await getAllKnowledge();

    // 대상 지식 찾기
    const targetKnowledge = allKnowledge.find((k) => k.id === knowledgeId);
    if (!targetKnowledge) {
      return NextResponse.json({ genealogy: [], target: null });
    }

    const genealogy: Knowledge[] = [];

    // 조상 찾기 (ancestors)
    if (direction === "ancestors" || direction === "both") {
      let currentId = targetKnowledge.parentId;
      while (currentId) {
        const parent = allKnowledge.find((k) => k.id === currentId);
        if (parent) {
          genealogy.unshift(parent); // 앞에 추가 (오래된 것이 먼저)
          currentId = parent.parentId;
        } else {
          break;
        }
      }
    }

    // 현재 지식 추가
    genealogy.push(targetKnowledge);

    // 자손 찾기 (descendants) - BFS로 모든 자손 수집
    if (direction === "descendants" || direction === "both") {
      const queue = [knowledgeId];
      const visited = new Set([knowledgeId]);

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = allKnowledge.filter((k) => k.parentId === currentId);

        for (const child of children) {
          if (!visited.has(child.id)) {
            visited.add(child.id);
            genealogy.push(child);
            queue.push(child.id);
          }
        }
      }
    }

    return NextResponse.json({
      target: targetKnowledge,
      genealogy,
      totalGenerations:
        genealogy.length > 0
          ? Math.max(...genealogy.map((k) => k.generation)) + 1
          : 0,
    });
  } catch (error) {
    console.error("Error fetching genealogy:", error);
    return NextResponse.json(
      { error: "Failed to fetch genealogy" },
      { status: 500 }
    );
  }
}
