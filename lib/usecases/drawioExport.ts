export type DrawioExportNode = {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data?: { name?: string; side?: "left" | "right" };
  style?: { width?: number | string; height?: number | string };
};

export type DrawioExportEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: unknown;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  style?: { strokeDasharray?: string | number };
  data?: unknown;
};

type Point = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number };

// Mirrors the on-screen React Flow nodes (UseCaseDiagram.tsx): a 160px-wide actor column with a
// ~40x78 stick figure centred at its top, and handle slots at 24% / 50% / 76% of a node's height.
const ACTOR_COLUMN_WIDTH = 160;
const ACTOR_FIGURE = { width: 40, height: 78 };
const HANDLE_SLOT_Y = [0.24, 0.5, 0.76];

function textValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function xml(value: unknown) {
  return textValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function snap(value: number) {
  return Math.round(value / 10) * 10;
}

function dimension(value: number | string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

function nodeStyle(node: DrawioExportNode) {
  if (node.type === "system") {
    return "rounded=0;whiteSpace=wrap;html=1;align=center;verticalAlign=top;spacingTop=16;fillColor=none;strokeColor=#6b7280;strokeWidth=1.5;container=0;pointerEvents=0;collapsible=0;fontColor=#111827;fontStyle=1;";
  }
  if (node.type === "actor") {
    // No whiteSpace=wrap: the label would otherwise wrap to the narrow figure's width.
    return "shape=umlActor;html=1;verticalLabelPosition=bottom;verticalAlign=top;outlineConnect=0;fillColor=#ffffff;strokeColor=#6b7280;fontColor=#374151;";
  }
  return "ellipse;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#6b7280;fontColor=#374151;";
}

/** The node's drawn shape, in the same coordinates as React Flow positions. */
function nodeBox(node: DrawioExportNode): Box {
  const x = Number(node.position.x) || 0;
  const y = Number(node.position.y) || 0;
  if (node.type === "actor") {
    return { x: x + (ACTOR_COLUMN_WIDTH - ACTOR_FIGURE.width) / 2, y, ...ACTOR_FIGURE };
  }
  const system = node.type === "system";
  return {
    x,
    y,
    width: dimension(node.style?.width, system ? 900 : 224),
    height: dimension(node.style?.height, system ? 560 : 72),
  };
}

function layoutPoints(edge: DrawioExportEdge): Point[] {
  const points = (edge.data as { points?: unknown } | undefined)?.points;
  if (!Array.isArray(points)) return [];
  return points.filter(
    (point): point is Point => Number.isFinite(point?.x) && Number.isFinite(point?.y),
  );
}

/** Where an edge leaves/enters a node, as draw.io's relative exit/entry constraint. */
function endpointStyle(box: Box, prefix: "exit" | "entry", point: Point | undefined, handle: string | null | undefined) {
  const ratio = (value: number) => Math.min(1, Math.max(0, Number(value.toFixed(3))));
  if (point) {
    // The ELK-routed endpoint itself, so draw.io starts/ends the line exactly where the web does.
    return `${prefix}X=${ratio((point.x - box.x) / box.width)};${prefix}Y=${ratio((point.y - box.y) / box.height)};${prefix}Dx=0;${prefix}Dy=0;`;
  }
  const side = handle?.includes("left") ? 0 : handle?.includes("right") ? 1 : undefined;
  if (side === undefined) return "";
  const slot = Number(handle?.match(/-(\d+)$/)?.[1] ?? 1);
  return `${prefix}X=${side};${prefix}Y=${HANDLE_SLOT_Y[slot] ?? 0.5};${prefix}Dx=0;${prefix}Dy=0;`;
}

function edgeStyle(edge: DrawioExportEdge, source: DrawioExportNode, target: DrawioExportNode, points: Point[]) {
  const routing = "rounded=0;html=1;";
  // An actor's association line floats on the figure's outline, as it does on screen.
  const exit = source.type === "actor" ? "" : endpointStyle(nodeBox(source), "exit", points[0], edge.sourceHandle);
  const entry = endpointStyle(nodeBox(target), "entry", points[points.length - 1], edge.targetHandle);
  const stroke = "strokeColor=#6b7280;strokeWidth=1.1;fontColor=#4b5563;labelBackgroundColor=#ffffff;";

  if (edge.type === "generalization") {
    return `edgeStyle=none;${routing}endArrow=block;endFill=0;endSize=12;${stroke}${exit}${entry}`;
  }
  if (edge.type === "relationship") {
    // «include» / «extend»: dashed with an open arrowhead, pointing source -> target.
    return `edgeStyle=none;${routing}dashed=1;dashPattern=6 5;endArrow=open;endSize=12;${stroke}${exit}${entry}`;
  }
  return `edgeStyle=none;${routing}endArrow=none;${stroke}${exit}${entry}`;
}

/**
 * Build an editable, uncompressed diagrams.net file from the current React Flow graph.
 * IDs are regenerated so arbitrary API IDs never become XML identifiers.
 */
export function buildDrawioXml(nodes: DrawioExportNode[], edges: DrawioExportEdge[], title: string) {
  const nodeIds = new Map(nodes.map((node, index) => [node.id, String(index + 2)]));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const vertices = nodes.map((node, index) => {
    const box = nodeBox(node);
    const label = node.type === "system" ? title : node.data?.name ?? "";
    return `<mxCell id="${index + 2}" value="${xml(label)}" vertex="1" parent="1" style="${nodeStyle(node)}"><mxGeometry x="${Math.round(box.x)}" y="${Math.round(box.y)}" width="${box.width}" height="${box.height}" as="geometry"/></mxCell>`;
  });
  const connections = edges.flatMap((edge, index) => {
    const sourceId = nodeIds.get(edge.source);
    const targetId = nodeIds.get(edge.target);
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!sourceId || !targetId || !source || !target) return [];
    const points = layoutPoints(edge);
    // Interior ELK bend points become draw.io waypoints, so a routed edge keeps its route.
    const waypoints = points.slice(1, -1).map((point) => `<mxPoint x="${Math.round(point.x)}" y="${Math.round(point.y)}"/>`);
    const geometry = waypoints.length
      ? `<mxGeometry relative="1" as="geometry"><Array as="points">${waypoints.join("")}</Array></mxGeometry>`
      : `<mxGeometry relative="1" as="geometry"/>`;
    return `<mxCell id="${nodes.length + index + 2}" value="${xml(edge.label)}" edge="1" parent="1" source="${sourceId}" target="${targetId}" style="${edgeStyle(edge, source, target, points)}">${geometry}</mxCell>`;
  });
  const boxes = nodes.map(nodeBox);
  const maxX = Math.max(...boxes.map((box) => box.x + box.width), 1200);
  const maxY = Math.max(...boxes.map((box) => box.y + box.height + 40), 900);
  const pageWidth = Math.max(1600, snap(maxX + 160));
  const pageHeight = Math.max(1200, snap(maxY + 160));
  const model = `<mxGraphModel dx="${Math.round(pageWidth / 2)}" dy="${Math.round(pageHeight / 2)}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageWidth}" pageHeight="${pageHeight}" background="#ffffff" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${vertices.join("")}${connections.join("")}</root></mxGraphModel>`;
  return `<?xml version="1.0" encoding="UTF-8"?><mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="ReqTool" version="24.7.17" type="device" compressed="false"><diagram id="use-case-diagram" name="${xml(title)}">${model}</diagram></mxfile>`;
}

export function downloadDrawioFile(xmlSource: string, filename: string) {
  const blobUrl = URL.createObjectURL(new Blob([xmlSource], { type: "application/vnd.jgraph.mxfile+xml;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
