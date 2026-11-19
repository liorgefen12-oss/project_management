import { useState, type FormEvent } from "react";
import { ApiError } from "../API/apiFetch";
import { useLogin } from "../API/users/useLogin";

const inputStyle = {
  display: "block",
  width: "100%",
  margin: "8px 0 16px",
  padding: 10,
};

export default function Login() {
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.mutate({ email, password });
  }

  const errorText =
    login.error instanceof ApiError
      ? (login.error.body.errorMessages?.join(", ") ?? login.error.body.message)
      : login.error
        ? "Could not reach the server"
        : null;

  return (
    <main style={{ maxWidth: 400, margin: "10vh auto", padding: 24 }}>
      <h1>Welcome back</h1>
      <p>Log in to view your project board.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {errorText && (
          <p role="alert" style={{ color: "crimson" }}>
            {errorText}
          </p>
        )}

        <button type="submit" disabled={login.isPending}>
          {login.isPending ? "Logging in…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
