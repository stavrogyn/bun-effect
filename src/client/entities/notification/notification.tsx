import { useEffect, useState } from "react"
import { useDisapearNotification, useNotification } from "./provider"

const DISPLAY_MS = 5000
const MOTION_MS = 280

export const NotificationStack = () => {
  const { data } = useNotification()
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(300px, calc(100vw - 24px))",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      {data.map((notification) => (
        <NotificationToast
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type}
        />
      ))}
    </div>
  )
}

export const NotificationToast = ({
  id,
  message,
  type,
}: {
  id: string
  message: string
  type: "success" | "error" | "info"
}) => {
  const { nodeRef, entered, leaving, motion } = useDisapearNotification(id)

  const bg =
    type === "success" ? "green" : type === "error" ? "red" : "blue"

  return (
    <div
      ref={nodeRef}
      style={{
        pointerEvents: "auto",
        width: "100%",
        minHeight: "42px",
        backgroundColor: bg,
        color: "white",
        borderRadius: "10px",
        padding: "10px",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
        opacity: entered && !leaving ? 1 : 0,
        transform:
          entered && !leaving ? "translateY(0)" : "translateY(-16px)",
        transition: motion,
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1rem", fontWeight: "bold", textAlign: "center" }}>{message}</h1>
      <p style={{ fontWeight: "bold", margin: "6px 0 0", fontSize: "0.85rem", opacity: 0.9, textAlign: "center" }}>
        {type}
      </p>
    </div>
  )
}
