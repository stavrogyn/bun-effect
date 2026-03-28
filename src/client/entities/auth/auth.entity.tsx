import { uuidGeneratorService } from "@shared/services/uuid_generator"
import { createContext, use, useContext } from "react"

const AuthContext = createContext<string | null>(null)

export const AuthProvider = ({
  children,
  initialAuthUuid,
}: {
  children: React.ReactNode
  initialAuthUuid?: string
}) => {
  if (initialAuthUuid != null) {
    return (
      <AuthContext.Provider value={initialAuthUuid}>
        {children}
      </AuthContext.Provider>
    )
  }
  return <AuthProviderGenerated>{children}</AuthProviderGenerated>
}

function AuthProviderGenerated({ children }: { children: React.ReactNode }) {
  const uuid = use(uuidGeneratorService.commands.generateUuid())
  return (
    <AuthContext.Provider value={uuid}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
