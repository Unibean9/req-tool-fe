import { cn } from "@/lib/utils"

/** Strong ease-out for UI enter/exit (Emil / animations.dev). */
export const UI_EASE_OUT = "ease-[cubic-bezier(0.22,1,0.36,1)]"

const motionReducePopup =
  "motion-reduce:transition-none motion-reduce:data-starting-style:scale-100 motion-reduce:data-starting-style:opacity-100 motion-reduce:data-ending-style:scale-100 motion-reduce:data-ending-style:opacity-100"

/** Anchored popovers, menus, tooltips — scale from trigger. */
export function uiPopupClasses(...extra: (string | undefined)[]) {
  return cn(
    "origin-(--transform-origin)",
    "transition-[transform,opacity] duration-200 will-change-transform",
    UI_EASE_OUT,
    "data-starting-style:scale-95 data-starting-style:opacity-0",
    "data-ending-style:scale-95 data-ending-style:opacity-0",
    "data-open:scale-100 data-open:opacity-100",
    motionReducePopup,
    ...extra
  )
}

/** Centered modals / alert dialogs. */
export function uiModalPopupClasses(...extra: (string | undefined)[]) {
  return cn(
    "transition-[transform,opacity] duration-200 will-change-transform",
    UI_EASE_OUT,
    "data-starting-style:scale-95 data-starting-style:opacity-0",
    "data-ending-style:scale-95 data-ending-style:opacity-0",
    "data-open:scale-100 data-open:opacity-100",
    motionReducePopup,
    ...extra
  )
}

/** Backdrop overlays. */
export function uiOverlayClasses(...extra: (string | undefined)[]) {
  return cn(
    "transition-opacity duration-200 ease-out",
    "data-starting-style:opacity-0 data-ending-style:opacity-0 data-open:opacity-100",
    "motion-reduce:transition-none motion-reduce:data-starting-style:opacity-100 motion-reduce:data-ending-style:opacity-100",
    ...extra
  )
}

/** Buttons and pressable controls (pair with active scale utility). */
export const uiPressableTransition =
  "transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-out"

export const uiPressableActive =
  "active:scale-[0.97] motion-reduce:active:scale-100"

/** Hover / focus color shifts only. */
export const uiColorTransition = "transition-colors duration-150 ease-out"
