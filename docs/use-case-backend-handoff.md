# Use Case — BE handoff cho FE

> Handoff cho màn hình **Use Case** gồm Table nhiều level và mã PlantUML có thể chỉnh sửa/preview.
> Contract gốc ở [`req-tool-be/docs/rule-diagram-usecase/use-case-model-api.md`](../../req-tool-be/docs/rule-diagram-usecase/use-case-model-api.md).

## 1. Trạng thái backend

- Backend đã có API đọc model, generate từ BRD/PRD đang lưu trong **document registry**, và chỉnh sửa thủ công actor/use case/relationship.
- Runtime **không đọc hai file Markdown mẫu trong repository**. Nguồn generate là các component/version BRD và PRD hiện tại của project.
- Full test BE đã được chạy trong checkout hiện tại; xem output CI để lấy số lượng test theo revision.
- `projectId` trên các path bên dưới là **UUID của project**, không phải project slug.
- Không gửi API key từ FE. Backend dùng LLM provider config active của user; có thể chọn config bằng `providerConfigId`.

## 2. Cách gọi API

Dùng `apiService` hiện có của FE để tự gắn Bearer token và base URL:

```ts
const response = await apiService.get<ApiResponse<UseCaseModel>>(
  `/api/v1/projects/${encodeURIComponent(projectId)}/use-case-model`,
  { maxLevel: "L2", includeActors: true, includeRelationships: true },
);

const model = response.data.data;
```

Backend trả envelope:

```ts
type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
};
```

Lưu ý: type `ApiResponse` cũ trong `types/api.ts` đang dùng `isSuccess`; API này dùng đúng field `success` theo BE. Service mới nên khai báo type riêng hoặc cập nhật type dùng chung sau khi kiểm tra các service cũ.

Base URL local mặc định của FE là `http://localhost:8000/` qua `NEXT_PUBLIC_API_URL`.

## 3. API chính cho tab Use Case

### 3.1. Đọc model dùng chung cho Table và PlantUML

```http
GET /api/v1/projects/{projectId}/use-case-model
```

Query params:

| Param | Giá trị | Mặc định | Ý nghĩa |
|---|---|---:|---|
| `maxLevel` | `L0 \| L1 \| L2` | `L2` | Level sâu nhất cần trả về |
| `includeActors` | `true \| false` | `true` | Có trả `actors` không |
| `includeRelationships` | `true \| false` | `true` | Có trả quan hệ và edge không |

Nên dùng cả ba giá trị mặc định khi mở tab. Table và PlantUML source phải dùng cùng một `model` để không lệch dữ liệu. Response mới có `plantUml: { language, source, editable, stale, generatedFrom }`; `diagrams` và `diagramPlans` là legacy, không render.

### 3.2. Generate Use Case Table + PlantUML

```http
POST /api/v1/projects/{projectId}/use-case-model/generate
Content-Type: application/json
```

Body có thể là `{}`:

```json
{
  "maxLevel": "L2",
  "providerConfigId": "optional-provider-config-uuid"
}
```

- `providerConfigId` là optional. Không truyền thì BE chọn provider active mặc định của user.
- Không truyền API key/model key trong body.
- Sau khi thành công, response `data` có cùng schema với API GET.
- Response có thêm `generation`, `validation`, `sourceHash`, và `plantUml`.
- `plantUml.source` được render từ bảng đã hoàn thiện, gồm actor, boundary, use case và quan hệ UML; backend không tạo React Flow plan mới.
- Nếu model có lỗi luật, API vẫn có thể trả model để người dùng review; đọc `validation` trước khi cho trạng thái “đủ điều kiện SRS/UML”.

Flow đề nghị:

1. Mở tab: gọi `GET`.
2. Bấm **Generate**: gọi `POST`, khóa nút và hiển thị loading vì đây là tác vụ LLM.
3. Thành công: thay toàn bộ state bằng `response.data.data`, sau đó render Table và editor/preview PlantUML từ state mới.
4. Nếu `validation.issues` có lỗi: vẫn hiển thị Table để review, nhưng không báo model/UML là đã đạt SRS.

### 3.3. Lưu source PlantUML đã chỉnh sửa

```http
PATCH /api/v1/projects/{projectId}/use-case-model/uml
Content-Type: application/json
```

```json
{ "source": "@startuml\n...\n@enduml" }
```

Endpoint chỉ lưu source text, không gọi LLM và không thay đổi bảng. Sau khi sửa bảng, `plantUml.stale` là `true` cho đến lần generate tiếp theo.

## 4. TypeScript domain types

```ts
export type UseCaseLevel = "L0" | "L1" | "L2";
export type UseCaseStatus = "Confirmed" | "Inferred" | "Suggested";
export type UseCasePriority = "Must" | "Should" | "Could";
export type ActorKind = "Primary actor" | "Supporting actor";
export type RelationshipType =
  | "association"
  | "part-of"
  | "include"
  | "extend"
  | "generalization";

export interface Actor {
  id: string;
  name: string;
  kind: ActorKind;
}

export interface UseCaseRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  condition?: string | null;
}

export interface UseCaseRow {
  id: string;
  level: UseCaseLevel;
  title: string;
  primaryActorId: string;
  supportingActorIds: string[];
  subsystem: string;
  status: UseCaseStatus;
  priority: UseCasePriority;
  parentUseCaseId: string | null;
  description: string;
  precondition: string;
  sourceTrace: string[];
}

export interface UseCaseDetail extends UseCaseRow {
  relationships: UseCaseRelationship[];
}

export interface Diagram {
  id: string;
  level: UseCaseLevel;
  systemBoundary: string;
  subsystem: string | null;
  actorIds: string[];
  useCaseIds: string[];
  relationIds: string[];
}

export type DiagramNodeKind = "system_boundary" | "actor" | "use_case";
export type DiagramNodeShape = "rectangle" | "actor" | "ellipse";
export type DiagramNodeSide = "left" | "right" | "inside";
export type DiagramLineStyle = "solid" | "dashed";
export type DiagramMarker = "none" | "open_arrow" | "open_triangle";

export interface DiagramNode {
  id: string;
  kind: DiagramNodeKind;
  label: string;
  shape: DiagramNodeShape;
  side: DiagramNodeSide | null;
}

export interface DiagramEdge {
  id: string;
  sourceId: string;
  targetId: string;
  kind: Exclude<RelationshipType, "part-of">;
  lineStyle: DiagramLineStyle;
  directed: boolean;
  marker: DiagramMarker;
  label: string | null;
  condition: string | null;
}

export interface DiagramPlan {
  diagramId: string;
  level: UseCaseLevel;
  systemBoundary: string;
  subsystem: string | null;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  path: string | null;
}

export interface UseCaseValidation {
  issues: ValidationIssue[];
  eligibleForSrs: boolean;
  eligibleDiagramIds: string[];
  confirmedUseCaseIds: string[];
}

export interface UseCaseModel {
  projectId: string;
  projectName: string;
  actors: Actor[];
  useCases: UseCaseRow[];
  relationships: UseCaseRelationship[];
  diagrams: Diagram[];
  diagramPlans: DiagramPlan[];
  sourceHash: string | null;
  validation: UseCaseValidation | null;
  generation: Record<string, unknown> | null;
}
```

## 5. Render Table nhiều level

- Hiển thị một dòng cho mỗi phần tử trong `useCases`.
- Cây phân cấp lấy từ `parentUseCaseId`; `L0` là root, `L1` là mục con, `L2` là subfunction.
- `primaryActorId` và `supportingActorIds` chỉ là ID; tra tên trong `actors`.
- Hiển thị `level`, `title`, `subsystem`, `status`, `priority` và actor chính theo thiết kế hiện tại.
- Panel detail dùng thêm `description`, `precondition`, `sourceTrace` và các relationship có `sourceId` hoặc `targetId` bằng ID đang chọn.
- `sourceTrace` là trace về evidence BRD/PRD, hiển thị dạng citation/read-only.
- Không tự tạo title, actor, subsystem hoặc relation ở FE nếu BE chưa trả về.

## 6. Render Diagram bằng React Flow

Ưu tiên dùng `diagramPlans`. Không tự suy diễn ký hiệu UML từ tên relationship khi plan đã có.

### Node mapping

| `DiagramNode` | React Flow nên render |
|---|---|
| `kind=system_boundary`, `shape=rectangle` | Boundary hình chữ nhật, label là `systemBoundary` |
| `kind=actor`, `shape=actor` | Actor icon/stick figure, đặt theo `side` (`left` hoặc `right`) |
| `kind=use_case`, `shape=ellipse` | Use case hình ellipse, label đã gồm `UC-ID + name` |

Các node là semantic node từ BE. FE chịu trách nhiệm layout và position; BE hiện **chưa có API lưu position**.

### Edge mapping bắt buộc

| `kind` | Line | Arrow | Label | Ý nghĩa hướng |
|---|---|---|---|---|
| `association` | solid | `none` | không có | actor ↔ use case, không hướng |
| `include` | dashed | `open_arrow` | `«include»` | `sourceId` → `targetId` |
| `extend` | dashed | `open_arrow` | `«extend»` | `sourceId` → `targetId`, có `condition` |
| `generalization` | solid | `open_triangle` | không có | source là child → target là parent |

`part-of` chỉ dùng cho hierarchy/table, **không vẽ thành UML edge**.

BE có thể trả `diagramPlans` dạng draft khi model còn validation error để người dùng review trên React Flow. FE phải gắn nhãn draft và vẫn dùng `eligibleDiagramIds`/`eligibleForSrs` để quyết định điều kiện SRS. Nếu `diagramPlans` vẫn rỗng, hiển thị trạng thái chưa render được và dùng `validation.issues` để giải thích. Không tự đổi `include` thành `extend`, không đổi hướng source/target và không dùng mũi tên kín thay cho marker BE trả về.

## 7. API chỉnh sửa thủ công

Sau mỗi mutation nên gọi lại `GET /use-case-model` để đồng bộ cả Table, Diagram và validation state.

### Actor

```http
POST /api/v1/projects/{projectId}/actors
```

```json
{ "name": "Data steward", "kind": "Supporting actor" }
```

`kind` mặc định là `Supporting actor`; giá trị hợp lệ: `Primary actor`, `Supporting actor`.

```http
PATCH /api/v1/projects/{projectId}/actors/{actorId}
```

```json
{ "name": "Research lead" }
```

```http
DELETE /api/v1/projects/{projectId}/actors/{actorId}
```

Không xóa được actor còn được use case hoặc relationship tham chiếu; xử lý `409` và yêu cầu user reassign/delete reference trước.

### Use Case

```http
POST /api/v1/projects/{projectId}/use-cases
```

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

```http
PATCH /api/v1/projects/{projectId}/use-cases/{useCaseId}
```

Body là partial, ví dụ:

```json
{ "status": "Confirmed", "priority": "Must" }
```

Muốn bỏ parent phải gửi rõ `{ "parentUseCaseId": null }`. Các field khác không được gửi `null`.

Validation chính của BE:

- Actor references phải tồn tại và không trùng nhau.
- Parent phải là level cao hơn child, không được tạo cycle.
- `title`: 2–160 ký tự; `description`: 1–600; `precondition`: 1–400; `sourceTrace` phải có ít nhất một phần tử.

```http
GET /api/v1/projects/{projectId}/use-cases/{useCaseId}
DELETE /api/v1/projects/{projectId}/use-cases/{useCaseId}
```

Không xóa được use case còn child hoặc relationship tham chiếu; xử lý `409`.

### Relationship

```http
POST /api/v1/projects/{projectId}/use-case-relationships
```

```json
{
  "sourceId": "UC-L1-004",
  "targetId": "UC-EXP-002",
  "type": "include"
}
```

Quy tắc endpoint:

- `association`: một actor và một use case.
- `part-of`: hai use case, `sourceId` là parent và `targetId` là child; parent phải level cao hơn.
- `include`, `extend`: hai use case; `extend` bắt buộc có `condition`.
- `generalization`: hai actor hoặc hai use case.
- Không cho source và target trùng nhau.

```http
DELETE /api/v1/projects/{projectId}/use-case-relationships/{relationshipId}
```

Xóa `part-of` sẽ bỏ `parentUseCaseId` của child.

## 8. Error và trạng thái UI

Error BE dùng `application/problem+json`:

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "Actor is still referenced by use cases or relationships",
  "instance": "http://localhost:8000/api/v1/...",
  "request_id": "...",
  "errors": [{ "field": "name", "message": "..." }]
}
```

Các status cần xử lý:

| Status | Khi nào |
|---:|---|
| `400` | Quan hệ/hierarchy/reference không hợp lệ |
| `401` | Session hết hạn; `apiService` tự refresh/redirect |
| `403` | User không có quyền vào project |
| `404` | Không tìm thấy project/actor/use case/relationship |
| `409` | Xóa item đang được tham chiếu |
| `422` | Payload sai hoặc chưa có LLM provider active |
| `502` | LLM generation thất bại |
| `504` | LLM generation timeout |

FE nên dùng `title`, `detail`, `errors[]` để hiển thị; giữ `request_id` trong log khi cần debug.

## 9. Checklist hoàn thành FE

- [ ] Tạo service/type cho các endpoint, dùng `apiService` và UUID project.
- [ ] Tab Use Case load GET và dùng một shared model cho Table + Diagram.
- [ ] Nút **Generate Use Case** gọi POST, có loading/error/success state.
- [ ] Table hiển thị cây L0/L1/L2 từ `parentUseCaseId`.
- [ ] Diagram dùng `diagramPlans`, đúng shape/line/marker/direction của BE.
- [ ] `part-of` không render thành edge UML.
- [ ] Hiển thị `validation.issues`, `eligibleForSrs`, `eligibleDiagramIds`.
- [ ] CRUD actor/use case/relationship cập nhật lại model sau khi thành công.
- [ ] Xử lý `400/401/403/404/409/422/502/504`.
- [ ] Không gửi API key và không đọc Markdown mẫu ở FE runtime.
- [ ] Position React Flow chỉ là UI state/local persistence cho tới khi BE có layout API.


## 10. Tích hợp FE (2026-09-23)

- `lib/api/services/useCaseModel.ts`: các service GET model, POST generate, CRUD actor/use case và POST/DELETE relationship; unwrap envelope `success/data/message`, dùng `apiService` để xác thực.
- `hooks/useUseCaseModel.ts`: cache theo UUID project, khóa thao tác trong lúc lưu/generate, GET lại model sau mutation (kể cả khi xóa nhiều item thành công một phần).
- UI giải UUID từ `useOrgProjects`; Table và Diagram dùng chung model. Table sắp xếp và thụt lề theo `parentUseCaseId`, có form thêm/sửa, xóa use case và xóa relationship trong detail.
- Diagram chọn từng `diagramPlan`, giữ node/edge ID, shape, side, label, direction và marker từ BE; không tự sinh association hoặc chuyển `part-of` thành UML edge. Kéo node và kiểu đường đi chỉ là state UI, chưa lưu BE.
- Nút Actors mở dialog thêm/đổi tên/xóa actor. Double-click actor/oval gửi PATCH; nối node gửi POST relationship; extend yêu cầu nhập condition. Xóa selection gửi DELETE và hiển thị lỗi tham chiếu từ BE.
- Hiển thị loading, lỗi API, model rỗng, validation issues và điều kiện SRS. Generate dùng provider active mặc định (`maxLevel: L2`), không gửi key.

### Điểm BE cần bổ sung để diagram đồng bộ sau CRUD

Đối chiếu `app/services/use_case_service.py`: các mutation cập nhật `actors/useCases/relationships`, nhưng `_invalidate_manual_state` chỉ xóa validation và đặt `generation.source = manual`; `_response` trả lại `diagramPlans` đã lưu. Vì vậy plan có thể giữ tên/node/edge cũ sau PATCH/DELETE, và chưa chứa node/edge mới sau POST. FE hiện báo rõ trạng thái này và hiển thị plan BE trả về.

BE cần dựng lại `diagrams` và `diagramPlans` từ aggregate mới sau CRUD (bao gồm membership của node/edge), giữ ID ổn định và trả GET nhất quán với Table. Không nên gọi generate LLM chỉ để refresh diagram vì có thể thay thế chỉnh sửa thủ công. Ngoài ra `_response` đang lọc relationships theo endpoint thuộc use case, nên generalization giữa hai actor không có trong danh sách relationships dù có thể tồn tại trong plan.

Kiểm tra FE: TypeScript và ESLint được chạy cho phần tích hợp; chưa xác nhận luồng end-to-end với backend qua phiên đăng nhập thực.
