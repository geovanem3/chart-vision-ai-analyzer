
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Check, X, AlertTriangle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex items-center gap-2">
              {variant === "success" && (
                <Check className="h-5 w-5 text-green-500" />
              )}
              {variant === "error" && (
                <X className="h-5 w-5 text-red-500" />
              )}
              {variant === "warning" && (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              <div className="grid gap-1">
                {title && <ToastTitle className="font-bold">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-sm">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
