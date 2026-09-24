# Use Case — BE handoff cho FE

Contract gốc:

- [`use-case-model-api.md`](./use-case-model-api.md)
- [`req-tool-be/docs/rule-diagram-usecase/use-case-table-and-uml-spec-with-enums.md`](../../req-tool-be/docs/rule-diagram-usecase/use-case-table-and-uml-spec-with-enums.md)

Màn hình gồm hai tab: **Use case table** và **PlantUML code**. Cả hai tab dùng cùng response
canonical từ backend.

## Nguồn dữ liệu và nguyên tắc

- Backend đọc BRD/PRD và toàn bộ component/version đã lưu trong document registry của project.
- Không đọc file Markdown mẫu trong repository ở runtime.
- Hierarchy là `System → Module/Capability → Use Case`.
- Module chỉ group rows, không phải một use case.
- Không dùng `L0/L1/L2`, `parentUseCaseId`, `part-of`, diagram plan hoặc React Flow output.
- Use case không có CRUD thủ công. Người dùng chỉ chỉnh source PlantUML.
- FE không gửi API key. Backend chọn provider active của user hoặc `providerConfigId` được chỉ định.

## API flow

### 1. Đọc model

```ts
const response = await apiService.get<ApiEnvelope<UseCaseModel>>(
  `/api/v1/projects/${encodeURIComponent(projectId)}/use-case-model`,
  { includeActors: true, includeRelationships: true },
);
```

Không gửi `maxLevel`.

### 2. Generate table + PlantUML

```ts
const response = await apiService.post<ApiEnvelope<UseCaseModel>>(
  `/api/v1/projects/${encodeURIComponent(projectId)}/use-case-model/generate`,
  { providerConfigId }, // có thể bỏ body hoặc bỏ field này
);
```

Khi thành công, thay toàn bộ query state bằng `data`. Backend luôn hoàn thành source-backed table
trước khi render PlantUML. Nếu LLM timeout/JSON lỗi, response vẫn có table và `generation.error`;
FE hiển thị warning để người dùng retry.

### 3. Resolve quan hệ khi cần

```ts
await apiService.post<ApiEnvelope<UseCaseModel>>(
  `/api/v1/projects/${encodeURIComponent(projectId)}/use-case-model/relations/generate`,
  {},
);
```

FE có thể gọi tự động sau generate khi `generation.relationsGenerated !== true`, hoặc để nút
**Resolve relationships** cho người dùng retry. Lỗi resolver không được xoá table hiện tại.

### 4. Lưu PlantUML đã chỉnh sửa

```ts
await apiService.patch<ApiEnvelope<UseCasePlantUml>>(
  `/api/v1/projects/${encodeURIComponent(projectId)}/use-case-model/uml`,
  { source },
);
```

Source phải có `@startuml` và `@enduml`. Backend lưu nguyên văn, không cập nhật ngược rows.

## TypeScript model tối thiểu

```ts
type EvidenceType = "explicit" | "inferred";
type UseCasePriority = "required" | "recommended" | "optional";
type ActorKind = "human" | "external_system" | "scheduler";
type ActorSide = "left" | "right";
type RelationshipType = "include" | "extend" | "generalization";
type FlowParticipantType = "actor" | "system" | "external_system";
type RequirementType = "functional" | "business_rule" | "non_functional";

type Actor = {
  id: string;
  name: string;
  kind: ActorKind;
  side: ActorSide | null;
};

type Module = {
  id: string;
  name: string;
  goal: string | null;
  sourceTrace: string[];
};

type UseCase = {
  id: string;
  name: string;
  moduleId: string;
  primaryActorId: string;
  secondaryActorIds: string[];
  relationshipIds: string[];
  evidence: EvidenceType;
  priority: UseCasePriority;
  description: string;
  trigger: string | null;
  preconditions: string[];
  mainFlow: FlowStep[];
  alternativeFlows: Flow[];
  exceptionFlows: Flow[];
  postconditionsSuccess: string[];
  postconditionsFailure: string[];
  businessRules: string[];
  relatedRequirements: RequirementLink[];
  sourceTrace: string[];
  note: string | null;
};

type Relationship = {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  condition: string | null;
  reason: string | null;
  confidence: number | null;
  reviewState: "accepted" | "review_required" | "rejected" | null;
  sourceTrace: string[];
};

type PlantUml = {
  language: "plantuml";
  source: string;
  editable: boolean;
  stale: boolean;
  generatedFrom: "use-case-table" | "manual";
};
```

## Table UX

Hiển thị các cột:

1. `Use case`: tên và ID.
2. `Main actor`: tra `primaryActorId` trong `actors`.
3. `Relationships`: chip include/extend/generalization, chiều và use case còn lại.
4. `Evidence`: explicit hoặc inferred.
5. `Priority`: required, recommended hoặc optional.

Rows được nhóm theo `moduleId`. Click một row mở detail panel với description, actors, semantic
relationships, trigger, preconditions, main/alternative/exception flows, postconditions, business
rules, related requirements và source trace. Empty field phải hiện là thiếu dữ liệu nguồn, không tự
điền nội dung.

## PlantUML UX

Tab PlantUML phải:

- hiển thị source editable;
- preview source hiện tại;
- save source bằng PATCH;
- reset về source generated gần nhất;
- download file `.puml`;
- hiển thị lỗi preview nhưng vẫn giữ editor khi server PlantUML không truy cập được.

Renderer backend sinh **một diagram tổng thể**:

```plantuml
left to right direction
skinparam shadowing false
skinparam linetype ortho
skinparam nodesep 70
skinparam ranksep 80
skinparam packageStyle rectangle

actor "Researcher" as ACT_RESEARCHER
rectangle "System" as SYSTEM {
  package "Research Workspace" {
    usecase "UC-001\nCreate Project" as UC_001
  }
}
ACT_RESEARCHER -- UC_001
UC_001 ..> UC_VALIDATE : <<include>>
```

Actors phải nằm ngoài boundary, chỉ ở trái/phải. Module render thành package bên trong boundary.
Không dựng node/edge từ tên hoặc từ hierarchy ở FE; PlantUML source từ BE là nguồn diagram.

## Validation và lỗi

`validation.issues` gồm `severity`, `code`, `message`, `path`. FE nên hiển thị summary và vẫn cho
review table khi có lỗi. `eligibleForSrs` chỉ true khi không có validation error.

Các trường hợp thường gặp:

- `422`: user chưa có active LLM provider hoặc API key không giải mã được.
- `generation.error`: LLM timeout/JSON không hợp lệ nhưng source-backed table đã được trả về.
- resolver timeout/502: giữ table, hiển thị warning và cho retry relationships.
- PlantUML preview lỗi: giữ editor/source, cho retry preview hoặc download `.puml`.

## Checklist trước khi merge FE

- [ ] Không còn request/query `maxLevel`.
- [ ] Không còn type/UI `L0/L1/L2`, `part-of` hoặc `association` trong canonical response.
- [ ] Không render React Flow cho Use Case.
- [ ] Table và detail đọc từ cùng `UseCaseModel` response.
- [ ] Relationship direction được hiển thị đúng: include `base → included`, extend `extension → base`, generalization `child → parent`.
- [ ] PlantUML source được save riêng, không sửa canonical table.
- [ ] Lỗi AI/preview có thông báo và không làm mất dữ liệu table đang có.
