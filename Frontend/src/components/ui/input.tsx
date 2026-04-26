import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: 'default' | 'glass' | 'premium';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          
          variant === 'default' && "border-border hover:border-muted-foreground/30",
          
          variant === 'glass' && "bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 text-white",
          
          variant === 'premium' && "bg-secondary/30 dark:bg-zinc-900/50 border-border dark:border-zinc-800 shadow-sm hover:shadow-md focus:scale-[1.002]",

          "dark:bg-zinc-900/40 dark:border-zinc-800 dark:hover:border-zinc-700",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
