# API Reference

Base URL: `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:8000`)  
Auth: `Authorization: Bearer {token}` — inject tự động qua Axios interceptor.  
Mọi response (trừ export) đều có dạng `{ success: boolean, data: T, message: string | null }`.

---

## Enums

### Artifact

```
ArtifactType:
  research_output | intent | problem | goal | stakeholder | capability
  domain_entity | business_rule | constraint | assumption | risk
  open_question | functional_requirement | non_functional_requirement
  use_case | epic | story | acceptance_criteria

ArtifactStatus:
  draft | needs_clarification | accepted | rejected | archived

ArtifactCurrentVersionStatus:
  draft | proposed | accepted | rejected | archived

ArtifactPriority:
  must | should | could | wont

ArtifactChangeSource:
  manual | ai_output | ai_generation | import

ArtifactVersionReviewStatus:
  approved | rejected | changes_requested

EvidenceSourceType:
  chat | repo_file | document | url | user_input | ai_output

ArtifactPhase:
  brd | srs | delivery

WorkflowStepKey:
  intent_vision | capability_map | domain_model | requirements_spec | realization_backlog
```

### Agent Session

```
AgentSessionStatus:
  active | waiting_for_human | completed | failed

AgentInterruptType:
  ask_human | propose_artifacts | null

AgentMessageRole:
  user | agent

AgentSessionUiStatus:
  processing | waiting_input | waiting_approval | error | idle

AgentToolCallStatus:
  proposed | approved | rejected | executed | superseded
```

### LLM Provider

```
LLMProviderType:
  openai | anthropic | google | bedrock

LLMProviderConfigStatus:
  draft | active | error | disabled
```

---

## Auth

### GET `/api/v1/auth/github`
Bắt đầu GitHub OAuth flow. **Dùng browser navigation** (không phải XHR).

| | |
|---|---|
| Method | GET (browser redirect) |
| Auth | Không cần |
| Response | Redirect đến GitHub OAuth consent page |

### POST `/api/v1/auth/github/refresh`
Refresh access token khi nhận 401 — gọi tự động bởi Axios interceptor.

**Request body:**
```json
{
  "refresh_token": "string"
}
```

**Response `data`:**
```json
{
  "access_token": "string",
  "refresh_token": "string"
}
```

---

## Users

### GET `/api/v1/users/me`
Lấy thông tin user hiện tại.

**Response `data`:**
```json
{
  "id": "string",
  "email": "string",
  "full_name": "string",
  "is_active": true,
  "role": "string",
  "github_login": "string | null",
  "github_avatar_url": "string | null",
  "created_at": "ISO8601"
}
```

---

### GET `/api/v1/users/search`
Tìm kiếm users.

**Query params:**
| Param | Type | Bắt buộc |
|-------|------|----------|
| `q` | string | ✓ |
| `limit` | number | |
| `offset` | number | |

**Response `data`:** `Array<UserSearchUser>`
```json
[
  {
    "id": "string",
    "email": "string",
    "full_name": "string",
    "github_id": "string | null",
    "github_login": "string | null",
    "github_avatar_url": "string | null"
  }
]
```

---

## Organizations

### GET `/api/v1/orgs/me`
Lấy danh sách org của user hiện tại.

**Response `data`:** `Array<Org>`
```json
[
  {
    "id": "string",
    "name": "string",
    "slug": "string",
    "owner_id": "string | null",
    "created_at": "ISO8601"
  }
]
```

---

### POST `/api/v1/orgs`
Tạo organization mới.

**Request body:**
```json
{
  "name": "string"
}
```

**Response `data`:** `Org` (xem schema trên)

---

### GET `/api/v1/orgs/{org_id}`
Lấy chi tiết một org.

**Path params:** `org_id`

**Response `data`:** `Org`

---

### GET `/api/v1/orgs/{org_id}/members`
Lấy danh sách thành viên trong org.

**Path params:** `org_id`

**Query params:**
| Param | Type | Mô tả |
|-------|------|-------|
| `q` | string | Tìm theo tên/email |
| `role` | string | Lọc theo role |
| `limit` | number | |
| `offset` | number | |

**Response `data`:** `Array<OrgMember>`
```json
[
  {
    "id": "string",
    "org_id": "string",
    "user_id": "string",
    "role": "string",
    "created_at": "ISO8601",
    "user": {
      "id": "string",
      "email": "string",
      "full_name": "string",
      "github_id": "string | null",
      "github_login": "string | null",
      "github_avatar_url": "string | null"
    }
  }
]
```

---

### POST `/api/v1/orgs/{org_id}/members`
Thêm thành viên vào org (bulk).

**Path params:** `org_id`

**Request body:**
```json
{
  "members": [
    {
      "identifier": "string (email hoặc github_login)",
      "role": "string (vd: \"member\")"
    }
  ]
}
```

**Response `data`:**
```json
{
  "added": [ /* Array<OrgMember> */ ],
  "skipped": ["string"],
  "not_found": ["string"]
}
```

---

### GET `/api/v1/orgs/{org_id}/members/search`
Tìm kiếm thành viên trong org.

**Path params:** `org_id`

**Query params:**
| Param | Type | Bắt buộc |
|-------|------|----------|
| `q` | string | ✓ |

**Response `data`:**
```json
[
  {
    "id": "string",
    "email": "string",
    "full_name": "string",
    "github_login": "string | null"
  }
]
```

---

### DELETE `/api/v1/orgs/{org_id}/members/{user_id}`
Xóa thành viên khỏi org.

**Path params:** `org_id`, `user_id`

**Response:** `204 No Content`

---

## Projects

### GET `/api/v1/orgs/{org_id}/projects`
Lấy danh sách projects của org.

**Path params:** `org_id`

**Response `data`:** `Array<OrgProject>`
```json
[
  {
    "id": "string",
    "org_id": "string",
    "name": "string",
    "slug": "string",
    "description": "string | null",
    "created_at": "ISO8601"
  }
]
```

---

### GET `/api/v1/orgs/{org_id}/projects/{project_id}`
Lấy chi tiết một project.

**Path params:** `org_id`, `project_id`

**Response `data`:** `OrgProject`

---

### POST `/api/v1/projects`
Tạo project mới (org_id trong body).

**Request body:**
```json
{
  "org_id": "string",
  "name": "string",
  "description": "string | null"
}
```

**Response `data`:** `OrgProject`

---

### POST `/api/v1/orgs/{org_id}/projects`
Tạo project trong context của org.

**Path params:** `org_id`

**Request body:**
```json
{
  "name": "string",
  "description": "string | null"
}
```

**Response `data`:** `OrgProject`

---

### PATCH `/api/v1/orgs/{org_id}/projects/{project_id}`
Cập nhật project.

**Path params:** `org_id`, `project_id`

**Request body (tất cả optional):**
```json
{
  "name": "string",
  "description": "string | null"
}
```

**Response `data`:** `OrgProject`

---

### DELETE `/api/v1/orgs/{org_id}/projects/{project_id}`
Xóa project.

**Path params:** `org_id`, `project_id`

**Response:** `204 No Content`

---

## Artifacts

### GET `/api/v1/projects/{project_id}/artifacts`
Lấy danh sách artifacts của project.

**Path params:** `project_id`

**Query params:**
| Param | Type | Enum |
|-------|------|------|
| `type` | string | `ArtifactType` |
| `status` | string | `ArtifactStatus` |
| `step_key` | string | `WorkflowStepKey` |
| `phase` | string | `ArtifactPhase` |
| `priority` | string | `ArtifactPriority` |
| `current_version_status` | string | `ArtifactCurrentVersionStatus` |

**Response `data`:** `Array<Artifact>` (xem schema bên dưới)

---

### POST `/api/v1/projects/{project_id}/artifacts`
Tạo artifact mới.

**Path params:** `project_id`

**Request body:**
```json
{
  "type": "ArtifactType",
  "title": "string",
  "body": "string",
  "status": "ArtifactStatus (default: draft)",
  "priority": "ArtifactPriority | null",
  "code": "string | null",
  "confidence": "number | null",
  "nfr_category": "string | null",
  "stakeholder_role": "string | null",
  "metadata": "object",
  "change_source": "ArtifactChangeSource (default: manual)",
  "change_summary": "string | null",
  "source_document_id": "string | null"
}
```

**Response `data`:** `Artifact`

---

### PATCH `/api/v1/projects/{project_id}/artifacts/{artifact_id}`
Cập nhật artifact.

**Path params:** `project_id`, `artifact_id`

**Request body (tất cả optional):**
```json
{
  "title": "string",
  "body": "string",
  "status": "ArtifactStatus",
  "priority": "ArtifactPriority | null",
  "code": "string | null",
  "confidence": "number | null",
  "nfr_category": "string | null",
  "stakeholder_role": "string | null",
  "metadata": "object",
  "change_source": "ArtifactChangeSource (default: manual)",
  "change_summary": "string | null",
  "source_document_id": "string | null"
}
```

**Response `data`:** `Artifact`

---

### DELETE `/api/v1/projects/{project_id}/artifacts/{artifact_id}`
Xóa artifact.

**Path params:** `project_id`, `artifact_id`

**Response:** `204 No Content`

---

### POST `/api/v1/projects/{project_id}/artifacts/{artifact_id}/versions/{version_id}/review`
Review một version của artifact.

**Path params:** `project_id`, `artifact_id`, `version_id`

**Request body:**
```json
{
  "review_status": "ArtifactVersionReviewStatus",
  "comment": "string | null"
}
```

**Response `data`:** `ArtifactVersionReview`
```json
{
  "id": "string",
  "artifact_id": "string",
  "artifact_version_id": "string",
  "reviewed_by_id": "string",
  "review_status": "ArtifactVersionReviewStatus",
  "comment": "string | null",
  "created_at": "ISO8601"
}
```

---

### POST `/api/v1/projects/{project_id}/artifacts/{artifact_id}/versions/{version_id}/restore`
Khôi phục một version cũ của artifact.

**Path params:** `project_id`, `artifact_id`, `version_id`

**Request body:** (empty)

**Response `data`:** `Artifact`

---

### GET `/api/v1/projects/{project_id}/artifacts/{artifact_id}/evidence`
Lấy danh sách evidence của artifact.

**Path params:** `project_id`, `artifact_id`

**Response `data`:** `Array<ArtifactEvidence>`
```json
[
  {
    "id": "string",
    "artifact_id": "string",
    "artifact_version_id": "string | null",
    "source_document_id": "string | null",
    "source_type": "EvidenceSourceType",
    "locator": "string",
    "excerpt": "string | null",
    "confidence": "number | null",
    "metadata": "object",
    "created_at": "ISO8601"
  }
]
```

---

### POST `/api/v1/projects/{project_id}/artifacts/{artifact_id}/evidence`
Thêm evidence cho artifact.

**Path params:** `project_id`, `artifact_id`

**Request body:**
```json
{
  "artifact_version_id": "string | null",
  "source_document_id": "string | null",
  "source_type": "EvidenceSourceType",
  "locator": "string",
  "excerpt": "string | null",
  "confidence": "number | null",
  "metadata": "object"
}
```

**Response `data`:** `ArtifactEvidence`

---

#### Schema: `Artifact`
```json
{
  "id": "string",
  "project_id": "string",
  "current_version_id": "string | null",
  "type": "ArtifactType",
  "status": "ArtifactStatus",
  "priority": "ArtifactPriority | null",
  "code": "string | null",
  "title": "string",
  "confidence": "number | null",
  "nfr_category": "string | null",
  "stakeholder_role": "string | null",
  "created_by_id": "string",
  "created_at": "ISO8601",
  "metadata": "object",
  "current_version": {
    "id": "string",
    "artifact_id": "string",
    "version_number": "number | null",
    "title": "string | null",
    "body": "string",
    "status": "ArtifactCurrentVersionStatus | null",
    "parent_version_id": "string | null",
    "change_source": "ArtifactChangeSource",
    "change_summary": "string | null",
    "review_status": "ArtifactVersionReviewStatus | null",
    "source_document_id": "string | null",
    "created_by_id": "string",
    "created_at": "ISO8601",
    "metadata": "object"
  }
}
```

---

## Agent Sessions

### POST `/api/v1/projects/{project_id}/agent-sessions`
Tạo agent session mới.

**Path params:** `project_id`

**Request body:**
```json
{
  "artifact_type": "ArtifactType",
  "step_key": "string | null",
  "workflow_area": "string",
  "agent_role": "string | null",
  "provider_config_id": "string | null"
}
```

**Response `data`:**
```json
{
  "session_id": "string",
  "missing_context": ["string"]
}
```

---

### GET `/api/v1/projects/{project_id}/agent-sessions/{session_id}`
Lấy trạng thái của session.

**Path params:** `project_id`, `session_id`

**Response `data`:** `AgentSession`
```json
{
  "id": "string",
  "project_id": "string",
  "artifact_type": "ArtifactType",
  "workflow_area": "string",
  "step_key": "string | null",
  "status": "AgentSessionStatus",
  "ui_status": "AgentSessionUiStatus",
  "interrupt_type": "AgentInterruptType",
  "missing_context": "array | object | null",
  "agent_role": "string | null",
  "provider_config_id": "string | null",
  "created_by_id": "string | null",
  "created_at": "ISO8601 | null",
  "updated_at": "ISO8601 | null"
}
```

---

### GET `/api/v1/projects/{project_id}/agent-sessions/{session_id}/events`
Stream SSE events từ agent session.

**Path params:** `project_id`, `session_id`

**Headers:** `Accept: text/event-stream`

**Đặc điểm:** Dùng Axios fetch adapter với Bearer token (không thể dùng native EventSource). Hỗ trợ `AbortSignal`.

**SSE Event types:**

`event: snapshot`
```json
{
  "type": "snapshot",
  "session": { /* AgentSession */ },
  "messages": [ /* AgentMessage[] */ ],
  "tool_calls": [ /* AgentToolCall[] */ ]
}
```

`event: stream_closed`
```json
{
  "type": "stream_closed",
  "status": "completed | failed"
}
```

---

### DELETE `/api/v1/projects/{project_id}/agent-sessions/{session_id}`
Xóa agent session.

**Path params:** `project_id`, `session_id`

**Response:** `204 No Content`

---

### POST `/api/v1/projects/{project_id}/agent-sessions/{session_id}/messages`
Gửi message của user vào session.

**Path params:** `project_id`, `session_id`

**Request body:**
```json
{
  "content": "string"
}
```

**Response `data`:** `AgentMessage`
```json
{
  "id": "string",
  "session_id": "string",
  "role": "AgentMessageRole",
  "content": "string",
  "payload": {
    "kind": "string",
    "locale": "vi | en",
    "queued": "boolean",
    "options": [ { "id": "string", "label": "string", "value": "string" } ],
    "blocks": [ { "type": "heading | list", "text": "string", "items": ["string"] } ]
  },
  "created_at": "ISO8601 | null",
  "updated_at": "ISO8601 | null"
}
```

---

### GET `/api/v1/projects/{project_id}/agent-sessions/{session_id}/messages`
Lấy lịch sử hội thoại của session.

**Path params:** `project_id`, `session_id`

**Response `data`:** `Array<AgentMessage>`

---

### GET `/api/v1/projects/{project_id}/agent-sessions/{session_id}/tool-calls`
Lấy lịch sử tool calls của session.

**Path params:** `project_id`, `session_id`

**Response `data`:** `Array<AgentToolCall>`
```json
[
  {
    "id": "string",
    "run_id": "string",
    "tool_name": "string",
    "input_snapshot": "object",
    "status": "AgentToolCallStatus",
    "created_artifact_id": "string | null",
    "created_version_id": "string | null",
    "resolved_at": "ISO8601 | null",
    "created_at": "ISO8601 | null",
    "updated_at": "ISO8601 | null"
  }
]
```

---

### POST `/api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/approve`
Approve một tool call đang chờ.

**Path params:** `project_id`, `tool_call_id`

**Request body:** `{}`

**Response `data`:** `AgentToolCall`

---

### POST `/api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/reject`
Reject một tool call đang chờ.

**Path params:** `project_id`, `tool_call_id`

**Request body:** `{}`

**Response `data`:** `AgentToolCall`

---

### POST `/api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/request-edit`
Yêu cầu chỉnh sửa một tool call.

**Path params:** `project_id`, `tool_call_id`

**Request body:**
```json
{
  "note": "string"
}
```

**Response `data`:** `AgentToolCall`

---

## LLM Provider Configs

### GET `/api/v1/users/me/llm-provider-configs`
Lấy danh sách LLM provider configs của user.

**Response `data`:** `Array<LLMProviderConfig>` (xem schema bên dưới)

---

### GET `/api/v1/users/me/llm-provider-configs/{config_id}`
Lấy chi tiết một LLM config.

**Path params:** `config_id`

**Response `data`:** `LLMProviderConfig`

---

### POST `/api/v1/users/me/llm-provider-configs`
Tạo mới hoặc cập nhật LLM config (upsert).

**Request body:**
```json
{
  "provider_type": "LLMProviderType",
  "api_key": "string",
  "secret_key": "string | null",
  "region": "string | null",
  "model_name": "string",
  "strong_model_name": "string"
}
```

**Response `data`:** `LLMProviderConfig`

---

### PATCH `/api/v1/users/me/llm-provider-configs/{config_id}`
Cập nhật một LLM config.

**Path params:** `config_id`

**Request body:** Giống POST upsert ở trên.

**Response `data`:** `LLMProviderConfig`

---

### DELETE `/api/v1/users/me/llm-provider-configs/{config_id}`
Xóa LLM config.

**Path params:** `config_id`

**Response:** `204 No Content`

---

### POST `/api/v1/users/me/llm-provider-configs/{config_id}/health-check`
Kiểm tra kết nối provider.

**Path params:** `config_id`

**Request body:** `{}`

**Response `data`:**
```json
{
  "config": { /* LLMProviderConfig */ },
  "response_time_ms": "number",
  "provider_reply": "string | null"
}
```

---

#### Schema: `LLMProviderConfig`
```json
{
  "id": "string",
  "user_id": "string",
  "provider_type": "LLMProviderType",
  "name": "string",
  "base_url": "string | null",
  "region": "string | null",
  "model_name": "string | null",
  "strong_model_name": "string | null",
  "status": "LLMProviderConfigStatus",
  "is_default": "boolean",
  "api_key_set": "boolean",
  "secret_key_set": "boolean",
  "last_checked_at": "ISO8601 | null",
  "last_check_error": "string | null",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

---

## Project Export

### GET `/api/v1/projects/{project_id}/exports/brd.md`
Xuất BRD dưới dạng Markdown.

**Path params:** `project_id`

**Query params:**
| Param | Type | Mô tả |
|-------|------|-------|
| `include_wont` | boolean | Bao gồm requirements có priority `wont` |

**Headers:** `Accept: text/markdown, text/plain;q=0.9, */*;q=0.8`

**Response:** Raw markdown string (không phải JSON)

---

## Error Format

API trả lỗi theo một trong các định dạng sau:

**FastAPI validation error:**
```json
{
  "detail": [
    { "msg": "string", "loc": ["body", "field_name"] }
  ]
}
```

**Problem JSON:**
```json
{
  "errors": [
    { "field": "string", "message": "string" }
  ]
}
```

**Standard:**
```json
{
  "success": false,
  "message": "string",
  "data": null
}
```
