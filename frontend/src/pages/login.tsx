import { useState, type FormEvent } from "react";
import { errorMessage } from "../API/apiFetch";
import { useLogin } from "../API/users/useLogin";
import "../styles/input.css";

export default function Login() {
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <main className="center-page">
      <section className="panel">
        <h1 className="popup__title">Welcome back</h1>
        <p className="muted">Log in to view your project board.</p>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Email</span>
            <input
              className="field__input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              className="field__input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {login.error && (
            <p role="alert" className="alert">
              {errorMessage(login.error)}
            </p>
          )}

          <button type="submit" className="btn btn--block" disabled={login.isPending}>
            {login.isPending ? "Logging in…" : "Log in"}
          </button>
        </form>
      </section>
    </main>
  );
}
