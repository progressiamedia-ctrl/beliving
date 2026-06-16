import type { Metadata } from "next";
import { LayoutClient } from "@/components/LayoutClient";
import "./globals.css";

export const metadata: Metadata = {
  title: "Be Living - Premium Properties",
  description: "Premium luxury rental platform with modern design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preload" as="image" href="https://images.unsplash.com/photo-1512453575128-d2f4b0e961c3?w=1920&h=1080&fit=crop&q=85" />
        <link rel="preload" as="image" href="https://images.unsplash.com/photo-1562883714-47a98a3c3872?w=1920&h=1080&fit=crop&q=85" />
        <link rel="preload" as="image" href="https://images.unsplash.com/photo-1543936552-5150209c26d6?w=1920&h=1080&fit=crop&q=85" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
