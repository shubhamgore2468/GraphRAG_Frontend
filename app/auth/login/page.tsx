"use client";

import { signIn } from "next-auth/react";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1>
        <button onClick={() => signIn("google", { callbackUrl: "/chat" })}>
          Login with Google
        </button>
      </h1>
    </div>
  );
}
