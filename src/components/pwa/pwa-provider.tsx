"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/service-worker";
import { OfflineIndicator } from "./offline-indicator";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <>
      {children}
      <OfflineIndicator />
    </>
  );
}
