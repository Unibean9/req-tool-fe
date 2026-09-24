"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getStraightPath,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type EdgeProps,
  type Node,
} from "@xyflow/react";
import { Download, GitBranch, Maximize2, Minimize2, Users } from "lucide-react";
import "@xyflow/react/dist/style.css";
import type {
  UseCaseActorResponse,
  UseCaseItemResponse,
  UseCaseModelResponse,
} from "@/lib/api/services/useCaseModel";

type UseCaseDiagramProps = {
  response: UseCaseModelResponse;
};

type ActorNodeData = {
  name: string;
  side: "left" | "right";
  kind: UseCaseActorResponse["kind"];
};

type UseCaseNodeData = {
  name: string;
  moduleName: string;
  priority: UseCaseItemResponse["priority"];
};

type SystemNodeData = {
  name: string;
};

type DiagramNode = Node<ActorNodeData | UseCaseNodeData | SystemNodeData>;

const USE_CASE_WIDTH = 224;
const USE_CASE_HEIGHT = 72;
const COLUMN_GAP = 88;
const ROW_GAP = 92;
const SYSTEM_X = 280;
const SYSTEM_Y = 24;

function SystemNode({ data }: { data: SystemNodeData }) {
  return (
    <div className="h-full w-full border border-[#737373] bg-white text-[#20242d]">
      <h2 className="pt-6 text-center text-lg font-semibold tracking-wide">{data.name}</h2>
    </div>
  );
}

function ActorNode({ data }: { data: ActorNodeData }) {
  const sidePosition = data.side === "left" ? Position.Right : Position.Left;
  return (
    <div className="flex w-40 flex-col items-center bg-transparent px-1 text-center text-[11px] text-[#24272e]">
      <Handle
        type="source"
        position={sidePosition}
        id="actor-source"
        className="!size-2 !border-0 !bg-[#777]/70"
      />
      <Handle
        type="target"
        position={sidePosition}
        id="actor-target"
        className="!size-2 !border-0 !bg-[#777]/70"
      />
      <svg aria-hidden viewBox="0 0 80 88" className="mb-1 h-[78px] w-[72px] fill-none stroke-[#555] stroke-[1.2]">
        <circle cx="40" cy="12" r="10" />
        <path d="M40 22v33M16 34h48M40 55 20 82M40 55l20 27" />
      </svg>
      <span className="max-w-36 font-mono" title={data.kind}>{data.name}</span>
    </div>
  );
}

function UseCaseNode({ data }: { data: UseCaseNodeData }) {
  return (
    <div className="relative flex min-h-[72px] w-[224px] items-center justify-center rounded-[50%] border border-[#777] bg-white px-6 text-center text-[11px] leading-tight text-[#252932]">
      <Handle type="target" id="target-left" position={Position.Left} className="!size-2 !border-0 !bg-[#777]/70" />
      <Handle type="target" id="target-right" position={Position.Right} className="!size-2 !border-0 !bg-[#777]/70" />
      <span title={`${data.moduleName} · ${data.priority}`}>{data.name}</span>
      <Handle type="source" id="source-left" position={Position.Left} className="!size-2 !border-0 !bg-[#777]/70" />
      <Handle type="source" id="source-right" position={Position.Right} className="!size-2 !border-0 !bg-[#777]/70" />
    </div>
  );
}

function GeneralizationEdge({ id, sourceX, sourceY, targetX, targetY, label, style }: EdgeProps) {
  const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const distance = Math.hypot(targetX - sourceX, targetY - sourceY) || 1;
  const unitX = (targetX - sourceX) / distance;
  const unitY = (targetY - sourceY) / distance;
  const baseX = targetX - unitX * 15;
  const baseY = targetY - unitY * 15;
  const normalX = -unitY * 7;
  const normalY = unitX * 7;
  const points = `${targetX},${targetY} ${baseX + normalX},${baseY + normalY} ${baseX - normalX},${baseY - normalY}`;
  const stroke = String(style?.stroke ?? "#686868");

  return (
    <>
      <BaseEdge id={id} path={path} style={style} />
      <polygon points={points} fill="white" stroke={stroke} strokeWidth="1.4" />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan rounded bg-white/90 px-1 text-[10px] text-[#555]"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

function RelationshipEdge({ id, sourceX, sourceY, targetX, targetY, label, style }: EdgeProps) {
  const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const distance = Math.hypot(targetX - sourceX, targetY - sourceY) || 1;
  const unitX = (targetX - sourceX) / distance;
  const unitY = (targetY - sourceY) / distance;
  const baseX = targetX - unitX * 13;
  const baseY = targetY - unitY * 13;
  const normalX = -unitY * 5;
  const normalY = unitX * 5;
  const stroke = String(style?.stroke ?? "#686868");

  return (
    <>
      <BaseEdge id={id} path={path} style={style} />
      <polyline
        points={`${baseX + normalX},${baseY + normalY} ${targetX},${targetY} ${baseX - normalX},${baseY - normalY}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan rounded bg-white/90 px-1 text-[10px] text-[#555]"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const nodeTypes = {
  system: SystemNode,
  actor: ActorNode,
  usecase: UseCaseNode,
};

const edgeTypes = { generalization: GeneralizationEdge, relationship: RelationshipEdge };

function nodeKey(kind: "actor" | "usecase", id: string) {
  return `${kind}-${id}`;
}

function actorSide(actor: UseCaseActorResponse, index: number): "left" | "right" {
  return actor.side ?? (index % 2 === 0 ? "left" : "right");
}

function boundaryName(response: UseCaseModelResponse) {
  const projectName = response.projectName?.trim();
  if (projectName) return projectName;
  const name = response.system.name?.trim();
  return name && name.toLowerCase() !== "requirements system" ? name : response.projectName;
}

function createGraph(response: UseCaseModelResponse) {
  const useCases = response.useCases;
  const actors = response.actors;
  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(Math.max(useCases.length, 1)))));
  const rows = Math.max(1, Math.ceil(useCases.length / columns));
  const systemWidth = columns * USE_CASE_WIDTH + (columns - 1) * COLUMN_GAP + 96;
  const systemHeight = Math.max(470, rows * USE_CASE_HEIGHT + (rows - 1) * ROW_GAP + 120);
  const leftActors = actors.filter((actor, index) => actorSide(actor, index) === "left");
  const rightActors = actors.filter((actor, index) => actorSide(actor, index) === "right");
  const actorY = (index: number, count: number) => SYSTEM_Y + 100 + ((systemHeight - 180) * (index + 1)) / (count + 1);

  const nodes: DiagramNode[] = [
    {
      id: "system-boundary",
      type: "system",
      position: { x: SYSTEM_X, y: SYSTEM_Y },
      data: { name: boundaryName(response) },
      style: { width: systemWidth, height: systemHeight },
      draggable: false,
      selectable: false,
      deletable: false,
      zIndex: -1,
    },
    ...actors.map((actor, index) => {
      const side = actorSide(actor, index);
      const sideActors = side === "left" ? leftActors : rightActors;
      const sideIndex = sideActors.findIndex((item) => item.id === actor.id);
      return {
        id: nodeKey("actor", actor.id),
        type: "actor",
        position: {
          x: side === "left" ? 0 : SYSTEM_X + systemWidth + 160,
          y: actorY(sideIndex, sideActors.length),
        },
        data: { name: actor.name, side, kind: actor.kind },
        draggable: false,
      } satisfies DiagramNode;
    }),
    ...useCases.map((item, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const moduleEntry = response.modules.find((entry) => entry.id === item.moduleId);
      return {
        id: nodeKey("usecase", item.id),
        type: "usecase",
        position: {
          x: SYSTEM_X + 48 + column * (USE_CASE_WIDTH + COLUMN_GAP),
          y: SYSTEM_Y + 92 + row * (USE_CASE_HEIGHT + ROW_GAP),
        },
        data: { name: item.name, moduleName: moduleEntry?.name ?? "", priority: item.priority },
        draggable: false,
      } satisfies DiagramNode;
    }),
  ];

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: Edge[] = [];
  const associationKeys = new Set<string>();
  const addAssociation = (actorId: string, useCaseId: string, role: string) => {
    const actor = byId.get(nodeKey("actor", actorId));
    const useCase = byId.get(nodeKey("usecase", useCaseId));
    if (!actor || !useCase) return;
    const key = `${actor.id}:${useCase.id}`;
    if (associationKeys.has(key)) return;
    associationKeys.add(key);
    const side = (actor.data as ActorNodeData).side;
    edges.push({
      id: `association-${role}-${actorId}-${useCaseId}`,
      source: actor.id,
      target: useCase.id,
      sourceHandle: "actor-source",
      targetHandle: side === "left" ? "target-left" : "target-right",
      type: "straight",
      label: undefined,
      style: { stroke: "#686868", strokeWidth: 1.2 },
    });
  };

  for (const item of useCases) {
    addAssociation(item.primaryActorId, item.id, "primary");
    item.secondaryActorIds.forEach((actorId) => addAssociation(actorId, item.id, "secondary"));
  }

  const positionOf = (node: DiagramNode) => ({ x: node.position.x, y: node.position.y });
  for (const relation of response.relationships) {
    const source = byId.get(nodeKey("usecase", relation.sourceId));
    const target = byId.get(nodeKey("usecase", relation.targetId));
    if (!source || !target) continue;
    const sourcePosition = positionOf(source);
    const targetPosition = positionOf(target);
    const toRight = targetPosition.x >= sourcePosition.x;
    const type = relation.type;
    const isGeneralization = type === "generalization";
    const label = type === "include" ? "«include»" : type === "extend" ? "«extend»" : undefined;
    edges.push({
      id: relation.id,
      source: source.id,
      target: target.id,
      sourceHandle: toRight ? "source-right" : "source-left",
      targetHandle: toRight ? "target-left" : "target-right",
      type: isGeneralization ? "generalization" : "relationship",
      label,
      markerEnd: isGeneralization ? undefined : { type: MarkerType.Arrow, color: "#686868" },
      style: {
        stroke: "#686868",
        strokeWidth: 1.2,
        ...(isGeneralization ? {} : { strokeDasharray: "6 5" }),
      },
      labelStyle: { fill: "#4b5563", fontSize: 10 },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.95 },
    });
  }

  return { nodes, edges };
}

function createDiagramSvg(nodes: DiagramNode[], edges: Edge[], projectName: string) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const visibleNodes = nodes.filter((node) => node.type !== "system");
  const minX = Math.min(...visibleNodes.map((node) => node.position.x), SYSTEM_X) - 100;
  const minY = Math.min(...visibleNodes.map((node) => node.position.y), SYSTEM_Y) - 100;
  const maxX = Math.max(
    ...nodes.map((node) => node.position.x + Number(node.style?.width ?? (node.type === "usecase" ? USE_CASE_WIDTH : 160))),
  ) + 100;
  const maxY = Math.max(
    ...nodes.map((node) => node.position.y + Number(node.style?.height ?? (node.type === "usecase" ? USE_CASE_HEIGHT : 110))),
  ) + 100;
  const width = Math.max(800, maxX - minX);
  const height = Math.max(500, maxY - minY);
  const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
  const port = (node: DiagramNode, handle: string | null | undefined) => {
    const widthOf = Number(node.style?.width ?? (node.type === "usecase" ? USE_CASE_WIDTH : 160));
    const heightOf = Number(node.style?.height ?? (node.type === "usecase" ? USE_CASE_HEIGHT : 110));
    const left = String(handle ?? "").includes("left") || (node.type === "actor" && (node.data as ActorNodeData).side === "right");
    return { x: node.position.x + (left ? 0 : widthOf), y: node.position.y + heightOf / 2 };
  };
  const edgeMarkup = edges.map((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return "";
    const from = port(source, edge.sourceHandle);
    const to = port(target, edge.targetHandle);
    const label = typeof edge.label === "string" ? edge.label : "";
    const dash = edge.style?.strokeDasharray ? ` stroke-dasharray="${edge.style.strokeDasharray}"` : "";
    const marker = edge.type === "generalization" ? "url(#generalization)" : edge.markerEnd ? "url(#open-arrow)" : "";
    const labelMarkup = label
      ? `<rect x="${(from.x + to.x) / 2 - label.length * 3.1 - 6}" y="${(from.y + to.y) / 2 - 10}" width="${label.length * 6.2 + 12}" height="18" rx="3" fill="#ffffff"/><text x="${(from.x + to.x) / 2}" y="${(from.y + to.y) / 2 + 3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#4b5563">${escape(label)}</text>`
      : "";
    return `<path d="M ${from.x} ${from.y} L ${to.x} ${to.y}" fill="none" stroke="#686868" stroke-width="1.3"${dash}${marker ? ` marker-end="${marker}"` : ""}/>${labelMarkup}`;
  }).join("");
  const nodeMarkup = nodes.map((node) => {
    if (node.type === "system") {
      const widthOf = Number(node.style?.width ?? 1000);
      const heightOf = Number(node.style?.height ?? 500);
      return `<rect x="${node.position.x}" y="${node.position.y}" width="${widthOf}" height="${heightOf}" fill="#ffffff" stroke="#737373" stroke-width="1.4"/><text x="${node.position.x + widthOf / 2}" y="${node.position.y + 34}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#20242d">${escape((node.data as SystemNodeData).name || projectName)}</text>`;
    }
    if (node.type === "actor") {
      const widthOf = 160;
      const center = node.position.x + widthOf / 2;
      const name = escape((node.data as ActorNodeData).name);
      return `<g fill="none" stroke="#555555" stroke-width="1.4"><circle cx="${center}" cy="${node.position.y + 12}" r="10"/><path d="M ${center} ${node.position.y + 22} V ${node.position.y + 56} M ${center - 24} ${node.position.y + 34} H ${center + 24} M ${center} ${node.position.y + 56} L ${center - 20} ${node.position.y + 82} M ${center} ${node.position.y + 56} L ${center + 20} ${node.position.y + 82}"/></g><text x="${center}" y="${node.position.y + 104}" text-anchor="middle" font-family="monospace" font-size="11" fill="#24272e">${name}</text>`;
    }
    const widthOf = USE_CASE_WIDTH;
    const heightOf = USE_CASE_HEIGHT;
    const centerX = node.position.x + widthOf / 2;
    const centerY = node.position.y + heightOf / 2;
    return `<ellipse cx="${centerX}" cy="${centerY}" rx="${widthOf / 2}" ry="${heightOf / 2}" fill="#ffffff" stroke="#777777" stroke-width="1.3"/><text x="${centerX}" y="${centerY + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#252932">${escape((node.data as UseCaseNodeData).name)}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * 2}" height="${height * 2}" viewBox="${minX} ${minY} ${width} ${height}"><defs><marker id="open-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto"><path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="#686868" stroke-width="1.2"/></marker><marker id="generalization" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 0 L 12 6 L 0 12 Z" fill="#ffffff" stroke="#686868" stroke-width="1.2"/></marker></defs>${edgeMarkup}${nodeMarkup}</svg>`;
}

export function UseCaseDiagram({ response }: UseCaseDiagramProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const stableNodeTypes = useMemo(() => nodeTypes, []);
  const stableEdgeTypes = useMemo(() => edgeTypes, []);
  const graph = useMemo(() => createGraph(response), [response]);
  const [nodes, setNodes, onNodesChange] = useNodesState<DiagramNode>(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);
  const syncGraph = useCallback(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph.edges, graph.nodes, setEdges, setNodes]);

  useEffect(() => {
    syncGraph();
  }, [syncGraph]);

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(document.fullscreenElement === sectionRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement === sectionRef.current) await document.exitFullscreen();
    else await sectionRef.current?.requestFullscreen();
  };

  const exportPng = async () => {
    if (!nodes.length) return;
    const svg = createDiagramSvg(nodes, edges, boundaryName(response));
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    try {
      const image = new Image();
      image.src = svgUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Could not render the use case diagram."));
      });
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create PNG.")), "image/png"));
      const pngUrl = URL.createObjectURL(png);
      const link = document.createElement("a");
      link.download = `${response.projectName}-use-case-diagram.png`.replace(/[^a-z0-9-_.]/gi, "-");
      link.href = pngUrl;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  };

  return (
    <section ref={sectionRef} className={`flex min-h-[520px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/25 ${fullscreen ? "h-screen w-screen rounded-none bg-background p-2" : ""}`}>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{boundaryName(response)}</h2>
          <p className="mt-1 text-xs text-muted-foreground">React Flow preview · {response.useCases.length} use cases · {response.relationships.length} relationships</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 px-2.5 text-xs hover:bg-muted/50" onClick={() => void exportPng()}>
            <Download className="size-3.5" />Export PNG
          </button>
          <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 px-2.5 text-xs hover:bg-muted/50" onClick={() => void toggleFullscreen()}>
            {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            {fullscreen ? "Exit full screen" : "Full screen"}
          </button>
        </div>
      </header>
      <div className="relative min-h-[460px] w-full flex-1 bg-white">
        {!response.useCases.length ? (
          <div className="flex h-full min-h-[460px] items-center justify-center p-8 text-center text-sm text-gray-600">No use cases are available. Generate the use case model first.</div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={stableNodeTypes}
            edgeTypes={stableEdgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodesConnectable={false}
            nodesDraggable
            fitView
            fitViewOptions={{ padding: 0.08 }}
            minZoom={0.1}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e7e7e7" gap={24} size={1} />
            <Controls className="!overflow-hidden !rounded-lg !border !border-[#ccc] !bg-white !shadow-md [&>button]:!border-[#ddd] [&>button]:!bg-white [&>button]:!fill-[#333]" />
          </ReactFlow>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 px-4 py-2.5 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Users className="size-3" />Actor</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded-full border border-muted-foreground" />Use case</span>
        <span className="inline-flex items-center gap-1.5"><GitBranch className="size-3" />Association · include · extend · generalization</span>
        <span className="ml-auto">All generated use cases are shown</span>
      </div>
    </section>
  );
}
