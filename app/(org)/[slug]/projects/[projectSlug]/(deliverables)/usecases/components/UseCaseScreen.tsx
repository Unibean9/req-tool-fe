"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Background, BaseEdge, Controls, EdgeLabelRenderer, getStraightPath,
  getNodesBounds, Handle, MarkerType, Position, ReactFlow, useEdgesState,
  useNodesState, type Connection, type Edge, type EdgeProps, type Node,
} from "@xyflow/react";
import {
  CheckCircle2, CircleDot, Download, GitBranch, Layers3, Maximize2, Minimize2,
  Network, Plus, Search, Sparkles, Table2, Trash2, Users,
} from "lucide-react";
import "@xyflow/react/dist/style.css";
import {
  createUseCaseActor, updateUseCaseActor, deleteUseCaseActor,
  createUseCase, updateUseCase, deleteUseCase, createUseCaseRelationship, deleteUseCaseRelationship,
  type UseCaseActorResponse, type UseCaseLevel, type UseCaseDiagramPlan,
  type UseCaseItemResponse, type UseCaseModelResponse, type UseCaseRelationshipType,
  type UseCaseStatus,
} from "@/lib/api/services/useCaseModel";

import { useOrgProjects } from "@/hooks/useProject";
import { useUseCaseModel } from "@/hooks/useUseCaseModel";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { useOrgWorkspace } from "../../../../../orgWorkspaceContext";
import { UseCaseEditor } from "./UseCaseEditor";
import { UseCaseActorsDialog } from "./UseCaseActorsDialog";

const EMPTY_USE_CASES: UseCaseItemResponse[] = [];
const EMPTY_ACTORS: UseCaseActorResponse[] = [];

function hierarchyRows(items: UseCaseItemResponse[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const children = new Map<string, UseCaseItemResponse[]>();
  for (const item of items) {
    const parentId = item.parentUseCaseId && byId.has(item.parentUseCaseId) ? item.parentUseCaseId : "";
    children.set(parentId, [...(children.get(parentId) ?? []), item]);
  }
  const visited = new Set<string>();
  const rows: { item: UseCaseItemResponse; depth: number }[] = [];
  const visit = (item: UseCaseItemResponse, depth: number) => {
    if (visited.has(item.id)) return;
    visited.add(item.id);
    rows.push({ item, depth });
    for (const child of children.get(item.id) ?? []) visit(child, depth + 1);
  };
  for (const root of children.get("") ?? []) visit(root, 0);
  for (const item of items) visit(item, 0);
  return rows;
}

type ActorNodeData = { actorId: string; name: string; side: "left" | "right"; onRename?: (name: string) => void };
type CaseNodeData = { useCaseId: string; title: string; editTitle?: string; level: UseCaseLevel; onRename?: (name: string) => void };
type Tab = "table" | "diagram";

function EditableLabel({ value, editValue = value, onRename, className }: { value: string; editValue?: string; onRename?: (name: string) => void; className: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => {
    const next = draft.trim();
    if (next && next !== editValue) onRename?.(next);
    else setDraft(editValue);
    setEditing(false);
  };
  if (editing) return <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onPointerDown={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === "Enter") commit(); if (event.key === "Escape") { setDraft(editValue); setEditing(false); } }} className="nodrag nopan w-full rounded border border-[#4f9f83] bg-white px-1 py-0.5 text-center text-[#20242d] outline-none" aria-label="Edit diagram label" />;
  return <span onDoubleClick={(event) => { event.stopPropagation(); if (onRename) { setDraft(editValue); setEditing(true); } }} title={onRename ? "Double-click to rename" : undefined} className={`${className} ${onRename ? "cursor-text" : ""}`}>{value}</span>;
}

function SystemNode({ data }: { data: { title: string } }) {
  return <div className="h-full w-full border border-[#737373] bg-white text-[#20242d]"><h2 className="pt-7 text-center text-xl font-semibold tracking-wide">{data.title}</h2></div>;
}

function ActorNode({ data }: { data: ActorNodeData }) {
  const position = data.side === "left" ? Position.Right : Position.Left;
  return <div className="flex w-40 flex-col items-center bg-transparent px-1 text-center text-[11px] text-[#24272e]">
    <Handle type="source" position={position} id={data.side} className="!size-2 !border-0 !bg-[#777]/70" />
    <Handle type="target" position={position} id={`${data.side}-target`} className="!size-2 !border-0 !bg-[#777]/70" />
    <svg aria-hidden viewBox="0 0 80 88" className="mb-1 h-[78px] w-[72px] fill-none stroke-[#555] stroke-[1.2]"><circle cx="40" cy="12" r="10" /><path d="M40 22v33M16 34h48M40 55 20 82M40 55l20 27" /></svg>
    <EditableLabel value={data.name} onRename={data.onRename} className="max-w-36 font-mono" />
  </div>;
}

function UseCaseNode({ data }: { data: CaseNodeData }) {
  return <div className="relative flex min-h-[68px] w-[218px] items-center justify-center rounded-[50%] border border-[#777] bg-white px-6 text-center text-[11px] leading-tight text-[#252932]">
    <Handle type="target" id="target-left" position={Position.Left} className="!size-2 !border-0 !bg-[#777]/70" />
    <Handle type="target" id="target-right" position={Position.Right} className="!size-2 !border-0 !bg-[#777]/70" />
    <EditableLabel value={data.title} editValue={data.editTitle} onRename={data.onRename} className="min-w-0" />
    <Handle type="source" id="source-left" position={Position.Left} className="!size-2 !border-0 !bg-[#777]/70" />
    <Handle type="source" id="source-right" position={Position.Right} className="!size-2 !border-0 !bg-[#777]/70" />
  </div>;
}

function GeneralizationEdge({ id, sourceX, sourceY, targetX, targetY, label, style }: EdgeProps) {
  const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const distance = Math.hypot(targetX - sourceX, targetY - sourceY) || 1;
  const unitX = (targetX - sourceX) / distance;
  const unitY = (targetY - sourceY) / distance;
  const baseX = targetX - unitX * 14;
  const baseY = targetY - unitY * 14;
  const normalX = -unitY * 7;
  const normalY = unitX * 7;
  const points = `${targetX},${targetY} ${baseX + normalX},${baseY + normalY} ${baseX - normalX},${baseY - normalY}`;
  return <>
    <BaseEdge id={id} path={path} style={style} />
    <polygon points={points} fill="white" stroke={String(style?.stroke ?? "#686868")} strokeWidth="1.5" />
    {label ? <EdgeLabelRenderer><div className="nodrag nopan rounded bg-white/90 px-1 text-[10px] text-[#555]" style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: "none" }}>{label}</div></EdgeLabelRenderer> : null}
  </>;
}

const edgeTypes = { generalization: GeneralizationEdge };

function createGraph(response: UseCaseModelResponse, plan: UseCaseDiagramPlan | undefined) {
  if (!plan) return { nodes: [] as Node[], edges: [] as Edge[] };
  const caseNodes = plan.nodes.filter((node) => node.kind === "use_case");
  const columns = Math.min(3, Math.max(1, caseNodes.length));
  const width = columns * 390 + 100;
  const height = Math.max(520, Math.ceil(caseNodes.length / columns) * 180 + 180);
  const sideIndex = { left: 0, right: 0 };
  const sideCount = { left: plan.nodes.filter((node) => node.kind === "actor" && node.side !== "right").length, right: plan.nodes.filter((node) => node.kind === "actor" && node.side === "right").length };
  const nodes: Node[] = plan.nodes.map((node) => {
    if (node.kind === "system_boundary") return { id: node.id, type: "system", position: { x: 230, y: 0 }, data: { title: node.label }, style: { width, height }, draggable: false, selectable: false, deletable: false, zIndex: -2 };
    if (node.kind === "actor") {
      const side = node.side === "right" ? "right" : "left";
      const index = sideIndex[side]++;
      return { id: `actor-${node.id}`, type: "actor", position: { x: side === "left" ? 0 : width + 300, y: (index + 1) * height / (sideCount[side] + 1) - 50 }, data: { actorId: node.id, name: node.label, side } };
    }
    const index = caseNodes.findIndex((item) => item.id === node.id);
    const row = response.useCases.find((item) => item.id === node.id);
    return { id: `usecase-${node.id}`, type: "usecase", position: { x: 310 + index % columns * 390, y: 130 + Math.floor(index / columns) * 180 }, data: { useCaseId: node.id, title: node.label, editTitle: row?.title ?? node.label, level: row?.level ?? plan.level } };
  });
  const byId = new Map(nodes.map((node) => [String(node.data.actorId ?? node.data.useCaseId ?? node.id), node]));
  const edges: Edge[] = plan.edges.flatMap((edge) => {
    const source = byId.get(edge.sourceId);
    const target = byId.get(edge.targetId);
    if (!source || !target) return [];
    const right = target.position.x >= source.position.x;
    return [{ id: edge.id, source: source.id, target: target.id,
      sourceHandle: source.type === "actor" ? String(source.data.side) : right ? "source-right" : "source-left",
      targetHandle: target.type === "actor" ? `${target.data.side}-target` : right ? "target-left" : "target-right",
      type: edge.marker === "open_triangle" ? "generalization" : "straight",
      label: edge.label ?? undefined,
      data: { condition: edge.condition },
      ...(edge.directed && edge.marker === "open_arrow" ? { markerEnd: { type: MarkerType.Arrow } } : {}),
      style: { stroke: "#686868", strokeWidth: 1.2, ...(edge.lineStyle === "dashed" ? { strokeDasharray: "5 4" } : {}) },
      labelStyle: { fill: "#4b5563", fontSize: 11 }, labelBgStyle: { fill: "#ffffff", fillOpacity: 0.95 },
    }];
  });
  return { nodes, edges };
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

function wrapSvgText(value: string, maxCharacters: number) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function createDiagramSvg(nodes: Node[], edges: Edge[], projectName: string) {
  const bounds = getNodesBounds(nodes);
  const padding = 96;
  const minX = bounds.x - padding;
  const minY = bounds.y - padding;
  const width = Math.ceil(bounds.width + padding * 2);
  const height = Math.ceil(bounds.height + padding * 2);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const dimension = (value: unknown, fallback: number) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
  };
  const sizeOf = (node: Node) => ({
    width: dimension(node.measured?.width ?? node.width ?? node.style?.width, node.type === "system" ? 1260 : node.type === "usecase" ? 218 : 160),
    height: dimension(node.measured?.height ?? node.height ?? node.style?.height, node.type === "system" ? 1490 : node.type === "usecase" ? 68 : 110),
  });
  const port = (node: Node, handleId: string | null | undefined) => {
    const { width: nodeWidth, height: nodeHeight } = sizeOf(node);
    const handle = handleId ?? "";
    const actorSide = String(node.data.side ?? "");
    const onLeft = node.type === "actor" ? actorSide !== "left" : handle.includes("left");
    return { x: node.position.x + (onLeft ? 0 : nodeWidth), y: node.position.y + nodeHeight / 2 };
  };
  const systemNode = nodes.find((node) => node.type === "system");
  const systemSize = systemNode ? sizeOf(systemNode) : { width: bounds.width, height: bounds.height };
  const boundary = systemNode ? `<rect x="${systemNode.position.x}" y="${systemNode.position.y}" width="${systemSize.width}" height="${systemSize.height}" fill="#ffffff" stroke="#737373" stroke-width="1.4"/><text x="${systemNode.position.x + systemSize.width / 2}" y="${systemNode.position.y + 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#20242d">${escapeXml(projectName)}</text>` : "";
  const edgeMarkup = edges.map((edge) => {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    if (!sourceNode || !targetNode || sourceNode.type === "system" || targetNode.type === "system") return "";
    const source = port(sourceNode, edge.sourceHandle);
    const target = port(targetNode, edge.targetHandle);
    const lineType = edge.type ?? "straight";
    let path = `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
    if (lineType === "step" || lineType === "smoothstep") {
      const middleX = (source.x + target.x) / 2;
      path = `M ${source.x} ${source.y} L ${middleX} ${source.y} L ${middleX} ${target.y} L ${target.x} ${target.y}`;
    } else if (lineType === "default") {
      const middleX = (source.x + target.x) / 2;
      path = `M ${source.x} ${source.y} C ${middleX} ${source.y}, ${middleX} ${target.y}, ${target.x} ${target.y}`;
    }
    const label = typeof edge.label === "string" ? edge.label : "";
    const marker = edge.type === "generalization" ? "url(#generalization)" : edge.markerEnd ? "url(#open-arrow)" : "";
    const dash = edge.style?.strokeDasharray ?? (label.includes("include") || label.includes("extend") ? "6 5" : "");
    const stroke = String(edge.style?.stroke ?? "#737373");
    const labelMarkup = label ? `<rect x="${(source.x + target.x) / 2 - (label.length * 3.2 + 7)}" y="${(source.y + target.y) / 2 - 11}" width="${label.length * 6.4 + 14}" height="20" rx="3" fill="#ffffff"/><text x="${(source.x + target.x) / 2}" y="${(source.y + target.y) / 2 + 3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#4b5563">${escapeXml(label)}</text>` : "";
    return `<path d="${path}" fill="none" stroke="${escapeXml(stroke)}" stroke-width="1.4"${dash ? ` stroke-dasharray="${escapeXml(String(dash))}"` : ""}${marker ? ` marker-end="${marker}"` : ""}/>${labelMarkup}`;
  }).join("");
  const nodeMarkup = nodes.map((node) => {
    if (node.type === "system") return "";
    const { width: nodeWidth, height: nodeHeight } = sizeOf(node);
    const x = node.position.x;
    const y = node.position.y;
    if (node.type === "actor") {
      const center = x + nodeWidth / 2;
      const labelY = y + Math.max(96, nodeHeight - 5);
      return `<g fill="none" stroke="#555555" stroke-width="1.5"><circle cx="${center}" cy="${y + 12}" r="10"/><path d="M ${center} ${y + 22} V ${y + 56} M ${center - 24} ${y + 34} H ${center + 24} M ${center} ${y + 56} L ${center - 20} ${y + 82} M ${center} ${y + 56} L ${center + 20} ${y + 82}"/></g><text x="${center}" y="${labelY}" text-anchor="middle" font-family="monospace" font-size="11" fill="#24272e">${escapeXml(String(node.data.name ?? "Actor"))}</text>`;
    }
    if (node.type === "usecase") {
      const centerX = x + nodeWidth / 2;
      const centerY = y + nodeHeight / 2;
      const lines = wrapSvgText(String(node.data.title ?? "Use case"), Math.max(18, Math.floor((nodeWidth - 28) / 6.5)));
      const firstY = centerY - ((lines.length - 1) * 13) / 2 + 4;
      const text = lines.map((line, index) => `<tspan x="${centerX}" y="${firstY + index * 13}">${escapeXml(line)}</tspan>`).join("");
      return `<ellipse cx="${centerX}" cy="${centerY}" rx="${nodeWidth / 2}" ry="${nodeHeight / 2}" fill="#ffffff" stroke="#777777" stroke-width="1.3"/><text text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#252932">${text}</text>`;
    }
    return "";
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * 2}" height="${height * 2}" viewBox="${minX} ${minY} ${width} ${height}"><defs><marker id="open-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto"><path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="#686868" stroke-width="1.2"/></marker><marker id="generalization" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto"><path d="M 0 0 L 12 6 L 0 12 Z" fill="#ffffff" stroke="#686868" stroke-width="1.2"/></marker></defs><rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff"/>${boundary}${edgeMarkup}${nodeMarkup}</svg>`;
}

function StatusBadge({ status }: { status: UseCaseStatus }) {
  const style = status === "Confirmed" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : status === "Inferred" ? "border-violet-500/40 bg-violet-500/10 text-violet-300" : "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${style}`}><CheckCircle2 className="size-3" />{status}</span>;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-medium text-muted-foreground">{label}</p><p className="mt-1 leading-relaxed text-foreground/85">{value}</p></div>;
}

export default function UseCaseScreen() {
  const params = useParams<{ projectSlug: string }>();
  const { orgId } = useOrgWorkspace();
  const projects = useOrgProjects(orgId);
  const projectId = projects.data?.find((project) => project.slug === params.projectSlug)?.id;
  const { data: response, error: loadError, isLoading, refetch, save, generate, saving, saveError } = useUseCaseModel(projectId);
  const [uiError, setUiError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [actorsOpen, setActorsOpen] = useState(false);
  const [editor, setEditor] = useState<UseCaseItemResponse | "new" | null>(null);
  const [tab, setTab] = useState<Tab>("table");
  const [level, setLevel] = useState<"all" | UseCaseLevel>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [lineType, setLineType] = useState<"straight" | "step" | "smoothstep" | "default">("straight");
  const [relationship, setRelationship] = useState<Exclude<UseCaseRelationshipType, "part-of">>("association");
  const [isDiagramFullscreen, setIsDiagramFullscreen] = useState(false);
  const diagramSectionRef = useRef<HTMLElement>(null);
  const nodeTypes = useMemo(() => ({ system: SystemNode, actor: ActorNode, usecase: UseCaseNode }), []);
  const renameActor = useCallback((id: string, name: string) => { void save(() => updateUseCaseActor(projectId!, id, { name })); }, [projectId, save]);
  const renameUseCase = useCallback((id: string, title: string) => { void save(() => updateUseCase(projectId!, id, { title })); }, [projectId, save]);
  const plan = response?.diagramPlans.find((item) => item.diagramId === selectedPlanId) ?? response?.diagramPlans[0];
  const planIsEligible = Boolean(plan && response?.validation?.eligibleDiagramIds.includes(plan.diagramId));
  const graph = useMemo(() => response ? createGraph(response, plan) : { nodes: [], edges: [] }, [response, plan]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  useEffect(() => {
    const editableNodes = graph.nodes.map((node) => {
      if (node.type === "actor") {
        const actorId = String(node.data.actorId);
        return { ...node, data: { ...node.data, onRename: (name: string) => renameActor(actorId, name) } };
      }
      if (node.type === "usecase") {
        const useCaseId = String(node.data.useCaseId);
        return { ...node, data: { ...node.data, onRename: (name: string) => renameUseCase(useCaseId, name) } };
      }
      return node;
    });
    setNodes(editableNodes);
    setEdges(graph.edges);
  }, [graph, renameActor, renameUseCase, setEdges, setNodes]);

  const onConnect = useCallback((connection: Connection) => {
    if (saving) return;
    const sourceId = connection.source.replace(/^(actor|usecase)-/, "");
    const targetId = connection.target.replace(/^(actor|usecase)-/, "");
    const condition = relationship === "extend" ? window.prompt("Extension condition (required)")?.trim() : null;
    if (relationship === "extend" && !condition) return;
    void save(() => createUseCaseRelationship(projectId!, { sourceId, targetId, type: relationship, condition: condition ?? null }));
  }, [projectId, relationship, save, saving]);

  useEffect(() => {
    const syncFullscreen = () => setIsDiagramFullscreen(document.fullscreenElement === diagramSectionRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleDiagramFullscreen = useCallback(async () => {
    if (document.fullscreenElement === diagramSectionRef.current) {
      await document.exitFullscreen();
    } else {
      await diagramSectionRef.current?.requestFullscreen();
    }
  }, []);

  const exportDiagram = useCallback(async () => {
    if (!nodes.length) return;
    const svg = createDiagramSvg(nodes, edges.map((edge) => edge.type === "generalization" ? edge : { ...edge, type: lineType }), plan?.systemBoundary ?? response?.projectName ?? "Use Case Diagram");
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
      link.download = `${response?.projectName ?? "use-case-diagram"}-${plan?.level ?? "diagram"}-${plan?.subsystem ?? "overview"}.png`.replace(/[^a-z0-9-_.]/gi, "-");
      link.href = pngUrl;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }, [edges, nodes, response?.projectName, plan?.level, plan?.subsystem, plan?.systemBoundary, lineType]);

  const useCases = response?.useCases ?? EMPTY_USE_CASES;
  const actors = response?.actors ?? EMPTY_ACTORS;
  const actorById = useMemo(() => new Map(actors.map((actor) => [actor.id, actor])), [actors]);
  const visibleUseCases = useMemo(() => hierarchyRows(useCases).filter(({ item }) => (level === "all" || item.level === level) && `${item.id} ${item.title} ${item.subsystem} ${item.status}`.toLowerCase().includes(query.toLowerCase())), [level, query, useCases]);
  const selected = useCases.find((item) => item.id === selectedId) ?? useCases[0] ?? null;
  const selectedRelationships = selected ? (response?.relationships ?? []).filter((item) => item.sourceId === selected.id || item.targetId === selected.id) : [];
  const count = (wanted: "all" | UseCaseLevel) => wanted === "all" ? useCases.length : useCases.filter((item) => item.level === wanted).length;
  const addActor = () => setActorsOpen(true);
  const addUseCase = () => setEditor("new");
  const selectedNodes = nodes.filter((node) => node.selected && node.type !== "system");
  const selectedEdges = edges.filter((edge) => edge.selected);
  const selectedCount = selectedNodes.length + selectedEdges.length;
  const deleteSelected = () => {
    if (!selectedCount || saving) return;
    void save(async () => {
      for (const edge of selectedEdges) await deleteUseCaseRelationship(projectId!, edge.id);
      // Children must be deleted before their parents. The backend protects remaining references.
      const ordered = [...selectedNodes].sort((a, b) => String(b.data.level ?? "").localeCompare(String(a.data.level ?? "")));
      for (const node of ordered) {
        if (node.type === "actor") await deleteUseCaseActor(projectId!, String(node.data.actorId));
        else await deleteUseCase(projectId!, String(node.data.useCaseId));
      }
    });
  };

  if (!response) return <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
    {projects.isLoading || isLoading ? "Loading use case model…" : <><p role="alert">{getApiErrorMessage(loadError ?? projects.error, projectId ? "Could not load use case model." : "Project could not be found.")}</p><button type="button" onClick={() => { void projects.refetch(); if (projectId) void refetch(); }} className="rounded-md border px-3 py-2">Retry</button></>}
  </div>;

  return <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
    <header className="rounded-xl border border-border/70 bg-card/35 p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-primary">{response.projectName.toUpperCase()} <span className="text-muted-foreground">/ MODELING</span></div>
          <div className="flex items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight">Use Case</h1><span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-200"><Sparkles className="size-3" />{saving ? "Saving…" : "Project model"}</span></div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Explore a multi-level use case model informed by the project’s BRD and PRD. The table is the source model; the diagram is a React Flow preview.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={saving} onClick={addActor} className="text-xs text-primary">Actors · {actors.length}</button><button type="button" disabled={saving} onClick={addUseCase} className="text-xs text-primary">Add use case</button><button type="button" disabled={saving} onClick={() => void generate()} className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">{saving ? "Processing…" : "Generate Use Case"}</button><div className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Layers3 className="size-4 text-primary" />{useCases.length} use cases across 3 levels</div></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="flex items-center gap-1 rounded-lg bg-muted/40 p-1"><button type="button" onClick={() => setTab("table")} className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium ${tab === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Table2 className="size-4" />Use Case Table</button><button type="button" onClick={() => setTab("diagram")} className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium ${tab === "diagram" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Network className="size-4" />Diagram</button></div>
        {tab === "table" ? <div className="flex items-center gap-1 overflow-x-auto">{(["all", "L0", "L1", "L2"] as const).map((item) => <button key={item} type="button" onClick={() => setLevel(item)} className={`shrink-0 rounded-md px-2.5 py-2 text-[11px] ${level === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>{item === "all" ? "All levels" : item} · {count(item)}</button>)}</div> : <div className="flex items-center gap-2"><button type="button" disabled={saving} onClick={addActor} className="inline-flex h-8 items-center gap-1 rounded-md border border-border/70 px-2.5 text-[11px] hover:bg-muted/50"><Plus className="size-3.5" />Actor</button><button type="button" disabled={saving} onClick={addUseCase} className="inline-flex h-8 items-center gap-1 rounded-md border border-border/70 px-2.5 text-[11px] hover:bg-muted/50"><Plus className="size-3.5" />UC oval</button></div>}
      </div>
    </header>
    {saveError || uiError ? <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm whitespace-pre-line text-destructive">{saveError ?? uiError}</p> : null}
    {response.generation?.source === "manual" ? <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">Changes are saved. The diagram may show an earlier version because diagram updates are not yet available after manual edits.</p> : null}
    {response.validation ? <details className="rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground"><summary className="cursor-pointer">{response.validation.eligibleForSrs ? "Eligible for SRS" : "Review required for SRS"} · {response.validation.issues.length} issues · {response.validation.eligibleDiagramIds.length} eligible diagrams</summary><div className="mt-3 space-y-2"><p>Eligible diagrams: {response.validation.eligibleDiagramIds.join(", ") || "None"}</p>{response.validation.issues.map((issue, index) => <p key={`${issue.code}-${index}`} className={issue.severity === "error" ? "text-destructive" : "text-amber-400"}>{issue.severity}: {issue.message}{issue.path ? ` (${issue.path})` : ""}</p>)}</div></details> : <p className="text-xs text-muted-foreground">Model has not been validated. Generate to review diagram eligibility.</p>}
    {actorsOpen ? <UseCaseActorsDialog actors={actors} busy={saving} error={saveError} onClose={() => setActorsOpen(false)} onCreate={(name, kind) => save(() => createUseCaseActor(projectId!, { name, kind }))} onRename={(id, name) => save(() => updateUseCaseActor(projectId!, id, { name }))} onDelete={(id) => save(() => deleteUseCaseActor(projectId!, id))} /> : null}
    {editor ? <UseCaseEditor key={typeof editor === "string" ? editor : editor.id} model={response} item={editor === "new" ? undefined : editor} busy={saving} error={saveError} onClose={() => setEditor(null)} onSave={(body) => save(() => editor === "new" ? createUseCase(projectId!, body) : updateUseCase(projectId!, editor.id, body))} /> : null}

    {tab === "table" ? <div className="grid min-h-[560px] min-w-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 overflow-hidden rounded-xl border border-border/70 bg-card/25"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-4"><div><h2 className="text-sm font-semibold">Use Case Table</h2><p className="mt-1 text-xs text-muted-foreground">Hierarchy, actor mapping, evidence, and relationship hints.</p></div><label className="flex h-8 items-center gap-2 rounded-md border border-border/70 bg-background/45 px-2.5 text-muted-foreground"><Search className="size-3.5" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search use cases" className="w-36 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground" /></label></div>
        <div className="overflow-auto"><table className="w-full min-w-[820px] border-collapse text-left"><thead className="sticky top-0 z-10 bg-muted/80"><tr className="border-b border-border/60 text-[11px] text-muted-foreground"><th className="px-4 py-3 font-medium">Level</th><th className="px-4 py-3 font-medium">Use case</th><th className="px-4 py-3 font-medium">Primary actor</th><th className="px-4 py-3 font-medium">Subsystem</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Priority</th></tr></thead><tbody>{visibleUseCases.map(({ item, depth }) => <tr key={item.id} onClick={() => setSelectedId(item.id)} className={`cursor-pointer border-b border-border/50 transition-colors ${selected?.id === item.id ? "bg-primary/8" : "hover:bg-muted/25"}`}><td className="px-4 py-3"><span className="rounded-lg border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] font-semibold text-primary">{item.level}</span></td><td className="max-w-[300px] px-4 py-3"><div className="flex items-center gap-2" style={{ paddingLeft: depth * 16 }}><span className="size-1.5 shrink-0 rounded-full bg-primary" /><span className="min-w-0"><span className="block truncate text-xs font-medium">{item.title}</span><span className="mt-0.5 block font-mono text-[9px] text-muted-foreground">{item.id}</span></span></div></td><td className="px-4 py-3 text-xs text-muted-foreground">{actorById.get(item.primaryActorId)?.name ?? "—"}</td><td className="max-w-[210px] truncate px-4 py-3 text-xs text-muted-foreground">{item.subsystem}</td><td className="px-4 py-3"><StatusBadge status={item.status} /></td><td className="px-4 py-3 text-xs text-muted-foreground">{item.priority}</td></tr>)}</tbody></table>{visibleUseCases.length === 0 ? <p className="px-4 py-8 text-center text-xs text-muted-foreground">{useCases.length ? "No matching use cases." : "No use case model yet. Generate from the project BRD and PRD to get started."}</p> : null}</div>
      </section>
      <aside className="overflow-hidden rounded-xl border border-border/70 bg-card/40">{selected ? <>
        <div className="border-b border-border/60 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground">SELECTED USE CASE</p><h2 className="mt-2 text-base font-semibold leading-snug">{selected.title}</h2><button type="button" disabled={saving} onClick={() => setEditor(selected)} className="mt-2 text-xs text-primary">Edit use case</button><button type="button" disabled={saving} onClick={() => void save(() => deleteUseCase(projectId!, selected.id))} className="ml-3 text-xs text-destructive">Delete</button></div><span className="rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary">{selected.level}</span></div><div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge status={selected.status} /><span className="text-[10px] text-muted-foreground">{selected.priority} priority</span></div></div>
        <div className="space-y-4 p-4 text-xs"><div><p className="font-mono text-[10px] text-muted-foreground">{selected.id} · {selected.subsystem.toUpperCase()}</p><p className="mt-2 leading-relaxed text-foreground/85">{selected.description}</p></div><DetailField label="Primary actor" value={actorById.get(selected.primaryActorId)?.name ?? "—"} /><DetailField label="Supporting actors" value={selected.supportingActorIds.map((id) => actorById.get(id)?.name).filter(Boolean).join(", ") || "None"} /><DetailField label="Precondition" value={selected.precondition} />
          <div><p className="mb-2 text-[10px] font-medium text-muted-foreground">Relationships</p>{selectedRelationships.length ? <ul className="space-y-2">{selectedRelationships.map((relation) => { const otherId = relation.sourceId === selected.id ? relation.targetId : relation.sourceId; const other = useCases.find((item) => item.id === otherId); return <li key={relation.id} className="flex items-center gap-2 text-[11px] text-foreground/80"><GitBranch className="size-3 text-primary" /><span className="text-muted-foreground">{relation.type}</span><span className="truncate">{other?.id ?? otherId}</span>{relation.condition ? <span className="text-muted-foreground">{relation.condition}</span> : null}<button type="button" disabled={saving} aria-label={`Delete relationship ${relation.id}`} onClick={() => void save(() => deleteUseCaseRelationship(projectId!, relation.id))} className="ml-auto text-destructive"><Trash2 className="size-3" /></button></li>; })}</ul> : <span className="text-muted-foreground">No linked use cases</span>}</div>
          <div><p className="mb-2 text-[10px] font-medium text-muted-foreground">Source trace</p><div className="flex flex-wrap gap-1.5">{selected.sourceTrace.map((source) => <span key={source} className="rounded-md border border-border/70 bg-muted/35 px-2 py-1 font-mono text-[9px]">{source}</span>)}</div></div>
        </div></> : <p className="p-5 text-sm text-muted-foreground">Select a use case to inspect details.</p>}</aside>
    </div> : <section ref={diagramSectionRef} className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/25 ${isDiagramFullscreen ? "h-screen w-screen rounded-none bg-background p-2" : ""}`}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3"><div><h2 className="text-sm font-semibold">{plan?.subsystem ?? plan?.systemBoundary ?? response.projectName}</h2><p className="mt-1 text-xs text-muted-foreground">{plan?.subsystem ? `System boundary · ${plan.systemBoundary} · ` : ""}React Flow preview · {edges.length} relationships{plan && !planIsEligible ? " · Draft preview" : ""}</p></div><div className="flex flex-wrap items-center gap-2"><select aria-label="Diagram" value={plan?.diagramId ?? ""} onChange={(e) => setSelectedPlanId(e.target.value)} className="h-8 max-w-60 rounded-md border border-border/70 bg-background px-2 text-xs">{response.diagramPlans.map((item) => <option key={item.diagramId} value={item.diagramId}>{item.level} · {item.subsystem ?? item.systemBoundary}{response.validation && !response.validation.eligibleDiagramIds.includes(item.diagramId) ? " · Draft" : ""}</option>)}</select><select aria-label="Connector line style" className="h-8 rounded-md border border-border/70 bg-background px-2 text-[10px]" onChange={(event) => setLineType(event.target.value as typeof lineType)}><option value="straight">Straight line</option><option value="step">Right angle</option><option value="smoothstep">Rounded elbow</option><option value="default">Bezier curve</option></select><select aria-label="Relationship type" className="h-8 rounded-md border border-border/70 bg-background px-2 text-[10px]" onChange={(event) => setRelationship(event.target.value as typeof relationship)}><option value="association">Association</option><option value="include">«include»</option><option value="extend">«extend»</option><option value="generalization">Generalization</option></select>{selectedCount > 0 ? <button type="button" disabled={saving} onClick={deleteSelected} className="inline-flex h-8 items-center gap-1 rounded-md border border-destructive/40 px-2.5 text-[10px] text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" />Delete selected · {selectedCount}</button> : null}<button type="button" disabled={!plan} onClick={() => void exportDiagram().catch((error) => setUiError(getApiErrorMessage(error, "Could not export diagram.")))} className="inline-flex h-8 items-center gap-1 rounded-md border border-border/70 px-2.5 text-[10px] hover:bg-muted/50"><Download className="size-3.5" />Export PNG</button><button type="button" onClick={() => void toggleDiagramFullscreen().catch((error) => setUiError(getApiErrorMessage(error, "Full screen is unavailable.")))} className="inline-flex h-8 items-center gap-1 rounded-md border border-border/70 px-2.5 text-[10px] hover:bg-muted/50">{isDiagramFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}{isDiagramFullscreen ? "Exit full screen" : "Full screen"}</button></div></div>{plan && !planIsEligible ? <p role="status" className="border-b border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-300">Draft preview only. Resolve the validation issues above before using this diagram as an SRS diagram.</p> : null}
      <div className="relative min-h-[420px] w-full flex-1 bg-white">{!plan ? <div className="flex h-full min-h-[420px] items-center justify-center p-8 text-center text-sm text-gray-600">No diagram is available. Review validation issues or generate a use case model.</div> : <ReactFlow key={plan?.diagramId} deleteKeyCode={null} nodesConnectable={!saving} nodes={nodes} edges={edges.map((edge) => edge.type === "generalization" ? edge : { ...edge, type: lineType })} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView fitViewOptions={{ padding: 0.025 }} minZoom={0.15} maxZoom={1.3} proOptions={{ hideAttribution: true }}><Background color="#e7e7e7" gap={24} size={1} /><Controls className="!overflow-hidden !rounded-lg !border !border-[#ccc] !bg-white !shadow-md [&>button]:!border-[#ddd] [&>button]:!bg-white [&>button]:!fill-[#333]" /></ReactFlow>}</div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 px-4 py-2.5 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Users className="size-3" />Actor</span><span className="inline-flex items-center gap-1.5"><CircleDot className="size-3" />Use case oval</span><span className="inline-flex items-center gap-1.5"><GitBranch className="size-3" />Association · include · extend</span><span className="ml-auto">Double-click label to edit · select node or edge and delete</span></div>
    </section>}
  </div>;
}
