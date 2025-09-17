"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

interface ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "error" | "success" | "warning"
  onClose: (id: string) => void
}

export function SimpleToast({ id, title, description, variant = "default", onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [id, onClose])

  const variantStyles = {
    default: "border-gray-200 bg-white text-gray-900 shadow-lg",
    error: "border-red-300 bg-red-50 text-red-900 shadow-lg shadow-red-100",
    success: "border-green-300 bg-green-50 text-green-900 shadow-lg shadow-green-100",
    warning: "border-yellow-300 bg-yellow-50 text-yellow-900 shadow-lg shadow-yellow-100"
  }

  return (
    <div
      className={cn(
        "relative flex w-full items-start justify-between space-x-3 sm:space-x-4 overflow-hidden rounded-md border p-3 sm:p-4 pr-10 sm:pr-8 transition-all animate-in slide-in-from-top-2 fade-in-0",
        variantStyles[variant]
      )}
    >
      <div className="grid gap-1 sm:gap-2 flex-1 max-w-full">
        {title && (
          <div className="text-xs sm:text-sm font-semibold break-words">
            {title}
          </div>
        )}
        {description && (
          <div className="text-xs sm:text-sm leading-relaxed opacity-90 break-words">
            {description}
          </div>
        )}
      </div>
      
      <button
        onClick={() => onClose(id)}
        className={cn(
          "absolute right-2 top-2 rounded-md p-1 transition-colors hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-black/20",
          variant === "error" && "hover:bg-red-900/10 focus:ring-red-400/50"
        )}
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}