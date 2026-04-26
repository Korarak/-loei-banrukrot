'use client';

import { useOrder, useUpdateOrderStatus, useVerifyPayment } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Package, Truck, Pencil, AlertCircle, Copy, ExternalLink, CheckCircle2, ScanLine, ReceiptText, Printer } from 'lucide-react';
import { OrderReceiptDialog } from '@/components/admin/OrderReceiptDialog';
import { ShippingLabelDialog } from '@/components/admin/ShippingLabelDialog';
import { BarcodeScanner } from '@/components/features/BarcodeScanner';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useShippingMethods } from '@/hooks/useShippingMethods';
import { useState, use, useEffect } from 'react';
import Image from 'next/image';
import { COURIERS, getCourier, getTrackingUrl } from '@/lib/couriers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ImagePreviewDialog from '@/components/features/ImagePreviewDialog';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { getOrderStatusColor } from '@/lib/order-status';

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: order, isLoading } = useOrder(id);
    const { data: shippingMethods } = useShippingMethods();
    const updateStatus = useUpdateOrderStatus();
    const verifyPayment = useVerifyPayment();

    const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [shippingProvider, setShippingProvider] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shippingCost, setShippingCost] = useState('');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [newStatusToApply, setNewStatusToApply] = useState<string | null>(null);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [labelOpen, setLabelOpen] = useState(false);

    const calculateShippingCost = () => {
        if (!order?.items) return 0;
        const hasLargeItem = order.items.some(item => item.shippingSize === 'large');
        return hasLargeItem ? 100 : 50;
    };

    useEffect(() => {
        if (order) {
            setShippingProvider(order.shippingInfo?.provider || '');
            setTrackingNumber(order.shippingInfo?.trackingNumber || '');
            // Use existing cost or calculate based on items
            const calculatedCost = calculateShippingCost();
            setShippingCost(order.shippingInfo?.cost?.toString() || calculatedCost.toString());
        }
    }, [order]);

    const handleUpdateShipping = async () => {
        if (!order) return;
        const trimmed = trackingNumber.trim();
        if (!trimmed) {
            toast.error('กรุณากรอกเลขพัสดุก่อนบันทึก');
            return;
        }
        try {
            // Save shipping info + auto-advance status to shipped in one call
            await updateStatus.mutateAsync({
                id: order._id,
                status: 'shipped',
                shippingInfo: {
                    provider: shippingProvider,
                    trackingNumber: trimmed,
                    cost: parseFloat(shippingCost) || 0,
                }
            });
            setShippingDialogOpen(false);
            const url = getTrackingUrl(shippingProvider, trimmed);
            toast.success('เริ่มการจัดส่งแล้ว', {
                description: `เลขพัสดุ: ${trimmed}`,
                action: url ? {
                    label: 'ติดตามพัสดุ',
                    onClick: () => window.open(url, '_blank'),
                } : undefined,
                duration: 6000,
            });
        } catch (error) {
            // Error handled by mutation
        }
    };

    const copyTrackingNumber = () => {
        const t = order?.shippingInfo?.trackingNumber;
        if (!t) return;
        navigator.clipboard.writeText(t);
        toast.success('คัดลอกเลขพัสดุแล้ว');
    };

    const copyDraftTrackingNumber = () => {
        navigator.clipboard.writeText(trackingNumber.trim());
        toast.success('คัดลอกเลขพัสดุแล้ว');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="max-w-4xl mx-auto">
                <Card className="p-12 text-center">
                    <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">ไม่พบคำสั่งซื้อ</h2>
                    <Button asChild className="mt-4">
                        <Link href="/admin/orders">กลับไปยังหน้าคำสั่งซื้อ</Link>
                    </Button>
                </Card>
            </div>
        );
    }



    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === 'cancelled') {
            setNewStatusToApply(newStatus);
            setCancelDialogOpen(true);
            return;
        }
        if (!order) return;
        try {
            await updateStatus.mutateAsync({ id: order._id, status: newStatus as any });
        } catch (error) {
            // Error handled by mutation
        }
    };

    const confirmCancel = async () => {
        if (!order) return;
        try {
            await updateStatus.mutateAsync({ id: order._id, status: 'cancelled' });
            setCancelDialogOpen(false);
            setNewStatusToApply(null);
        } catch (error) {
            // Error handled by mutation
        }
    };

    const savedTrackingUrl = order.shippingInfo?.trackingNumber
        ? getTrackingUrl(order.shippingInfo.provider ?? '', order.shippingInfo.trackingNumber)
        : null;

    const statusOptions = [
        { value: 'pending', label: 'รอดำเนินการ' },
        { value: 'confirmed', label: 'ยืนยันแล้ว' },
        { value: 'processing', label: 'กำลังเตรียมสินค้า' },
        { value: 'shipped', label: 'เริ่มการจัดส่ง' },
        { value: 'delivered', label: 'จัดส่งสำเร็จ' },
        { value: 'completed', label: 'เสร็จรับเงิน' },
        { value: 'cancelled', label: 'ยกเลิกแล้ว' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Button variant="ghost" asChild>
                <Link href="/admin/orders">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    กลับไปยังหน้าคำสั่งซื้อ
                </Link>
            </Button>

            {/* Order Header */}
            <Card className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">คำสั่งซื้อ #{order.orderReference}</h1>
                        <p className="text-gray-600">
                            สั่งซื้อเมื่อ {new Date(order.createdAt).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {order.source === 'online' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLabelOpen(true)}
                                className="h-9 gap-2 text-sm font-medium"
                            >
                                <Printer className="h-4 w-4" />
                                พิมพ์สติ้กเกอร์
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReceiptOpen(true)}
                            className="h-9 gap-2 text-sm font-medium"
                        >
                            <ReceiptText className="h-4 w-4" />
                            ดูใบเสร็จ
                        </Button>
                        <Select
                            value={order.orderStatus}
                            onValueChange={handleStatusChange}
                            disabled={updateStatus.isPending}
                        >
                            <SelectTrigger className={`w-[180px] ${getOrderStatusColor(order.orderStatus || 'pending')}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2">
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">รายการสินค้า</h2>
                        <div className="space-y-4">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center border-b pb-4 last:border-b-0">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{item.productName}</h3>
                                        <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                                        <p className="text-sm text-gray-600">จำนวน: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">฿{item.price.toFixed(2)}</p>
                                        <p className="text-sm text-gray-600">
                                            รวม: ฿{(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Order Summary */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">สรุปคำสั่งซื้อ</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">ยอดรวมย่อย</span>
                                <span className="font-semibold">฿{order.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">ค่าจัดส่ง</span>
                                <span className="font-semibold">
                                    {order.shippingInfo?.cost
                                        ? `฿${order.shippingInfo.cost.toFixed(2)}`
                                        : `฿${calculateShippingCost().toFixed(2)} (โดยประมาณ)`}
                                </span>
                            </div>
                            <div className="border-t pt-3 flex justify-between">
                                <span className="text-lg font-bold">ยอดรวมทั้งหมด</span>
                                <span className="text-lg font-bold text-orange-600">
                                    ฿{order.totalAmount.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Customer Information */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">ข้อมูลลูกค้า</h2>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-600">ชื่อ</p>
                                <p className="font-semibold">
                                    {order.customer?.firstName || 'ลูกค้า'} {order.customer?.lastName || 'หน้าร้าน'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">อีเมล</p>
                                <p className="font-semibold">{order.customer?.email || 'ไม่มี'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">เบอร์โทรศัพท์</p>
                                <p className="font-semibold">{order.customer?.phone || 'ไม่มี'}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Payment Verification */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">ข้อมูลการชำระเงิน</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">วิธีการ</span>
                                <span className="font-semibold">{order.payments?.[0]?.paymentMethod === 'Cash' ? 'เงินสด' : (order.payments?.[0]?.paymentMethod || 'โอนผ่านบัญชี')}</span>
                            </div>

                            {order.payments?.[0]?.slipImage ? (
                                <div className="space-y-3 border-t pt-3">
                                    <p className="font-medium text-sm text-gray-900">หลักฐานการชำระเงิน (Slip)</p>
                                    <div className="relative h-40 w-full rounded-lg overflow-hidden border border-gray-200 group cursor-pointer" onClick={() => setPreviewImage(order.payments![0].slipImage!)}>
                                        <Image
                                            src={getImageUrl(order.payments[0].slipImage)}
                                            alt="หลักฐานการชำระเงิน"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Eye className="text-white h-8 w-8" />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {order.payments[0].isVerified ? (
                                            <Button
                                                variant="outline"
                                                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => verifyPayment.mutate({ id: order._id, isVerified: false })}
                                                disabled={verifyPayment.isPending}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                ยกเลิกการยืนยัน
                                            </Button>
                                        ) : (
                                            <Button
                                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => verifyPayment.mutate({ id: order._id, isVerified: true })}
                                                disabled={verifyPayment.isPending}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                ยืนยันการชำระเงิน
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-3 rounded text-sm text-gray-500 text-center">
                                    ยังไม่มีการอัปโหลดหลักฐานการชำระเงิน
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Shipping Information */}
                    <Card className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold">ข้อมูลการจัดส่ง</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShippingDialogOpen(true)}
                                className="h-8 w-8"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">ผู้ให้บริการ</p>
                                <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-gray-400" />
                                    <p className={cn('font-semibold', getCourier(order.shippingInfo?.provider ?? '')?.color)}>
                                        {getCourier(order.shippingInfo?.provider ?? '')?.label || order.shippingInfo?.provider || 'ไม่มีข้อมูล'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">เลขพัสดุ (Tracking Number)</p>
                                {order.shippingInfo?.trackingNumber ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="font-semibold font-mono tracking-wider text-sm">
                                            {order.shippingInfo.trackingNumber}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={copyTrackingNumber}
                                            className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                                            title="คัดลอกเลขพัสดุ"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm mt-1">ยังไม่ได้กรอกเลขพัสดุ</p>
                                )}
                            </div>
                            {savedTrackingUrl && (
                                <a
                                    href={savedTrackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        'flex items-center gap-2 text-xs px-3 py-2 rounded-lg border w-full transition-colors',
                                        getCourier(order.shippingInfo!.provider ?? '')?.bg ?? 'bg-gray-50 border-gray-200',
                                        getCourier(order.shippingInfo!.provider ?? '')?.color ?? 'text-gray-700'
                                    )}
                                >
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                    <span>ติดตามพัสดุที่ {getCourier(order.shippingInfo!.provider ?? '')?.label || order.shippingInfo!.provider}</span>
                                </a>
                            )}
                            <div>
                                <p className="text-sm text-gray-600">ค่าจัดส่ง</p>
                                <p className="font-semibold">
                                    {order.shippingInfo?.cost ? `฿${order.shippingInfo.cost.toFixed(2)}` : '-'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-primary" />
                            กรอกเลขพัสดุ — เริ่มการจัดส่ง
                        </DialogTitle>
                        {order.shippingAddressId && (
                            <DialogDescription asChild>
                                <div className="bg-gray-50 rounded-lg px-3 py-2 text-left text-xs text-gray-600 space-y-0.5 mt-1">
                                    <p className="font-bold text-gray-800">{order.shippingAddressId.recipientName}</p>
                                    <p>{order.shippingAddressId.streetAddress}</p>
                                    <p>{[order.shippingAddressId.subDistrict, order.shippingAddressId.district, order.shippingAddressId.province, order.shippingAddressId.zipCode].filter(Boolean).join(', ')}</p>
                                </div>
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Courier selector */}
                        <div className="space-y-2">
                            <Label>บริษัทขนส่ง</Label>
                            <Select
                                value={shippingProvider}
                                onValueChange={(value) => {
                                    setShippingProvider(value);
                                    // Also try to auto-fill cost from shippingMethods
                                    const method = shippingMethods?.find(m => m.name === value && m.isActive);
                                    if (method) setShippingCost(method.price.toString());
                                }}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="เลือกบริษัทขนส่ง" />
                                </SelectTrigger>
                                <SelectContent>
                                    {COURIERS.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            <span className={cn('font-medium', c.color)}>{c.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Shipping method override (cost autofill) */}
                        {shippingMethods && shippingMethods.filter(m => m.isActive).length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">หรือเลือกจากวิธีจัดส่งที่ตั้งค่าไว้ (เติมค่าอัตโนมัติ)</Label>
                                <Select onValueChange={(value) => {
                                    const method = shippingMethods?.find(m => m._id === value);
                                    if (method) {
                                        setShippingProvider(method.name);
                                        setShippingCost(method.price.toString());
                                    }
                                }}>
                                    <SelectTrigger className="h-9 text-sm text-gray-500">
                                        <SelectValue placeholder="เลือกจากรายการ..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {shippingMethods.filter(m => m.isActive).map((method) => (
                                            <SelectItem key={method._id} value={method._id}>
                                                {method.name} — ฿{method.price}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Tracking number */}
                        <div className="space-y-2">
                            <Label htmlFor="tracking">เลขพัสดุ (Tracking Number)</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="tracking"
                                        placeholder={getCourier(shippingProvider)?.placeholder ?? 'กรอกเลขพัสดุ'}
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                                        className="h-11 pr-10 font-mono tracking-wider"
                                        autoComplete="off"
                                    />
                                    {trackingNumber && (
                                        <button
                                            type="button"
                                            onClick={copyDraftTrackingNumber}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                            title="คัดลอก"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setScannerOpen(true)}
                                    className="h-11 w-11 shrink-0 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                                    title="สแกนบาร์โค้ดจากกล้อง"
                                >
                                    <ScanLine className="h-5 w-5" />
                                </button>
                            </div>
                            {getCourier(shippingProvider)?.hint && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                    {getCourier(shippingProvider)!.hint}
                                </p>
                            )}
                            {(() => {
                                const draftUrl = trackingNumber.trim() ? getTrackingUrl(shippingProvider, trackingNumber) : null;
                                return draftUrl ? (
                                    <a
                                        href={draftUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            'flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-colors',
                                            getCourier(shippingProvider)?.bg ?? 'bg-gray-50 border-gray-200',
                                            getCourier(shippingProvider)?.color ?? 'text-gray-700'
                                        )}
                                    >
                                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">ดูข้อมูลติดตาม: {trackingNumber.trim()}</span>
                                    </a>
                                ) : null;
                            })()}
                        </div>

                        {/* Shipping cost */}
                        <div className="space-y-2">
                            <Label htmlFor="cost">ค่าจัดส่ง (บาท)</Label>
                            <Input
                                id="cost"
                                type="number"
                                min="0"
                                placeholder="0.00"
                                value={shippingCost}
                                onChange={(e) => setShippingCost(e.target.value)}
                                className="h-11"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShippingDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleUpdateShipping} disabled={updateStatus.isPending || !trackingNumber.trim()} className="gap-1.5">
                            <Truck className="h-4 w-4" />
                            {updateStatus.isPending ? 'กำลังบันทึก...' : 'บันทึก + เริ่มการจัดส่ง'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            ยืนยันการยกเลิกคำสั่งซื้อ
                        </DialogTitle>
                        <DialogDescription>
                            คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำสั่งซื้อนี้?
                            <br />
                            <span className="font-medium text-gray-900 mt-2 block">
                                การดำเนินการนี้จะคืนสินค้าเข้าสต็อกโดยอัตโนมัติ
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>กลับไปดูแลออเดอร์</Button>
                        <Button variant="destructive" onClick={confirmCancel}>ใช่, ยกเลิกคำสั่งซื้อ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ImagePreviewDialog
                open={!!previewImage}
                onOpenChange={(open: boolean) => !open && setPreviewImage(null)}
                images={previewImage ? [{ _id: 'slip', imagePath: previewImage, isPrimary: true, sortOrder: 0 }] : []}
                productName="Payment Slip"
            />

            <BarcodeScanner
                open={scannerOpen}
                onScan={(value) => setTrackingNumber(value)}
                onClose={() => setScannerOpen(false)}
            />

            {receiptOpen && (
                <OrderReceiptDialog
                    open={receiptOpen}
                    onOpenChange={setReceiptOpen}
                    order={order}
                />
            )}

            {labelOpen && (
                <ShippingLabelDialog
                    open={labelOpen}
                    onOpenChange={setLabelOpen}
                    order={order}
                />
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    #receipt-content, #receipt-content * { visibility: visible; }
                    #receipt-content {
                        position: absolute;
                        left: 0; top: 0;
                        width: 100%;
                        padding: 0; margin: 0;
                    }
                    [role="dialog"] { box-shadow: none !important; border: none !important; }
                }
            `}} />
        </div >
    );
}
