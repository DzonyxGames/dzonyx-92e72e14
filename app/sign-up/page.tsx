"use client";

import { SignUp } from "@clerk/react";

export default function SignUpPage() {
  return (
    <main id="main-content" className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">JOIN DZONYX</h1>
        <p className="auth-subtitle">
          Create your reader account using only your email and verification code.
        </p>
        <SignUp routing="hash" signInUrl="/sign-in" />
      </div>
    </main>
  );
}
