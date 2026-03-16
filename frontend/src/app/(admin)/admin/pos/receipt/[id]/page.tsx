'use client';

import { useSaleReceipt } from '@/hooks/usePOS';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Receipt, Printer, ArrowLeft, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRef } from 'react';
import { siteConfig } from '@/config/site';

export default function ReceiptPage() {
    const params = useParams();
    const id = params.id as string;
    const { data: sale, isLoading } = useSaleReceipt(id);
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="container max-w-lg mx-auto py-10 text-center">
                <Card className="p-10 flex flex-col items-center gap-4">
                    <Receipt className="h-16 w-16 text-gray-300" />
                    <h2 className="text-xl font-bold text-gray-700">ไม่พบข้อมูลใบเสร็จ</h2>
                    <p className="text-gray-500">รหัสอ้างอิง: {id}</p>
                    <Button asChild variant="default">
                        <Link href="/admin/pos/history">กลับไปประวัติการขาย</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-xl mx-auto py-10 px-4 space-y-6">
            {/* Header Actions - Hidden when printing */}
            <div className="flex items-center justify-between print:hidden">
                <Button variant="ghost" asChild className="hover:text-primary hover:bg-primary/10">
                    <Link href="/admin/pos/history">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        ย้อนกลับ
                    </Link>
                </Button>
                <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-white shadow-md">
                    <Printer className="h-4 w-4 mr-2" />
                    พิมพ์ใบเสร็จ
                </Button>
            </div>

            {/* Receipt Card */}
            <div ref={componentRef} className="print:shadow-none print:w-full">
                <Card className="p-8 bg-white shadow-xl border-t-8 border-t-primary relative overflow-hidden">
                    {/* Watermark / Decoration */}
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Receipt className="h-64 w-64 rotate-12" />
                    </div>

                    {/* Store Header */}
                    <div className="text-center space-y-2 mb-8 relative z-10">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                            <Receipt className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{siteConfig.brand.name}</h1>
                        <div className="text-sm text-gray-500 space-y-1">
                            <p className="flex items-center justify-center gap-1">
                                <MapPin className="h-3 w-3" />
                                ศูนย์รวมอะไหล่และบริการซ่อมเวสป้าครบวงจร
                            </p>
                            <p className="flex items-center justify-center gap-1">
                                <Phone className="h-3 w-3" />
                                0xx-xxx-xxxx
                            </p>
                        </div>
                    </div>

                    <div className="border-b-2 border-dashed border-gray-100 my-6"></div>

                    {/* Sale Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-6 relative z-10">
                        <div>
                            <p className="text-gray-500">เลขที่ใบเสร็จ</p>
                            <p className="font-mono font-bold text-gray-800">#{sale.saleReference}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500">วันที่</p>
                            <p className="font-semibold text-gray-800">
                                {new Date(sale.createdAt).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500">พนักงานขาย</p>
                            <p className="font-semibold text-gray-800">{sale.createdBy?.username || '-'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500">การชำระเงิน</p>
                            <span className="inline-block px-2 py-0.5 rounded-full bg-secondary text-primary-foreground text-xs font-bold border border-secondary">
                                {sale.paymentMethod}
                            </span>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-6 relative z-10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 text-left">
                                    <th className="py-2 font-medium">รายการ (Item)</th>
                                    <th className="py-2 text-center w-16">จำนวน</th>
                                    <th className="py-2 text-right w-24">รวม (บาท)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(sale.items || []).map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-3 pr-2">
                                            <p className="font-medium text-gray-800">{item.product?.productName || 'สินค้าไม่ระบุ'}</p>
                                            <p className="text-xs text-gray-400 font-mono">@{item.price?.toLocaleString()}</p>
                                        </td>
                                        <td className="py-3 text-center text-gray-600">x{item.quantity}</td>
                                        <td className="py-3 text-right font-medium text-gray-800">
                                            {(item.price * item.quantity).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(!sale.items || sale.items.length === 0) && (
                            <p className="text-center text-gray-400 italic py-4">ไม่มีรายการสินค้า</p>
                        )}
                    </div>

                    <div className="border-t-2 border-dashed border-gray-100 mb-6"></div>

                    {/* Totals */}
                    <div className="space-y-2 relative z-10">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span className="text-gray-800">ยอดรวมสุทธิ (Total)</span>
                            <span className="text-primary text-2xl">฿{sale.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                            <span>รวมในราคาขายแล้ว</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-10 text-center space-y-2 pt-6 border-t border-gray-100 relative z-10">
                        <p className="text-primary font-bold text-sm">ขอบคุณที่ใช้บริการ</p>
                        <p className="text-xs text-gray-400">Thank you for shopping with us</p>
                        <p className="text-[10px] text-gray-300 font-mono mt-4">System powered by {siteConfig.brand.englishName}</p>
                    </div>

                    {/* Print Only Styles */}
                    <style jsx global>{`
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            #receipt-content, #receipt-content * {
                                visibility: visible;
                            }
                            #receipt-content {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                            }
                            .print\\:hidden {
                                display: none !important;
                            }
                            .print\\:shadow-none {
                                box-shadow: none !important;
                                border: none !important;
                            }
                            .print\\:w-full {
                                width: 100% !important;
                                max-width: none !important;
                            }
                        }
                    `}</style>
                </Card>
            </div>
        </div>
    );
}
