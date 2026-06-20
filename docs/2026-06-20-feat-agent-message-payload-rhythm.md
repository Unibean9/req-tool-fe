# FE Handoff: Agent message `payload` field & one-question rhythm

> Branch: `feat/harness-req`
> Date: 2026-06-20
> Scope: Phase 1 (Foundation — `payload` field) + Phase 6 (One-question rhythm)

Hai phase này KHÔNG thêm endpoint mới và KHÔNG đổi request body. Chỉ:
1. **Phase 1** — thêm field `payload` (nullable) vào response của message.
2. **Phase 6** — đổi *ngữ nghĩa* của `content` trong message câu hỏi của agent.

## 1) Endpoint map

Các endpoint trả về `AgentMessageResponse` — nay có thêm `payload`:

- `POST /projects/{project_id}/agent-sessions/{session_id}/messages` — gửi message của user, trả về 1 message.
- `GET  /projects/{project_id}/agent-sessions/{session_id}/messages` — liệt kê toàn bộ message của session.

> Lưu ý: SSE snapshot (`GET .../events`) cũng có `payload` trên mỗi message, nhưng cấu trúc đầy đủ của `payload` (`options`/`blocks`) thuộc Phase 5 — ngoài phạm vi tài liệu này.

## 2) Contracts

### Gửi message

`POST /projects/{project_id}/agent-sessions/{session_id}/messages`

**Auth:** thành viên project (project member). Không phải member → 404.

**Body:**
```json
{ "content": "Mục tiêu của tôi là tăng tỉ lệ chuyển đổi" }
```

Validation rules:
- `content` — string, bắt buộc, `1..8000` ký tự.

**Response `data`** (`AgentMessageResponse`):
- `id` — uuid
- `session_id` — uuid
- `role` — `"agent"` | `"user"`
- `content` — string, **luôn có mặt và không rỗng**. Đây là fallback hiển thị bắt buộc.
- `payload` — **MỚI (Phase 1)** — `object | null`. `null` với message cũ/legacy hoặc message user. Khi có giá trị, đây là "envelope" cấu trúc để render giàu hơn `content`.
- `created_at` — datetime | null
- `updated_at` — datetime | null

### Liệt kê message

`GET /projects/{project_id}/agent-sessions/{session_id}/messages`

**Auth:** thành viên project.

**Response `data`:** `AgentMessageResponse[]` (cùng shape trên), sắp theo `created_at` tăng dần.

### `payload` — phần FE cần biết ở 2 phase này

`payload` là `null` HOẶC một object. Khi không null, luôn có tối thiểu:
- `kind` — string, phân loại message. Ở Phase 6, message câu hỏi của agent có `kind == "question"`.
- `locale` — `"vi"` | `"en"` — ngôn ngữ message (đã khoá xuyên phiên).

```json
{
  "id": "…",
  "role": "agent",
  "content": "Đã rõ mục tiêu. Deadline dự kiến là khi nào?",
  "payload": { "kind": "question", "locale": "vi" }
}
```

> `payload` có thể chứa thêm key nội bộ (vd `run_id`) — FE bỏ qua các key không dùng. Cấu trúc `options[]`/`blocks[]` đầy đủ là Phase 5.

## 3) Error codes

| HTTP | Khi nào | Ghi chú |
|------|---------|---------|
| 404  | User không phải member của project, hoặc session không tồn tại / không thuộc user | Dùng chung cho mọi endpoint message |
| 422  | `content` rỗng hoặc > 8000 ký tự | Pydantic validation |
| 503  | Agent service chưa sẵn sàng (graph chưa nạp) | `POST .../messages` |

(Phase 1 & 6 không thêm error code mới.)

## 4) FE notes

- **Render an toàn:** luôn hiển thị `content` làm mặc định. `payload` chỉ là lớp tăng cường — nếu `payload == null` (message legacy/user) thì chỉ render `content`. Đừng giả định `payload` luôn tồn tại.
- **One-question rhythm (Phase 6):** mỗi lượt agent chỉ hỏi đúng 1 câu. `content` của message `kind == "question"` giờ **có thể** mở đầu bằng một câu ghi nhận câu trả lời trước của user (vd: `"Đã rõ mục tiêu. Deadline là khi nào?"`). FE không cần tách 2 phần — cứ render nguyên `content`. Phần ghi nhận đã được gộp sẵn ở BE.
- **Lượt đầu** (chưa có gì để ghi nhận): `content` chỉ là câu hỏi, không có tiền tố thừa, không khoảng trắng đầu dòng.
- **Locale:** đọc `payload.locale` (nếu có) để biết ngôn ngữ message; locale đã được khoá nhất quán trong cả phiên nên không bị trộn Việt/Anh giữa các message.
- **Tương thích ngược:** field `payload` là additive + nullable; client cũ không đọc `payload` vẫn hoạt động bình thường với `content`.
