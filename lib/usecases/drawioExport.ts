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
  markerEnd?: unknown;
};

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

function coordinate(value: number | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? snap(parsed) : 0;
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
    return "shape=umlActor;aspect=fixed;html=1;whiteSpace=wrap;verticalLabelPosition=bottom;verticalAlign=top;outlineConnect=0;fillColor=#ffffff;strokeColor=#6b7280;fontColor=#374151;";
  }
  return "ellipse;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#6b7280;fontColor=#374151;";
}

function endpointStyle(handle: string | null | undefined, prefix: "exit" | "entry") {
  if (handle?.includes("left")) return `${prefix}X=0;${prefix}Y=0.5;${prefix}Dx=0;${prefix}Dy=0;`;
  if (handle?.includes("right")) return `${prefix}X=1;${prefix}Y=0.5;${prefix}Dx=0;${prefix}Dy=0;`;
  return "";
}

function edgeStyle(edge: DrawioExportEdge, source: DrawioExportNode) {
  const routing = "rounded=1;orthogonalLoop=1;jettySize=auto;html=1;";
  const sourceEndpoint =
    source.type === "actor"
      ? ""
      : endpointStyle(edge.sourceHandle, "exit");
  const targetEndpoint = endpointStyle(edge.targetHandle, "entry");
  const endpoints = `${sourceEndpoint}${targetEndpoint}`;
  const stroke = "strokeColor=#6b7280;strokeWidth=1.1;fontColor=#4b5563;labelBackgroundColor=#ffffff;";

  if (edge.type === "generalization") {
    return `edgeStyle=none;${routing}endArrow=block;endFill=0;${stroke}${endpoints}`;
  }
  if (edge.markerEnd) {
    const dashed = edge.style?.strokeDasharray ? "dashed=1;dashPattern=6 5;" : "";
    return `edgeStyle=none;${routing}${dashed}endArrow=open;endSize=12;${stroke}${endpoints}`;
  }
  return `edgeStyle=none;${routing}endArrow=none;${stroke}${endpoints}`;
}

/**
 * Build an editable, uncompressed diagrams.net file from the current React Flow graph.
 * IDs are regenerated so arbitrary API IDs never become XML identifiers.
 */
export function buildDrawioXml(nodes: DrawioExportNode[], edges: DrawioExportEdge[], title: string) {
  const nodeIds = new Map(nodes.map((node, index) => [node.id, String(index + 2)]));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const vertices = nodes.map((node, index) => {
    const width = node.type === "actor" ? 100 : dimension(node.style?.width, node.type === "system" ? 900 : 224);
    const height = node.type === "actor" ? 130 : dimension(node.style?.height, node.type === "system" ? 560 : 72);
    const label = node.type === "system" ? title : node.data?.name ?? "";
    return `<mxCell id="${index + 2}" value="${xml(label)}" vertex="1" parent="1" style="${nodeStyle(node)}"><mxGeometry x="${coordinate(node.position.x)}" y="${coordinate(node.position.y)}" width="${width}" height="${height}" as="geometry"/></mxCell>`;
  });
  const connections = edges.flatMap((edge, index) => {
    const sourceId = nodeIds.get(edge.source);
    const targetId = nodeIds.get(edge.target);
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!sourceId || !targetId || !source || !target) return [];
    return `<mxCell id="${nodes.length + index + 2}" value="${xml(edge.label)}" edge="1" parent="1" source="${sourceId}" target="${targetId}" style="${edgeStyle(edge, source)}"><mxGeometry relative="1" as="geometry"/></mxCell>`;
  });
  const maxX = Math.max(...nodes.map((node) => coordinate(node.position.x) + (node.type === "actor" ? 100 : dimension(node.style?.width, node.type === "system" ? 900 : 224))), 1200);
  const maxY = Math.max(...nodes.map((node) => coordinate(node.position.y) + (node.type === "actor" ? 130 : dimension(node.style?.height, node.type === "system" ? 560 : 72))), 900);
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
