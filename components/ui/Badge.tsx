import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'business' | 'school' | 'health' | 'priority' | 'energy'
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-bg-elevated text-cream-muted border-cream-muted/20',
    business: 'bg-front-business/15 text-front-business border-front-business/30',
    school: 'bg-front-school/15 text-front-school border-front-school/30',
    health: 'bg-front-health/15 text-front-health border-front-health/30',
    priority: 'bg-gold/15 text-gold border-gold/30',
    energy: 'bg-danger/15 text-danger border-danger/30',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// Accept both front type string ('business') and look up from fronts array
export function getFrontBadgeVariant(frontTypeOrId: string): BadgeProps['variant'] {
  const map: Record<string, BadgeProps['variant']> = {
    business: 'business',
    school: 'school',
    health: 'health',
  }
  return map[frontTypeOrId] || 'default'
}

// Color badge for any front (uses inline style)
export function FrontBadge({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono border', className)}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}30`,
      }}
    >
      {name}
    </span>
  )
}
