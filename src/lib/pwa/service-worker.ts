"use client";

/**
 * 注册 PWA Service Worker
 */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration.scope);
      })
      .catch((error) => {
        console.error("SW registration failed:", error);
      });
  });
}

/**
 * 注销 Service Worker（开发调试）
 */
export async function unregisterServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  await registration.unregister();
}
