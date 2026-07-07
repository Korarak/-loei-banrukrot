import type { Metadata } from "next";
import { Sarabun, Mitr } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

const mitr = Mitr({
  variable: "--font-mitr",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
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
        className={`${sarabun.variable} ${mitr.variable} antialiased`}
      >
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
