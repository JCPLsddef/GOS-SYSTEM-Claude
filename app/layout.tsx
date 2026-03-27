import type { Metadata } from "next";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "GOS — G Operating System",
  description: "Personal life execution system with game progression mechanics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-body antialiased bg-bg-base text-cream min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
