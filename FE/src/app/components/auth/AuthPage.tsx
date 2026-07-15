import { FormEvent, useState } from "react";
import { BookOpen, LogIn, UserPlus } from "lucide-react";

import { login, register } from "../../lib/authApi";
import { ApiUser } from "../../lib/authApi";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import styles from "./AuthPage.module.css";

interface AuthPageProps {
  onAuthenticated: (user: ApiUser) => void;
  initialMode?: AuthMode;
  onCancel?: () => void;
}

type AuthMode = "login" | "signup";

export function AuthPage({ onAuthenticated, initialMode = "login", onCancel }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Enter your email.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const user = isLogin ? await login(email.trim(), password) : await register(email.trim(), password);
      onAuthenticated(user);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isLogin
            ? "Could not log in."
            : "Could not create your account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        {onCancel ? (
          <button type="button" className={styles.backButton} onClick={onCancel}>
            Back to dashboard
          </button>
        ) : null}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <BookOpen className="size-6" />
          </div>
          <div>
            <p className={styles.eyebrow}>Digital Student Planner</p>
            <h1 className={styles.title}>{isLogin ? "Welcome back" : "Create your account"}</h1>
          </div>
        </div>

        <div className={styles.modeSwitch}>
          <button
            type="button"
            className={isLogin ? styles.modeButtonActive : styles.modeButton}
            onClick={() => {
              setMode("login");
              setErrorMessage(null);
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={!isLogin ? styles.modeButtonActive : styles.modeButton}
            onClick={() => {
              setMode("signup");
              setErrorMessage(null);
            }}
          >
            Sign up
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.field}>
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}

          <Button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isLogin ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
            {isSubmitting ? "Please wait..." : isLogin ? "Login" : "Create account"}
          </Button>
        </form>

        <p className={styles.accountPrompt}>
          {isLogin ? "Don't have an account?" : "Have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(isLogin ? "signup" : "login");
              setErrorMessage(null);
            }}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
}
