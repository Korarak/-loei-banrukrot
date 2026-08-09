import type { Metadata, Viewport } from "next";
import { Sarabun, Mitr, Anton } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";

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

const siteUrl = "https://banrukrot.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "บ้านรักรถเมืองเลย - ซ่อมเวสป้าเมืองเลย อะไหล่เวสป้าเมืองเลย โดยช่างโอ๊ต (Oat Engineering)",
    template: "%s | บ้านรักรถเมืองเลย",
  },
  description:
    "ร้านซ่อมเวสป้าและอะไหล่เวสป้าเมืองเลย จังหวัดเลย ดูแลโดยช่างโอ๊ต (Oat Engineering) ผู้เชี่ยวชาญ Vespa และ Lambretta ตัวจริง อะไหล่แท้ OEM ส่งไวทั่วไทย",
  keywords: [
    "ซ่อมเวสป้าเมืองเลย",
    "อะไหล่เวสป้าเมืองเลย",
    "ซ่อมเวสป้าเลย",
    "อะไหล่เวสป้าเลย",
    "ร้านเวสป้าเมืองเลย",
    "ช่างเวสป้าเมืองเลย",
    "ร้านซ่อมมอเตอร์ไซค์เวสป้าเลย",
    "Vespa เลย",
    "Vespa Loei",
    "Vespa repair Loei",
    "Vespa parts Loei",
    "อะไหล่ Lambretta เลย",
    "ช่างโอ๊ต",
    "Oat Engineering",
    "บ้านรักรถเมืองเลย",
  ],
  authors: [{ name: "Oat Engineering" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "บ้านรักรถเมืองเลย",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: siteUrl,
    siteName: "บ้านรักรถเมืองเลย",
    title: "บ้านรักรถเมืองเลย - ซ่อมเวสป้าเมืองเลย อะไหล่เวสป้าเมืองเลย",
    description:
      "ร้านซ่อมเวสป้าและอะไหล่เวสป้าเมืองเลย จังหวัดเลย ดูแลโดยช่างโอ๊ต (Oat Engineering) ผู้เชี่ยวชาญ Vespa และ Lambretta ตัวจริง",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "บ้านรักรถเมืองเลย",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "บ้านรักรถเมืองเลย - ซ่อมเวสป้าเมืองเลย อะไหล่เวสป้าเมืองเลย",
    description:
      "ร้านซ่อมเวสป้าและอะไหล่เวสป้าเมืองเลย จังหวัดเลย ดูแลโดยช่างโอ๊ต (Oat Engineering)",
    images: ["/logo.png"],
  },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": ["AutoRepair", "AutoPartsStore"],
  name: "บ้านรักรถเมืองเลย",
  alternateName: "Oat Engineering",
  description:
    "ร้านซ่อมเวสป้าและอะไหล่เวสป้าเมืองเลย จังหวัดเลย ดูแลโดยช่างโอ๊ต (Oat Engineering) ผู้เชี่ยวชาญ Vespa และ Lambretta",
  url: siteUrl,
  image: `${siteUrl}/logo.png`,
  logo: `${siteUrl}/logo.png`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "519/2 หมู่ 5 บ้านหนองผักก้าม",
    addressLocality: "ตำบลเมือง อำเภอเมือง",
    addressRegion: "เลย",
    postalCode: "42000",
    addressCountry: "TH",
  },
  areaServed: [
    { "@type": "City", name: "เมืองเลย" },
    { "@type": "AdministrativeArea", name: "จังหวัดเลย" },
  ],
  hasMap: "https://goo.gl/maps/Cbas3yCjPz6feeSPA",
  sameAs: [
    "https://www.facebook.com/profile.php?id=100063556782744",
    "https://www.tiktok.com/@oatengineering",
    "https://www.youtube.com/@kittithat168",
  ],
  makesOffer: [
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "ซ่อมเวสป้าเมืองเลย",
        description: "บริการซ่อมและตรวจเช็ครถ Vespa และ Lambretta โดยช่างโอ๊ต",
      },
    },
    {
      "@type": "Offer",
      itemOffered: {
        "@type": "Product",
        name: "อะไหล่เวสป้าเมืองเลย",
        description: "อะไหล่แท้ OEM สำหรับรถ Vespa และ Lambretta",
      },
    },
  ],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
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
