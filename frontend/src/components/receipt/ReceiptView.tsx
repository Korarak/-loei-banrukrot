'use client';

import { Package, Receipt as ReceiptIcon } from 'lucide-react';
import { getPaymentMethodLabel, type ReceiptData, type ReceiptMode } from '@/lib/receipt';

interface ReceiptViewProps {
    data: ReceiptData;
    mode: ReceiptMode;
    id?: string;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export default function ReceiptView({ data, mode, id = 'receipt-content' }: ReceiptViewProps) {
    if (mode === 'full') return <ReceiptFull data={data} id={id} />;
    return <ReceiptCompact data={data} id={id} />;
}

// ─── Compact (thermal-friendly) ──────────────────────────────────────────────
function ReceiptCompact({ data, id }: { data: ReceiptData; id: string }) {
    const isPOS = data.source === 'pos';
    const hasCustomerInfo = !isPOS && (data.customerName || data.customerPhone || data.shippingAddress || data.trackingNumber);

    return (
        <div id={id} className="bg-white p-8 text-sm font-mono leading-relaxed">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package className="h-6 w-6" />
                </div>
                <h2 className="font-bold text-xl uppercase tracking-wider mb-1">{data.store.name}</h2>
                {(data.store.address || data.store.phone) && (
                    <p className="text-gray-500 text-xs">{[data.store.address, data.store.phone].filter(Boolean).join(' · ')}</p>
                )}
                {data.store.taxId && (
                    <p className="text-gray-500 text-xs">เลขผู้เสียภาษี: {data.store.taxId}</p>
                )}
                <div className="my-4 border-b border-dashed border-gray-300" />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>วันที่: {formatDate(data.createdAt)}</span>
                    <span>เวลา: {formatTime(data.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">อ้างอิง: {data.reference}</p>
                <div className="mt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPOS ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isPOS ? 'หน้าร้าน (POS)' : 'ออนไลน์'}
                    </span>
                </div>
            </div>

            {/* Items */}
            <div className="border-t border-b border-dashed border-gray-300 py-4 space-y-3 mb-6">
                {data.items.length === 0 ? (
                    <p className="text-center text-gray-400 italic py-2">ไม่มีรายการสินค้า</p>
                ) : (
                    data.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start">
                            <div className="flex-1 pr-4">
                                <div className="font-medium leading-snug">{item.name}</div>
                                <div className="text-xs text-gray-500">x{item.quantity} @ ฿{item.price.toLocaleString()}</div>
                            </div>
                            <span className="font-medium shrink-0">฿{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Totals */}
            <div className="space-y-2 mb-6">
                <div className="flex justify-between font-bold text-lg border-b-2 border-black pb-2 mb-2">
                    <span>ยอดรวม</span>
                    <span>฿{data.totalAmount.toLocaleString()}</span>
                </div>

                {data.cashReceived != null ? (
                    <>
                        <div className="flex justify-between text-gray-600">
                            <span>รับเงินสด</span>
                            <span>฿{data.cashReceived.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>เงินทอน</span>
                            <span>฿{(data.change ?? 0).toLocaleString()}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between text-gray-600">
                            <span>วิธีชำระ</span>
                            <span>{getPaymentMethodLabel(data.paymentMethod)}</span>
                        </div>
                        {data.isVerified && (
                            <div className="flex justify-between text-xs text-green-600">
                                <span>สถานะ</span>
                                <span>ยืนยันแล้ว</span>
                            </div>
                        )}
                        {!!data.shippingCost && (
                            <div className="flex justify-between text-gray-600">
                                <span>ค่าจัดส่ง</span>
                                <span>฿{data.shippingCost.toLocaleString()}</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Customer & shipping info (online only) */}
            {hasCustomerInfo && (
                <div className="border-t border-dashed border-gray-300 pt-4 mb-6 space-y-1.5 text-xs">
                    {data.customerName && (
                        <div className="flex gap-1">
                            <span className="text-gray-500 shrink-0">ชื่อ:</span>
                            <span className="font-medium">{data.customerName}</span>
                        </div>
                    )}
                    {data.customerPhone && (
                        <div className="flex gap-1">
                            <span className="text-gray-500 shrink-0">โทร:</span>
                            <span>{data.customerPhone}</span>
                        </div>
                    )}
                    {data.shippingAddress && (
                        <div className="flex gap-1">
                            <span className="text-gray-500 shrink-0">ที่อยู่:</span>
                            <span className="leading-snug">{data.shippingAddress}</span>
                        </div>
                    )}
                    {data.trackingNumber && (
                        <div className="flex gap-1 pt-1">
                            <span className="text-gray-500 shrink-0">Tracking:</span>
                            <span className="font-mono break-all">
                                {data.trackingNumber}{data.trackingProvider ? ` (${data.trackingProvider})` : ''}
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
                    <p>www.banrukrot.com</p>
                </div>
            </div>
        </div>
    );
}

// ─── Full (A4-friendly formal receipt) ───────────────────────────────────────
function ReceiptFull({ data, id }: { data: ReceiptData; id: string }) {
    const isPOS = data.source === 'pos';
    const hasCustomerInfo = !isPOS && (data.customerName || data.customerPhone || data.shippingAddress || data.trackingNumber);

    return (
        <div id={id} className="bg-white p-8 relative overflow-hidden border-t-8 border-t-primary">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <ReceiptIcon className="h-64 w-64 rotate-12" />
            </div>

            {/* Store header */}
            <div className="text-center space-y-1.5 mb-8 relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                    <ReceiptIcon className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{data.store.name}</h1>
                {data.store.address && <p className="text-sm text-gray-500">{data.store.address}</p>}
                {data.store.phone && <p className="text-sm text-gray-500">โทร: {data.store.phone}</p>}
                {data.store.taxId && <p className="text-sm text-gray-500">เลขประจำตัวผู้เสียภาษี: {data.store.taxId}</p>}
            </div>

            <div className="border-b-2 border-dashed border-gray-100 my-6" />

            {/* Sale info */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-6 relative z-10">
                <div>
                    <p className="text-gray-500">เลขที่ใบเสร็จ</p>
                    <p className="font-mono font-bold text-gray-800">#{data.reference}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500">วันที่</p>
                    <p className="font-semibold text-gray-800">{formatDate(data.createdAt)} {formatTime(data.createdAt)}</p>
                </div>
                {data.cashierName && (
                    <div>
                        <p className="text-gray-500">พนักงานขาย</p>
                        <p className="font-semibold text-gray-800">{data.cashierName}</p>
                    </div>
                )}
                <div className={data.cashierName ? 'text-right' : 'text-right col-start-2'}>
                    <p className="text-gray-500">การชำระเงิน</p>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-secondary text-primary-foreground text-xs font-bold border border-secondary">
                        {getPaymentMethodLabel(data.paymentMethod)}
                    </span>
                </div>
            </div>

            {/* Items table */}
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
                        {data.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-3 pr-2">
                                    <p className="font-medium text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-400 font-mono">@{item.price.toLocaleString()}</p>
                                </td>
                                <td className="py-3 text-center text-gray-600">x{item.quantity}</td>
                                <td className="py-3 text-right font-medium text-gray-800">
                                    {(item.price * item.quantity).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.items.length === 0 && (
                    <p className="text-center text-gray-400 italic py-4">ไม่มีรายการสินค้า</p>
                )}
            </div>

            <div className="border-t-2 border-dashed border-gray-100 mb-6" />

            {/* Totals */}
            <div className="space-y-2 relative z-10">
                <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-800">ยอดรวมสุทธิ (Total)</span>
                    <span className="text-primary text-2xl">฿{data.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {!!data.shippingCost && (
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>ค่าจัดส่ง</span>
                        <span>฿{data.shippingCost.toLocaleString()}</span>
                    </div>
                )}
                {data.cashReceived != null && (
                    <>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>รับเงินสด</span>
                            <span>฿{data.cashReceived.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>เงินทอน</span>
                            <span>฿{(data.change ?? 0).toLocaleString()}</span>
                        </div>
                    </>
                )}
                {data.store.taxId && (
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                        <span>รวมในราคาขายแล้ว</span>
                    </div>
                )}
            </div>

            {/* Customer & shipping info (online only) */}
            {hasCustomerInfo && (
                <div className="border-t border-dashed border-gray-100 mt-6 pt-4 space-y-1.5 text-sm relative z-10">
                    {data.customerName && (
                        <div className="flex gap-2">
                            <span className="text-gray-500 shrink-0">ลูกค้า:</span>
                            <span className="font-medium text-gray-800">{data.customerName}</span>
                        </div>
                    )}
                    {data.customerPhone && (
                        <div className="flex gap-2">
                            <span className="text-gray-500 shrink-0">โทร:</span>
                            <span className="text-gray-800">{data.customerPhone}</span>
                        </div>
                    )}
                    {data.shippingAddress && (
                        <div className="flex gap-2">
                            <span className="text-gray-500 shrink-0">ที่อยู่จัดส่ง:</span>
                            <span className="text-gray-800 leading-snug">{data.shippingAddress}</span>
                        </div>
                    )}
                    {data.trackingNumber && (
                        <div className="flex gap-2">
                            <span className="text-gray-500 shrink-0">Tracking:</span>
                            <span className="font-mono text-gray-800 break-all">
                                {data.trackingNumber}{data.trackingProvider ? ` (${data.trackingProvider})` : ''}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="mt-10 text-center space-y-1 pt-6 border-t border-gray-100 relative z-10">
                <p className="text-primary font-bold text-sm">ขอบคุณที่ใช้บริการ</p>
                <p className="text-xs text-gray-400">Thank you for shopping with us</p>
                <p className="text-[10px] text-gray-300 font-mono mt-4">www.banrukrot.com</p>
            </div>
        </div>
    );
}
