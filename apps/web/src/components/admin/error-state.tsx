import { AlertCircle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({
  title = "Đã có lỗi xảy ra",
  message,
  onRetry,
}: ErrorStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-[300px]">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-6 gap-2" variant="outline">
          <RefreshCcw className="h-4 w-4" />
          Thử lại
        </Button>
      )}
    </div>
  )
}
