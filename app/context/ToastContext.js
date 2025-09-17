"use client"

import React, { createContext, useContext, useState } from 'react'
import { SimpleToast } from '../../components/ui/simple-toast'

const ToastContext = createContext()

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = ({ title, description, variant = "default" }) => {
    const id = (++toastId).toString()
    const newToast = { id, title, description, variant }
    
    setToasts(prev => [...prev, newToast])
    
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAllToasts = () => {
    setToasts([])
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearAllToasts }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-16 sm:top-4 right-2 sm:right-4 z-[100] flex max-h-screen w-[calc(100%-1rem)] sm:w-full flex-col space-y-2 max-w-[calc(100vw-1rem)] sm:max-w-[420px]">
        {toasts.map(toast => (
          <SimpleToast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  const { addToast, removeToast, clearAllToasts } = context

  const toast = ({ title, description, variant = "default" }) => {
    return addToast({ title, description, variant })
  }

  return { toast, removeToast, clearAllToasts }
}