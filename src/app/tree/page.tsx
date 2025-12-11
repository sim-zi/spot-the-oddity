"use client";

import { Category, CATEGORY_INFO, Knowledge } from "@/types/knowledge";
import { SEED_KNOWLEDGE } from "@/data/seedKnowledge";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

// 트리 노드 타입
interface TreeNode {
  knowledge: Knowledge;
  children: TreeNode[];
  x: number;
  y: number;
  width: number;
}

export default function TreePage() {
  const [allKnowledge, setAllKnowledge] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Knowledge | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");

  // 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/knowledge");
        const data = await response.json();
        // 시드 지식 + DB 지식 합치기
        const dbKnowledge = data.knowledge || [];
        const combined = [...SEED_KNOWLEDGE, ...dbKnowledge];
        // 중복 제거
        const unique = combined.filter((k, idx, arr) => 
          arr.findIndex(item => item.id === k.id) === idx
        );
        setAllKnowledge(unique);
      } catch (error) {
        console.error("Error fetching knowledge:", error);
        setAllKnowledge(SEED_KNOWLEDGE);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // 카테고리 필터링된 지식
  const filteredKnowledge = useMemo(() => {
    if (selectedCategory === "all") return allKnowledge;
    return allKnowledge.filter(k => k.category === selectedCategory);
  }, [allKnowledge, selectedCategory]);

  // 트리 구조 생성
  const trees = useMemo(() => {
    const knowledgeMap = new Map<string, Knowledge>();
    filteredKnowledge.forEach(k => knowledgeMap.set(k.id, k));

    // 루트 노드 찾기 (parentId가 없거나, 부모가 필터링된 결과에 없는 경우)
    const roots = filteredKnowledge.filter(k => 
      !k.parentId || !knowledgeMap.has(k.parentId)
    );

    // 트리 빌드 함수
    const buildTree = (knowledge: Knowledge): TreeNode => {
      const children = filteredKnowledge
        .filter(k => k.parentId === knowledge.id)
        .map(buildTree);
      
      return {
        knowledge,
        children,
        x: 0,
        y: 0,
        width: 1,
      };
    };

    // 트리 위치 계산
    const calculatePositions = (node: TreeNode, x: number, y: number, availableWidth: number): TreeNode => {
      if (node.children.length === 0) {
        return { ...node, x, y, width: 1 };
      }

      const childWidth = availableWidth / node.children.length;
      const positionedChildren = node.children.map((child, idx) => 
        calculatePositions(child, x + idx * childWidth, y + 1, childWidth)
      );

      const totalWidth = positionedChildren.reduce((sum, c) => sum + c.width, 0);
      const centerX = positionedChildren.length > 0
        ? (positionedChildren[0].x + positionedChildren[positionedChildren.length - 1].x) / 2
        : x;

      return {
        ...node,
        children: positionedChildren,
        x: centerX,
        y,
        width: Math.max(totalWidth, 1),
      };
    };

    return roots.map((root, idx) => 
      calculatePositions(buildTree(root), idx * 4, 0, 4)
    );
  }, [filteredKnowledge]);

  // 전체 트리 너비 계산
  const totalWidth = useMemo(() => {
    if (trees.length === 0) return 800;
    const getAllNodes = (node: TreeNode): TreeNode[] => {
      return [node, ...node.children.flatMap(getAllNodes)];
    };
    const allNodes = trees.flatMap(getAllNodes);
    const maxX = Math.max(...allNodes.map(n => n.x), 0);
    return Math.max((maxX + 1) * 200, 800);
  }, [trees]);

  // 최대 깊이 계산
  const maxDepth = useMemo(() => {
    const getMaxDepth = (node: TreeNode, depth: number): number => {
      if (node.children.length === 0) return depth;
      return Math.max(...node.children.map(c => getMaxDepth(c, depth + 1)));
    };
    return Math.max(...trees.map(t => getMaxDepth(t, 0)), 0);
  }, [trees]);

  // 노드 렌더링
  const renderNode = (node: TreeNode, parentX?: number, parentY?: number) => {
    const nodeWidth = 160;
    const nodeHeight = 80;
    const levelHeight = 140;
    const x = node.x * 200 + 100;
    const y = node.y * levelHeight + 50;

    return (
      <g key={node.knowledge.id}>
        {/* 부모와의 연결선 */}
        {parentX !== undefined && parentY !== undefined && (
          <path
            d={`M ${parentX} ${parentY + nodeHeight / 2} 
                C ${parentX} ${parentY + levelHeight / 2},
                  ${x} ${y - levelHeight / 2},
                  ${x} ${y - nodeHeight / 2}`}
            fill="none"
            stroke={node.knowledge.generation === 0 ? "#c9a227" : "#94a3b8"}
            strokeWidth="2"
            strokeDasharray={node.knowledge.generation === 0 ? "0" : "5,5"}
          />
        )}

        {/* 노드 */}
        <g
          transform={`translate(${x - nodeWidth / 2}, ${y - nodeHeight / 2})`}
          onClick={() => setSelectedNode(node.knowledge)}
          style={{ cursor: "pointer" }}
        >
          <rect
            width={nodeWidth}
            height={nodeHeight}
            rx="8"
            fill={selectedNode?.id === node.knowledge.id ? "#fef3c7" : "white"}
            stroke={node.knowledge.generation === 0 ? "#c9a227" : "#e5e7eb"}
            strokeWidth={selectedNode?.id === node.knowledge.id ? "3" : "2"}
          />
          
          {/* 세대 배지 */}
          <rect
            x="4"
            y="4"
            width="40"
            height="18"
            rx="4"
            fill={node.knowledge.generation === 0 ? "#c9a227" : "#6b7280"}
          />
          <text
            x="24"
            y="16"
            fontSize="10"
            fill="white"
            textAnchor="middle"
          >
            {node.knowledge.generation === 0 ? "시드" : `${node.knowledge.generation}세대`}
          </text>

          {/* 카테고리 이모지 */}
          <text x="50" y="18" fontSize="14">
            {CATEGORY_INFO[node.knowledge.category].emoji}
          </text>

          {/* 제목 */}
          <text
            x={nodeWidth / 2}
            y="45"
            fontSize="12"
            fontWeight="bold"
            fill="#374151"
            textAnchor="middle"
          >
            {node.knowledge.title.length > 12 
              ? node.knowledge.title.slice(0, 12) + "..."
              : node.knowledge.title}
          </text>

          {/* 자식 수 */}
          {node.children.length > 0 && (
            <>
              <circle cx={nodeWidth - 15} cy="15" r="10" fill="#3b82f6" />
              <text
                x={nodeWidth - 15}
                y="19"
                fontSize="10"
                fill="white"
                textAnchor="middle"
              >
                {node.children.length}
              </text>
            </>
          )}
        </g>

        {/* 자식 노드들 */}
        {node.children.map(child => renderNode(child, x, y))}
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--secondary)]">
                🌳 지식 계보 트리
              </h1>
              <p className="text-sm text-gray-500">
                지식이 어떻게 변형되고 분기되었는지 시각화합니다
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/history"
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                📋 목록 보기
              </Link>
              <Link href="/" className="btn-gold px-4 py-2">
                🎮 게임하기
              </Link>
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
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
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat
                    ? "bg-[var(--primary)] text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {CATEGORY_INFO[cat].emoji} {CATEGORY_INFO[cat].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex">
        {/* 트리 영역 */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 animate-bounce">🌳</div>
              <p className="text-gray-500">트리를 그리는 중...</p>
            </div>
          ) : trees.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🌱</div>
              <p className="text-gray-500 mb-4">아직 지식 트리가 없습니다</p>
              <Link href="/" className="btn-gold px-6 py-2 inline-block">
                첫 지식 만들기
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-4 min-h-[500px]">
              <svg
                width={totalWidth}
                height={(maxDepth + 1) * 140 + 100}
                className="mx-auto"
              >
                {trees.map(tree => renderNode(tree))}
              </svg>
            </div>
          )}
        </div>

        {/* 선택된 노드 상세 */}
        {selectedNode && (
          <div className="w-80 bg-white border-l p-4 overflow-auto max-h-[calc(100vh-140px)] sticky top-[140px]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg">📄 상세 정보</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 기본 정보 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    selectedNode.generation === 0 
                      ? "bg-[var(--primary)] text-white" 
                      : "bg-gray-200"
                  }`}>
                    {selectedNode.generation === 0 ? "시드" : `${selectedNode.generation}세대`}
                  </span>
                  <span>{CATEGORY_INFO[selectedNode.category].emoji}</span>
                  <span className="text-sm text-gray-500">
                    {CATEGORY_INFO[selectedNode.category].label}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-[var(--secondary)]">
                  {selectedNode.title}
                </h4>
              </div>

              {/* 설명 */}
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-1">설명</h5>
                <p className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded-lg">
                  {selectedNode.description}
                </p>
              </div>

              {/* 메타 정보 */}
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">생성일</span>
                  <span>{new Date(selectedNode.createdAt).toLocaleDateString("ko-KR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">파생 지식 수</span>
                  <span>{selectedNode.childrenCount || 0}개</span>
                </div>
                {selectedNode.parentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">부모 ID</span>
                    <span className="text-xs font-mono">{selectedNode.parentId.slice(0, 12)}...</span>
                  </div>
                )}
              </div>

              {/* 채팅 로그 (있는 경우) */}
              {selectedNode.chatLog && selectedNode.chatLog.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-2">
                    💬 생성 대화 ({selectedNode.chatLog.length}개)
                  </h5>
                  <div className="bg-gray-50 rounded-lg p-2 max-h-48 overflow-auto space-y-2">
                    {selectedNode.chatLog.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-2 rounded ${
                          msg.role === "user"
                            ? "bg-blue-100 ml-4"
                            : "bg-gray-200 mr-4"
                        }`}
                      >
                        <span className="font-medium">
                          {msg.role === "user" ? "설명자" : "학습자"}:
                        </span>{" "}
                        {msg.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <h4 className="font-medium mb-2">범례</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-[#c9a227]"></div>
            <span>시드 지식</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-gray-300"></div>
            <span>파생 지식</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500 text-white text-xs flex items-center justify-center">3</div>
            <span>자식 수</span>
          </div>
        </div>
      </div>
    </div>
  );
}
