import type { Notification, NotificationType } from '@/components/NotificationSystem'

type NotificationListener = (notifications: Notification[]) => void

class NotificationManager {
  private notifications: Notification[] = []
  private listeners: NotificationListener[] = []

  subscribe(listener: NotificationListener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]))
  }

  add(
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      duration?: number
      action?: { label: string; onClick: () => void }
    }
  ) {
    const notification: Notification = {
      id: Math.random().toString(36).substring(7),
      type,
      title,
      message,
      duration: options?.duration ?? 5000,
      action: options?.action,
    }

    this.notifications.push(notification)
    this.notify()

    return notification.id
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.notify()
  }

  info(title: string, message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) {
    return this.add('info', title, message, options)
  }

  success(title: string, message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) {
    return this.add('success', title, message, options)
  }

  warning(title: string, message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) {
    return this.add('warning', title, message, options)
  }

  error(title: string, message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) {
    return this.add('error', title, message, options)
  }
}

export const notificationManager = new NotificationManager()
