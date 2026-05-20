# Swimlane edge routing API — draw.io-style (FE → BE)

Tài liệu gửi backend để mở rộng contract lưu **điểm nối dây (handle)**, **điểm gấp khúc (waypoints)** và **vị trí nhãn** trên swimlane diagram.

**FE đã triển khai** (đọc/ghi qua TanStack Query + PUT swimlane):

| File | Vai trò |
|------|---------|
| `lib/swimlane/swimlaneEdgeWire.ts` | Map handle wire ↔ React Flow; parse/serialize `waypoints` |
| `lib/api/services/fetchFlow.ts` | Types + `mapSwimlaneFromWire` / `toProjectFlowSwimlanePutWire` |
| `components/ui/swimlane-react-flow.tsx` | Vẽ dây (`SwimlaneEditableEdge`), suy điểm gấc (`getSwimlaneAutoInteriorWaypoints`), path/label |
| `components/ui/swimlaneEdgeHandlesLayer.tsx` | Chấm kéo + nhãn (HTML trong `ViewportPortal`, tọa độ flow) |
| `components/ui/swimlaneFlowEditorContext.tsx` | `setEdges` chung + registry snapshot handle cho overlay |
| `app/.../flow/components/flowSwimlaneBridge.ts` | GET → diagram; **Lưu layout** → PUT |
| `app/.../flow/components/flowSwimlaneDialog.tsx` | Canvas, `onEdgeDoubleClick` thêm waypoint, `SwimlaneFlowEditorProvider` |

### Tóm tắt contract (BE)

| API | Response / body |
|-----|-----------------|
| `GET …/flows/{flow_id}` | `data.swimlane` (nullable) gồm `lanes`, `actions`, `flows[]` với `source_handle`, `target_handle`, `label_offset`, `waypoints` |
| `PUT …/flows/{flow_id}/swimlane` | Body = cùng shape `swimlane` (snake_case, có thể bỏ `swimlane.id`) |
| PUT response | `data` = `ProjectFlow` đầy đủ; **`data.swimlane` bắt buộc non-null** |

---

## 1. Hành vi người dùng (draw.io-like)

### Điểm có thể kéo trên dây

FE luôn hiển thị **handle (chấm tròn) tại mọi đỉnh gấc khúc** của đường đi:

| Nguồn đường đi | Handle hiển thị tại |
|----------------|---------------------|
| Auto-route (chưa có `waypoints` từ BE) | **Mọi góc** polyline (`getSwimlaneAutoInteriorWaypoints`) — vd. 2 chấm cho đường ┐, 1 chấm cho └ |
| Dây thẳng một đoạn (không có góc) | **Ẩn** chấm — double-click dây để thêm gấp khúc |
| Đã có `waypoints[]` từ BE / user đã kéo | Đúng từng phần tử trong mảng |

Handle = **chấm tròn HTML** trong [`ViewportPortal`](https://reactflow.dev/api-reference/components/viewport-portal) (`SwimlaneEdgeHandlesLayer`) — cùng hệ tọa độ flow với edge (pan/zoom theo viewport). Edge component chỉ vẽ SVG + đăng ký tọa độ qua `publishEdgeSnapshot`.

**Pan canvas:** giữ **Space + kéo** (`panOnDrag: false` — chuột trái dành cho kéo chấm/node).

**Thả chuột** sau khi kéo lần đầu → ghi `edge.data.waypoints` → **Lưu layout** gửi BE.

### Thao tác

| Thao tác | FE lưu vào field |
|----------|------------------|
| Kéo đầu dây sang handle khác trên node | `source_handle`, `target_handle` |
| Kéo nhãn trên dây | `label_offset` |
| Kéo **bất kỳ** chấm trên dây | `waypoints[]` (toàn bộ đỉnh gấc khúc sau chỉnh) |
| Double-click dây | Thêm một phần tử vào `waypoints[]` (`flowSwimlaneDialog` → `onEdgeDoubleClick`) |
| Chuột phải chấm tròn (waypoint) | **Xóa điểm gãy** — hết điểm → bỏ `waypoints`, auto-route lại |
| Chuột phải **đoạn dây lệch** (gần ngang/dọc) | **Làm thẳng dây** — căn cả chuỗi đoạn ngang/dọc liền kề về **một đường thẳng** (cùng `y` hoặc `x`), gỡ điểm thừa → `waypoints[]`; lưu server qua **Lưu layout** |
| Chưa hề kéo / thêm / xóa điểm | **Không** gửi `waypoints` trên PUT → BE giữ auto-route |

**Hệ tọa độ:** giống node — **tuyệt đối trong pool** (gốc góc trên-trái canvas swimlane, đơn vị px). `actions[].x` / `initial_node.x` là **tâm** node theo trục X; `y` là **cạnh trên** node. `waypoints[].x/y` là từng **đỉnh gấc khúc** trên đường đi (không gồm điểm anchor trên biên node — anchor do `source_handle` / `target_handle` quyết định).

**Thứ tự `waypoints[]`:** theo hướng đi từ nguồn → đích (index `0` gần source nhất). Mỗi phần tử là một **góc** của polyline, không trùng tọa độ anchor trên node.

---

## 2. `GET /api/v1/projects/{project_id}/flows/{flow_id}`

### Response envelope (không đổi)

```json
{
  "success": true,
  "message": null,
  "data": { /* ProjectFlow — xem bên dưới */ }
}
```

### `data` — `ProjectFlow` (phần liên quan swimlane)

Các field metadata flow (`id`, `project_id`, `code`, `name`, `description`, `actions`, `order`, `title`, `created_at`, `updated_at`) giữ nguyên.

**Mới / cập nhật:** object `swimlane` (nullable) với `flows[]` mở rộng như sau.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "660e8400-e29b-41d4-a716-446655440001",
  "code": "REG-01",
  "name": "Đăng ký khóa học",
  "description": "1. Chọn khóa\n2. Xác nhận",
  "actions": [],
  "order": 0,
  "title": "Activity: Đăng ký khóa học",
  "created_at": "2026-05-20T10:00:00Z",
  "updated_at": "2026-05-20T12:30:00Z",
  "swimlane": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Activity: Đăng ký khóa học",
    "layout": {
      "lane_width": 300,
      "pool_height": 640,
      "pool_bottom_padding": 120,
      "swimlane_node_offset_x": {
        "action-1": 12
      }
    },
    "lanes": [
      {
        "id": "student",
        "title": "Student",
        "width": 300,
        "x_left": 0,
        "x_center": 150,
        "x_right": 300
      },
      {
        "id": "system",
        "title": "System",
        "width": 300,
        "x_left": 300,
        "x_center": 450,
        "x_right": 600
      }
    ],
    "initial_node": {
      "id": "start",
      "lane_id": "student",
      "y": 80,
      "x": 150
    },
    "activity_final_node": {
      "id": "end",
      "lane_id": "student",
      "y": 900,
      "x": 150
    },
    "actions": [
      {
        "id": "a-select",
        "lane_id": "student",
        "label": "Chọn khóa học",
        "notation": "action",
        "index": 1,
        "y": 180,
        "x": 150,
        "width": 200,
        "height": 60
      },
      {
        "id": "fork-1",
        "lane_id": "system",
        "label": "",
        "notation": "fork",
        "y": 320,
        "x": 450,
        "width": 160,
        "height": 20
      }
    ],
    "flows": [
      {
        "id": "f-start-select",
        "source": "start",
        "target": "a-select",
        "flow_type": "control",
        "guard": null,
        "label": null,
        "source_handle": "bottom",
        "target_handle": "top",
        "label_offset": null,
        "waypoints": null
      },
      {
        "id": "f-select-fork",
        "source": "a-select",
        "target": "fork-1",
        "flow_type": "control",
        "guard": "Đủ điều kiện",
        "source_handle": "right",
        "target_handle": "top",
        "label_offset": { "x": 8, "y": -4 },
        "waypoints": [
          { "x": 280, "y": 210 },
          { "x": 280, "y": 310 },
          { "x": 450, "y": 310 }
        ]
      },
      {
        "id": "f-fork-branch-a",
        "source": "fork-1",
        "target": "a-branch-a",
        "flow_type": "control",
        "source_handle": "bottom_left",
        "target_handle": "top"
      }
    ]
  }
}
```

### `swimlane.flows[]` — schema đầy đủ

| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `id` | string (uuid) | Có | Id ổn định của edge |
| `source` | string | Có | Id node nguồn (`initial_node`, `activity_final_node`, hoặc `actions[].id`) |
| `target` | string | Có | Id node đích |
| `flow_type` | enum | Có | `control` \| `object` |
| `guard` | string \| null | Không | Điều kiện hiển thị trên dây (ưu tiên thấp hơn `label` nếu cả hai có) |
| `label` | string \| null | Không | Nhãn override |
| `source_handle` | enum \| null | Không | Điểm xuất phát trên node nguồn (xem bảng enum) |
| `target_handle` | enum \| null | Không | Điểm đích trên node target |
| `label_offset` | `{ x: number, y: number }` \| null | Không | Offset px khi user kéo nhãn (cộng thêm vị trí mặc định FE) |
| `waypoints` | `{ x: number, y: number }[]` \| null | Không | **Mọi** đỉnh gấc khúc giữa source và target (pool px). `null` / `[]` / không gửi = FE auto-route và suy ra handle kéo từ geometry |

### Enum `source_handle` / `target_handle` (snake_case trên wire)

**Cạnh thường (action, decision, initial, final, object):**

| Wire | Ý nghĩa (FE map sang React Flow) |
|------|----------------------------------|
| `top` | Cạnh trên |
| `bottom` | Cạnh dưới |
| `left` | Cạnh trái |
| `right` | Cạnh phải |

**Fork (nguồn) / Join (đích) — bắt buộc khi notation là fork/join:**

| Wire | Node | Vai trò |
|------|------|---------|
| `bottom_left` | fork | Nhánh ra trái-dưới |
| `bottom_right` | fork | Nhánh ra phải-dưới |
| `top_left` | join | Nhánh vào trái-trên |
| `top_right` | join | Nhánh vào phải-trên |

> **Lưu ý:** Trước đây FE gửi `bottom` cho mọi handle fork/join → mất thông tin nhánh. BE cần **lưu và trả lại** giá trị compound (`bottom_left`, …).

**Validation gợi ý:**

- Nếu `source` là fork: `source_handle` ∈ `{ bottom_left, bottom_right }` (hoặc null → FE infer).
- Nếu `target` là join: `target_handle` ∈ `{ top_left, top_right, top }` (hoặc null → FE infer).
- Còn lại: ∈ `{ top, bottom, left, right }`.
- Giá trị khác → **422** với message rõ field.

### `waypoints` — validation gợi ý

| Rule | Giá trị |
|------|---------|
| Tối đa điểm / flow | 16 |
| `x`, `y` | finite number (float ok; FE làm tròn 1 chữ số thập phân khi PUT) |
| Thứ tự mảng | Từ gần nguồn → gần đích (FE giữ thứ tự user chỉnh) |
| `null` vs bỏ field | Coi như không có waypoint — GET không trả field hoặc `null` |
| Số điểm vs auto-route | Auto-route 3 góc → user kéo một lần → PUT thường gửi **3** phần tử; dây thẳng user kéo giữa → thường **1** phần tử |

**Lưu ý BE:** Không cần lưu “điểm ảo” giữa đoạn thẳng nếu user chưa chỉnh — chỉ persist sau khi user thao tác (FE omit trên PUT).

---

## 3. `PUT /api/v1/projects/{project_id}/flows/{flow_id}/swimlane`

### Request body (snake_case)

Cùng shape với `swimlane` trong GET (trừ `swimlane.id` có thể bỏ — BE gắn theo `flow_id`).

```json
{
  "title": "Activity: Đăng ký khóa học",
  "layout": {
    "lane_width": 300,
    "pool_bottom_padding": 120,
    "swimlane_node_offset_x": {}
  },
  "lanes": [
    { "id": "student", "title": "Student", "width": 300, "x_left": 0, "x_center": 150, "x_right": 300 }
  ],
  "initial_node": { "id": "start", "lane_id": "student", "y": 80, "x": 150 },
  "activity_final_node": { "id": "end", "lane_id": "student", "y": 900, "x": 150 },
  "actions": [
    {
      "id": "a-select",
      "lane_id": "student",
      "label": "Chọn khóa học",
      "notation": "action",
      "y": 180,
      "x": 150,
      "width": 200,
      "height": 60
    }
  ],
  "flows": [
    {
      "id": "f-select-fork",
      "source": "a-select",
      "target": "fork-1",
      "flow_type": "control",
      "guard": "Đủ điều kiện",
      "source_handle": "right",
      "target_handle": "top",
      "label_offset": { "x": 8, "y": -4 },
      "waypoints": [
        { "x": 280, "y": 210 },
        { "x": 280, "y": 310 },
        { "x": 450, "y": 310 }
      ]
    }
  ]
}
```

### Quy tắc merge (khuyến nghị cho BE)

| Trường hợp | Hành vi |
|------------|---------|
| `flows[].waypoints` có mảng ≥ 1 phần tử | Lưu nguyên; GET trả lại y hệt |
| `waypoints` = `[]` hoặc không gửi | Xóa waypoint đã lưu; FE auto-route |
| `source_handle` / `target_handle` null | Có thể xóa override; FE infer khi render |
| `label_offset` = `{ "x": 0, "y": 0 }` | FE có thể omit khi PUT — BE nên normalize về `null` |

**Breaking change so với note cũ (2026-05-20):** `waypoints` **được phép** trở lại. Không còn 422 khi có `waypoints` hợp lệ.

### Response

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "project_id": "660e8400-e29b-41d4-a716-446655440001",
    "code": "REG-01",
    "name": "Đăng ký khóa học",
    "description": "...",
    "order": 0,
    "title": "Activity: Đăng ký khóa học",
    "created_at": "...",
    "updated_at": "...",
    "swimlane": { /* cùng schema GET — phản ánh dữ liệu vừa lưu */ }
  }
}
```

`data.swimlane` **bắt buộc** non-null sau PUT thành công (FE throw nếu thiếu).

---

## 4. `GET /api/v1/projects/{project_id}/flows` (list)

- Có thể **không** embed `swimlane` đầy đủ (performance).
- Nếu embed: `flows[].waypoints` có thể omit để giảm payload; client mở diagram sẽ gọi GET detail.

---

## 5. Migration / tương thích

| Dữ liệu cũ | Sau migrate |
|------------|-------------|
| Chỉ có `source_handle: "bottom"` trên edge từ fork | FE vẫn render (infer nhánh); lần Save layout đầu tiên ghi `bottom_left` / `bottom_right` đúng |
| Không có `waypoints` | Auto-route như hiện tại |
| `x`/`y` trên actions/events | Giữ nguyên |

---

## 6. Checklist BE

- [ ] DB / JSON column lưu `flows[].waypoints` (JSON array)
- [ ] Mở rộng validator handle: thêm `bottom_left`, `bottom_right`, `top_left`, `top_right`
- [ ] GET flow detail trả đủ `swimlane.flows[]` với handle + waypoints + label_offset
- [ ] PUT swimlane persist và echo lại trong response
- [ ] Test round-trip: PUT → GET → FE render không đổi hình dạy dây
- [ ] (Tuỳ chọn) OpenAPI example cập nhật theo file này

---

## 7. Tham chiếu FE (mapping nhanh)

```
React Flow edge.sourceHandle = "bottom-left-source"
  → PUT source_handle = "bottom_left"

Điểm gấc khúc (logic):
  getSwimlaneAutoInteriorWaypoints(geometry)     // auto-route: mọi góc polyline
  resolveSwimlaneEditableWaypoints(stored, geom) // hoặc mảng đã lưu / user kéo

Hiển thị + kéo chấm:
  SwimlaneEditableEdge → publishEdgeSnapshot({ handles, label })
  SwimlaneEdgeHandlesLayer (ViewportPortal) → setEdges → edge.data.waypoints

Sau khi user kéo lần đầu:
  edge.data.waypoints = [ ... ]  → PUT flows[].waypoints

edge.data.labelOffset → PUT flows[].label_offset
```

Chi tiết: `lib/swimlane/swimlaneEdgeWire.ts`, `swimlaneEdgeHandlesLayer.tsx`, `swimlane-react-flow.tsx` (`buildSwimlaneEdgePathFromGeometry`).
