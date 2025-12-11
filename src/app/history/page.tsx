"use client";

import { Category, CATEGORY_INFO, Knowledge } from "@/types/knowledge";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all"
  );
  const [loading, setLoading] = useState(true);
  const [selectedKnowledge, setSelectedKnowledge] = useState<Knowledge | null>(
    null
  );
  const [genealogy, setGenealogy] = useState<Knowledge[]>([]);

  // 지식 목록 불러오기
  useEffect(() => {
    const fetchKnowledge = async () => {
      setLoading(true);
      try {
        const url =
          selectedCategory === "all"
            ? "/api/knowledge"
            : `/api/knowledge?category=${selectedCategory}`;
        const response = await fetch(url);
        const data = await response.json();
        setKnowledge(data.knowledge || []);
      } catch (error) {
        console.error("Error fetching knowledge:", error);
      }
      setLoading(false);
    };

    fetchKnowledge();
  }, [selectedCategory]);

  // 계보 불러오기
  const fetchGenealogy = async (k: Knowledge) => {
    setSelectedKnowledge(k);
    try {
      const response = await fetch(`/api/knowledge/genealogy?id=${k.id}`);
      const data = await response.json();
      setGenealogy(data.genealogy || []);
    } catch (error) {
      console.error("Error fetching genealogy:", error);
      setGenealogy([k]);
    }
  };

  // 세대별로 그룹화
  const knowledgeByGeneration = knowledge.reduce((acc, k) => {
    const gen = k.generation;
    if (!acc[gen]) acc[gen] = [];
    acc[gen].push(k);
    return acc;
  }, {} as Record<number, Knowledge[]>);

  const generations = Object.keys(knowledgeByGeneration)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--secondary)]">
              📖 지식 계보
            </h1>
            <p className="text-gray-500 mt-1">
              지식이 어떻게 변형되어 왔는지 확인하세요
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/tree" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              🌳 트리 보기
            </Link>
            <Link href="/" className="btn-gold px-6 py-2">
              🎮 게임하기
            </Link>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === "all"
                ? "bg-[var(--primary)] text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            전체
          </button>
          {(Object.keys(CATEGORY_INFO) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === cat
                  ? "bg-[var(--primary)] text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {CATEGORY_INFO[cat].emoji} {CATEGORY_INFO[cat].label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-bounce">📚</div>
            <p className="text-gray-500">지식을 불러오는 중...</p>
          </div>
        ) : knowledge.length === 0 ? (
          <div className="text-center py-12 encyclopedia-page">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-[var(--secondary)] mb-2">
              아직 저장된 지식이 없습니다
            </h3>
            <p className="text-gray-500 mb-4">
              게임을 플레이하고 새로운 지식을 만들어보세요!
            </p>
            <Link href="/" className="btn-gold px-6 py-2 inline-block">
              게임 시작하기
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* 지식 목록 */}
            <div className="md:col-span-2 space-y-6">
              {generations.map((gen) => (
                <div key={gen}>
                  <h3 className="text-lg font-bold text-[var(--secondary)] mb-3 flex items-center gap-2">
                    <span className="bg-[var(--primary)] text-white px-2 py-1 rounded text-sm">
                      {gen === 0 ? "시드" : `${gen}세대`}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ({knowledgeByGeneration[gen].length}개)
                    </span>
                  </h3>
                  <div className="grid gap-3">
                    {knowledgeByGeneration[gen].map((k) => (
                      <div
                        key={k.id}
                        onClick={() => fetchGenealogy(k)}
                        className={`encyclopedia-page cursor-pointer transition-all hover:shadow-lg ${
                          selectedKnowledge?.id === k.id
                            ? "ring-2 ring-[var(--primary)]"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-sm text-gray-500">
                              {CATEGORY_INFO[k.category].emoji}
                            </span>
                            <h4 className="font-bold text-[var(--secondary)]">
                              {k.title}
                            </h4>
                          </div>
                          {k.parentId && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              파생됨
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {k.description}
                        </p>
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(k.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 계보 상세 */}
            <div className="md:col-span-1">
              <div className="sticky top-4">
                <h3 className="text-lg font-bold text-[var(--secondary)] mb-3">
                  🧬 지식 계보
                </h3>
                {selectedKnowledge ? (
                  <div className="space-y-3">
                    {genealogy.map((k, idx) => (
                      <div
                        key={k.id}
                        className={`p-4 rounded-lg border-2 ${
                          k.id === selectedKnowledge.id
                            ? "border-[var(--primary)] bg-amber-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {k.generation === 0
                              ? "시드"
                              : `${k.generation}세대`}
                          </span>
                          <span>{CATEGORY_INFO[k.category].emoji}</span>
                        </div>
                        <h4 className="font-bold text-sm">{k.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                          {k.description}
                        </p>
                        {idx < genealogy.length - 1 && (
                          <div className="text-center text-gray-300 mt-2">
                            ↓
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>지식을 선택하면</p>
                    <p>계보를 볼 수 있습니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
