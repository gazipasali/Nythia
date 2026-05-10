import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nythia Consulting — IT Infrastructure & Advisory",
  description:
    "Nythia Consulting provides enterprise IT infrastructure, cloud migration, and compliance advisory services for mid-size businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans">
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(230 25% 9%)",
              border: "1px solid hsl(230 20% 16%)",
              color: "hsl(220 15% 92%)",
            },
          }}
        />
      </body>
    </html>
  );
}
