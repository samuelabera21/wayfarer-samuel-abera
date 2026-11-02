"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  startTransition,
  type ReactNode,
} from "react";
import type { User } from "../lib/types";
import { fetchUsers } from "../lib/users-api";
import { getStoredActiveUserId, setStoredActiveUserId } from "../lib/api";

interface UserContextValue {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  selectUser: (user: User) => void;
  refreshUsers: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      try {
        const data = await fetchUsers();

        if (!isCancelled) {
          startTransition(() => {
            setUsers(data);
            if (data.length > 0) {
              const storedId = getStoredActiveUserId();
              const matchedUser = storedId ? data.find((u) => u.id === storedId) : null;
              const activeUser = matchedUser ?? data[0]!;
              setCurrentUser(activeUser);
              setStoredActiveUserId(activeUser.id);
            }
            setError(null);
            setIsLoading(false);
          });
        }
      } catch (err) {
        if (!isCancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load travellers";
          startTransition(() => {
            setError(message);
            setIsLoading(false);
          });
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [reloadKey]);

  const selectUser = useCallback((user: User) => {
    setCurrentUser(user);
    setStoredActiveUserId(user.id);
  }, []);

  const refreshUsers = useCallback(() => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      users,
      currentUser,
      isLoading,
      error,
      selectUser,
      refreshUsers,
    }),
    [users, currentUser, isLoading, error, selectUser, refreshUsers]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
