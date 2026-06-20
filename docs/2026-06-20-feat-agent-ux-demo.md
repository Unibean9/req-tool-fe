# FE Handoff: Agent UX Demo (Phase 1 → 6)

> Branch: `feat/harness-req`
> Date: 2026-06-20
> Scope: toàn bộ "tầng vỏ giao tiếp" của AI agent — Phase 1 đến Phase 6.

Mục tiêu các thay đổi này: agent **không bao giờ trông như hỏng** — trạng thái hiển thị tức thì,
không nuốt message, ngôn ngữ nhất quán, chào hỏi tự nhiên, output có cấu trúc. **Không** có endpoint
mới, **không** đổi request body. Chỉ thêm field response + đổi hành vi một số trạng thái.

## 1) Endpoint map

Không có route mới. Ba endpoint dưới đây thay đổi về *response* hoặc *hành vi*:

- `POST /projects/{project_id}/agent-sessions/{session_id}/messages` — gửi message. **Đổi hành vi:** khi agent bận, message được **xếp hàng + trả 200** (không còn 400). Response có thêm `payload`.
- `GET  /projects/{project_id}/agent-sessions/{session_id}/messages` — liệt kê message. Mỗi message có thêm `payload`.
- `GET  /projects/{project_id}/agent-sessions/{session_id}/events` — **SSE snapshot** (poll-based). `session` có thêm `ui_status`; mỗi message có thêm `payload`.

Không đổi: `POST /agent-sessions`, `GET/DELETE /agent-sessions/{id}`, các endpoint tool-call (`approve`/`reject`/`request-edit`).

## 2) Contracts

### 2.1 — `AgentMessageResponse` (dùng ở `POST` và `GET .../messages`)

```json
{
  "id": "uuid",
  "session_id": "uuid",
  "role": "agent | user",
  "content": "string — luôn có mặt, không rỗng (fallback hiển thị bắt buộc)",
  "payload": null,
  "created_at": "datetime | null",
  "updated_at": "datetime | null"
}
```

- `payload` — **MỚI (Phase 1)** — `object | null`. `null` với message legacy hoặc message user thường. Khi có giá trị là một "envelope" cấu trúc (xem 2.4).

### 2.2 — Gửi message: `POST .../messages`

**Auth:** thành viên project (không phải member → 404).

**Body:**
```json
{ "content": "Tôi muốn tạo goal tăng tỉ lệ chuyển đổi" }
```
Validation: `content` string, bắt buộc, `1..8000` ký tự.

**Response `data`:** một `AgentMessageResponse` — chính là message **user** vừa lưu.

**Hành vi theo trạng thái session (Phase 3 — S2/S3):**

| Trạng thái session khi gửi | Kết quả |
|----------------------------|---------|
| `waiting_for_human` + đang chờ user trả lời (ask_human) hoặc lượt đầu | Nhận bình thường, agent bắt đầu xử lý (session → `active`). |
| `active` (agent đang chạy) | **200** — message được **xếp hàng** (`payload.queued = true`), xử lý tự động sau khi lượt hiện tại xong. KHÔNG còn trả 400. |
| `waiting_for_human` + đang chờ duyệt artifact (propose_artifacts) | **200** — cũng **xếp hàng** như trên (user nên bấm approve/reject, nhưng nếu gõ text vẫn không bị mất). |
| `completed` / `failed` | **400** — session đã kết thúc, không nhận thêm. |

> Message xếp hàng trả về có `payload: { "queued": true }`. Sau khi được xử lý, cờ này chuyển `false` (thấy được qua SSE/`GET messages`). FE có thể hiển thị message ở dạng "đang chờ gửi" khi `payload.queued === true`.

### 2.3 — SSE snapshot: `GET .../events`

**Auth:** thành viên project + đúng chủ session (sai chủ → 404).

`Content-Type: text/event-stream`. Cơ chế: **snapshot-poll** — server gửi 1 snapshot đầy đủ mỗi khi có thay đổi (diff theo fingerprint), không phải token streaming.

**Các event:**
- `event: snapshot` — `data` là object snapshot đầy đủ (dưới đây). Gửi ngay lần đầu, rồi lặp lại mỗi khi state đổi.
- `event: stream_closed` — `data: { "type": "stream_closed", "status": "completed | failed" }`. Server đóng stream khi session kết thúc.

**`data` của `snapshot`:**
```json
{
  "type": "snapshot",
  "session": {
    "id": "uuid",
    "project_id": "uuid",
    "created_by_id": "uuid",
    "artifact_type": "goal",
    "workflow_area": "analysis",
    "status": "active | waiting_for_human | completed | failed",
    "ui_status": "processing | waiting_input | waiting_approval | error | idle",
    "interrupt_type": "ask_human | propose_artifacts | null",
    "missing_context": ["..."],
    "updated_at": "datetime"
  },
  "messages": [
    { "id": "uuid", "session_id": "uuid", "role": "agent|user",
      "content": "string", "payload": { } , "created_at": "...", "updated_at": "..." }
  ],
  "tool_calls": [
    { "id": "uuid", "run_id": "uuid", "tool_name": "create_artifact",
      "input_snapshot": { }, "status": "proposed|approved|rejected|executed|superseded",
      "created_artifact_id": "uuid|null", "created_version_id": "uuid|null",
      "resolved_at": "...|null", "created_at": "...", "updated_at": "..." }
  ]
}
```

> Bảo mật: snapshot **không bao giờ** chứa `graph_checkpoint` hay secret. Đừng kỳ vọng các field đó.

### 2.4 — `ui_status` (Phase 2 — S1) — trạng thái để render tức thì

Phái sinh từ `status` + `interrupt_type`. Đây là field FE nên dùng để quyết định UI thay vì tự suy luận:

| `ui_status` | Ý nghĩa | Gợi ý UI |
|-------------|---------|----------|
| `processing` | Agent đang chạy (`status=active`) | Hiện spinner "Agent đang xử lý…" |
| `waiting_input` | Đang chờ user trả lời câu hỏi (ask_human) | Mở ô nhập, focus |
| `waiting_approval` | Đang chờ duyệt artifact (propose_artifacts) | Hiện nút Approve / Reject / Request-edit |
| `error` | Lượt thất bại (`status=failed`) | Hiện thông báo lỗi + cho gửi lại |
| `idle` | Đã hoàn tất (`status=completed`) hoặc nghỉ | Trạng thái tĩnh |

### 2.5 — `payload` envelope (Phase 4 + 5 — S5/S6/S7)

Khi `payload != null`, luôn có tối thiểu `kind` + `locale`. Các `kind`:

| `kind` | Sinh ra khi | Field đáng chú ý |
|--------|-------------|------------------|
| `greeting` | User chào hỏi/smalltalk (Phase 4) | `locale` |
| `question` | Agent hỏi 1 câu (ask_human) | `options: []`, `blocks: []` (rỗng) |
| `confirm` | Agent xin xác nhận tạo artifact (Phase 5) | `options: [...]` ≥ 2 nút |
| `proposal` | Agent đề xuất artifact (Phase 5) | `blocks: [...]` mô tả có cấu trúc |

**`options[]`** — nút bấm nhanh (kind=`confirm`):
```json
{ "kind": "confirm", "locale": "vi", "blocks": [],
  "options": [
    { "id": "create",  "label": "Tạo artifact",   "value": "create"  },
    { "id": "explore", "label": "Khám phá thêm",  "value": "explore" }
  ] }
```
→ Khi user bấm 1 nút, FE **gửi `value` như một message thường** qua `POST .../messages` (vd body `{ "content": "create" }`). Không có endpoint riêng (quyết định Open Question Q3).

**`blocks[]`** — output có cấu trúc (kind=`proposal`):
```json
{ "kind": "proposal", "locale": "vi", "options": [],
  "blocks": [
    { "type": "heading", "text": "Tôi đề xuất các artifact sau" },
    { "type": "list", "items": ["Tăng tỉ lệ chuyển đổi", "Giảm churn"] }
  ] }
```
→ FE render `blocks` (heading/list) nếu muốn output đẹp; nếu không, `content` luôn là bản text fallback tương đương.

### 2.6 — One-question rhythm (Phase 6 — S8)

- Mỗi lượt agent chỉ hỏi **đúng 1 câu** (`kind=question`).
- `content` của câu hỏi **có thể** mở đầu bằng câu ghi nhận câu trả lời trước (vd `"Đã rõ mục tiêu. Deadline là khi nào?"`). Phần ghi nhận đã được BE gộp sẵn vào `content` — FE render nguyên `content`, không cần tách.
- Lượt đầu (chưa có gì để ghi nhận): `content` chỉ là câu hỏi, không có tiền tố/khoảng trắng thừa.

## 3) Error codes

| HTTP | Khi nào | Endpoint |
|------|---------|----------|
| 404  | Không phải member project; hoặc session/tool-call không tồn tại / không thuộc user | Tất cả |
| 422  | `content` rỗng hoặc > 8000 ký tự | `POST .../messages` |
| 400  | Gửi message khi session đã `completed`/`failed` | `POST .../messages` |
| 409  | Tạo session khi đã có session active/waiting cho cùng artifact_type | `POST .../agent-sessions` |
| 503  | Agent service chưa sẵn sàng (graph chưa nạp) | `POST .../messages`, tạo session |

> **Đổi đáng chú ý (Phase 3):** trước đây gửi message lúc agent bận trả **400**; nay trả **200** + message `queued`. FE cần bỏ xử lý lỗi 400 cho case "agent đang bận".

**Lỗi runtime trong lượt agent (không phải HTTP):**
- **Timeout:** nếu agent chạy quá `agent_turn_timeout_seconds` (mặc định 90s), session → `failed` và thêm 1 message `role=agent` báo timeout (tiếng Việt). Quan sát qua SSE (`ui_status=error`) — không phải lỗi của request `POST`.
- **Thất bại kỹ thuật:** session → `failed` + message `role=agent` mô tả ngắn lý do.

## 4) FE notes

- **Luôn render `content` trước.** `payload` chỉ là lớp tăng cường. `payload == null` → chỉ hiển thị `content`. Đừng giả định `payload` luôn tồn tại hay luôn có `options`/`blocks`.
- **Dùng `ui_status`, không tự suy luận từ `status`/`interrupt_type`.** Map trực tiếp sang UI theo bảng 2.4.
- **Nguồn chân lý là SSE snapshot**, không phải response của `POST .../messages`. Sau khi gửi, lắng nghe `events` để cập nhật danh sách message + trạng thái. Mỗi `snapshot` là **toàn bộ** state — thay thế, không append.
- **Đóng stream:** khi nhận `event: stream_closed`, ngừng poll; nếu cần tiếp tục hội thoại, mở lại stream sau message kế.
- **Quick-action:** nút từ `options[]` gửi `value` qua `POST .../messages` y như user gõ tay.
- **Queue:** message `payload.queued === true` là đang chờ tới lượt; có thể hiển thị nhạt/"pending". Tối đa 1 lượt agent chạy mỗi session — cứ gửi, không bị mất.
- **Locale nhất quán:** đọc `payload.locale` để biết ngôn ngữ; agent đã khoá locale xuyên phiên nên không trộn Việt/Anh giữa các message.
- **Tương thích ngược:** mọi field mới (`payload`, `ui_status`) là additive; client cũ bỏ qua chúng vẫn chạy với `content` + `status`.
