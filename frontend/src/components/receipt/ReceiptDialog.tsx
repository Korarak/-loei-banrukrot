'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAPER_SIZES, type ReceiptData, type ReceiptMode, type PaperSizeId } from '@/lib/receipt';
import { printReceiptElement, saveReceiptAsImage } from '@/lib/receipt-print';
import ReceiptView from './ReceiptView';

interface ReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: ReceiptData;
    defaultMode?: ReceiptMode;
    defaultPaperSize?: PaperSizeId;
}

const RECEIPT_ELEMENT_ID = 'receipt-content';

export function ReceiptDialog({ open, onOpenChange, data, defaultMode = 'compact', defaultPaperSize = 'thermal80' }: ReceiptDialogProps) {
    const [mode, setMode] = useState<ReceiptMode>(defaultMode);
    const [paperSize, setPaperSize] = useState<PaperSizeId>(defaultPaperSize);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-white">
                <DialogTitle className="sr-only">ใบเสร็จรับเงิน #{data.reference}</DialogTitle>

                <div className="max-h-[70vh] overflow-y-auto">
                    <ReceiptView data={data} mode={mode} id={RECEIPT_ELEMENT_ID} />
                </div>

                <div className="p-4 bg-gray-50 border-t space-y-2">
                    {/* Mode toggle */}
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setMode('compact')}
                            className={cn(
                                'flex-1 rounded-lg border text-center px-2.5 py-1.5 text-xs font-bold transition-colors',
                                mode === 'compact' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                            )}
                        >
                            ย่อ
                        </button>
                        <button
                            onClick={() => setMode('full')}
                            className={cn(
                                'flex-1 rounded-lg border text-center px-2.5 py-1.5 text-xs font-bold transition-colors',
                                mode === 'full' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                            )}
                        >
                            เต็มรูปแบบ
                        </button>
                    </div>

                    {/* Paper size toggle */}
                    <div className="flex gap-1.5">
                        {PAPER_SIZES.map((size) => (
                            <button
                                key={size.id}
                                onClick={() => setPaperSize(size.id)}
                                className={cn(
                                    'flex-1 rounded-lg border text-center px-2.5 py-1.5 text-xs font-bold transition-colors',
                                    paperSize === size.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                                )}
                            >
                                {size.label}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            className="flex-1 h-11 gap-2 font-bold"
                            onClick={() => printReceiptElement(RECEIPT_ELEMENT_ID, paperSize)}
                        >
                            <Printer className="h-4 w-4" />
                            พิมพ์ใบเสร็จ
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-11 gap-2 font-bold"
                            onClick={() => saveReceiptAsImage(RECEIPT_ELEMENT_ID, `receipt-${data.reference}.png`)}
                        >
                            <ImageIcon className="h-4 w-4" />
                            บันทึกรูปภาพ
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0"
                            onClick={() => onOpenChange(false)}
                            aria-label="ปิด"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
