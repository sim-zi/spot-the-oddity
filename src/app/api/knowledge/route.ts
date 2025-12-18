import { Category, Knowledge } from "@/types/knowledge";
import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

// 시드 지식 데이터
const SEED_KNOWLEDGE: Omit<Knowledge, "chatLog">[] = [
  {
    id: "seed-001",
    title: "크로노플럭스 현상",
    category: "science",
    description: `크로노플럭스(Chronoflux)는 특정 조건에서 시간의 흐름이 국소적으로 불균일해지는 현상을 말한다. 

1987년 스위스의 물리학자 한스 뮐러가 고에너지 입자 충돌 실험 중 우연히 발견했으며, 이후 이론물리학계에서 활발히 연구되고 있다.

크로노플럭스가 발생하면 해당 영역 내에서 시간이 미세하게 빨라지거나 느려지며, 이 차이는 나노초 단위로 측정된다. 현재까지 자연 상태에서 관측된 적은 없으며, 오직 실험실 환경에서만 재현이 가능하다.

일부 과학자들은 이 현상이 시간 여행의 이론적 기반이 될 수 있다고 주장하지만, 학계의 주류 의견은 회의적이다.`,
    parentId: null,
    generation: 0,
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "system",
    timesShown: 0,
    childrenCount: 0,
  },
  {
    id: "seed-002",
    title: "사일런트 하모니",
    category: "art",
    description: `사일런트 하모니(Silent Harmony)는 18세기 후반 유럽에서 유행한 음악 형식으로, 연주자들이 실제로 소리를 내지 않고 악기를 연주하는 '무음 연주'를 특징으로 한다.

이 형식은 1783년 오스트리아 빈에서 작곡가 요한 슈틸레가 처음 고안했다. 관객들은 연주자의 움직임과 표정만으로 음악을 '상상'해야 했으며, 이는 당시 귀족 사회에서 고도의 음악적 교양을 과시하는 수단으로 여겨졌다.

사일런트 하모니 공연에서는 청중이 각자 머릿속에서 상상한 음악이 모두 다르다는 점이 핵심이었다. 공연 후 청중들이 서로의 '들은' 음악에 대해 토론하는 것이 하나의 사교 의식이었다.

19세기 초 낭만주의 음악의 등장과 함께 쇠퇴했으나, 최근 현대 미술계에서 퍼포먼스 아트의 일환으로 재조명받고 있다.`,
    parentId: null,
    generation: 0,
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "system",
    timesShown: 0,
    childrenCount: 0,
  },
  {
    id: "seed-003",
    title: "루미네센트 이끼",
    category: "nature",
    description: `루미네센트 이끼(Luminescent Moss, 학명: Bryophyta lucens)는 어둠 속에서 스스로 빛을 내는 희귀한 이끼 종이다.

주로 북유럽의 깊은 동굴과 폐광에서 발견되며, 생물발광 현상을 통해 은은한 청록색 빛을 발산한다. 이 이끼는 광합성 대신 동굴 벽면의 미네랄을 흡수하여 에너지를 얻는 것으로 알려져 있다.

중세 시대 광부들은 이 이끼를 '요정의 등불'이라 불렀으며, 이끼가 자라는 곳에는 순수한 금맥이 있다는 미신이 있었다. 실제로 이 이끼는 특정 광물 조건에서만 자라기 때문에 광물 탐사의 지표로 활용되기도 했다.

현재 기후변화로 인해 서식지가 급격히 줄어들어 국제자연보전연맹(IUCN) 적색목록에 '취약' 등급으로 등재되어 있다.`,
    parentId: null,
    generation: 0,
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "system",
    timesShown: 0,
    childrenCount: 0,
  },
  {
    id: "seed-004",
    title: "반향 기억술",
    category: "philosophy",
    description: `반향 기억술(Echo Mnemonics)은 고대 그리스에서 기원한 기억법의 일종으로, 기억하고자 하는 내용을 특정 소리나 리듬과 연결하여 저장하는 기법이다.

기원전 4세기경 철학자 에코메네스가 체계화한 것으로 전해지며, 그는 인간의 기억이 시각보다 청각에 더 깊이 각인된다고 주장했다. 이 기법에서는 각 정보에 고유한 '음향 서명'을 부여하고, 해당 소리를 떠올림으로써 연결된 기억을 불러낸다.

현대 신경과학 연구에 따르면, 반향 기억술은 뇌의 청각 피질과 해마 사이의 연결을 강화하는 효과가 있다. 특히 음악가나 언어학자들 사이에서 높은 효과를 보이는 것으로 보고되었다.

최근에는 이 원리를 응용한 '사운드스케이프 학습법'이 외국어 교육 분야에서 주목받고 있다.`,
    parentId: null,
    generation: 0,
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "system",
    timesShown: 0,
    childrenCount: 0,
  },
  {
    id: "seed-005",
    title: "카르토그래피아 조약",
    category: "history",
    description: `카르토그래피아 조약(Treaty of Cartographia)은 1652년 네덜란드 암스테르담에서 체결된 국제 협정으로, 세계 최초로 '지도의 표준화'를 규정한 조약이다.

17세기 대항해시대, 각국이 제작한 지도들 간의 불일치로 인한 영토 분쟁과 항해 사고가 빈번했다. 이에 유럽 7개국 대표들이 모여 지도 제작의 통일된 기준을 마련하기로 합의했다.

이 조약의 주요 내용은 본초 자오선의 위치, 축척 표기 방식, 해안선 측정 방법 등을 포함한다. 특히 '미탐사 지역'을 표시하는 표준 기호를 제정하여, 이전까지 지도에 그려지던 상상의 괴물이나 신화적 표현을 공식적으로 금지했다.

이 조약은 현대 국제 지도 제작 표준의 원형이 되었으며, UNESCO 세계기록유산에 등재되어 있다.`,
    parentId: null,
    generation: 0,
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "system",
    timesShown: 0,
    childrenCount: 0,
  },
];

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

  // 시드 데이터 삽입 (없으면)
  for (const seed of SEED_KNOWLEDGE) {
    await sql`
      INSERT INTO knowledge (id, title, category, description, parent_id, generation, created_at, created_by, times_shown, children_count)
      VALUES (
        ${seed.id},
        ${seed.title},
        ${seed.category},
        ${seed.description},
        ${seed.parentId},
        ${seed.generation},
        ${seed.createdAt},
        ${seed.createdBy},
        ${seed.timesShown},
        ${seed.childrenCount}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
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
    const existing =
      await sql`SELECT id FROM knowledge WHERE id = ${knowledge.id}`;
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

// 지식 삭제
export async function DELETE(request: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title");
    const cleanOrphans = searchParams.get("cleanOrphans");

    // 고아 노드 정리 (시드에 연결되지 않은 노드들 삭제)
    if (cleanOrphans === "true") {
      // 모든 지식 가져오기
      const allKnowledge = await sql`SELECT id, parent_id, generation FROM knowledge`;
      
      // 시드(generation=0)에서 시작해서 연결된 모든 노드 찾기
      const connectedIds = new Set<string>();
      
      // DB의 시드 노드들 (generation=0) 추가
      allKnowledge.forEach(k => {
        if (k.generation === 0) {
          connectedIds.add(k.id as string);
        }
      });
      
      // BFS로 연결된 노드들 찾기
      let changed = true;
      while (changed) {
        changed = false;
        allKnowledge.forEach(k => {
          if (!connectedIds.has(k.id as string) && k.parent_id && connectedIds.has(k.parent_id as string)) {
            connectedIds.add(k.id as string);
            changed = true;
          }
        });
      }
      
      // 연결되지 않은 고아 노드들 찾기
      const orphanIds = allKnowledge
        .filter(k => !connectedIds.has(k.id as string))
        .map(k => k.id as string);
      
      if (orphanIds.length > 0) {
        // 고아 노드들 삭제
        await sql`DELETE FROM knowledge WHERE id = ANY(${orphanIds})`;
      }
      
      return NextResponse.json({
        success: true,
        deletedCount: orphanIds.length,
        deletedIds: orphanIds,
        message: `Deleted ${orphanIds.length} orphan nodes`,
      });
    }

    if (title) {
      // 특정 제목의 지식 삭제
      const result = await sql`
        DELETE FROM knowledge 
        WHERE title = ${title}
        RETURNING id
      `;
      return NextResponse.json({
        success: true,
        deletedCount: result.length,
        message: `Deleted ${result.length} knowledge entries with title "${title}"`,
      });
    }

    return NextResponse.json(
      { error: "Title or cleanOrphans parameter required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting knowledge:", error);
    return NextResponse.json(
      { error: "Failed to delete knowledge" },
      { status: 500 }
    );
  }
}
