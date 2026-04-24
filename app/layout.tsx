import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Be Living Property",
  description: "Premium luxury rental platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-white text-black">{children}</body>
    </html>
  );
}
