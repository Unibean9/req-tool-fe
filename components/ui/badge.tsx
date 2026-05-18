import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import { uiColorTransition } from "./ui-motion"

const badgeVariants = cva(
  cn(
    "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-semibold whitespace-nowrap shadow-sm",
    uiColorTransition,
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/45",
    "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    "[&>svg]:pointer-events-none [&>svg]:size-3!"
  ),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-primary/25 [a]:hover:bg-primary/88",
        secondary:
          "bg-secondary text-secondary-foreground shadow-secondary/20 [a]:hover:bg-secondary/88",
        destructive:
          "bg-destructive/12 text-destructive shadow-none focus-visible:ring-destructive/20 dark:bg-destructive/22 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/22",
        outline:
          "border-border/90 bg-background/80 text-foreground shadow-none backdrop-blur-sm [a]:hover:bg-muted [a]:hover:text-foreground",
        ghost:
          "shadow-none hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "shadow-none text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
