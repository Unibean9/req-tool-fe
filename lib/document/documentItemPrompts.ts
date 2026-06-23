const INITIAL_DOCUMENT_ITEM_PROMPTS: Record<string, string> = {
  vision_objectives:
    "Hãy giúp tôi làm rõ tầm nhìn và mục tiêu kinh doanh: vì sao làm dự án này, thành công trông như thế nào, đo bằng gì.",
  problem_statement:
    "Hãy phân tích và làm rõ vấn đề cốt lõi mà dự án này cần giải quyết.",
  stakeholder_register:
    "Hãy xác định các stakeholder chính, vai trò, nhu cầu và mức độ ảnh hưởng của họ.",
  scope_capabilities:
    "Hãy xác định phạm vi và các năng lực nghiệp vụ cốt lõi mà hệ thống cần hỗ trợ.",
  business_rules:
    "Hãy xác định và cấu trúc các business rule quan trọng của dự án.",
  constraints_assumptions:
    "Hãy phân tích các ràng buộc, giả định và điểm cần kiểm chứng của dự án.",
  risks_issues:
    "Hãy phân tích các rủi ro và vấn đề chính, tác động, khả năng xảy ra và hướng giảm thiểu.",
  functional_requirement:
    "Hãy xây dựng các functional requirement rõ ràng và có thể kiểm chứng cho dự án.",
  use_case:
    "Hãy xây dựng các use case chính, actor, luồng chính và các ngoại lệ cần xử lý.",
  non_functional_requirement:
    "Hãy xác định các non-functional requirement quan trọng và tiêu chí đo lường phù hợp.",
  acceptance_criteria:
    "Hãy xây dựng acceptance criteria cụ thể, kiểm chứng được cho các yêu cầu hiện tại.",
  domain_entity:
    "Hãy khám phá các domain entity chính, thuộc tính và mối quan hệ giữa chúng.",
  component:
    "Hãy mô tả các component chính trong kiến trúc giải pháp và trách nhiệm của từng phần.",
  interface:
    "Hãy xác định các interface giữa component, giao thức và hợp đồng tích hợp.",
  tech_decision:
    "Hãy ghi lại các quyết định kỹ thuật quan trọng, phương án đã chọn và lý do.",
};

function formatItemType(itemType: string): string {
  return itemType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getInitialDocumentItemPrompt(
  itemType: string,
  label?: string | null
): string {
  return (
    INITIAL_DOCUMENT_ITEM_PROMPTS[itemType] ??
    `Hãy giúp tôi phân tích và xây dựng ${label ?? formatItemType(itemType)} cho dự án này.`
  );
}
