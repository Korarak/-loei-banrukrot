import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'อะไหล่เวสป้า Vespa ทั้งหมด',
    description: 'รวมอะไหล่และอุปกรณ์แต่งเวสป้า Vespa คัดสรรคุณภาพ จัดส่งทั่วไทย จากบ้านรักรถเมืองเลย โดยช่างโอ๊ต',
    alternates: { canonical: `${SITE_URL}/products` },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
