import type { Metadata, Viewport } from "next";
import { Sarabun, Mitr, Anton } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
import { SITE_URL, storeJsonLd } from "@/lib/seo";

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

const anton = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "บ้านรักรถเมืองเลย - อะไหล่และซ่อมเวสป้า โดยช่างโอ๊ต (Oat Engineering)",
    template: "%s | บ้านรักรถเมืองเลย",
  },
  description: "ร้านอะไหล่ Vespa เล็กๆ ที่เมืองเลย ดูแลโดยช่างโอ๊ต (Oat Engineering)",
  openGraph: {
    type: "website",
    siteName: "บ้านรักรถเมืองเลย",
    locale: "th_TH",
    url: SITE_URL,
    title: "บ้านรักรถเมืองเลย - อะไหล่และซ่อมเวสป้า",
    description: "ร้านอะไหล่ Vespa เล็กๆ ที่เมืองเลย ดูแลโดยช่างโอ๊ต (Oat Engineering)",
    images: [{ url: "/logo.png", alt: "บ้านรักรถเมืองเลย" }],
  },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "บ้านรักรถเมืองเลย",
  },
};

export const viewport: Viewport = {
  themeColor: "#af1d35",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${sarabun.variable} ${mitr.variable} ${anton.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
        />
        <QueryProvider>
          {children}
          <Toaster />
          <ServiceWorkerRegistration />
        </QueryProvider>
      </body>
    </html>
  );
}
