
import * as React from "react"
import { Check, X, AlertTriangle, Info } from "lucide-react"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex items-start gap-3">
              {props.variant === "success" && (
                <div className="rounded-full bg-green-500/20 p-1">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              )}
              {props.variant === "error" && (
                <div className="rounded-full bg-red-500/20 p-1">
                  <X className="h-4 w-4 text-red-500" />
                </div>
              )}
              {props.variant === "warning" && (
                <div className="rounded-full bg-amber-500/20 p-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
              )}
              {props.variant === "default" && (
                <div className="rounded-full bg-blue-500/20 p-1">
                  <Info className="h-4 w-4 text-blue-500" />
                </div>
              )}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
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
