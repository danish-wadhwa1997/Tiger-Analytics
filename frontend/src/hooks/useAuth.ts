import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { login as loginApi } from "../api/auth";
import { setAuthToken } from "../api/client";
import type { User } from "../types";

export function useAuth() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      loginApi(username, password),
    onSuccess: (data) => {
      setToken(data.token);
      setAuthToken(data.token);
      setUser(data.user);
    },
  });

  const logout = useCallback(() => {
    setToken("");
    setAuthToken("");
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(token);
  const canEdit = user?.role === "admin" || user?.role === "editor";

  return { user, isAuthenticated, canEdit, loginMutation, logout };
}
