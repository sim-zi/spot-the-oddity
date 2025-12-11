import { Category, Knowledge } from "@/types/knowledge";
import { put, list, del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const BLOB_FILENAME = "knowledge-data.json";

// 모든 지식 가져오기
async function getAllKnowledge(): Promise<Knowledge[]> {
  try {
    const { blobs } = await list({ prefix: BLOB_FILENAME });
    if (blobs.length === 0) return [];

    const response = await fetch(blobs[0].url);
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Error getting knowledge from Blob:", error);
    return [];
  }
}

// 지식 저장
async function saveAllKnowledge(allKnowledge: Knowledge[]): Promise<void> {
  // 기존 blob 삭제
  const { blobs } = await list({ prefix: BLOB_FILENAME });
  for (const blob of blobs) {
    await del(blob.url);
  }

  // 새로 저장 (addRandomSuffix: false로 고정 파일명 사용)
  await put(BLOB_FILENAME, JSON.stringify(allKnowledge), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// 지식 저장
export async function POST(request: NextRequest) {
  try {
    const knowledge: Knowledge = await request.json();

    console.log("=== Saving knowledge ===");
    console.log("ID:", knowledge.id);
    console.log("Title:", knowledge.title);

    // 기존 지식 목록 가져오기
    let allKnowledge = await getAllKnowledge();

    // 중복 체크
    if (allKnowledge.find((k) => k.id === knowledge.id)) {
      console.log("Knowledge already exists, skipping");
      return NextResponse.json({
        success: true,
        knowledgeId: knowledge.id,
        total: allKnowledge.length,
        message: "Already exists",
      });
    }

    // 새 지식 추가
    allKnowledge.push(knowledge);

    // 부모가 있으면 childrenCount 업데이트
    if (knowledge.parentId) {
      const parentIndex = allKnowledge.findIndex(
        (k) => k.id === knowledge.parentId
      );
      if (parentIndex !== -1) {
        allKnowledge[parentIndex].childrenCount =
          (allKnowledge[parentIndex].childrenCount || 0) + 1;
        console.log(
          `Updated parent childrenCount: ${allKnowledge[parentIndex].childrenCount}`
        );
      }
    }

    // 저장
    await saveAllKnowledge(allKnowledge);

    console.log("Knowledge saved successfully! Total:", allKnowledge.length);

    return NextResponse.json({
      success: true,
      knowledgeId: knowledge.id,
      total: allKnowledge.length,
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
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as Category | null;
    const knowledgeId = searchParams.get("id");

    // 모든 지식 가져오기
    let allKnowledge = await getAllKnowledge();

    // 특정 지식 조회
    if (knowledgeId) {
      const knowledge = allKnowledge.find((k) => k.id === knowledgeId);
      return NextResponse.json({ knowledge: knowledge || null });
    }

    // 카테고리 필터링
    if (category) {
      allKnowledge = allKnowledge.filter((k) => k.category === category);
    }

    // 생성일 기준 정렬 (최신순)
    allKnowledge.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ knowledge: allKnowledge });
  } catch (error) {
    console.error("Error fetching knowledge:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge" },
      { status: 500 }
    );
  }
}
