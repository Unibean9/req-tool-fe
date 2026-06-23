# Câu hỏi / message đầu khi tạo section (mẫu nội dung)

Chỉ định nghĩa **message đầu tiên** gửi agent khi Start section. Không bao gồm câu hỏi follow-up của agent.

---

## Quy tắc ngắn

- **Vision & Objectives:** Hỏi user “Bạn muốn làm gì?” — câu trả lời của user là message đầu (không auto-gửi template).
- **Các section còn lại:** FE auto-gửi message đầu; nếu đã có nội dung section trước thì chèn tóm tắt (`{{prior_summary}}`), không có thì dùng câu fallback.

---

## BRD

### `vision_objectives`

**Câu hỏi cho user (UI):** Bạn muốn làm gì với dự án này?

**Placeholder:** Mô tả ngắn sản phẩm/dự án là gì, ai dùng, muốn đạt kết quả gì.

**Message đầu:** Nội dung user nhập (nguyên văn).

---

### `problem_statement`

**Tham chiếu:** Vision & Objectives

**Có prior:**
```
Dựa trên tầm nhìn và mục tiêu đã thống nhất ở phần Vision & Objectives:

{{prior_summary}}

Hãy giúp tôi làm rõ vấn đề cốt lõi mà dự án này cần giải quyết — tập trung vào khoảng cách giữa hiện trạng và outcome đã nêu.
```

**Fallback:**
```
Hãy giúp tôi làm rõ vấn đề cốt lõi mà dự án này cần giải quyết.
```

---

### `stakeholder_register`

**Tham chiếu:** Problem Statement

**Có prior:**
```
Dựa trên vấn đề cốt lõi đã mô tả ở Problem Statement:

{{prior_summary}}

Hãy giúp tôi xác định các stakeholder chính — vai trò, nhu cầu và mức độ ảnh hưởng tới dự án.
```

**Fallback:**
```
Hãy giúp tôi xác định các stakeholder chính — vai trò, nhu cầu và mức độ ảnh hưởng tới dự án.
```

---

### `scope_capabilities`

**Tham chiếu:** Problem Statement

**Có prior:**
```
Dựa trên vấn đề và bối cảnh đã làm rõ ở Problem Statement:

{{prior_summary}}

Hãy giúp tôi xác định phạm vi (in/out of scope) và các năng lực nghiệp vụ cốt lõi hệ thống cần hỗ trợ.
```

**Fallback:**
```
Hãy giúp tôi xác định phạm vi và các năng lực nghiệp vụ cốt lõi hệ thống cần hỗ trợ.
```

---

### `business_rules`

**Tham chiếu:** Scope & Capabilities

**Có prior:**
```
Dựa trên phạm vi và năng lực đã thống nhất ở Scope & Capabilities:

{{prior_summary}}

Hãy giúp tôi xác định và cấu trúc các business rule quan trọng của dự án.
```

**Fallback:**
```
Hãy giúp tôi xác định và cấu trúc các business rule quan trọng của dự án.
```

---

### `constraints_assumptions`

**Tham chiếu:** Scope & Capabilities

**Có prior:**
```
Dựa trên phạm vi đã thống nhất ở Scope & Capabilities:

{{prior_summary}}

Hãy giúp tôi phân tích các ràng buộc, giả định và điểm cần kiểm chứng của dự án.
```

**Fallback:**
```
Hãy giúp tôi phân tích các ràng buộc, giả định và điểm cần kiểm chứng của dự án.
```

---

### `risks_issues`

**Tham chiếu:** Constraints & Assumptions

**Có prior:**
```
Dựa trên ràng buộc và giả định đã ghi nhận ở Constraints & Assumptions:

{{prior_summary}}

Hãy giúp tôi phân tích các rủi ro và vấn đề chính — tác động, khả năng xảy ra và hướng giảm thiểu.
```

**Fallback:**
```
Hãy giúp tôi phân tích các rủi ro và vấn đề chính — tác động, khả năng xảy ra và hướng giảm thiểu.
```

---

## PRD

### `functional_requirement`

**Tham chiếu:** Scope & Capabilities

**Có prior:**
```
Dựa trên phạm vi và năng lực đã có ở Scope & Capabilities:

{{prior_summary}}

Hãy giúp tôi xây dựng các functional requirement rõ ràng và có thể kiểm chứng.
```

**Fallback:**
```
Hãy giúp tôi xây dựng các functional requirement rõ ràng và có thể kiểm chứng cho dự án.
```

---

### `use_case`

**Tham chiếu:** Functional Requirement

**Có prior:**
```
Dựa trên các functional requirement đã thống nhất:

{{prior_summary}}

Hãy giúp tôi xây dựng các use case chính — actor, luồng chính và ngoại lệ cần xử lý.
```

**Fallback:**
```
Hãy giúp tôi xây dựng các use case chính — actor, luồng chính và ngoại lệ cần xử lý.
```

---

### `non_functional_requirement`

**Tham chiếu:** Functional Requirement

**Có prior:**
```
Dựa trên các functional requirement đã có:

{{prior_summary}}

Hãy giúp tôi xác định các non-functional requirement quan trọng và tiêu chí đo lường phù hợp.
```

**Fallback:**
```
Hãy giúp tôi xác định các non-functional requirement quan trọng và tiêu chí đo lường phù hợp.
```

---

### `acceptance_criteria`

**Tham chiếu:** Functional Requirement

**Có prior:**
```
Dựa trên các functional requirement hiện tại:

{{prior_summary}}

Hãy giúp tôi xây dựng acceptance criteria cụ thể, kiểm chứng được.
```

**Fallback:**
```
Hãy giúp tôi xây dựng acceptance criteria cụ thể, kiểm chứng được cho các yêu cầu hiện tại.
```

---

## SAD

### `domain_entity`

**Tham chiếu:** Functional Requirement

**Có prior:**
```
Dựa trên các yêu cầu chức năng đã có:

{{prior_summary}}

Hãy giúp tôi khám phá các domain entity chính, thuộc tính và mối quan hệ giữa chúng.
```

**Fallback:**
```
Hãy giúp tôi khám phá các domain entity chính, thuộc tính và mối quan hệ giữa chúng.
```

---

### `component`

**Tham chiếu:** Domain Entity

**Có prior:**
```
Dựa trên domain entity đã mô tả:

{{prior_summary}}

Hãy giúp tôi mô tả các component chính trong kiến trúc giải pháp và trách nhiệm của từng phần.
```

**Fallback:**
```
Hãy giúp tôi mô tả các component chính trong kiến trúc giải pháp và trách nhiệm của từng phần.
```

---

### `interface`

**Tham chiếu:** Component

**Có prior:**
```
Dựa trên các component đã xác định:

{{prior_summary}}

Hãy giúp tôi xác định các interface giữa component, giao thức và hợp đồng tích hợp.
```

**Fallback:**
```
Hãy giúp tôi xác định các interface giữa component, giao thức và hợp đồng tích hợp.
```

---

### `tech_decision`

**Tham chiếu:** Component

**Có prior:**
```
Dựa trên kiến trúc component đã có:

{{prior_summary}}

Hãy giúp tôi ghi lại các quyết định kỹ thuật quan trọng, phương án đã chọn và lý do.
```

**Fallback:**
```
Hãy giúp tôi ghi lại các quyết định kỹ thuật quan trọng, phương án đã chọn và lý do.
```
