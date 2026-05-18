export const FLOW_TITLE_MAX_CHARS = 120;
export const FLOW_STEP_MAX_CHARS = 200;
export const FLOW_MAX_STEPS = 20;

/** Số ô step hiển thị cùng lúc; từ step thứ 5 scroll trong vùng steps. */
export const FLOW_STEPS_VISIBLE_COUNT = 4;

/** Chiều cao cố định vùng steps (~4 hàng + connector); từ bước 5 scroll dọc. */
export const FLOW_STEPS_SCROLL_HEIGHT_CLASS = "min-h-[17.5rem] max-h-[17.5rem]";

/** Dialog form flow — width cố định, không giãn khi thêm bước. */
export const FLOW_FORM_DIALOG_WIDTH_CLASS =
  "w-[min(100vw-2rem,32rem)] min-w-[min(100vw-2rem,32rem)] max-w-[min(100vw-2rem,32rem)] overflow-hidden sm:max-w-[min(100vw-2rem,32rem)]";
export const FLOW_DESCRIPTION_MAX_CHARS = 4000;
export const FLOW_ORDER_MIN = 0;
export const FLOW_ORDER_MAX = 9999;
