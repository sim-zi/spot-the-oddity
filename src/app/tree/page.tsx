"use client";

import { Category, CATEGORY_INFO, Knowledge } from "@/types/knowledge";
import dagre from "@dagrejs/dagre";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Handle,
  MiniMap,
  Node,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

// 커스텀 노드 컴포넌트
function KnowledgeNode({
  data,
}: {
  data: {
    knowledge: Knowledge;
    selected: boolean;
    onClick: (k: Knowledge) => void;
  };
}) {
  const { knowledge, selected, onClick } = data;

  return (
    <div
      onClick={() => onClick(knowledge)}
      className={`
        px-4 py-3 rounded-lg border-2 bg-white cursor-pointer
        transition-all duration-200 min-w-40 max-w-[200px] relative
        ${
          selected
            ? "border-primary shadow-lg scale-105"
            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
        }
        ${knowledge.generation === 0 ? "border-l-4 border-l-primary" : ""}
      `}
    >
      {/* 엣지 연결 핸들 */}
      <Handle
        type="target"
        position={Position.Top}
        className="bg-gray-300! w-2! h-2! border-0!"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-gray-300! w-2! h-2! border-0!"
      />

      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded ${
            knowledge.generation === 0
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {knowledge.generation === 0 ? "시드" : `${knowledge.generation}세대`}
        </span>
        <span className="text-sm">
          {CATEGORY_INFO[knowledge.category].emoji}
        </span>
      </div>
      <p className="text-xs font-medium text-gray-800 line-clamp-2">
        {knowledge.title}
      </p>
    </div>
  );
}

// 노드 타입 등록
const nodeTypes = {
  knowledge: KnowledgeNode,
};

// dagre 레이아웃 계산
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 70 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 90,
        y: nodeWithPosition.y - 35,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function TreePage() {
  const [allKnowledge, setAllKnowledge] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Knowledge | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all"
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/knowledge");
        const data = await response.json();
        const allKnowledgeData = data.knowledge || [];
        setAllKnowledge(allKnowledgeData);
      } catch (error) {
        console.error("Error fetching knowledge:", error);
        setAllKnowledge([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // 카테고리 필터링된 지식
  const filteredKnowledge = useMemo(() => {
    if (selectedCategory === "all") return allKnowledge;
    return allKnowledge.filter((k) => k.category === selectedCategory);
  }, [allKnowledge, selectedCategory]);

  // 노드 클릭 핸들러
  const handleNodeClick = useCallback((knowledge: Knowledge) => {
    setSelectedNode(knowledge);
  }, []);

  // 노드와 엣지 생성
  useEffect(() => {
    if (filteredKnowledge.length === 0) return;

    const knowledgeMap = new Map<string, Knowledge>();
    filteredKnowledge.forEach((k) => knowledgeMap.set(k.id, k));

    // 노드 생성
    const newNodes: Node[] = filteredKnowledge.map((k) => ({
      id: k.id,
      type: "knowledge",
      position: { x: 0, y: 0 },
      data: {
        knowledge: k,
        selected: selectedNode?.id === k.id,
        onClick: handleNodeClick,
      },
    }));

    // 엣지 생성
    const newEdges: Edge[] = filteredKnowledge
      .filter((k) => k.parentId && knowledgeMap.has(k.parentId))
      .map((k) => ({
        id: `${k.parentId}-${k.id}`,
        source: k.parentId!,
        target: k.id,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#9ca3af", strokeWidth: 2 },
      }));

    // 레이아웃 적용
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      newNodes,
      newEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [filteredKnowledge, selectedNode, handleNodeClick, setNodes, setEdges]);

  // 선택된 노드가 변경되면 노드 데이터 업데이트
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selected: selectedNode?.id === node.id,
        },
      }))
    );
  }, [selectedNode, setNodes]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 헤더 */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-medium text-secondary">지식 계보</h1>
          <p className="text-xs text-gray-400">
            노드를 클릭하여 상세 정보 확인 · 드래그로 이동 · 스크롤로 확대/축소
          </p>
        </div>
        <Link href="/" className="btn-gold px-4 py-2 text-sm">
          게임으로
        </Link>
      </div>

      {/* 메인 */}
      <div className="flex-1 flex">
        {/* React Flow */}
        <div className="flex-1">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-400">불러오는 중</p>
              </div>
            </div>
          ) : filteredKnowledge.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 mb-4">지식이 없습니다</p>
                <Link href="/" className="btn-gold px-6 py-2 text-sm">
                  첫 지식 만들기
                </Link>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.3}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color="#e5e7eb"
              />
              <Controls showInteractive={false} />
              <MiniMap
                nodeColor={(node) =>
                  node.data.knowledge.generation === 0 ? "#8b7355" : "#e5e7eb"
                }
                maskColor="rgba(255, 255, 255, 0.8)"
                style={{ border: "1px solid #e5e7eb" }}
              />

              {/* 카테고리 필터 */}
              <Panel position="top-left">
                <div className="bg-white rounded-lg shadow-sm border p-2 flex gap-1 flex-wrap max-w-[400px]">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      selectedCategory === "all"
                        ? "bg-primary text-white"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    전체
                  </button>
                  {(Object.keys(CATEGORY_INFO) as Category[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        selectedCategory === cat
                          ? "bg-primary text-white"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {CATEGORY_INFO[cat].emoji}
                    </button>
                  ))}
                </div>
              </Panel>
            </ReactFlow>
          )}
        </div>

        {/* 사이드 패널 */}
        {selectedNode && (
          <div className="w-72 bg-white border-l p-4 overflow-auto">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                상세 정보
              </p>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                닫기
              </button>
            </div>

            <div className="space-y-4">
              {/* 기본 정보 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      selectedNode.generation === 0
                        ? "bg-primary text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {selectedNode.generation === 0
                      ? "시드"
                      : `${selectedNode.generation}세대`}
                  </span>
                  <span className="text-sm">
                    {CATEGORY_INFO[selectedNode.category].emoji}
                  </span>
                  <span className="text-xs text-gray-500">
                    {CATEGORY_INFO[selectedNode.category].label}
                  </span>
                </div>
                <h4 className="text-base font-medium text-secondary">
                  {selectedNode.title}
                </h4>
              </div>

              {/* 설명 */}
              <div>
                <p className="text-xs text-gray-400 mb-1">설명</p>
                <p className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded-lg leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              {/* 메타 정보 */}
              <div className="text-xs space-y-1.5 text-gray-500">
                <div className="flex justify-between">
                  <span>생성일</span>
                  <span>
                    {new Date(selectedNode.createdAt).toLocaleDateString(
                      "ko-KR"
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>파생 지식</span>
                  <span>{selectedNode.childrenCount || 0}개</span>
                </div>
              </div>

              {/* 채팅 로그 */}
              {selectedNode.chatLog && selectedNode.chatLog.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">
                    생성 대화 ({selectedNode.chatLog.length})
                  </p>
                  <div className="bg-gray-50 rounded-lg p-2 max-h-40 overflow-auto space-y-1.5">
                    {selectedNode.chatLog.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-2 rounded ${
                          msg.role === "user"
                            ? "bg-blue-50 ml-3"
                            : "bg-gray-100 mr-3"
                        }`}
                      >
                        <span className="font-medium text-gray-500">
                          {msg.role === "user" ? "설명자" : "학습자"}
                        </span>
                        <p className="mt-0.5">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
