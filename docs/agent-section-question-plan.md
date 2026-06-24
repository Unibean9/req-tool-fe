# Agent section question plan

## Kết luận hiện trạng

- Đúng: luồng hiện tại tự gửi message đầu khi tạo session/section, lấy từ `getInitialDocumentItemPrompt(itemType, label)`.
- Đúng: prompt hiện tại gần như hardcode theo section, chưa nối ngữ cảnh từ section trước vào message đầu.
- Đúng: `vision_objectives` chưa hỏi user “Bạn muốn làm gì?” trước; FE đang tự gửi template nên trải nghiệm mở đầu bị hụt, không liền mạch.
- Sai nếu hiểu là BE tự hỏi sai câu đầu: vấn đề đang nằm ở FE auto-start message. Agent phía sau có thể hỏi follow-up, nhưng message đầu đã bị FE quyết định trước.

## Nguyên tắc câu hỏi mới

- Section đầu tiên (`vision_objectives`) phải bắt đầu bằng câu hỏi cho user, không auto-gửi template.
- Câu trả lời của user cho `vision_objectives` chính là message đầu gửi agent.
- Các section sau có thể auto-gửi message đầu, nhưng nên dẫn bằng ngữ cảnh từ section trước nếu có.
- Mỗi lượt chỉ hỏi một câu chính để giữ nhịp agent rõ ràng.
- Copy phải dùng tiếng Việt tự nhiên, ngắn, và hướng user trả lời bằng nội dung thật thay vì trả lời “có/không”.

## BRD

### 1. Vision & Objectives

**UI question:** Bạn muốn làm gì với dự án này?

**Helper text:** Mô tả ngắn sản phẩm/dịch vụ, ai sẽ dùng, và kết quả bạn muốn đạt được.

**Placeholder:** Ví dụ: Tôi muốn xây dựng một hệ thống đặt lịch khám cho phòng khám, giúp bệnh nhân tự chọn khung giờ và giảm tải cho lễ tân.

**First message to agent:** Nội dung user nhập nguyên văn.

---

### 2. Problem Statement

**Depends on:** Vision & Objectives

**Auto message with prior context:**

```text
Dựa trên tầm nhìn và mục tiêu đã thống nhất:

{{prior_summary}}

Hãy giúp tôi làm rõ vấn đề cốt lõi dự án cần giải quyết. Tập trung vào hiện trạng, nỗi đau chính, ai bị ảnh hưởng, và khoảng cách giữa hiện tại với outcome mong muốn.
```

**Fallback question:** Vấn đề cốt lõi mà dự án này cần giải quyết là gì?

---

### 3. Stakeholder Register

**Depends on:** Problem Statement

**Auto message with prior context:**

```text
Dựa trên vấn đề cốt lõi đã mô tả:

{{prior_summary}}

Hãy giúp tôi xác định các stakeholder chính, gồm vai trò, nhu cầu, mức độ ảnh hưởng, và điều họ cần từ hệ thống.
```

**Fallback question:** Những nhóm người hoặc bộ phận nào sẽ dùng, vận hành, phê duyệt, hoặc bị ảnh hưởng bởi dự án này?

---

### 4. Scope & Capabilities

**Depends on:** Problem Statement

**Auto message with prior context:**

```text
Dựa trên vấn đề và outcome đã làm rõ:

{{prior_summary}}

Hãy giúp tôi xác định phạm vi trong/ngoài dự án và các năng lực nghiệp vụ cốt lõi hệ thống cần hỗ trợ.
```

**Fallback question:** Hệ thống cần làm những việc chính nào, và những việc nào chưa nên đưa vào phạm vi hiện tại?

---

### 5. Business Rules

**Depends on:** Scope & Capabilities

**Auto message with prior context:**

```text
Dựa trên phạm vi và năng lực đã thống nhất:

{{prior_summary}}

Hãy giúp tôi xác định các business rule quan trọng, gồm điều kiện, giới hạn, quyền quyết định, và ngoại lệ nghiệp vụ.
```

**Fallback question:** Có quy tắc nghiệp vụ nào bắt buộc hệ thống phải tuân theo không?

---

### 6. Constraints & Assumptions

**Depends on:** Scope & Capabilities

**Auto message with prior context:**

```text
Dựa trên phạm vi hiện tại:

{{prior_summary}}

Hãy giúp tôi liệt kê các ràng buộc, giả định, phụ thuộc, và điểm cần kiểm chứng trước khi triển khai.
```

**Fallback question:** Dự án đang có ràng buộc hoặc giả định quan trọng nào về thời gian, dữ liệu, kỹ thuật, pháp lý, hoặc vận hành?

---

### 7. Risks & Issues

**Depends on:** Constraints & Assumptions

**Auto message with prior context:**

```text
Dựa trên các ràng buộc và giả định đã ghi nhận:

{{prior_summary}}

Hãy giúp tôi phân tích rủi ro và vấn đề chính, gồm tác động, khả năng xảy ra, tín hiệu cảnh báo, và hướng giảm thiểu.
```

**Fallback question:** Những rủi ro hoặc vấn đề nào có thể làm dự án chậm, sai hướng, hoặc khó vận hành?

## PRD

### 8. Functional Requirements

**Depends on:** Scope & Capabilities

**Auto message with prior context:**

```text
Dựa trên phạm vi và năng lực đã có:

{{prior_summary}}

Hãy giúp tôi xây dựng các functional requirement rõ ràng, có thể kiểm chứng, và gắn với mục tiêu nghiệp vụ.
```

**Fallback question:** Người dùng cần thực hiện những hành động chính nào trong hệ thống?

---

### 9. Use Cases

**Depends on:** Functional Requirements

**Auto message with prior context:**

```text
Dựa trên các functional requirement đã thống nhất:

{{prior_summary}}

Hãy giúp tôi xây dựng các use case chính, gồm actor, mục tiêu, tiền điều kiện, luồng chính, ngoại lệ, và kết quả sau cùng.
```

**Fallback question:** Những kịch bản sử dụng quan trọng nhất của hệ thống là gì?

---

### 10. Non-functional Requirements

**Depends on:** Functional Requirements

**Auto message with prior context:**

```text
Dựa trên chức năng và bối cảnh sử dụng hiện tại:

{{prior_summary}}

Hãy giúp tôi xác định các non-functional requirement quan trọng, kèm tiêu chí đo lường phù hợp.
```

**Fallback question:** Hệ thống cần đạt yêu cầu nào về hiệu năng, bảo mật, độ tin cậy, khả năng mở rộng, hoặc trải nghiệm sử dụng?

---

### 11. Acceptance Criteria

**Depends on:** Functional Requirements

**Auto message with prior context:**

```text
Dựa trên các functional requirement hiện tại:

{{prior_summary}}

Hãy giúp tôi viết acceptance criteria cụ thể, kiểm chứng được, ưu tiên dạng Given/When/Then khi phù hợp.
```

**Fallback question:** Điều kiện nào chứng minh một yêu cầu đã hoàn thành đúng?

## Technical Design

### 12. Domain Entities

**Depends on:** Functional Requirements

**Auto message with prior context:**

```text
Dựa trên chức năng và nghiệp vụ đã mô tả:

{{prior_summary}}

Hãy giúp tôi khám phá các domain entity chính, thuộc tính quan trọng, quan hệ, và vòng đời dữ liệu.
```

**Fallback question:** Những đối tượng dữ liệu/nghiệp vụ chính của hệ thống là gì?

---

### 13. Components

**Depends on:** Functional Requirements, Domain Entities

**Auto message with prior context:**

```text
Dựa trên yêu cầu chức năng và các domain entity đã có:

{{prior_summary}}

Hãy giúp tôi đề xuất các component chính trong kiến trúc giải pháp và trách nhiệm của từng component.
```

**Fallback question:** Hệ thống nên được chia thành những component chính nào, và mỗi component chịu trách nhiệm gì?

---

### 14. Interfaces

**Depends on:** Components

**Auto message with prior context:**

```text
Dựa trên các component đã xác định:

{{prior_summary}}

Hãy giúp tôi xác định các interface giữa component, gồm dữ liệu trao đổi, giao thức, trigger, lỗi, và hợp đồng tích hợp.
```

**Fallback question:** Các component hoặc hệ thống ngoài cần trao đổi dữ liệu với nhau qua những interface nào?

---

### 15. Technical Decisions

**Depends on:** Constraints & Assumptions, Components

**Auto message with prior context:**

```text
Dựa trên ràng buộc, giả định, và kiến trúc hiện tại:

{{prior_summary}}

Hãy giúp tôi ghi lại các quyết định kỹ thuật quan trọng, phương án được chọn, lựa chọn bị loại, lý do, và hệ quả.
```

**Fallback question:** Có quyết định kỹ thuật quan trọng nào cần ghi nhận để team hiểu vì sao chọn hướng này không?

## Gợi ý flow FE

1. Nếu `itemType === "vision_objectives"` và chưa có session: hiện input hỏi user trước, không gọi `sendInitialPrompt`.
2. Khi user submit câu trả lời: tạo/ensure section, tạo session, gửi chính nội dung user nhập làm message đầu.
3. Nếu section khác và có prior summary: auto-gửi message có `{{prior_summary}}`.
4. Nếu section khác nhưng thiếu prior: dùng fallback question hoặc prompt ngắn để agent hỏi thêm, không giả vờ đã có ngữ cảnh.
