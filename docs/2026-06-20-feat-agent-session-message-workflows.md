# FE Handoff: Agent Session Message Workflows

> Branch: `feat/harness-req`  
> Date: 2026-06-20  
> Scope: mô tả đầy đủ cách FE mapping các API `agent-sessions`, gửi message, nhận snapshot, xử lý câu hỏi và proposal.

## 1) Tổng quan

Agent session là một phiên hội thoại theo từng `project_id` và `artifact_type`. FE không nên xem `POST /messages` là response cuối cùng của agent. API gửi message chỉ ghi nhận input của user và kích hoạt graph chạy nền; trạng thái thật của phiên được đọc qua SSE snapshot hoặc các endpoint list.

Luồng chuẩn:

```text
POST /agent-sessions
  -> GET /events để nhận snapshot đầu tiên
  -> POST /messages với nội dung user
  -> SSE snapshot đổi status/messages/tool_calls
  -> nếu agent hỏi thêm: POST /messages để trả lời
  -> nếu agent confirm: POST /messages với lựa chọn của user
  -> nếu có proposal: approve/reject/request-edit từng tool call
  -> SSE snapshot tới completed/failed hoặc quay lại waiting_input
```

Response REST dùng envelope chung:

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

## 2) Endpoint map

| Method | Path | Mục đích |
| --- | --- | --- |
| `POST` | `/api/v1/projects/{project_id}/agent-sessions` | Tạo session mới cho một artifact type. |
| `GET` | `/api/v1/projects/{project_id}/agent-sessions/{session_id}` | Lấy trạng thái session hiện tại. |
| `DELETE` | `/api/v1/projects/{project_id}/agent-sessions/{session_id}` | Xóa session. |
| `POST` | `/api/v1/projects/{project_id}/agent-sessions/{session_id}/messages` | Gửi message của user hoặc câu trả lời cho interrupt hiện tại. |
| `GET` | `/api/v1/projects/{project_id}/agent-sessions/{session_id}/messages` | Lấy toàn bộ transcript theo thứ tự tạo. |
| `GET` | `/api/v1/projects/{project_id}/agent-sessions/{session_id}/events` | SSE snapshot-first stream cho session. |
| `GET` | `/api/v1/projects/{project_id}/agent-sessions/{session_id}/tool-calls` | Lấy danh sách tool call/proposal của session. |
| `POST` | `/api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/approve` | Duyệt một proposal và tạo artifact draft. |
| `POST` | `/api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/reject` | Từ chối một proposal. |
| `POST` | `/api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/request-edit` | Yêu cầu sửa proposal; tool call hiện tại bị supersede. |

Auth cho toàn bộ endpoint: user đã đăng nhập và là member của project. Session/tool call còn bị giới hạn theo owner `created_by_id`.

## 3) Trạng thái FE cần map

### Session status

| `session.status` | Ý nghĩa | FE nên làm |
| --- | --- | --- |
| `active` | Graph đang xử lý nền. | Disable nút gửi chính hoặc cho phép gửi nhưng hiển thị message queued. |
| `waiting_for_human` | Backend đang chờ user input hoặc approval. | Nhìn thêm `interrupt_type` và `ui_status`. |
| `completed` | Turn hiện tại đã kết thúc, không còn graph chạy. | Có thể cho user gửi message mới nếu muốn mở lượt mới. |
| `failed` | Turn lỗi hoặc timeout. | Hiển thị lỗi từ agent message gần nhất nếu có. |

### Interrupt type

| `interrupt_type` | Ý nghĩa | FE nên làm |
| --- | --- | --- |
| `ask_human` | Agent đang chờ user trả lời một câu hỏi hoặc confirm. | Render input trả lời; nếu message payload có `options`, render quick actions. |
| `propose_artifacts` | Agent đang chờ user xử lý proposal tool calls. | Render danh sách tool calls và nút approve/reject/request edit. |
| `null` | Không có interrupt cụ thể. | Dựa vào `status`. |

### UI status trong SSE snapshot

`GET /events` trả thêm `session.ui_status` để FE dùng trực tiếp:

| `ui_status` | Nguồn từ backend | FE state gợi ý |
| --- | --- | --- |
| `processing` | `status=active` | Đang xử lý. |
| `waiting_input` | `status=waiting_for_human`, interrupt khác `propose_artifacts` | Đang chờ user trả lời. |
| `waiting_approval` | `status=waiting_for_human`, `interrupt_type=propose_artifacts` | Đang chờ duyệt proposal. |
| `error` | `status=failed` | Lỗi. |
| `idle` | `status=completed` hoặc trạng thái còn lại | Rảnh/đã xong lượt. |

## 4) Contracts

### 4.1 Tạo session

`POST /api/v1/projects/{project_id}/agent-sessions`

Body:

```json
{
  "artifact_type": "goal",
  "step_key": "analysis-goal",
  "workflow_area": "analysis",
  "agent_role": "business_analyst",
  "provider_config_id": "00000000-0000-0000-0000-000000000000"
}
```

Validation:

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `artifact_type` | enum | Yes | Một trong các artifact type backend hỗ trợ. |
| `step_key` | string/null | No | Tối đa 100 ký tự. |
| `workflow_area` | string | No | Default `analysis`, tối đa 50 ký tự. |
| `agent_role` | string/null | No | Tối đa 100 ký tự. |
| `provider_config_id` | uuid/null | No | LLM provider config của user. |

Response `data`:

```json
{
  "session_id": "00000000-0000-0000-0000-000000000000",
  "missing_context": []
}
```

Ghi chú:

- Session mới được tạo ở `status=waiting_for_human`, `interrupt_type=null`.
- Backend chỉ trả `session_id` và `missing_context` trong response create; muốn lấy status đầy đủ thì gọi `GET /agent-sessions/{session_id}` hoặc mở SSE.
- Nếu đã có session `active` hoặc `waiting_for_human` cùng `project_id`, `artifact_type`, `created_by_id`, backend trả `409`.

### 4.2 Lấy session

`GET /api/v1/projects/{project_id}/agent-sessions/{session_id}`

Response `data`:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "project_id": "00000000-0000-0000-0000-000000000000",
  "artifact_type": "goal",
  "workflow_area": "analysis",
  "step_key": "analysis-goal",
  "status": "waiting_for_human",
  "interrupt_type": "ask_human",
  "missing_context": [],
  "agent_role": "business_analyst",
  "provider_config_id": "00000000-0000-0000-0000-000000000000",
  "created_by_id": "00000000-0000-0000-0000-000000000000",
  "created_at": "2026-06-20T09:00:00Z",
  "updated_at": "2026-06-20T09:00:00Z"
}
```

Ghi chú:

- Endpoint này không trả `messages`, `tool_calls`, `ui_status`.
- FE nên dùng `GET /events` cho màn hình realtime vì snapshot đã gom session, messages và tool calls.

### 4.3 Gửi message

`POST /api/v1/projects/{project_id}/agent-sessions/{session_id}/messages`

Body:

```json
{
  "content": "Tôi muốn tạo goal cho MVP demo trong 2 tuần."
}
```

Validation:

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `content` | string | Yes | 1 đến 8000 ký tự. |

Response `data`:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "session_id": "00000000-0000-0000-0000-000000000000",
  "role": "user",
  "content": "Tôi muốn tạo goal cho MVP demo trong 2 tuần.",
  "payload": null,
  "created_at": "2026-06-20T09:00:00Z",
  "updated_at": "2026-06-20T09:00:00Z"
}
```

Quan trọng:

- Response này là message của user vừa được lưu, không phải câu trả lời của agent.
- Nếu session đang `waiting_for_human` với `interrupt_type=ask_human` hoặc `interrupt_type=null`, backend đổi session sang `active` và chạy graph nền.
- Nếu session đang `active`, backend không chạy graph thứ hai. Message vẫn được lưu với `payload.queued=true`.
- Nếu session đang `waiting_for_human` với `interrupt_type=propose_artifacts`, message text cũng được queue. FE nên ưu tiên các nút approve/reject/request-edit thay vì gửi free-text ở trạng thái này.
- Nếu session `completed` hoặc `failed`, endpoint trả `400` khi gửi thêm message.

Queued response:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "session_id": "00000000-0000-0000-0000-000000000000",
  "role": "user",
  "content": "Tạo đi",
  "payload": {
    "queued": true
  },
  "created_at": "2026-06-20T09:00:00Z",
  "updated_at": "2026-06-20T09:00:00Z"
}
```

### 4.4 List messages

`GET /api/v1/projects/{project_id}/agent-sessions/{session_id}/messages`

Response `data`:

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "session_id": "00000000-0000-0000-0000-000000000000",
    "role": "agent",
    "content": "Bạn muốn tập trung vào mục tiêu nào trước?",
    "payload": {
      "kind": "question",
      "locale": "vi",
      "options": [],
      "blocks": [],
      "run_id": "00000000-0000-0000-0000-000000000000"
    },
    "created_at": "2026-06-20T09:00:00Z",
    "updated_at": "2026-06-20T09:00:00Z"
  }
]
```

Message role:

| `role` | Ý nghĩa |
| --- | --- |
| `user` | Message do user gửi. |
| `agent` | Message do agent/backend tạo. |

Message payload:

| `payload.kind` | Khi nào xuất hiện | FE mapping |
| --- | --- | --- |
| `greeting` | User mở đầu bằng greeting/smalltalk. | Render text chào và input trả lời tiếp. |
| `question` | Agent cần thêm thông tin. | Render một câu hỏi chính; `content` là fallback bắt buộc. |
| `confirm` | Agent hỏi user có muốn tạo artifact không. | Render `options` thành quick actions. |
| `proposal` | Agent đã tạo proposal tool calls. | Render `blocks` và kết hợp với list tool calls. |
| `null` | Message legacy hoặc user message bình thường. | Render bằng `content`. |

Payload luôn là additive. FE phải luôn fallback về `content` nếu `payload` thiếu field hoặc bằng `null`.

### 4.5 SSE session events

`GET /api/v1/projects/{project_id}/agent-sessions/{session_id}/events`

Response là `text/event-stream`. Backend gửi snapshot đầu tiên ngay khi connect:

```text
id: 2026-06-20T09:00:00+00:00:{session_id}:0
event: snapshot
data: {"type":"snapshot","session":{},"messages":[],"tool_calls":[]}
```

Snapshot `data`:

```json
{
  "type": "snapshot",
  "session": {
    "id": "00000000-0000-0000-0000-000000000000",
    "project_id": "00000000-0000-0000-0000-000000000000",
    "created_by_id": "00000000-0000-0000-0000-000000000000",
    "artifact_type": "goal",
    "workflow_area": "analysis",
    "status": "waiting_for_human",
    "ui_status": "waiting_input",
    "interrupt_type": "ask_human",
    "missing_context": [],
    "updated_at": "2026-06-20T09:00:00Z"
  },
  "messages": [],
  "tool_calls": []
}
```

Stream behavior:

- Event names hiện tại chỉ là `snapshot` và `stream_closed`.
- Backend so sánh fingerprint của snapshot; chỉ gửi snapshot mới khi session/messages/tool_calls thay đổi.
- Khi session vào `completed` hoặc `failed`, backend gửi:

```text
event: stream_closed
data: {"type":"stream_closed","status":"completed"}
```

FE mapping:

- Khi mở màn hình session, connect SSE càng sớm càng tốt.
- Mỗi `snapshot` nên replace state theo `session.id`, reconcile `messages` theo `message.id`, reconcile `tool_calls` theo `tool_call.id`.
- Không lưu hoặc hiển thị `graph_checkpoint`; snapshot cố ý không expose field này.
- Nếu SSE disconnect, FE có thể reconnect cùng endpoint và sẽ nhận snapshot mới nhất.

### 4.6 List tool calls

`GET /api/v1/projects/{project_id}/agent-sessions/{session_id}/tool-calls`

Response `data`:

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "run_id": "00000000-0000-0000-0000-000000000000",
    "tool_name": "create_artifact",
    "input_snapshot": {
      "artifact_type": "goal",
      "title": "Tăng độ rõ của MVP demo",
      "body": "Mục tiêu đo được cho phiên demo khách hàng..."
    },
    "status": "proposed",
    "created_artifact_id": null,
    "created_version_id": null,
    "resolved_at": null,
    "created_at": "2026-06-20T09:00:00Z",
    "updated_at": "2026-06-20T09:00:00Z"
  }
]
```

Tool call status:

| `status` | Ý nghĩa | FE action |
| --- | --- | --- |
| `proposed` | Đang chờ user quyết định. | Hiển thị approve/reject/request edit. |
| `executed` | Đã approve và artifact draft đã được tạo. | Link tới `created_artifact_id` hoặc version nếu FE có màn hình artifact. |
| `rejected` | User đã từ chối. | Disable action, hiển thị trạng thái rejected. |
| `superseded` | User request edit, proposal cũ bị thay thế. | Disable action, chờ proposal mới hoặc câu hỏi tiếp theo. |
| `approved` | Enum còn tồn tại nhưng flow hiện tại chuyển thẳng sang `executed`. | Không hard-code chỉ mỗi `approved` là thành công. |

### 4.7 Approve tool call

`POST /api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/approve`

Body: không có.

Response `data`:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "run_id": "00000000-0000-0000-0000-000000000000",
  "tool_name": "create_artifact",
  "input_snapshot": {},
  "status": "executed",
  "created_artifact_id": "00000000-0000-0000-0000-000000000000",
  "created_version_id": "00000000-0000-0000-0000-000000000000",
  "resolved_at": "2026-06-20T09:00:00Z",
  "created_at": "2026-06-20T09:00:00Z",
  "updated_at": "2026-06-20T09:00:00Z"
}
```

Ghi chú:

- Chỉ tool call `status=proposed` mới approve được.
- Approve tạo artifact draft và version draft.
- Nếu còn tool call `proposed` khác trong cùng session, backend chưa resume graph.
- Khi tất cả proposed tool calls đã resolved, backend resume graph nền và session chuyển `active`.

### 4.8 Reject tool call

`POST /api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/reject`

Body: không có.

Response `data.status` là `rejected`.

Ghi chú:

- Chỉ tool call `status=proposed` mới reject được.
- Nếu đây là proposed cuối cùng, backend resume graph nền.

### 4.9 Request edit tool call

`POST /api/v1/projects/{project_id}/agent-tool-calls/{tool_call_id}/request-edit`

Body:

```json
{
  "note": "Làm rõ metric đo lường và giảm phần mô tả chung chung."
}
```

Validation:

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `note` | string | Yes | 1 đến 8000 ký tự. |

Response `data.status` là `superseded`.

Ghi chú:

- Backend lưu `note` thành user message trong transcript.
- Tool call cũ chuyển `superseded`.
- Nếu không còn proposed tool call nào khác, backend resume graph để phân tích yêu cầu sửa.

## 5) Workflow FE chi tiết

### Workflow A: Khởi tạo phiên agent

```text
1. User mở màn hình agent trong project.
2. FE gọi POST /agent-sessions với artifact_type cần làm.
3. FE lưu session_id.
4. FE mở GET /events để nhận snapshot.
5. FE render trạng thái ban đầu từ snapshot.
```

Pseudo-code:

```ts
const created = await api.post(`/projects/${projectId}/agent-sessions`, {
  artifact_type: "goal",
  workflow_area: "analysis",
  provider_config_id: selectedProviderConfigId
});

const sessionId = created.data.session_id;
connectAgentEvents(projectId, sessionId);
```

### Workflow B: User gửi message đầu tiên

```text
1. FE gọi POST /messages.
2. API trả user message ngay.
3. FE append optimistic hoặc dùng response message.
4. Session chuyển active; SSE snapshot tiếp theo có ui_status=processing.
5. Khi agent tạo câu hỏi/confirm/proposal, SSE snapshot cập nhật messages/tool_calls.
```

FE không nên chờ `POST /messages` trả agent answer. Agent answer đến qua SSE hoặc `GET /messages`.

### Workflow C: Agent hỏi một câu, user trả lời

Dấu hiệu trong snapshot:

```json
{
  "session": {
    "status": "waiting_for_human",
    "interrupt_type": "ask_human",
    "ui_status": "waiting_input"
  },
  "messages": [
    {
      "role": "agent",
      "content": "Bạn muốn ưu tiên metric nào?",
      "payload": {
        "kind": "question",
        "locale": "vi",
        "options": [],
        "blocks": []
      }
    }
  ]
}
```

FE action:

```text
1. Render câu hỏi mới nhất của agent.
2. Enable text input.
3. User trả lời.
4. FE POST /messages với content.
5. Chờ snapshot tiếp theo.
```

Nhịp hỏi đáp hiện tại của backend hướng tới one-question rhythm: agent hỏi một câu mỗi lượt, có thể kèm acknowledgment trong `content`.

### Workflow D: Agent confirm trước khi tạo artifact

Dấu hiệu trong snapshot:

```json
{
  "role": "agent",
  "content": "Tôi đã có đủ thông tin để tạo **goal**. Bạn có muốn tôi tiến hành tạo không?",
  "payload": {
    "kind": "confirm",
    "locale": "vi",
    "options": [
      { "id": "create", "label": "Tạo artifact", "value": "create" },
      { "id": "explore", "label": "Khám phá thêm", "value": "explore" }
    ],
    "blocks": []
  }
}
```

FE action:

```text
1. Render confirm card hoặc inline prompt.
2. Nếu user chọn tạo: POST /messages với content tương ứng như "có" hoặc "tạo đi".
3. Nếu user chọn hỏi thêm: POST /messages với nội dung user muốn đào sâu.
4. Nếu user đồng ý, backend chạy quality_gate rồi mới tạo proposal tool calls.
```

Ghi chú:

- Backend nhận diện đồng ý bằng keyword đơn giản như `có`, `yes`, `đồng ý`, `ok`, `tạo`, `create`, `proceed`.
- Sau confirm đồng ý có thể có khoảng chờ vì backend chạy quality gate trước khi tạo proposal.

### Workflow E: Proposal và approval

Dấu hiệu trong snapshot:

```json
{
  "session": {
    "status": "waiting_for_human",
    "interrupt_type": "propose_artifacts",
    "ui_status": "waiting_approval"
  },
  "messages": [
    {
      "role": "agent",
      "payload": {
        "kind": "proposal",
        "blocks": [
          { "type": "heading", "text": "Tôi đề xuất các artifact sau" },
          { "type": "list", "items": ["Tăng độ rõ của MVP demo"] }
        ]
      }
    }
  ],
  "tool_calls": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "status": "proposed",
      "input_snapshot": {
        "artifact_type": "goal",
        "title": "Tăng độ rõ của MVP demo",
        "body": "..."
      }
    }
  ]
}
```

FE action:

```text
1. Render proposal summary từ message payload.kind=proposal.
2. Render từng tool_call.status=proposed thành card có title/body từ input_snapshot.
3. User chọn Approve, Reject hoặc Request edit.
4. Gọi endpoint tương ứng theo tool_call_id.
5. Disable action cho tool call đã resolved.
6. Chờ SSE snapshot mới.
```

Nếu có nhiều tool calls:

```text
1. Backend chỉ resume graph khi không còn tool_call status=proposed trong session.
2. FE cần xử lý từng card độc lập.
3. Sau tool call cuối được approve/reject/request-edit, session sẽ chuyển active rồi có snapshot mới.
```

### Workflow F: User gửi message khi agent đang bận

Khi session đang `active`, FE vẫn có thể gọi `POST /messages`. Backend trả `200` và lưu message:

```json
{
  "role": "user",
  "content": "Bổ sung thêm khách hàng mục tiêu là SMEs.",
  "payload": {
    "queued": true
  }
}
```

FE action:

```text
1. Render message của user với trạng thái queued.
2. Không tự mở graph turn mới ở FE.
3. Chờ snapshot; message queued vẫn xuất hiện trong transcript.
4. Backend chỉ tự xử lý queued message sau khi turn hiện tại completed/failed.
```

Lưu ý:

- Nếu turn hiện tại dừng ở `waiting_for_human`, queued message chưa được drain vì backend đang chờ input cụ thể cho interrupt hiện tại.
- FE nên hạn chế UX gửi nhiều message liên tục khi `ui_status=processing`, nhưng không cần coi queued là lỗi.

### Workflow G: Request edit proposal

```text
1. FE gọi POST /request-edit với note.
2. Tool call cũ chuyển superseded.
3. Note được lưu thành user message.
4. Nếu không còn proposed tool call nào, backend resume graph.
5. FE chờ snapshot mới: có thể là câu hỏi mới, confirm mới, hoặc proposal mới.
```

### Workflow H: Kết thúc stream

Khi session `completed` hoặc `failed`, SSE gửi `stream_closed`.

FE action:

```text
1. Dừng loading.
2. Đóng hoặc để browser tự đóng EventSource.
3. Nếu failed, hiển thị agent message lỗi gần nhất.
4. Nếu cần refresh, gọi GET session/messages/tool-calls hoặc reconnect SSE để lấy snapshot cuối.
```

## 6) Error codes

| HTTP | Khi nào | FE xử lý |
| --- | --- | --- |
| `400` | Session đã kết thúc nhưng vẫn gửi message; tool call không ở `proposed`; artifact type trong snapshot không hợp lệ khi execute. | Hiển thị lỗi thao tác và refresh snapshot. |
| `401` | Chưa đăng nhập hoặc token không hợp lệ. | Điều hướng login/refresh token. |
| `404` | Project/session/tool call không tồn tại hoặc không thuộc user hiện tại. | Hiển thị not found hoặc reload danh sách session. |
| `409` | Đã có active/waiting session cùng project + artifact type + user. | Gọi lại session hiện có nếu backend trả `detail.session_id`. |
| `422` | Body sai schema, ví dụ `content` rỗng hoặc `note` rỗng. | Highlight field lỗi. |
| `503` | Graph agent chưa sẵn sàng. | Hiển thị retry sau. |

Ví dụ `409`:

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": {
    "detail": "Active session already exists",
    "session_id": "00000000-0000-0000-0000-000000000000"
  }
}
```

## 7) Mapping UI đề xuất

### Nguồn dữ liệu ưu tiên

| UI phần | Nguồn chính | Fallback |
| --- | --- | --- |
| Header trạng thái | `snapshot.session.ui_status` | `GET /agent-sessions/{session_id}` |
| Transcript | `snapshot.messages` | `GET /messages` |
| Proposal cards | `snapshot.tool_calls` | `GET /tool-calls` |
| Text hiển thị message | `message.content` | Không có fallback khác. |
| Structured rendering | `message.payload` | Nếu thiếu thì render plain text. |

### Rendering theo `payload.kind`

| Kind | Component |
| --- | --- |
| `greeting` | Agent bubble thông thường. |
| `question` | Agent bubble + input enabled. |
| `confirm` | Agent bubble + quick action buttons từ `options`. |
| `proposal` | Proposal summary + tool call cards. |
| absent/null | Plain chat bubble. |

### Disable/enable input

| `ui_status` | Text input | Proposal actions |
| --- | --- | --- |
| `processing` | Có thể cho gửi nhưng mark queued; khuyến nghị disable để demo gọn hơn. | Disable. |
| `waiting_input` | Enable. | Disable. |
| `waiting_approval` | Khuyến nghị disable free-text; enable approve/reject/request edit. | Enable cho `proposed`. |
| `idle` | Enable nếu muốn mở lượt mới, tùy product. | Disable nếu không còn `proposed`. |
| `error` | Disable hoặc cho retry tùy UI. | Disable. |

## 8) Checklist FE integration

- Kết nối SSE sau khi có `session_id`.
- Treat `POST /messages` là ack lưu user message, không phải agent answer.
- Render snapshot mới nhất làm source of truth.
- Fallback về `message.content` nếu `payload` null hoặc thiếu field.
- Dùng `session.ui_status` thay vì tự suy luận nhiều trạng thái nếu đang đọc từ SSE.
- Khi `payload.queued=true`, hiển thị trạng thái message đang chờ xử lý.
- Khi `interrupt_type=propose_artifacts`, ưu tiên tool call actions, không gửi free-text như câu trả lời chính.
- Sau mỗi approve/reject/request-edit, chờ snapshot mới trước khi kết luận session đã xong.
- Không phụ thuộc vào `approved` để nhận biết artifact đã tạo; flow hiện tại trả `executed` với `created_artifact_id` và `created_version_id`.
- Không expect SSE event rời kiểu `message_created`; runtime hiện tại gửi `snapshot` khi dữ liệu thay đổi.
