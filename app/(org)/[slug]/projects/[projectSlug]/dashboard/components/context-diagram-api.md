# Context Diagram — API Requirements

## Overview

The context diagram renders:
- **Center circle**: project name
- **Outer rectangles**: stakeholders (sky-blue)
- **Labeled arrows**: directed data flows between stakeholders and the system

Layout (node positions + edge waypoints/anchors) is user-editable and must be persisted separately.

---

## GET — Load diagram

### `GET /api/v1/projects/{projectId}/context-diagram`

Returns the full diagram: stakeholders, flows, and the saved layout (if any).

**Response:**
```json
{
  "success": true,
  "data": {
    "center_label": "string",
    "stakeholders": [
      {
        "id": "string",
        "name": "string",
        "role": "string | null"
      }
    ],
    "flows": [
      {
        "id": "string",
        "source": "center | <stakeholder_id>",
        "target": "center | <stakeholder_id>",
        "label": "string"
      }
    ],
    "layout": {
      "nodes": [
        {
          "id": "center | <stakeholder_id>",
          "position": { "x": 420, "y": 350 }
        }
      ],
      "edges": [
        {
          "id": "string",
          "waypoint":      { "x": 0, "y": 0 },
          "source_anchor": { "x": 0, "y": 0 },
          "target_anchor": { "x": 0, "y": 0 },
          "label_offset":  { "x": 0, "y": 0 }
        }
      ]
    }
  }
}
```

**Notes:**
- `layout` may be `null` on first load — the FE will use the default radial layout.
- `layout.edges` only includes edges that have at least one custom position set.
- `source_anchor` / `target_anchor` override the edge's start/end point on the node boundary.
- `source_anchor` / `target_anchor` are stored as offsets from the source/target node center, **not absolute canvas coordinates**. This lets the anchor follow the node when the node is moved.
- `waypoint` is the mid-edge bend control point (quadratic bezier), stored in absolute flow canvas coordinates.
- `label_offset` is the offset from the default bezier midpoint, stored in flow canvas coordinates.
- If `stakeholders` is an empty array, the diagram renders only the center circle.

---

## PUT — Save layout

### `PUT /api/v1/projects/{projectId}/context-diagram/layout`

Saves the user-edited node positions and edge bend points. Does **not** modify `stakeholders` or `flows`.

**Request body:**
```json
{
  "nodes": [
    {
      "id": "center | <stakeholder_id>",
      "position": { "x": 420, "y": 350 }
    }
  ],
  "edges": [
    {
      "id": "string",
      "waypoint":      { "x": 300, "y": 200 },
      "source_anchor": { "x": 66, "y": 0 },
      "target_anchor": { "x": -88, "y": 0 },
      "label_offset":  { "x": 12, "y": -8 }
    }
  ]
}
```

**Response:**
```json
{ "success": true, "message": "Layout saved." }
```

**Notes:**
- `nodes` must include ALL nodes. Missing nodes → positions reset to default on next load.
- `edges` only needs entries that have at least one custom position. Pass `null` to clear a specific override.
- `source_anchor` / `target_anchor` must remain relative to the node center. For the center circle, valid anchor offsets are roughly on radius `66`. For actor cards, valid offsets are on the card boundary, currently width `176` and height `40` in the FE.
- BE can persist these layout numbers as-is; it does not need to recalculate the anchors.

---

## POST — Create flow

### `POST /api/v1/projects/{projectId}/context-diagram/flows`

Creates a new directed data flow between the center and a stakeholder.
Called after the user drags a connection in the diagram and confirms the label.

**Request body:**
```json
{
  "source": "center | <stakeholder_id>",
  "target": "center | <stakeholder_id>",
  "label": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "source": "string",
    "target": "string",
    "label": "string"
  }
}
```

**Notes:**
- `source === "center"` → outgoing flow (center → stakeholder).
- `source === <stakeholder_id>` → incoming flow (stakeholder → center).
- Stakeholder-to-stakeholder connections are rejected by the FE before this call is made.
- FE does not require BE to store React Flow handle ids. On reload, FE computes default handle placement from `source` / `target`; custom endpoint placement is stored through `layout.edges.source_anchor` / `target_anchor`.

---

## PATCH — Update flow label

### `PATCH /api/v1/projects/{projectId}/context-diagram/flows/{flowId}`

Updates the label text of an existing flow (e.g. user double-clicks a label to rename it).

**Request body:**
```json
{ "label": "string" }
```

**Response:**
```json
{
  "success": true,
  "data": { "id": "string", "label": "string" }
}
```

---

## DELETE — Delete flow

### `DELETE /api/v1/projects/{projectId}/context-diagram/flows/{flowId}`

Removes a flow. Triggered when the user right-clicks an edge and selects "Xóa dây".

**Response:**
```json
{ "success": true }
```

---

## FE callbacks (`components/ui/context-diagram.tsx`)

```tsx
<ContextDiagram
  config={config}
  onSaveLayout={(layout) => putContextDiagramLayout(projectId, layout)}
  isSavingLayout={isMutating}
  onUpdateStakeholders={() => router.push(`...stakeholders`)}
  onCreateFlow={({ source, target, label }) => postContextDiagramFlow(projectId, { source, target, label })}
  onDeleteFlow={(flowId) => deleteContextDiagramFlow(projectId, flowId)}
/>
```

---

## Wire format mapping (camelCase FE ↔ snake_case BE)

| FE field        | BE field        |
|-----------------|-----------------|
| `sourceAnchor`  | `source_anchor` |
| `targetAnchor`  | `target_anchor` |
| `waypoint`      | `waypoint`      |
| `labelOffset`   | `label_offset`  |
| `position.x`    | `position.x`    |
| `position.y`    | `position.y`    |
