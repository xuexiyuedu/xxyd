import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { PwaProvider } from "@/components/pwa/pwa-provider";

export const metadata: Metadata = {
  title: "知识阅读平台",
  description: "资料管理 + 学习阅读一体化系统",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <PwaProvider>
            {children}
            <Toaster position="top-center" richColors />
          </PwaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
