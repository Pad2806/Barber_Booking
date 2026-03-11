import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: string
  config: Record<string, { label: string; variant: "success" | "warning" | "info" | "destructive" | "secondary" | "default" | "outline" }>
}

export function StatusBadge({ status, config }: StatusBadgeProps): React.JSX.Element {
  const item = config[status] || { label: status, variant: "secondary" }
  
  return (
    <Badge variant={item.variant} className="font-medium px-2.5 py-0.5 rounded-full capitalize">
      {item.label}
    </Badge>
  )
}
