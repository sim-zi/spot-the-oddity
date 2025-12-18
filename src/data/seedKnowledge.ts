import { Knowledge } from "@/types/knowledge";

// 시드 지식을 DB에서 가져오기
export async function getRandomKnowledge(
  category?: string
): Promise<Knowledge> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // DB에서 시드 지식 가져오기 (generation=0)
  const response = await fetch(`${baseUrl}/api/knowledge/seeds`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch seed knowledge");
  }

  const { seeds } = await response.json();

  let filtered = seeds as Knowledge[];

  if (category && category !== "random") {
    filtered = seeds.filter((k: Knowledge) => k.category === category);
  }

  if (filtered.length === 0) {
    filtered = seeds;
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
}

// 모든 시드 지식 가져오기 (서버용)
export async function getAllSeeds(): Promise<Knowledge[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/knowledge/seeds`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch seed knowledge");
  }

  const { seeds } = await response.json();
  return seeds;
}
