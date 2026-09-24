"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type EdgeProps,
  type Node,
} from "@xyflow/react";
import { Download, FileDown, GitBranch, Maximize2, Minimize2, Users } from "lucide-react";
import "@xyflow/react/dist/style.css";
import type {
  DiagramLayout,
  DiagramLayoutPoint,
  UseCaseActorResponse,
  UseCaseItemResponse,
  UseCaseModelResponse,
} from "@/lib/api/services/useCaseModel";
import { buildDrawioXml, downloadDrawioFile } from "@/lib/usecases/drawioExport";

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
  moduleId: string;
  moduleName: string;
  priority: UseCaseItemResponse["priority"];
};

type SystemNodeData = {
  name: string;
};

type DiagramEdgeData = {
  points?: DiagramLayoutPoint[];
};

type DiagramNode = Node<ActorNodeData | UseCaseNodeData | SystemNodeData>;

const USE_CASE_WIDTH = 224;
const USE_CASE_HEIGHT = 72;
const COLUMN_GAP = 88;
const ROW_GAP = 92;
const SYSTEM_X = 280;
const SYSTEM_Y = 24;
const HANDLE_OFFSETS = ["24%", "50%", "76%"] as const;
// Handles remain available to React Flow for correct edge attachment, but they are implementation
// points rather than UML symbols and must not appear as extra dots on the diagram.
const VISIBLE_HANDLE_CLASS = "!size-2 !border-0 !bg-transparent !opacity-0";
const HIDDEN_HANDLE_CLASS = "!size-2 !border-0 !bg-transparent !opacity-0";

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
      <Handle type="source" position={sidePosition} id="actor-source" className={VISIBLE_HANDLE_CLASS} />
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
      {HANDLE_OFFSETS.map((offset, index) => (
        <Fragment key={`target-left-${index}`}>
          <Handle type="target" id={`target-left-${index}`} position={Position.Left} style={{ top: offset }} className={index === 1 ? VISIBLE_HANDLE_CLASS : HIDDEN_HANDLE_CLASS} />
          <Handle type="target" id={`target-right-${index}`} position={Position.Right} style={{ top: offset }} className={index === 1 ? VISIBLE_HANDLE_CLASS : HIDDEN_HANDLE_CLASS} />
        </Fragment>
      ))}
      <span title={`${data.moduleName} · ${data.priority}`}>{data.name}</span>
      {HANDLE_OFFSETS.map((offset, index) => (
        <Fragment key={`source-left-${index}`}>
          <Handle type="source" id={`source-left-${index}`} position={Position.Left} style={{ top: offset }} className={index === 1 ? VISIBLE_HANDLE_CLASS : HIDDEN_HANDLE_CLASS} />
          <Handle type="source" id={`source-right-${index}`} position={Position.Right} style={{ top: offset }} className={index === 1 ? VISIBLE_HANDLE_CLASS : HIDDEN_HANDLE_CLASS} />
        </Fragment>
      ))}
    </div>
  );
}

function arrowPoints(sourceX: number, sourceY: number, targetX: number, targetY: number, length = 13, halfWidth = 5) {
  const distance = Math.hypot(targetX - sourceX, targetY - sourceY) || 1;
  const unitX = (targetX - sourceX) / distance;
  const unitY = (targetY - sourceY) / distance;
  const baseX = targetX - unitX * length;
  const baseY = targetY - unitY * length;
  const normalX = -unitY * halfWidth;
  const normalY = unitX * halfWidth;
  return `${baseX + normalX},${baseY + normalY} ${targetX},${targetY} ${baseX - normalX},${baseY - normalY}`;
}

function normalizedEdgePoints(data: unknown, sourceX: number, sourceY: number, targetX: number, targetY: number) {
  const points = data && typeof data === "object" && "points" in data ? (data as DiagramEdgeData).points : undefined;
  return points && points.length >= 2 ? points : [{ x: sourceX, y: sourceY }, { x: targetX, y: targetY }];
}

function edgePath(points: DiagramLayoutPoint[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function edgeMidpoint(points: DiagramLayoutPoint[]) {
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 };
  const total = points.reduce((sum, point, index) => {
    if (!index) return sum;
    return sum + Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y);
  }, 0);
  if (!total) return points[0];
  let travelled = 0;
  const halfway = total / 2;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const length = Math.hypot(current.x - previous.x, current.y - previous.y);
    if (travelled + length >= halfway) {
      const ratio = (halfway - travelled) / (length || 1);
      return { x: previous.x + (current.x - previous.x) * ratio, y: previous.y + (current.y - previous.y) * ratio };
    }
    travelled += length;
  }
  return points.at(-1) ?? points[0] ?? { x: 0, y: 0 };
}

function GeneralizationEdge({ id, sourceX, sourceY, targetX, targetY, label, style, data }: EdgeProps) {
  const points = normalizedEdgePoints(data, sourceX, sourceY, targetX, targetY);
  const path = edgePath(points);
  const midpoint = edgeMidpoint(points);
  const last = points.at(-1) ?? { x: targetX, y: targetY };
  const previous = points.at(-2) ?? { x: sourceX, y: sourceY };
  const arrow = arrowPoints(previous.x, previous.y, last.x, last.y, 15, 7);
  const stroke = String(style?.stroke ?? "#686868");

  return (
    <>
      <BaseEdge id={id} path={path} style={style} />
      <polygon points={arrow} fill="white" stroke={stroke} strokeWidth="1.4" />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan rounded bg-white/90 px-1 text-[10px] text-[#555]"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${midpoint.x}px,${midpoint.y}px)`,
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

function RelationshipEdge({ id, sourceX, sourceY, targetX, targetY, label, style, data }: EdgeProps) {
  const points = normalizedEdgePoints(data, sourceX, sourceY, targetX, targetY);
  const path = edgePath(points);
  const midpoint = edgeMidpoint(points);
  const last = points.at(-1) ?? { x: targetX, y: targetY };
  const previous = points.at(-2) ?? { x: sourceX, y: sourceY };
  const arrow = arrowPoints(previous.x, previous.y, last.x, last.y);
  const stroke = String(style?.stroke ?? "#686868");

  return (
    <>
      <BaseEdge id={id} path={path} style={style} />
      <polyline
        points={arrow}
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
              transform: `translate(-50%, -50%) translate(${midpoint.x}px,${midpoint.y}px)`,
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

function layoutNodeId(node: DiagramLayout["nodes"][number]) {
  if (node.kind === "system_boundary") return "system-boundary";
  return node.kind === "actor" ? nodeKey("actor", node.id) : nodeKey("usecase", node.id);
}

function createGraphFromLayout(response: UseCaseModelResponse, layout: DiagramLayout) {
  const moduleById = new Map(response.modules.map((module) => [module.id, module]));
  const nodes: DiagramNode[] = layout.nodes.map((node) => {
    if (node.kind === "system_boundary") {
      return {
        id: "system-boundary",
        type: "system",
        position: { x: node.x, y: node.y },
        data: { name: node.name || boundaryName(response) },
        style: { width: node.width, height: node.height },
        draggable: false,
        selectable: false,
        deletable: false,
        zIndex: -1,
      } satisfies DiagramNode;
    }
    if (node.kind === "actor") {
      return {
        id: layoutNodeId(node),
        type: "actor",
        position: { x: node.x, y: node.y },
        data: { name: node.name, side: node.side === "right" ? "right" : "left", kind: node.actorKind ?? "human" },
        draggable: false,
      } satisfies DiagramNode;
    }
    const moduleEntry = moduleById.get(node.moduleId ?? "");
    return {
      id: layoutNodeId(node),
      type: "usecase",
      position: { x: node.x, y: node.y },
      data: {
        name: node.name,
        moduleId: node.moduleId ?? "",
        moduleName: node.moduleName ?? moduleEntry?.name ?? "General",
        priority: node.priority ?? "recommended",
      },
      draggable: false,
    } satisfies DiagramNode;
  });
  const byCanonicalId = new Map(layout.nodes.map((node) => [node.id, layoutNodeId(node)]));
  const edges: Edge[] = layout.edges.flatMap((edge): Edge[] => {
    const source = byCanonicalId.get(edge.source);
    const target = byCanonicalId.get(edge.target);
    if (!source || !target) return [];
    if (edge.kind === "association") {
      return [{
        id: edge.id,
        source,
        target,
        sourceHandle: edge.sourceHandle ?? "actor-source",
        targetHandle: edge.targetHandle ?? "target-left-1",
        type: "straight",
        label: undefined,
        style: { stroke: "#686868", strokeWidth: 1.2 },
      }];
    }
    return [{
      id: edge.id,
      source,
      target,
      sourceHandle: edge.sourceHandle ?? "source-right-1",
      targetHandle: edge.targetHandle ?? "target-left-1",
      type: edge.kind === "generalization" ? "generalization" : "relationship",
      label: edge.label ?? undefined,
      data: { points: edge.points },
      style: {
        stroke: "#686868",
        strokeWidth: 1.2,
        ...(edge.lineStyle === "dashed" ? { strokeDasharray: "6 5" } : {}),
      },
      labelStyle: { fill: "#4b5563", fontSize: 10 },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.95 },
    }];
  });
  return { nodes, edges: orientEdges(nodes, edges) };
}

function createGraph(response: UseCaseModelResponse) {
  if (response.diagramLayout?.engine === "elk" && response.diagramLayout.nodes.length) {
    return createGraphFromLayout(response, response.diagramLayout);
  }
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
        data: { name: item.name, moduleId: item.moduleId, moduleName: moduleEntry?.name ?? "", priority: item.priority },
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
      targetHandle: side === "left" ? "target-left-1" : "target-right-1",
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
      sourceHandle: toRight ? "source-right-1" : "source-left-1",
      targetHandle: toRight ? "target-left-1" : "target-right-1",
      type: isGeneralization ? "generalization" : "relationship",
      label,
      style: {
        stroke: "#686868",
        strokeWidth: 1.2,
        ...(isGeneralization ? {} : { strokeDasharray: "6 5" }),
      },
      labelStyle: { fill: "#4b5563", fontSize: 10 },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.95 },
    });
  }

  return { nodes, edges: orientEdges(nodes, edges) };
}

function orientEdges(nodes: DiagramNode[], edges: Edge[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const incomingSlots = new Map<string, number>();
  const outgoingSlots = new Map<string, number>();
  const incomingGroups = new Map<string, Edge[]>();
  const outgoingGroups = new Map<string, Edge[]>();

  for (const edge of edges) {
    if (edge.type === "straight") continue;
    if (edge.type !== "relationship" && edge.type !== "generalization") continue;
    const incoming = incomingGroups.get(edge.target) ?? [];
    incoming.push(edge);
    incomingGroups.set(edge.target, incoming);
    const outgoing = outgoingGroups.get(edge.source) ?? [];
    outgoing.push(edge);
    outgoingGroups.set(edge.source, outgoing);
  }

  const sortByPosition = (left: Edge, right: Edge, endpoint: "source" | "target") => {
    const leftNode = byId.get(left[endpoint]);
    const rightNode = byId.get(right[endpoint]);
    return (leftNode?.position.y ?? 0) - (rightNode?.position.y ?? 0) || left.id.localeCompare(right.id);
  };
  for (const [targetId, group] of incomingGroups) {
    group.slice().sort((left, right) => sortByPosition(left, right, "source")).forEach((edge, index) => {
      incomingSlots.set(`${targetId}:${edge.id}`, index % HANDLE_OFFSETS.length);
    });
  }
  for (const [sourceId, group] of outgoingGroups) {
    group.slice().sort((left, right) => sortByPosition(left, right, "target")).forEach((edge, index) => {
      outgoingSlots.set(`${sourceId}:${edge.id}`, index % HANDLE_OFFSETS.length);
    });
  }

  return edges.map((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) return edge;
    if (edge.type === "straight") {
      const side = (source.data as ActorNodeData).side;
      return {
        ...edge,
        sourceHandle: "actor-source",
        targetHandle: side === "left" ? "target-left-1" : "target-right-1",
      };
    }
    const toRight = target.position.x > source.position.x || (target.position.x === source.position.x && target.position.y >= source.position.y);
    const sourceSlot = outgoingSlots.get(`${source.id}:${edge.id}`) ?? 1;
    const targetSlot = incomingSlots.get(`${target.id}:${edge.id}`) ?? 1;
    return {
      ...edge,
      sourceHandle: `${toRight ? "source-right" : "source-left"}-${sourceSlot}`,
      targetHandle: `${toRight ? "target-left" : "target-right"}-${targetSlot}`,
    };
  });
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
    const handleName = String(handle ?? "");
    const left = handleName.includes("left") || (node.type === "actor" && (node.data as ActorNodeData).side === "right");
    const slot = Number(handleName.match(/-(\d+)$/)?.[1] ?? 1);
    const verticalOffset = Number.parseFloat(HANDLE_OFFSETS[Math.min(slot, HANDLE_OFFSETS.length - 1)]) / 100;
    return { x: node.position.x + (left ? 0 : widthOf), y: node.position.y + heightOf * verticalOffset };
  };
  const edgeMarkup = edges.map((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return "";
    const from = port(source, edge.sourceHandle);
    const to = port(target, edge.targetHandle);
    const layoutPoints = edge.data && typeof edge.data === "object" && "points" in edge.data
      ? (edge.data as DiagramEdgeData).points
      : undefined;
    const points = layoutPoints && layoutPoints.length >= 2 ? layoutPoints : [{ x: from.x, y: from.y }, { x: to.x, y: to.y }];
    const path = edgePath(points);
    const midpoint = edgeMidpoint(points);
    const label = typeof edge.label === "string" ? edge.label : "";
    const dash = edge.style?.strokeDasharray ? ` stroke-dasharray="${edge.style.strokeDasharray}"` : "";
    const marker = edge.type === "generalization" ? "url(#generalization)" : edge.type === "relationship" ? "url(#open-arrow)" : "";
    const labelMarkup = label
      ? `<rect x="${midpoint.x - label.length * 3.1 - 6}" y="${midpoint.y - 10}" width="${label.length * 6.2 + 12}" height="18" rx="3" fill="#ffffff"/><text x="${midpoint.x}" y="${midpoint.y + 3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#4b5563">${escape(label)}</text>`
      : "";
    return `<path d="${path}" fill="none" stroke="#686868" stroke-width="1.3"${dash}${marker ? ` marker-end="${marker}"` : ""}/>${labelMarkup}`;
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

  const exportDrawio = () => {
    if (!nodes.some((node) => node.type === "usecase")) return;
    const source = buildDrawioXml(nodes, edges, boundaryName(response));
    const filename = `${response.projectName}-use-case-diagram.drawio`.replace(/[^a-z0-9-_.]/gi, "-");
    downloadDrawioFile(source, filename);
  };

  return (
    <section ref={sectionRef} className={`flex min-h-[520px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/25 ${fullscreen ? "h-screen w-screen rounded-none bg-background p-2" : ""}`}>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{boundaryName(response)}</h2>
          <p className="mt-1 text-xs text-muted-foreground">React Flow preview · {response.useCases.length} use cases · {response.relationships.length} relationships</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-label="Export editable Draw.io file" title="Export editable Draw.io file" className="inline-flex h-8 min-w-max shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/50 bg-primary/5 px-2.5 text-xs text-primary hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50" onClick={exportDrawio} disabled={!nodes.some((node) => node.type === "usecase")}>
            <FileDown className="size-3.5" />Export .drawio
          </button>
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
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodesConnectable={false}
            nodesDraggable={false}
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
