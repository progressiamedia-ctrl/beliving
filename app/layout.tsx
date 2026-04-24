import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { LayoutClient } from "@/components/LayoutClient";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"] });

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
      <body className={`${montserrat.className} min-h-full bg-white dark:bg-black text-black dark:text-white`}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
