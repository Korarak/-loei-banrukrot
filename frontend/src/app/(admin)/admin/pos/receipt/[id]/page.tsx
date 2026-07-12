'use client';

import { useSaleReceipt } from '@/hooks/usePOS';
import { usePublicSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Receipt, Printer, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import ReceiptView from '@/components/receipt/ReceiptView';
import { PAPER_SIZES, posSaleToReceiptData, type ReceiptMode, type PaperSizeId } from '@/lib/receipt';
import { printReceiptElement, saveReceiptAsImage } from '@/lib/receipt-print';

const RECEIPT_ELEMENT_ID = 'receipt-content';

export default function ReceiptPage() {
    const params = useParams();
    const id = params.id as string;
    const { data: sale, isLoading } = useSaleReceipt(id);
    const { data: settings } = usePublicSettings();
    const [mode, setMode] = useState<ReceiptMode>('full');
    const [paperSize, setPaperSize] = useState<PaperSizeId>('a4');

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
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" asChild className="hover:text-primary hover:bg-primary/10">
                    <Link href="/admin/pos/history">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        ย้อนกลับ
                    </Link>
                </Button>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => setMode('compact')}
                        className={cn(
                            'rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors',
                            mode === 'compact' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                        )}
                    >
                        ย่อ
                    </button>
                    <button
                        onClick={() => setMode('full')}
                        className={cn(
                            'rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors',
                            mode === 'full' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                        )}
                    >
                        เต็มรูปแบบ
                    </button>
                </div>
            </div>

            {/* Paper size + action bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex gap-1.5">
                    {PAPER_SIZES.map((size) => (
                        <button
                            key={size.id}
                            onClick={() => setPaperSize(size.id)}
                            className={cn(
                                'rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors',
                                paperSize === size.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                            )}
                        >
                            {size.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => saveReceiptAsImage(RECEIPT_ELEMENT_ID, `receipt-${sale.saleReference}.png`)}
                        className="gap-2"
                    >
                        <ImageIcon className="h-4 w-4" />
                        บันทึกรูปภาพ
                    </Button>
                    <Button
                        onClick={() => printReceiptElement(RECEIPT_ELEMENT_ID, paperSize)}
                        className="bg-primary hover:bg-primary/90 text-white shadow-md gap-2"
                    >
                        <Printer className="h-4 w-4" />
                        พิมพ์ใบเสร็จ
                    </Button>
                </div>
            </div>

            {/* Receipt */}
            <Card className="p-0 shadow-xl overflow-hidden">
                <ReceiptView data={posSaleToReceiptData(sale, settings)} mode={mode} id={RECEIPT_ELEMENT_ID} />
            </Card>
        </div>
    );
}
