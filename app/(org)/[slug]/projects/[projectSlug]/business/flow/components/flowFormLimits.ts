export const FLOW_TITLE_MAX_CHARS = 120;
/** Mã flow (`code`) trên API. */
export const FLOW_CODE_MAX_CHARS = 80;
export const FLOW_STEP_MAX_CHARS = 200;
export const FLOW_MAX_STEPS = 20;

/** Số ô step hiển thị cùng lúc; từ step thứ 5 scroll trong vùng steps. */
export const FLOW_STEPS_VISIBLE_COUNT = 4;

/** Chiều cao cố định vùng steps (~4 hàng + connector); từ bước 5 scroll dọc. */
export const FLOW_STEPS_SCROLL_HEIGHT_CLASS = "min-h-[17.5rem] max-h-[17.5rem]";

/** Dialog form flow — width cố định, không giãn khi thêm bước. */
export const FLOW_FORM_DIALOG_WIDTH_CLASS =
  "w-[min(100vw-2rem,32rem)] min-w-[min(100vw-2rem,32rem)] max-w-[min(100vw-2rem,32rem)] overflow-hidden sm:max-w-[min(100vw-2rem,32rem)]";
/** Form flow actions (actor + rules) — hơi rộng hơn dialog flow. */
export const FLOW_CATALOG_ACTIONS_DIALOG_WIDTH_CLASS =
  "w-[min(100vw-2rem,36rem)] min-w-[min(100vw-2rem,36rem)] max-w-[min(100vw-2rem,36rem)] overflow-hidden sm:max-w-[min(100vw-2rem,36rem)]";
export const FLOW_DESCRIPTION_MAX_CHARS = 4000;
/** Mô tả từng flow action (catalog) khi POST/PATCH `.../actions`. */
export const FLOW_ACTION_DESCRIPTION_MAX_CHARS = 500;
/** Số dòng action tối đa trong một lần gửi POST/PATCH. */
export const FLOW_MAX_CATALOG_ACTIONS = 20;
