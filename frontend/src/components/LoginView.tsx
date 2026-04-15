import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import StatusMessage from "./StatusMessage";
import type { User } from "../types";

interface Props {
  loginMutation: UseMutationResult<
    { token: string; user: User },
    Error,
    { username: string; password: string }
  >;
}

export default function LoginView({ loginMutation }: Props) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Password123!");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <main className="container">
      <h1>Retail Pricing Management</h1>
      <p>Sign in with an RBAC-enabled account.</p>
      <form className="card" onSubmit={handleSubmit}>
        <label htmlFor="login-user">Username</label>
        <input
          id="login-user"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <label htmlFor="login-pass">Password</label>
        <input
          id="login-pass"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Signing in\u2026" : "Sign in"}
        </button>
        {loginMutation.isError && (
          <StatusMessage type="error" message="Login failed. Check credentials." />
        )}
      </form>
      <p className="muted">
        Demo users: <code>admin</code> / <code>editor</code> / <code>viewer</code>{" "}
        with password <code>Password123!</code>
      </p>
    </main>
  );
}
