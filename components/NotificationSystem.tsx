'use client'

import { useEffect, useState } from 'react'
import { X, Info, CheckCircle, AlertCircle, Bell } from 'lucide-react'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationSystemProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
}

export function NotificationSystem({ notifications, onDismiss }: NotificationSystemProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-end gap-3 p-4 sm:p-6">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}

function NotificationCard({
  notification,
  onDismiss,
}: {
  notification: Notification
  onDismiss: (id: string) => void
}) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, notification.duration)
      return () => clearTimeout(timer)
    }
  }, [notification.duration])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss(notification.id)
    }, 150)
  }

  const icons = {
    info: <Info className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
  }

  const styles = {
    info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/50 dark:text-blue-100 dark:border-blue-900',
    success: 'bg-green-50 text-green-900 border-green-200 dark:bg-green-950/50 dark:text-green-100 dark:border-green-900',
    warning: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:border-amber-900',
    error: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/50 dark:text-red-100 dark:border-red-900',
  }

  const iconStyles = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
  }

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm transform rounded-xl border p-4 shadow-lg transition-all duration-150 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      } ${styles[notification.type]}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${iconStyles[notification.type]}`}>
          {icons[notification.type]}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">{notification.title}</h3>
          <p className="mt-1 text-sm opacity-90">{notification.message}</p>
          {notification.action && (
            <button
              onClick={() => {
                notification.action?.onClick()
                handleDismiss()
              }}
              className="mt-2 text-sm font-medium underline underline-offset-2 opacity-90 hover:opacity-100"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 rounded-lg p-1 opacity-60 transition-all hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
