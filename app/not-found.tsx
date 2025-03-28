"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-gray-600 mb-8 text-center">
        Sorry, the page you are looking for does not exist or has been removed.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
        >
          Home
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
