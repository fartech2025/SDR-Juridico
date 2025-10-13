import { createContext, useContext } from "react";
import type { ReactNode } from "react";

type UserProfileContextValue = {
  profile: UserProfile | null;
  refreshProfile: () => Promise<UserProfile | null>;
};

export type UserProfile = {
  id_usuario: number;
  email: string;
  nome: string | null;
  auth_user_id: string;
};

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export function UserProfileProvider({
  value,
  children,
}: {
  value: UserProfileContextValue;
  children: ReactNode;
}) {
  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return ctx;
}
