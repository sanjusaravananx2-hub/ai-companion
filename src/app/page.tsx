"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";

export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function init() {
      const res = await fetch("/api/conversations", { method: "POST" });
      const data = await res.json();
      router.replace(`/chat/${data.id}`);
    }
    init();
  }, [router, isSignedIn, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="text-5xl mb-4">👋</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Meet Buddy
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Your AI best friend that remembers everything about you.
            Sign in to start chatting.
          </p>
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors">
              Sign In to Chat
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="text-4xl mb-4">👋</div>
        <p className="text-gray-500 dark:text-gray-400">
          Starting a new chat...
        </p>
      </div>
    </div>
  );
}
