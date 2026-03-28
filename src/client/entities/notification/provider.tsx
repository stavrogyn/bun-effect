import { createContext, use, useEffect, useRef, useState } from "react"
import { NotificationStack } from "./notification"

type Notification = {
  data: Array<{
    id: string,
    message: string
    type: "success" | "error" | "info"
  }>,
  add: (message: string, type: "success" | "error" | "info") => string,
  remove: (id: string) => void,
}

export const NotificationContext = createContext<Notification>({
  data: [],
  add: () => "",
  remove: () => {},
})

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification["data"]>([])

  const add = (message: string, type: "success" | "error" | "info") => {
    const id = crypto.randomUUID()
    setNotifications((prev) => [...prev, { id, message, type }])
    return id
  }

  const remove = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }
  return (
    <NotificationContext.Provider value={{ data: notifications, add, remove }}>
      {children}
      <NotificationStack />
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  return use(NotificationContext)
}

export const useAddNotification = (message: string, type: "success" | "error" | "info") => {
  const notification = useNotification()
  if (notification == null) {
    return null
  }
  return notification.add(message, type)
}

export const useRemoveNotification = (id: string) => {
  const notification = useNotification()
  if (notification == null) {
    return null
  }
  return notification.remove(id)
}

export const useDisapearNotification = (id: string) => {
  const DISPLAY_MS = 3000
  const MOTION_MS = 280

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const nodeRef = useRef<HTMLDivElement | null>(null)

  const { remove } = useNotification()


  const [entered, setEntered] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    timeoutRef.current = setTimeout(() => setLeaving(true), DISPLAY_MS)
    return () => {
      cancelAnimationFrame(raf)
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [id])

  useEffect(() => {
    if (!leaving) return
    timeoutRef.current = setTimeout(() => remove(id), MOTION_MS)
    return () => {
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [leaving, id, remove])

  const motion = `opacity ${MOTION_MS}ms ease-out, transform ${MOTION_MS}ms ease-out`

  return { nodeRef, entered, leaving, motion }
}
