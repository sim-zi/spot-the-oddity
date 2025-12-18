"use client";

import { useEffect } from "react";

export default function HistoryPage() {
  useEffect(() => {
    window.location.href = "/tree";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
