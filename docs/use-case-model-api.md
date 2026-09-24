# Use Case Table và PlantUML — API contract

Contract này phải được giữ đồng bộ với
[`req-tool-be/docs/rule-diagram-usecase/use-case-model-api.md`](../../req-tool-be/docs/rule-diagram-usecase/use-case-model-api.md)
và file đặc tả
[`use-case-table-and-uml-spec-with-enums.md`](../../req-tool-be/docs/rule-diagram-usecase/use-case-table-and-uml-spec-with-enums.md).

Backend đọc các component/version BRD và PRD đang lưu trong document registry của project. Hai file
Markdown mẫu trong repository không được đọc ở runtime.

## Canonical model

```text
System
└── Module / Capability
    └── Use Case
```

Module chỉ là nhóm hiển thị, không phải một use case. Model không còn `L0`, `L1`, `L2`,
`parentUseCaseId`, `part-of`, `diagramPlans` hoặc React Flow nodes/edges.

Các phần hiển thị của FE lấy từ cùng một aggregate:

```json
{
  "system": {},
  "modules": [],
  "actors": [],
  "useCases": [],
  "relationships": [],
  "plantUml": {}
}
```

## Enum

| Enum | Giá trị |
|---|---|
| `priority` | `required`, `recommended`, `optional` |
| `evidence` | `explicit`, `inferred` |
| `relationships[].type` | `include`, `extend`, `generalization` |
| `actors[].kind` | `human`, `external_system`, `scheduler` |
| `actors[].side` | `left`, `right` |
| `mainFlow[].participantType` / flow steps | `actor`, `system`, `external_system` |
| `relatedRequirements[].type` | `functional`, `business_rule`, `non_functional` |
| `relationships[].reviewState` | `accepted`, `review_required`, `rejected` |

Actor association không nằm trong `relationships`. Renderer suy ra association từ
`primaryActorId` và `secondaryActorIds` của từng use case.

## Đọc model

```http
GET /api/v1/projects/{projectId}/use-case-model?includeActors=true&includeRelationships=true
```

`projectId` là UUID. Không gửi `maxLevel`.

Envelope:

```ts
type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
};
```

Response data có các field:

```ts
type UseCaseModel = {
  projectId: string;
  projectName: string;
  system: {
    id: string;
    name: string;
    description: string | null;
    sourceTrace: string[];
  };
  actors: Actor[];
  modules: Module[];
  useCases: UseCase[];
  relationships: Relationship[];
  sourceHash: string | null;
  validation: Validation | null;
  generation: Record<string, unknown> | null;
  plantUml: PlantUml | null;
};
```

Use case table dùng các cột `Use case`, `Main actor`, `Relationships`, `Evidence`, `Priority`.
Chi tiết dùng `description`, actors, relationships, trigger, preconditions, các flow,
postconditions, business rules, related requirements và `sourceTrace`.

## Generate

```http
POST /api/v1/projects/{projectId}/use-case-model/generate
Content-Type: application/json
```

Body có thể rỗng hoặc chọn provider đã cấu hình cho user:

```json
{
  "providerConfigId": "optional-provider-config-uuid"
}
```

FE không gửi API key. Backend dùng provider active mặc định hoặc provider được chỉ định.
Pipeline là:

```text
stored BRD/PRD components
→ AI extraction
→ source-backed completion
→ enum/semantic validation
→ one complete PlantUML system diagram
```

Completion giữ lại mọi requirement family có trong snapshot, nên AI không được phép làm mất row,
actor, module hoặc source reference. Nếu LLM timeout hoặc trả JSON không hợp lệ, endpoint chính
vẫn trả bảng source-backed và ghi nguyên nhân trong `generation.error`.

Quan hệ semantic có thể được resolver trong cùng lần generate hoặc chạy lại bằng endpoint bên dưới.

## Resolve relationships

```http
POST /api/v1/projects/{projectId}/use-case-model/relations/generate
Content-Type: application/json
```

Endpoint chỉ được trả:

```text
include: base → included
extend: extension → base, bắt buộc condition
generalization: child → parent
```

Không trả `association`; association do PlantUML renderer lấy từ actor IDs. Nếu resolver timeout
hoặc thất bại, FE giữ nguyên bảng và cho phép retry.

## PlantUML source

```http
PATCH /api/v1/projects/{projectId}/use-case-model/uml
Content-Type: application/json
```

```json
{
  "source": "@startuml\n...\n@enduml"
}
```

Backend kiểm tra marker `@startuml`/`@enduml`, lưu source nguyên văn và không sync ngược vào bảng.
Generate lại model sẽ tạo source mới từ canonical model.

Renderer mặc định sinh một boundary cho toàn hệ thống, package cho từng module, actor ở ngoài
boundary và các arrow sau:

```plantuml
left to right direction
skinparam shadowing false
skinparam linetype ortho
skinparam nodesep 70
skinparam ranksep 80
skinparam packageStyle rectangle

ACTOR -- USE_CASE
UC_BASE ..> UC_INCLUDED : <<include>>
UC_EXTENSION ..> UC_BASE : <<extend>>
UC_CHILD -|> UC_PARENT
```

## Use Case detail

```http
GET /api/v1/projects/{projectId}/use-cases/{useCaseId}
```

Response là một use case cùng các semantic relationship trực tiếp. Đây là dữ liệu inspect từ BRD/PRD
và AI; FE không tạo/sửa/xóa use case thủ công. Chỉnh sửa thủ công chỉ áp dụng cho PlantUML source.

## Deprecated compatibility routes

Các route actor và route CRUD use case cũ có thể còn trong OpenAPI để tương thích client cũ. FE mới
không gọi CRUD use case; backend trả `405` cho tạo/sửa/xóa use case. Không dùng `association` hoặc
`part-of` trong payload canonical mới.
