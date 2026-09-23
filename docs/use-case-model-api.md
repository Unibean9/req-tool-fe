# Use Case Table và PlantUML — API Contract

Tài liệu này mô tả các API cho màn hình **Use Case Table** và **PlantUML source**, gồm method/path, payload, response và cách dùng dữ liệu. Frontend dùng một model chung; React Flow không còn là output của màn hình này. `diagrams` và `diagramPlans` là field legacy có thể còn trong dữ liệu cũ nhưng không được render.

Sau khi `POST /use-case-model/generate` hoàn tất, response có thêm `plantUml` với `language`, `source`, `editable`, `stale`, và `generatedFrom`. FE hiển thị `source` trong editor và preview PlantUML. Chỉnh sửa source được lưu bằng `PATCH /use-case-model/uml`.

## Quy ước

| Field | Giá trị |
|---|---|
| `level` | `L0`, `L1`, `L2` |
| `status` | `Confirmed`, `Inferred`, `Suggested` |
| `priority` | `Must`, `Should`, `Could` |
| `actor.kind` | `Primary actor`, `Supporting actor` |
| `relationship.type` | `association`, `part-of`, `include`, `extend` |

Actor/Use Case IDs phải ổn định vì các field `primaryActorId`, `supportingActorIds`, `parentUseCaseId`, `sourceId`, và `targetId` tham chiếu tới các ID này.

## 1. Lấy model dùng chung cho Table và Diagram

### Request

```http
GET /api/projects/{projectId}/use-case-model?maxLevel=L2&includeActors=true&includeRelationships=true
```

Không gửi JSON body với GET. Request object tương đương mà mock service hiện dùng:

```json
{
  "projectId": "demo-ai-research-platform",
  "includeActors": true,
  "includeRelationships": true,
  "maxLevel": "L2"
}
```

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `projectId` | `string` | bắt buộc | ID project trên URL path. |
| `maxLevel` | `L0 \| L1 \| L2` | `L2` | Level sâu nhất cần trả về. |
| `includeActors` | `boolean` | `true` | Có trả danh sách actors không. |
| `includeRelationships` | `boolean` | `true` | Có trả quan hệ dùng cho panel/diagram không. |

### Response `200 OK`

```json
{
  "projectId": "demo-ai-research-platform",
  "projectName": "AI Research Experimentation Platform",
  "actors": [
    { "id": "ACT-RESEARCHER", "name": "Researcher", "kind": "Primary actor" },
    { "id": "ACT-ADMIN", "name": "System Administrator", "kind": "Supporting actor" },
    { "id": "ACT-REVIEWER", "name": "Reviewer / Stakeholder", "kind": "Supporting actor" }
  ],
  "useCases": [
    {
      "id": "UC-L0-001",
      "level": "L0",
      "title": "Run a research experiment",
      "primaryActorId": "ACT-RESEARCHER",
      "supportingActorIds": ["ACT-ADMIN"],
      "subsystem": "AI Research Experimentation Platform",
      "status": "Confirmed",
      "priority": "Must",
      "parentUseCaseId": null,
      "description": "Plan, execute, validate, and publish a research experiment using governed data and reproducible workflows.",
      "precondition": "The organization and project are available.",
      "sourceTrace": ["BRD §3", "PRD §4"]
    },
    {
      "id": "UC-L1-001",
      "level": "L1",
      "title": "Manage research workspace and access",
      "primaryActorId": "ACT-RESEARCHER",
      "supportingActorIds": ["ACT-ADMIN"],
      "subsystem": "Workspace & Access",
      "status": "Confirmed",
      "priority": "Must",
      "parentUseCaseId": "UC-L0-001",
      "description": "Set up a project workspace and ensure users only see projects and actions they are allowed to use.",
      "precondition": "The organization and project are available.",
      "sourceTrace": ["BRD §3", "FR-AUTH-01"]
    },
    {
      "id": "UC-WAC-01",
      "level": "L2",
      "title": "Authenticate user",
      "primaryActorId": "ACT-RESEARCHER",
      "supportingActorIds": ["ACT-ADMIN"],
      "subsystem": "Workspace & Access",
      "status": "Confirmed",
      "priority": "Must",
      "parentUseCaseId": "UC-L1-001",
      "description": "Verify a user's identity before granting access to the workspace.",
      "precondition": "The user has an active account.",
      "sourceTrace": ["BRD §3", "FR-AUTH-01"]
    }
  ],
  "relationships": [
    { "id": "rel-root-workspace", "sourceId": "UC-L0-001", "targetId": "UC-L1-001", "type": "part-of" },
    { "id": "rel-auth-include", "sourceId": "UC-L1-001", "targetId": "UC-WAC-01", "type": "include" },
    { "id": "rel-quality-extend", "sourceId": "UC-DAT-02", "targetId": "UC-L1-002", "type": "extend" }
  ]
}
```

Đây là response rút gọn để minh họa schema. Mock hiện có **15 Use Case**: 1 `L0`, 5 `L1`, 9 `L2`.

### Dùng response để hiển thị Table

- Các cột `Level`, `Use case`, `Subsystem`, `Status`, `Priority` lấy từ `useCases`.
- `Primary actor` tra `primaryActorId` trong `actors` theo `id`.
- Panel chi tiết lấy `description`, `precondition`, actor IDs, `sourceTrace`, và relationships liên quan.
- Lọc level/tìm kiếm có thể chạy client-side. Khi dữ liệu lớn, hỗ trợ thêm query params `level`, `q`, `page`, `pageSize`.

### Dùng response để hiển thị Diagram

Frontend chuyển model domain sang React Flow nodes/edges. Ví dụ rút gọn:

```json
{
  "nodes": [
    {
      "id": "system",
      "type": "system",
      "position": { "x": 250, "y": 0 },
      "data": { "title": "AI Research Experimentation Platform" }
    },
    {
      "id": "actor-ACT-RESEARCHER",
      "type": "actor",
      "position": { "x": 5, "y": 620 },
      "data": { "actorId": "ACT-RESEARCHER", "name": "Researcher", "side": "left" }
    },
    {
      "id": "usecase-UC-L1-001",
      "type": "usecase",
      "position": { "x": 390, "y": 330 },
      "data": { "useCaseId": "UC-L1-001", "title": "Manage research workspace and access", "level": "L1" }
    }
  ],
  "edges": [
    {
      "id": "assoc-ACT-RESEARCHER-UC-L1-001",
      "source": "actor-ACT-RESEARCHER",
      "target": "usecase-UC-L1-001",
      "type": "straight"
    },
    {
      "id": "rel-auth-include",
      "source": "usecase-UC-L1-001",
      "target": "usecase-UC-WAC-01",
      "type": "straight",
      "label": "«include»",
      "markerEnd": { "type": "arrowclosed" }
    }
  ]
}
```

Trong API model response, **không bắt buộc** lưu React Flow `nodes`/`edges`: frontend có thể dựng chúng từ actors, use cases, relationships như hiện tại. Nếu cần giữ vị trí người dùng sắp xếp, lưu `position: {x, y}` riêng cho actor và Use Case, hoặc tạo API layout riêng. `include`/`extend` thành đường nét đứt có arrowhead; `part-of` dùng làm hierarchy và hiện không vẽ như UML edge.

## 2. Lấy chi tiết Use Case

### Request

```http
GET /api/projects/{projectId}/use-cases/{useCaseId}
```

### Response `200 OK`

```json
{
  "id": "UC-L1-001",
  "level": "L1",
  "title": "Manage research workspace and access",
  "primaryActorId": "ACT-RESEARCHER",
  "supportingActorIds": ["ACT-ADMIN"],
  "subsystem": "Workspace & Access",
  "status": "Confirmed",
  "priority": "Must",
  "parentUseCaseId": "UC-L0-001",
  "description": "Set up a project workspace and ensure users only see projects and actions they are allowed to use.",
  "precondition": "The organization and project are available.",
  "sourceTrace": ["BRD §3", "FR-AUTH-01"],
  "relationships": [
    { "id": "rel-root-workspace", "sourceId": "UC-L0-001", "targetId": "UC-L1-001", "type": "part-of" },
    { "id": "rel-auth-include", "sourceId": "UC-L1-001", "targetId": "UC-WAC-01", "type": "include" }
  ]
}
```

## 3. Actor APIs

### Tạo Actor

```http
POST /api/projects/{projectId}/actors
Content-Type: application/json
```

Request body:

```json
{ "name": "Data steward", "kind": "Supporting actor" }
```

Response `201 Created`:

```json
{ "id": "ACT-DATA-STEWARD", "name": "Data steward", "kind": "Supporting actor" }
```

### Đổi tên Actor

```http
PATCH /api/projects/{projectId}/actors/{actorId}
Content-Type: application/json
```

Request body:

```json
{ "name": "Research lead" }
```

Response `200 OK` trả Actor đã cập nhật:

```json
{ "id": "ACT-RESEARCHER", "name": "Research lead", "kind": "Primary actor" }
```

### Xóa Actor

```http
DELETE /api/projects/{projectId}/actors/{actorId}
```

Response `200 OK`:

```json
{ "id": "ACT-ADMIN", "deleted": true }
```

Nếu Actor còn được Use Case tham chiếu, backend nên trả `409 Conflict` hoặc yêu cầu `reassignPrimaryActorId` trước khi xóa.

## 4. Use Case APIs

### Tạo Use Case

```http
POST /api/projects/{projectId}/use-cases
Content-Type: application/json
```

Request body:

```json
{
  "level": "L2",
  "title": "Review experiment trace",
  "primaryActorId": "ACT-RESEARCHER",
  "supportingActorIds": ["ACT-REVIEWER"],
  "subsystem": "Execution & Scientific Validation",
  "status": "Suggested",
  "priority": "Should",
  "parentUseCaseId": "UC-L1-004",
  "description": "Inspect the provenance and execution trace for an experiment.",
  "precondition": "An experiment run has completed.",
  "sourceTrace": ["PRD §6"]
}
```

Response `201 Created` trả Use Case đầy đủ theo schema ở mục 1, kèm `id` do backend cấp.

### Cập nhật Use Case

```http
PATCH /api/projects/{projectId}/use-cases/{useCaseId}
Content-Type: application/json
```

Request body chỉ cần có các field thay đổi, ví dụ:

```json
{ "title": "Review experiment execution trace", "status": "Confirmed", "priority": "Must" }
```

Response `200 OK` trả Use Case đầy đủ sau cập nhật.

## 5. Relationship APIs

### Tạo relationship

```http
POST /api/projects/{projectId}/use-case-relationships
Content-Type: application/json
```

Request body:

```json
{ "sourceId": "UC-L1-004", "targetId": "UC-EXP-02", "type": "include" }
```

Response `201 Created`:

```json
{ "id": "REL-EXP-002", "sourceId": "UC-L1-004", "targetId": "UC-EXP-02", "type": "include" }
```

### Xóa relationship

```http
DELETE /api/projects/{projectId}/use-case-relationships/{relationshipId}
```

Response `200 OK`:

```json
{ "id": "REL-EXP-002", "deleted": true }
```

## 6. Error response chung

```json
{
  "error": {
    "code": "USE_CASE_NOT_FOUND",
    "message": "The requested use case does not exist.",
    "details": []
  }
}
```

Status dự kiến: `400` payload sai, `401` chưa đăng nhập, `403` thiếu quyền, `404` không thấy project/actor/Use Case, `409` xung đột khi xóa hoặc tạo relationship.

## 7. Mock hiện tại

TypeScript request/response, 15 Use Case mock, relationships và `fetchUseCaseModel(payload)` nằm trong `lib/api/services/useCaseModel.ts`. Thay implementation của hàm mock bằng HTTP client khi backend sẵn sàng; giữ contract để Table và Diagram tiếp tục dùng chung model.
