import Image from "next/image";
import { SessionProvider } from "next-auth/react";

export default function Home() {
  return (
    <div>
      <SessionProvider>
        <div className="min-h-screen flex items-center justify-center text-5xl">
          Hello World
        </div>
      </SessionProvider>
    </div>
  );
}
