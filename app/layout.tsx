import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { LayoutClient } from "@/components/LayoutClient";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"] });

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
        <script dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.remove('dark'); localStorage.removeItem('theme');`
        }} />
      </head>
      <body className={`${montserrat.className} min-h-full bg-white text-black`}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
