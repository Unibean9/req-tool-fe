import type { RequirementEdge, RequirementNode, RequirementNodeKind } from "./requirementsModelTypes";

export const REQUIREMENT_NODE_WIDTH: Record<RequirementNodeKind, number> = {
  actor: 232,
  epic: 280,
  feature: 280,
  userStory: 300,
};

export const REQUIREMENT_NODE_HEIGHT: Record<RequirementNodeKind, number> = {
  actor: 200,
  epic: 260,
  feature: 260,
  userStory: 300,
};

const SIBLING_GAP = 48;
const LEVEL_GAP = 72;
const ORIGIN_X = 80;
const ORIGIN_Y = 40;

function buildChildrenMap(edges: RequirementEdge[]): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.data?.invalid) continue;
    const list = children.get(edge.source) ?? [];
    list.push(edge.target);
    children.set(edge.source, list);
  }
  return children;
}

function measureSubtreeWidth(
  id: string,
  children: Map<string, string[]>,
  nodeById: Map<string, RequirementNode>,
  cache: Map<string, number>
): number {
  const cached = cache.get(id);
  if (cached != null) return cached;

  const node = nodeById.get(id);
  const leafWidth = node ? REQUIREMENT_NODE_WIDTH[node.data.kind] : 280;
  const kids = children.get(id) ?? [];

  if (kids.length === 0) {
    cache.set(id, leafWidth);
    return leafWidth;
  }

  const total =
    kids.reduce(
      (sum, kid) => sum + measureSubtreeWidth(kid, children, nodeById, cache),
      0
    ) +
    SIBLING_GAP * (kids.length - 1);

  cache.set(id, total);
  return total;
}

function layoutSubtree(
  id: string,
  xCenter: number,
  y: number,
  children: Map<string, string[]>,
  nodeById: Map<string, RequirementNode>,
  widthCache: Map<string, number>,
  positions: Map<string, { x: number; y: number }>
): void {
  const node = nodeById.get(id);
  if (!node) return;

  const width = REQUIREMENT_NODE_WIDTH[node.data.kind];
  positions.set(id, { x: xCenter - width / 2, y });

  const kids = children.get(id) ?? [];
  if (kids.length === 0) return;

  const childY = y + REQUIREMENT_NODE_HEIGHT[node.data.kind] + LEVEL_GAP;
  const subtreeWidth = widthCache.get(id) ?? REQUIREMENT_NODE_WIDTH[node.data.kind];
  let xCursor = xCenter - subtreeWidth / 2;

  for (const kidId of kids) {
    const kidWidth = widthCache.get(kidId) ?? REQUIREMENT_NODE_WIDTH.actor;
    layoutSubtree(
      kidId,
      xCursor + kidWidth / 2,
      childY,
      children,
      nodeById,
      widthCache,
      positions
    );
    xCursor += kidWidth + SIBLING_GAP;
  }
}

/** Sắp cây dọc: Actor → Epic → Feature → User Story (trên xuống dưới). */
export function layoutRequirementTree(
  nodes: RequirementNode[],
  edges: RequirementEdge[],
  rootId?: string
): RequirementNode[] {
  if (nodes.length === 0) return nodes;

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const children = buildChildrenMap(edges);
  const widthCache = new Map<string, number>();

  for (const n of nodes) {
    measureSubtreeWidth(n.id, children, nodeById, widthCache);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const root =
    (rootId && nodeById.get(rootId)) ||
    nodes.find((n) => n.data.kind === "actor") ||
    nodes[0];

  if (root) {
    const rootWidth = widthCache.get(root.id) ?? REQUIREMENT_NODE_WIDTH[root.data.kind];
    layoutSubtree(
      root.id,
      ORIGIN_X + rootWidth / 2,
      ORIGIN_Y,
      children,
      nodeById,
      widthCache,
      positions
    );
  }

  const placed = new Set(positions.keys());
  let orphanX = ORIGIN_X;
  let orphanY = ORIGIN_Y;

  if (positions.size > 0) {
    let maxY = 0;
    let maxX = 0;
    for (const pos of positions.values()) {
      maxY = Math.max(maxY, pos.y);
      maxX = Math.max(maxX, pos.x);
    }
    orphanX = maxX + 400;
    orphanY = ORIGIN_Y;
  }

  for (const n of nodes) {
    if (placed.has(n.id)) continue;
    const w = REQUIREMENT_NODE_WIDTH[n.data.kind];
    positions.set(n.id, { x: orphanX, y: orphanY });
    orphanY += REQUIREMENT_NODE_HEIGHT[n.data.kind] + LEVEL_GAP;
    if (orphanY > 1200) {
      orphanY = ORIGIN_Y;
      orphanX += w + SIBLING_GAP;
    }
  }

  return nodes.map((n) => ({
    ...n,
    position: positions.get(n.id) ?? n.position,
  }));
}

/** Vị trí gợi ý khi thêm node con (dưới parent). */
/** Epic (hoặc kind khác) chứa điểm thả trên canvas — dùng khi kéo từ palette. */
export function findNodeAtFlowPosition(
  nodes: RequirementNode[],
  position: { x: number; y: number },
  kind: RequirementNodeKind
): RequirementNode | undefined {
  return nodes.find((n) => {
    if (n.data.kind !== kind) return false;
    const w = REQUIREMENT_NODE_WIDTH[kind];
    const h = REQUIREMENT_NODE_HEIGHT[kind];
    return (
      position.x >= n.position.x &&
      position.x <= n.position.x + w &&
      position.y >= n.position.y &&
      position.y <= n.position.y + h
    );
  });
}

export function positionChildBelowParent(
  parent: RequirementNode,
  childKind: RequirementNodeKind,
  siblingIndex = 0
): { x: number; y: number } {
  const offsetX = siblingIndex * (REQUIREMENT_NODE_WIDTH[childKind] + SIBLING_GAP);
  return {
    x: parent.position.x + offsetX,
    y: parent.position.y + REQUIREMENT_NODE_HEIGHT[parent.data.kind] + LEVEL_GAP,
  };
}
