import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import { uiPressableTransition } from "./ui-motion"

const buttonVariants = cva(
  cn(
    "group/button cursor-pointer inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-transparent bg-clip-padding text-sm font-semibold tracking-tight whitespace-nowrap shadow-sm outline-none select-none",
    uiPressableTransition,
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/45",
    "active:not-aria-[haspopup]:scale-[0.97] motion-reduce:active:scale-100",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-md shadow-primary/25 hover:bg-primary/90 hover:text-white hover:shadow-lg hover:shadow-primary/35 active:bg-primary/95 active:text-white [a]:hover:bg-primary/88 [a]:hover:text-white [a]:hover:shadow-lg [a]:hover:shadow-primary/30 [&_svg]:text-white",
        outline:
          "border-border/90 bg-background/90 shadow-none backdrop-blur-sm hover:border-border hover:bg-muted hover:text-foreground hover:shadow-md aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/35 dark:hover:border-input dark:hover:bg-input/55",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md shadow-secondary/20 hover:bg-secondary/88 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "shadow-none hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/12 text-destructive shadow-none hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/22 dark:hover:bg-destructive/32 dark:focus-visible:ring-destructive/40",
        link: "shadow-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 px-4 py-2 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        /* extra-dense (không có trong doc mẫu; giữ cho UI thu gọn) */
        xs: "h-8 gap-1.5 rounded-lg px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 rounded-xl px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        lg: "h-11 rounded-xl px-8 has-data-[icon=inline-end]:pr-7 has-data-[icon=inline-start]:pl-7",
        icon: "size-10",
        "icon-xs":
          "size-8 rounded-lg in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 rounded-xl in-data-[slot=button-group]:rounded-xl",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
