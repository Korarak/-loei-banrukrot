import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <h1 className="text-3xl font-black text-gray-900 mb-2">ไม่พบหน้าที่ค้นหา</h1>
            <p className="text-gray-600 mb-8 max-w-md">หน้านี้อาจถูกลบหรือพักขายอยู่ ลองกลับไปดูสินค้าอื่นของเรา</p>
            <Link href="/products" className="rounded-md bg-foreground px-8 py-3 text-sm font-semibold text-background">
                ดูสินค้าทั้งหมด
            </Link>
        </div>
    );
}
