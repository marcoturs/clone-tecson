import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#1f7a5c]/10 dark:bg-[#1f7a5c]/20 text-[#1f7a5c]',
        success: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
        warning: 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
        destructive: 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400',
        secondary: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
        outline: 'border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
