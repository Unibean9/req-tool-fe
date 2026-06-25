# Bàn giao BE -> FE: Harness Conversation Fluency

> Branch: `feat/harness-req` · Date: 2026-06-25

Plan này thay đổi **vòng đời trạng thái** của agent session, không đổi chữ ký endpoint. Endpoint giữ nguyên path/method; cái thay đổi là **giá trị `status` / `interrupt_type` / `ui_status`** mà FE đọc qua snapshot và SSE. FE phải đọc kỹ mục 2 và 4.

## 1) Endpoint map

Không có endpoint mới. Các endpoint dưới đây là nơi FE quan sát trạng thái bị ảnh hưởng:

- `GET /projects/{project_id}/agent-sessions/{session_id}` — đọc session một lần (`AgentSessionResponse`)
- `GET /projects/{project_id}/agent-sessions/{session_id}/events` — SSE snapshot + delta (nguồn chính cho UI realtime)
- `POST /projects/{project_id}/agent-sessions/{session_id}/messages` — gửi tin nhắn người dùng
- `POST /projects/{project_id}/agent-sessions/{session_id}/tool-calls/{id}/approve|reject|request-edit` — duyệt artifact đề xuất

## 2) Thay đổi contract trạng thái (cốt lõi — D4)

Trước đây khi agent hỏi lại người dùng (`ask_user`), session chuyển sang:

```
status = "waiting_for_human", interrupt_type = "ask_human"
```

**Từ nay** khi agent hỏi một câu hội thoại (Q&A), session ở:

```
status = "active", interrupt_type = "stream_response"
```

`interrupt_type` có thêm giá trị mới: **`stream_response`**. Tập đầy đủ:

| interrupt_type | Khi nào | status đi kèm |
|---|---|---|
| `ask_human` | (legacy) hỏi người dùng — chỉ còn dùng ở các nhánh chưa migrate | `waiting_for_human` |
| `stream_response` | **mới** — agent hỏi/trả lời hội thoại, vẫn đang "mở" để người dùng nhập tiếp | `active` |
| `propose_artifacts` | agent đề xuất artifact chờ duyệt | `waiting_for_human` |

Lý do: giữ session `active` để mô hình hoá hội thoại liên tục (người dùng có thể trả lời ngay mà không bị coi là "đã kết thúc lượt"). Backend đã hardening để **không** tự promote `active + stream_response` thành `completed` khi graph còn interrupt.

## 3) Mapping `ui_status` (đã cập nhật, không cần FE đổi gì)

`ui_status` là field phái sinh BE cấp sẵn để FE **không phải** tự suy từ `status`+`interrupt_type`. Mapping đầy đủ (bao gồm case mới `stream_response`):

| status | interrupt_type | ui_status |
|---|---|---|
| `active` | `stream_response` | **`waiting_input`** ← mới |
| `active` | khác / null | `processing` |
| `waiting_for_human` | `propose_artifacts` | `waiting_approval` |
| `waiting_for_human` | khác | `waiting_input` |
| `failed` | — | `error` |
| còn lại | — | `idle` |

OQ2 đã đóng — BE đã fix mapping, **FE chỉ cần key theo `ui_status`** như trước, không cần đọc `interrupt_type` thô. **Đừng** key trực tiếp vào `status == "waiting_for_human"` để bật ô nhập — case Q&A mới có `status = "active"` nhưng vẫn cần ô nhập.

## 4) FE notes

- **Nguồn chân lý:** ưu tiên đọc `ui_status` thay vì tự ghép `status`+`interrupt_type`. Nếu BE chọn hướng (A) ở mục 3, FE gần như không cần thay đổi.
- **Phân biệt hai loại "chờ":**
  - `waiting_approval` (`propose_artifacts`) → render card duyệt artifact (approve/reject/request-edit).
  - hỏi hội thoại (`stream_response`) → render ô nhập tin nhắn.
- **Nhiều tool/lượt (D1):** một lượt agent có thể phát nhiều `tool_call` (ví dụ vừa ghi nhận note vừa hỏi lại). FE đọc danh sách `tool_calls` trong snapshot/SSE nên render theo list, không giả định "một tool một lượt". Ràng buộc BE đảm bảo: nếu lượt có tool dạng interrupt (hỏi/đề xuất) thì **chỉ một** tool loại đó được phát.
- **Không đổi:** payload `messages`, `tool_calls`, `document`, cơ chế SSE snapshot/delta, và các error code đều giữ nguyên.

## 5) Error codes

Không có error code mới hoặc thay đổi trong plan này.
