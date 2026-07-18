'use client';

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer, X, MapPin, Store, Package } from 'lucide-react';
import { Order } from '@/hooks/useOrders';
import { usePublicSettings } from '@/hooks/useSettings';
import { getCourier } from '@/lib/couriers';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/config/site';
import { useMemo, useState } from 'react';
import QRCode from 'qrcode';

interface ShippingLabelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order;
}

// Prefix on the scannable QR payload so the packing-scan flow can tell a
// shipping-label QR apart from an unrelated barcode (SKU, courier tracking, ...).
export const ORDER_SCAN_PREFIX = 'ORDER:';

// Real, machine-scannable QR code rendered as SVG rects from QRCode.create()'s
// module matrix. QRCode.create() is synchronous (unlike toDataURL/toCanvas),
// so the QR is present in the DOM on the same render as everything else —
// handlePrint's synchronous outerHTML clone can never race a still-loading QR.
function QRCodeSVG({ value, size = 86 }: { value: string; size?: number }) {
    const { modules, moduleCount } = useMemo(() => {
        const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
        return { modules: qr.modules.data, moduleCount: qr.modules.size };
    }, [value]);

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${moduleCount} ${moduleCount}`}
            xmlns="http://www.w3.org/2000/svg"
            style={{ imageRendering: 'pixelated', display: 'block' }}
        >
            <rect width={moduleCount} height={moduleCount} fill="white" />
            {Array.from(modules).map((dark, i) => dark ? (
                <rect key={i} x={i % moduleCount} y={Math.floor(i / moduleCount)} width={1} height={1} fill="#000" />
            ) : null)}
        </svg>
    );
}

// Visual-only pseudo-barcode — not machine-scannable, for print aesthetics
function PseudoBarcode({ value }: { value: string }) {
    if (!value) return null;
    const bars: { w: number; dark: boolean }[] = [{ w: 2, dark: true }, { w: 1, dark: false }];
    for (let ci = 0; ci < value.length; ci++) {
        const c = value.charCodeAt(ci);
        for (let bi = 0; bi < 5; bi++) {
            bars.push({ w: (c >> bi) & 1 ? 3 : 1, dark: bi % 2 === 0 });
        }
        bars.push({ w: 1, dark: false });
    }
    bars.push({ w: 2, dark: true });
    return (
        <div className="flex items-stretch h-10 overflow-hidden w-full">
            {bars.map((bar, i) => (
                <div
                    key={i}
                    className={cn('shrink-0', bar.dark ? 'bg-gray-900' : 'bg-white')}
                    style={{ width: `${bar.w}px` }}
                />
            ))}
        </div>
    );
}

const COURIER_STYLES: Record<string, { bg: string; text: string }> = {
    'Flash Express':  { bg: '#ea580c', text: '#ffffff' },
    'Kerry Express':  { bg: '#dc2626', text: '#ffffff' },
    'J&T Express':    { bg: '#991b1b', text: '#ffffff' },
    'Thailand Post':  { bg: '#7c3aed', text: '#ffffff' },
    'Ninja Van':      { bg: '#111827', text: '#ffffff' },
    'KEX Express':    { bg: '#15803d', text: '#ffffff' },
    'SPX Express':    { bg: '#f97316', text: '#ffffff' },
    'DHL':            { bg: '#d97706', text: '#111827' },
    'Other':          { bg: '#374151', text: '#ffffff' },
};

// Print sizes for Thai shipping labels
const PRINT_SIZES = [
    {
        id: 'thermal',
        label: 'Thermal 4"×6"',
        desc: 'Xprinter, TSC, Zebra',
        pageSize: '101.6mm 152.4mm',
        labelWidth: '95mm',
        margin: '3mm',
    },
    {
        id: 'a6',
        label: 'A6 (105×148mm)',
        desc: 'ตัดจาก A4',
        pageSize: '105mm 148mm',
        labelWidth: '99mm',
        margin: '3mm',
    },
    {
        id: 'a4',
        label: 'A4 (กึ่งกลาง)',
        desc: 'เครื่องพิมพ์ทั่วไป',
        pageSize: 'A4',
        labelWidth: '100mm',
        margin: '40mm auto',
    },
    {
        id: 'thermal-landscape',
        label: 'Thermal 6"×4" (แนวนอน)',
        desc: 'ตัวใหญ่ กระชับพื้นที่',
        pageSize: '152.4mm 101.6mm',
        labelWidth: '146mm',
        margin: '3mm',
    },
] as const;

type PrintSizeId = typeof PRINT_SIZES[number]['id'];

export function ShippingLabelDialog({ open, onOpenChange, order }: ShippingLabelDialogProps) {
    const { data: settings } = usePublicSettings();
    const [sizeId, setSizeId] = useState<PrintSizeId>('thermal');
    const [showBarcode, setShowBarcode] = useState(true);
    const [showQR, setShowQR] = useState(true);

    const addr = order.shippingAddressId;
    const storeName = settings?.store_name || siteConfig.brand.name;
    const storePhone = settings?.store_phone || '';
    const storeAddress = settings?.store_address || '';
    const courier = getCourier(order.shippingInfo?.provider || '');
    const trackingNumber = order.shippingInfo?.trackingNumber;
    // The QR always encodes the order id (stable target for the packing-scan
    // flow); the caption underneath stays human-readable.
    const qrValue = `${ORDER_SCAN_PREFIX}${order._id}`;
    const qrCaption = trackingNumber || order.orderReference;
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const courierStyle = order.shippingInfo?.provider
        ? (COURIER_STYLES[order.shippingInfo.provider] || COURIER_STYLES['Other'])
        : COURIER_STYLES['Other'];

    const dateStr = new Date(order.createdAt).toLocaleDateString('th-TH', {
        day: 'numeric', month: 'short', year: '2-digit',
    });

    const selectedSize = PRINT_SIZES.find(s => s.id === sizeId)!;
    const isLandscape = sizeId === 'thermal-landscape';

    const handlePrint = () => {
        const el = document.getElementById('shipping-label-print');
        if (!el) return;

        const win = window.open('', '_blank');
        if (!win) { window.print(); return; }

        const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .map(l => `<link rel="stylesheet" href="${(l as HTMLLinkElement).href}">`)
            .join('\n');

        win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${styleLinks}
<style>
@page { size: ${selectedSize.pageSize}; margin: 0; }
body { margin: 0; padding: 0; background: white; }
* { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
</style>
</head>
<body>${el.outerHTML}</body>
</html>`);
        win.document.close();
        win.onafterprint = () => win.close();
        setTimeout(() => win.print(), 600);
    };

    return (
        <>

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className={cn(
                    'p-0 flex flex-col max-h-[90vh] transition-[max-width] duration-200',
                    isLandscape ? 'sm:max-w-[640px]' : 'sm:max-w-[420px]'
                )}>
                    <DialogTitle className="sr-only">
                        สติ้กเกอร์จัดส่ง #{order.orderReference}
                    </DialogTitle>

                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {/* ─── Printable label area ─── */}
                        <div id="shipping-label-print" className="bg-white">
                            {isLandscape ? (
                                <>
                                    {/* Courier header strip */}
                                    <div
                                        className="px-4 py-1.5 flex items-center justify-between border-b"
                                        style={{ borderColor: courierStyle.bg, color: courierStyle.bg }}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Package className="h-4 w-4 shrink-0" />
                                            <span className="font-bold text-sm tracking-wide uppercase leading-none">
                                                {courier?.label || order.shippingInfo?.provider || 'จัดส่งสินค้า'}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0 text-gray-500">
                                            <span className="font-mono text-xs">#{order.orderReference}</span>
                                            <span className="text-xs ml-2">{dateStr}</span>
                                        </div>
                                    </div>

                                    {/* Main row: recipient | QR | sender — side-by-side to save vertical space */}
                                    <div className="border-x border-b border-gray-200 px-4 py-3 flex gap-4">
                                        {/* Recipient */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-400 flex items-center gap-1 mb-1.5">
                                                <MapPin className="h-4 w-4 shrink-0" /> ผู้รับ
                                            </p>
                                            {addr ? (
                                                <div className="space-y-1">
                                                    <p className="font-black text-3xl leading-tight text-gray-900">
                                                        {addr.recipientName}
                                                    </p>
                                                    <p className="text-lg text-gray-700 leading-snug">
                                                        {addr.streetAddress}
                                                    </p>
                                                    {(addr.subDistrict || addr.district || addr.province) && (
                                                        <p className="text-lg text-gray-700">
                                                            {[addr.subDistrict, addr.district, addr.province]
                                                                .filter(Boolean).join(' ')}
                                                        </p>
                                                    )}
                                                    {addr.zipCode && (
                                                        <p className="font-black text-4xl text-gray-900 mt-1 tracking-widest">
                                                            {addr.zipCode}
                                                        </p>
                                                    )}
                                                    {(addr.phone || order.customer?.phone) && (
                                                        <p className="text-lg font-semibold text-gray-700 mt-1">
                                                            ☎ {addr.phone || order.customer?.phone}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <p className="font-black text-3xl leading-tight text-gray-900">
                                                        {order.customer?.firstName} {order.customer?.lastName}
                                                    </p>
                                                    {order.customer?.phone && (
                                                        <p className="text-lg font-semibold text-gray-700 mt-1">
                                                            ☎ {order.customer.phone}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-amber-600 mt-1">
                                                        ไม่พบที่อยู่จัดส่งในระบบ
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* QR code */}
                                        {showQR && (
                                            <div className="flex flex-col items-center justify-center shrink-0">
                                                <div className="p-2 border-2 border-gray-200 rounded-xl overflow-hidden">
                                                    <QRCodeSVG value={qrValue} size={120} />
                                                </div>
                                                <p className="text-[9px] text-gray-400 mt-1.5 font-mono text-center max-w-[120px] break-all leading-tight">
                                                    {qrCaption}
                                                </p>
                                            </div>
                                        )}

                                        {/* Divider */}
                                        <div className="border-l border-dashed border-gray-300 self-stretch" />

                                        {/* Sender + totals — address intentionally omitted here (store
                                            name/phone is enough to identify the sender; the address line
                                            just ate space this compact layout doesn't have) */}
                                        <div className="w-[140px] shrink-0 flex flex-col justify-center gap-2">
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-400 flex items-center gap-1 mb-1">
                                                    <Store className="h-4 w-4 shrink-0" /> ผู้ส่ง
                                                </p>
                                                <p className="font-black text-xl leading-tight text-gray-900">{storeName}</p>
                                                {storePhone && (
                                                    <p className="text-base font-semibold text-gray-700 mt-0.5">โทร: {storePhone}</p>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 font-semibold">
                                                {totalItems} ชิ้น • {order.items.length} รายการ
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tracking barcode — full-width, compact height */}
                                    {trackingNumber && showBarcode && (
                                        <div className="border-x border-b border-gray-200 px-4 py-2 flex items-center gap-4">
                                            <div className="flex-1">
                                                <PseudoBarcode value={trackingNumber} />
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-mono font-black text-xl tracking-[0.2em] text-gray-900">
                                                    {trackingNumber}
                                                </p>
                                                {courier && (
                                                    <p className="text-xs text-gray-500">{courier.label}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Items — 2-column grid, bigger text, tight rows */}
                                    <div className="border-x border-b border-gray-200 px-4 py-2">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm text-gray-700">
                                                    <span className="truncate pr-2">{item.productName}</span>
                                                    <span className="text-gray-500 shrink-0 font-medium">× {item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {!order.shippingAddressId && order.source === 'online' && (
                                            <p className="mt-1 text-xs text-amber-600">
                                                ยังไม่มีที่อยู่จัดส่งในระบบ
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Courier header strip */}
                                    <div
                                        className="px-4 py-2 flex items-center justify-between border-b"
                                        style={{ borderColor: courierStyle.bg, color: courierStyle.bg }}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Package className="h-3.5 w-3.5 shrink-0" />
                                            <span className="font-bold text-xs tracking-wide uppercase leading-none">
                                                {courier?.label || order.shippingInfo?.provider || 'จัดส่งสินค้า'}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0 text-gray-500">
                                            <span className="font-mono text-[10px]">#{order.orderReference}</span>
                                            <span className="text-[10px] ml-2">{dateStr}</span>
                                        </div>
                                    </div>

                                    {/* Label body */}
                                    <div className="border-x border-b border-gray-200 p-4 space-y-4">

                                        {/* ── Recipient + QR code ── */}
                                        <div className="flex gap-3 items-start">
                                            {/* Address block */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 flex items-center gap-1 mb-2">
                                                    <MapPin className="h-3 w-3 shrink-0" /> ผู้รับ
                                                </p>

                                                {addr ? (
                                                    <div className="space-y-0.5">
                                                        <p className="font-black text-[1.35rem] leading-snug text-gray-900">
                                                            {addr.recipientName}
                                                        </p>
                                                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                                            {addr.streetAddress}
                                                        </p>
                                                        {(addr.subDistrict || addr.district || addr.province) && (
                                                            <p className="text-sm text-gray-700">
                                                                {[addr.subDistrict, addr.district, addr.province]
                                                                    .filter(Boolean).join(' ')}
                                                            </p>
                                                        )}
                                                        {addr.zipCode && (
                                                            <p className="font-black text-2xl text-gray-900 mt-1.5 tracking-widest">
                                                                {addr.zipCode}
                                                            </p>
                                                        )}
                                                        {(addr.phone || order.customer?.phone) && (
                                                            <p className="text-sm font-semibold text-gray-700 mt-1">
                                                                ☎ {addr.phone || order.customer?.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-0.5">
                                                        <p className="font-black text-[1.35rem] leading-snug text-gray-900">
                                                            {order.customer?.firstName} {order.customer?.lastName}
                                                        </p>
                                                        {order.customer?.phone && (
                                                            <p className="text-sm font-semibold text-gray-700 mt-1">
                                                                ☎ {order.customer.phone}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-amber-600 mt-1">
                                                            ไม่พบที่อยู่จัดส่งในระบบ
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* QR code */}
                                            {showQR && (
                                                <div className="flex flex-col items-center shrink-0">
                                                    <div className="p-1.5 border-2 border-gray-200 rounded-xl overflow-hidden">
                                                        <QRCodeSVG value={qrValue} size={86} />
                                                    </div>
                                                    <p className="text-[8px] text-gray-400 mt-1.5 font-mono text-center max-w-[94px] break-all leading-tight">
                                                        {qrCaption}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* ── Dashed divider ── */}
                                        <div className="border-t border-dashed border-gray-300" />

                                        {/* ── Sender + order totals ── */}
                                        <div className="flex items-end justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 flex items-center gap-1 mb-1.5">
                                                    <Store className="h-3 w-3 shrink-0" /> ผู้ส่ง
                                                </p>
                                                <p className="font-bold text-sm text-gray-900">{storeName}</p>
                                                {storePhone && (
                                                    <p className="text-xs text-gray-600">โทร: {storePhone}</p>
                                                )}
                                                {storeAddress && (
                                                    <p className="text-xs text-gray-500">{storeAddress}</p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs text-gray-500">{totalItems} ชิ้น</p>
                                            </div>
                                        </div>

                                        {/* ── Tracking barcode (only when tracking number exists and enabled) ── */}
                                        {trackingNumber && showBarcode && (
                                            <>
                                                <div className="border-t-2 border-gray-800 pt-3">
                                                    <PseudoBarcode value={trackingNumber} />
                                                    <div className="text-center mt-2">
                                                        <p className="font-mono font-black text-base tracking-[0.22em] text-gray-900">
                                                            {trackingNumber}
                                                        </p>
                                                        {courier && (
                                                            <p className="text-xs text-gray-500 mt-0.5">{courier.label}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* ── Items list ── */}
                                    <div className="border-x border-b border-gray-200 px-4 pt-3 pb-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">
                                            รายการสินค้า ({order.items.length} รายการ)
                                        </p>
                                        <div className="space-y-1">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-xs text-gray-700">
                                                    <span className="truncate pr-3">{item.productName}</span>
                                                    <span className="text-gray-500 shrink-0 font-medium">× {item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {!order.shippingAddressId && order.source === 'online' && (
                                            <p className="mt-2 text-xs text-amber-600">
                                                ยังไม่มีที่อยู่จัดส่งในระบบ
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action bar */}
                    <div className="px-4 pt-3 pb-4 bg-gray-50 border-t space-y-2">
                        {/* Paper size selector */}
                        <div className="flex gap-1.5">
                            {PRINT_SIZES.map((size) => (
                                <button
                                    key={size.id}
                                    onClick={() => setSizeId(size.id)}
                                    className={cn(
                                        'flex-1 rounded-lg border text-left px-2.5 py-1.5 transition-colors',
                                        sizeId === size.id
                                            ? 'border-gray-900 bg-gray-900 text-white'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                                    )}
                                >
                                    <p className="text-[11px] font-bold leading-tight">{size.label}</p>
                                    <p className={cn('text-[10px] leading-tight mt-0.5', sizeId === size.id ? 'text-gray-300' : 'text-gray-400')}>
                                        {size.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                        {/* Show/hide toggles — applies across every paper size, for
                            squeezing the print area as compact as possible */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="show-qr"
                                    checked={showQR}
                                    onCheckedChange={(v) => setShowQR(v === true)}
                                />
                                <label htmlFor="show-qr" className="text-xs font-semibold text-gray-600 cursor-pointer select-none">
                                    แสดง QR Code
                                </label>
                            </div>
                            {trackingNumber && (
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="show-barcode"
                                        checked={showBarcode}
                                        onCheckedChange={(v) => setShowBarcode(v === true)}
                                    />
                                    <label htmlFor="show-barcode" className="text-xs font-semibold text-gray-600 cursor-pointer select-none">
                                        แสดงบาร์โค้ดเลขพัสดุ
                                    </label>
                                </div>
                            )}
                        </div>
                        {/* Print + close */}
                        <div className="flex gap-2">
                            <Button
                                className="flex-1 h-11 gap-2 font-bold"
                                onClick={handlePrint}
                            >
                                <Printer className="h-4 w-4" />
                                พิมพ์สติ้กเกอร์
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
        </>
    );
}
