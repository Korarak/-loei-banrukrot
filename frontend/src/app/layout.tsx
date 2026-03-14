import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "บ้านรักรถเมืองเลย - ซ่อมเวสป้า & โรงกลึงโอ๊ต (Vespa Repair & Oat Engineering)",
  description: "ศูนย์รวมอะไหล่และบริการปรับแต่งซ่อมบำรุงรถจักรยานยนต์ Vespa ครบวงจร โดยช่างโอ๊ต (Oat Engineering) เมืองเลย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
