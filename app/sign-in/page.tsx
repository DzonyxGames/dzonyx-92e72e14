"use client";

import { SignIn } from "@clerk/react";

export default function SignInPage() {
  return (
    <main id="main-content" className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">ENTER DZONYX</h1>
        <p className="auth-subtitle">
          Enter your email. Clerk will send a one-time sign-in code—no password.
        </p>
        <SignIn routing="hash" withSignUp signUpUrl="/sign-up" />
      </div>
    </main>
  );
}
