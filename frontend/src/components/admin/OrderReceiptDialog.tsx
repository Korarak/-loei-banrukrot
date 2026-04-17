'use client';

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package, Printer, X } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Order } from '@/hooks/useOrders';

interface OrderReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order;
}

export function OrderReceiptDialog({ open, onOpenChange, order }: OrderReceiptDialogProps) {
    const isPOS = order.source === 'pos';
    const payment = order.payments?.[0];
    const cashReceived = payment?.amountPaid ?? 0;
    const change = isPOS ? Math.max(0, cashReceived - order.totalAmount) : 0;

    const addr = order.shippingAddressId;
    const fullAddress = addr
        ? [addr.streetAddress, addr.subDistrict, addr.district, addr.province, addr.zipCode]
              .filter(Boolean)
              .join(' ')
        : (order.shippingAddress || '');

    const paymentLabel =
        payment?.paymentMethod === 'Cash' ? 'เงินสด' :
        payment?.paymentMethod === 'PromptPay' ? 'พร้อมเพย์' :
        payment?.paymentMethod || 'โอนผ่านบัญชี';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden bg-white">
                <DialogTitle className="sr-only">ใบเสร็จรับเงิน</DialogTitle>
                <div className="max-h-[85vh] overflow-y-auto">
                    <div id="receipt-content" className="bg-white p-8 text-sm font-mono leading-relaxed">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3">
                                <Package className="h-6 w-6" />
                            </div>
                            <h2 className="font-bold text-xl uppercase tracking-wider mb-1">
                                {siteConfig.brand.name}
                            </h2>
                            <p className="text-gray-500 text-xs">สาขาเลย</p>
                            <div className="my-4 border-b border-dashed border-gray-300" />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>
                                    วันที่: {new Date(order.createdAt).toLocaleDateString('th-TH', {
                                        day: '2-digit', month: '2-digit', year: 'numeric'
                                    })}
                                </span>
                                <span>
                                    เวลา: {new Date(order.createdAt).toLocaleTimeString('th-TH', {
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">อ้างอิง: {order.orderReference}</p>
                            <div className="mt-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isPOS
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {isPOS ? 'หน้าร้าน (POS)' : 'ออนไลน์'}
                                </span>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="border-t border-b border-dashed border-gray-300 py-4 space-y-3 mb-6">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-start">
                                    <div className="flex-1 pr-4">
                                        <div className="font-medium leading-snug">{item.productName}</div>
                                        <div className="text-xs text-gray-500">
                                            x{item.quantity} @ ฿{item.price.toLocaleString()}
                                        </div>
                                    </div>
                                    <span className="font-medium shrink-0">
                                        ฿{(item.price * item.quantity).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between font-bold text-lg border-b-2 border-black pb-2 mb-2">
                                <span>ยอดรวม</span>
                                <span>฿{order.totalAmount.toLocaleString()}</span>
                            </div>

                            {isPOS ? (
                                <>
                                    <div className="flex justify-between text-gray-600">
                                        <span>รับเงินสด</span>
                                        <span>฿{cashReceived.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>เงินทอน</span>
                                        <span>฿{change.toLocaleString()}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between text-gray-600">
                                        <span>วิธีชำระ</span>
                                        <span>{paymentLabel}</span>
                                    </div>
                                    {payment?.isVerified && (
                                        <div className="flex justify-between text-xs text-green-600">
                                            <span>สถานะ</span>
                                            <span>ยืนยันแล้ว</span>
                                        </div>
                                    )}
                                    {order.shippingInfo?.cost ? (
                                        <div className="flex justify-between text-gray-600">
                                            <span>ค่าจัดส่ง</span>
                                            <span>฿{order.shippingInfo.cost.toLocaleString()}</span>
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>

                        {/* Customer & shipping info (online only) */}
                        {!isPOS && (
                            <div className="border-t border-dashed border-gray-300 pt-4 mb-6 space-y-1.5 text-xs">
                                {order.customer && (
                                    <div className="flex gap-1">
                                        <span className="text-gray-500 shrink-0">ชื่อ:</span>
                                        <span className="font-medium">
                                            {order.customer.firstName} {order.customer.lastName}
                                        </span>
                                    </div>
                                )}
                                {order.customer?.phone && (
                                    <div className="flex gap-1">
                                        <span className="text-gray-500 shrink-0">โทร:</span>
                                        <span>{order.customer.phone}</span>
                                    </div>
                                )}
                                {fullAddress && (
                                    <div className="flex gap-1">
                                        <span className="text-gray-500 shrink-0">ที่อยู่:</span>
                                        <span className="leading-snug">{fullAddress}</span>
                                    </div>
                                )}
                                {order.shippingInfo?.trackingNumber && (
                                    <div className="flex gap-1 pt-1">
                                        <span className="text-gray-500 shrink-0">Tracking:</span>
                                        <span className="font-mono break-all">
                                            {order.shippingInfo.trackingNumber}
                                            {order.shippingInfo.provider ? ` (${order.shippingInfo.provider})` : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
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
                    <Button className="w-full h-12 text-lg font-bold" onClick={() => window.print()}>
                        <Printer className="mr-2 h-5 w-5" />
                        พิมพ์ใบเสร็จ
                    </Button>
                    <Button variant="outline" className="w-full h-12" onClick={() => onOpenChange(false)}>
                        <X className="mr-2 h-4 w-4" />
                        ปิด
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
