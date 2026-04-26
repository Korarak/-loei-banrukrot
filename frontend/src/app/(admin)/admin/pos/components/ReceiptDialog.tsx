'use client';

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Package, Printer, RefreshCcw } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { usePublicSettings } from '@/hooks/useSettings';

interface ReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    receiptData: any | null;
    onPrint: () => void;
    onNewSale: () => void;
}

export function ReceiptDialog({ open, onOpenChange, receiptData, onPrint, onNewSale }: ReceiptDialogProps) {
    const { data: settings } = usePublicSettings();
    if (!receiptData) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden bg-white">
                <DialogTitle className="sr-only">Sale Receipt</DialogTitle>
                <div className="max-h-[80vh] overflow-y-auto">
                    <div id="receipt-content" className="bg-white p-8 text-sm font-mono leading-relaxed">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3">
                                <Package className="h-6 w-6" />
                            </div>
                            <h2 className="font-bold text-xl uppercase tracking-wider mb-1">
                                {settings?.store_name || siteConfig.brand.name}
                            </h2>
                            {(settings?.store_address || settings?.store_phone) && (
                                <p className="text-gray-500 text-xs">
                                    {settings.store_address || settings.store_phone}
                                </p>
                            )}
                            <div className="my-4 border-b border-dashed border-gray-300" />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>วันที่: {receiptData?.date ? new Date(receiptData.date).toLocaleDateString('th-TH') : ''}</span>
                                <span>เวลา: {receiptData?.date ? new Date(receiptData.date).toLocaleTimeString('th-TH') : ''}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">อ้างอิง: {receiptData?.saleReference}</p>
                        </div>

                        <div className="border-t border-b border-dashed border-gray-300 py-4 space-y-3 mb-6">
                            {receiptData?.items.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between items-start">
                                    <div className="flex-1 pr-4">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-gray-500">x{item.quantity} @ ฿{item.price.toLocaleString()}</div>
                                    </div>
                                    <span className="font-medium">฿{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 mb-8">
                            <div className="flex justify-between font-bold text-lg border-b-2 border-black pb-2 mb-2">
                                <span>ยอดรวม</span>
                                <span>฿{receiptData?.total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>รับเงินสด</span>
                                <span>฿{receiptData?.cash.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>เงินทอน</span>
                                <span>฿{receiptData?.change.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="text-center text-xs text-gray-400 space-y-1">
                            <p>ขอบคุณที่ใช้บริการ!</p>
                            <p>โปรดเก็บใบเสร็จนี้ไว้เพื่อการรับประกัน</p>
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                                <p>www.banrakrod.com</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t flex flex-col gap-3">
                    <Button className="w-full h-12 text-lg font-bold" onClick={onPrint}>
                        <Printer className="mr-2 h-5 w-5" />
                        พิมพ์ใบเสร็จ
                    </Button>
                    <Button variant="outline" className="w-full h-12" onClick={onNewSale}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        เริ่มการขายใหม่
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
