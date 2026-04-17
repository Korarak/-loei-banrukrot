'use client';

import { useOrder, useUploadSlip, useOrderQRCode, useCancelOrder } from '@/hooks/useOrders';
import { usePublicSettings } from '@/hooks/useSettings';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Package, Upload, CheckCircle, Clock, Truck, ImageIcon, X, BanknoteIcon, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, use, useState, useRef } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { getOrderStatusLabel, getOrderStatusColor } from '@/lib/order-status';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const customer = useAuthStore((state) => state.customer);
    const { id } = use(params);
    const { data: order, isLoading } = useOrder(id);
    const { data: bankSettings } = usePublicSettings();
    const uploadSlip = useUploadSlip();
    const cancelOrder = useCancelOrder();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setFile(f);
        if (f) {
            const url = URL.createObjectURL(f);
            setPreview(url);
        } else {
            setPreview(null);
        }
    };

    const handleClearFile = () => {
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpload = async () => {
        if (!file) return;
        try {
            await uploadSlip.mutateAsync({ id, file });
            setFile(null);
            setPreview(null);
        } catch (error) {
            // Error handled by hook
        }
    };

    useEffect(() => {
        if (!customer) {
            router.push('/customer-login?redirect=/orders/' + id);
        }
    }, [customer, router, id]);

    if (!customer) return null;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="max-w-4xl mx-auto">
                <Card className="p-12 text-center border-0 shadow-lg rounded-3xl">
                    <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-bold mb-2 text-gray-700">ไม่พบคำสั่งซื้อ</h2>
                    <Button asChild className="mt-4 rounded-full">
                        <Link href="/orders">กลับไปคำสั่งซื้อ</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    const isTransfer = order.payments?.[0]?.paymentMethod === 'Transfer' || !order.payments?.length;
    const slipImage = order.payments?.[0]?.slipImage;
    const isVerified = order.payments?.[0]?.isVerified;
    const isPendingPayment = order.orderStatus === 'pending' && isTransfer && !slipImage;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <Button variant="ghost" asChild className="font-bold hover:text-primary transition-colors -ml-2">
                <Link href="/orders">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    กลับไปคำสั่งซื้อ
                </Link>
            </Button>

            {/* Order Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                        คำสั่งซื้อ <span className="text-primary">#{order.orderReference}</span>
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        สั่งเมื่อ {new Date(order.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                        })}
                    </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${getOrderStatusColor(order.orderStatus)}`}>
                    {getOrderStatusLabel(order.orderStatus)}
                </span>
            </div>

            {/* ── Cancel button — only before slip is uploaded ── */}
            {isPendingPayment && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="self-start gap-2 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded-xl font-bold"
                            disabled={cancelOrder.isPending}
                        >
                            <XCircle className="h-4 w-4" />
                            ยกเลิกคำสั่งซื้อ
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <XCircle className="h-5 w-5" />
                                ยืนยันการยกเลิก?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-2">
                                <span className="block">คำสั่งซื้อ <strong>#{order.orderReference}</strong> จะถูกยกเลิก และสินค้าจะถูกคืนเข้าสต็อกโดยอัตโนมัติ</span>
                                <span className="block text-amber-600 font-medium">⚠️ ยกเลิกได้เฉพาะก่อนแนบสลิปโอนเงินเท่านั้น</span>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>กลับไปดูออเดอร์</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => cancelOrder.mutate(id)}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                ใช่ ยกเลิกคำสั่งซื้อ
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* ── PAYMENT SLIP SECTION (hero when pending) ── */}
            {isTransfer && (
                <Card className={`border-0 shadow-xl rounded-3xl overflow-hidden ${isPendingPayment ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}>
                    {isPendingPayment && (
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 flex items-center gap-3">
                            <BanknoteIcon className="h-5 w-5 text-white shrink-0" />
                            <p className="text-white font-bold text-sm">รอการชำระเงิน — กรุณาโอนเงินและแนบสลิป</p>
                        </div>
                    )}

                    <div className="p-6 md:p-8">
                        {slipImage ? (
                            /* ─ Slip already uploaded ─ */
                            <div className="space-y-4">
                                <h2 className="text-xl font-black text-gray-900">หลักฐานการโอนเงิน</h2>
                                <div className="flex flex-col sm:flex-row gap-6 items-start">
                                    <div className="relative h-52 w-44 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-md shrink-0">
                                        <Image
                                            src={getImageUrl(slipImage)}
                                            alt="สลิปการโอนเงิน"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        {isVerified ? (
                                            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-2xl font-bold text-sm border border-emerald-100">
                                                <CheckCircle className="h-5 w-5" />
                                                ตรวจสอบสลิปแล้ว — ยืนยันการชำระเงิน
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-2.5 rounded-2xl font-bold text-sm border border-amber-100">
                                                <Clock className="h-5 w-5" />
                                                รอแอดมินตรวจสอบ (ประมาณ 24 ชั่วโมง)
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            หากมีปัญหาเกี่ยวกับการชำระเงิน กรุณาติดต่อทีมงาน
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ─ No slip yet — show upload UI ─ */
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 mb-1">แนบสลิปโอนเงิน</h2>
                                    <p className="text-sm text-gray-400">กรุณาโอนเงินและอัปโหลดหลักฐานการชำระเงิน</p>
                                </div>

                                {/* Bank Info + QR in a grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Bank account */}
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100 space-y-2.5">
                                        <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">ข้อมูลบัญชีธนาคาร</p>
                                        <div className="space-y-1.5 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">ธนาคาร</span>
                                                <span className="font-bold text-gray-900">{bankSettings?.payment_bank_name || '—'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">เลขบัญชี</span>
                                                <span className="font-bold text-gray-900 font-mono tracking-wider select-all">{bankSettings?.payment_bank_account_number || '—'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">ชื่อบัญชี</span>
                                                <span className="font-bold text-gray-900 text-right">{bankSettings?.payment_bank_account_name || '—'}</span>
                                            </div>
                                        </div>
                                        <div className="border-t border-green-100 pt-2.5 flex justify-between items-center">
                                            <span className="text-gray-500 text-sm">ยอดที่ต้องโอน</span>
                                            <span className="text-xl font-black text-primary">฿{order.totalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* PromptPay QR */}
                                    <PromptPayQRCode orderId={order._id} />
                                </div>

                                {/* File Upload */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700">อัปโหลดสลิปการโอนเงิน</Label>

                                    {preview ? (
                                        <div className="relative">
                                            <div className="relative h-56 w-full rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md">
                                                <Image src={preview} alt="ตัวอย่างสลิป" fill className="object-contain bg-gray-50" unoptimized />
                                            </div>
                                            <button
                                                onClick={handleClearFile}
                                                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50 hover:text-red-500 transition-colors"
                                                aria-label="ลบรูปที่เลือก"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                            <p className="text-xs text-gray-400 text-center mt-2">{file?.name}</p>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="slip-upload"
                                            className="flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-primary/50 transition-all cursor-pointer group"
                                        >
                                            <ImageIcon className="h-8 w-8 text-gray-300 group-hover:text-primary/50 mb-2 transition-colors" />
                                            <p className="text-sm font-bold text-gray-400 group-hover:text-gray-600">คลิกเพื่อเลือกรูปสลิป</p>
                                            <p className="text-xs text-gray-300 mt-1">รองรับ JPG, PNG, HEIC</p>
                                        </label>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        id="slip-upload"
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={handleFileChange}
                                    />

                                    <Button
                                        onClick={handleUpload}
                                        disabled={!file || uploadSlip.isPending}
                                        className="w-full h-14 text-base font-black rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-green-200 disabled:opacity-40 disabled:shadow-none transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                                    >
                                        {uploadSlip.isPending ? (
                                            <span className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/40 border-t-white" />
                                                กำลังอัปโหลด...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Upload className="h-5 w-5" />
                                                ส่งหลักฐานการโอนเงิน
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* ── Tracking ── */}
            {order.shippingInfo?.trackingNumber && (
                <Card className="p-6 border-0 shadow-lg rounded-3xl">
                    <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-gray-900">
                        <Truck className="h-5 w-5 text-primary" />
                        ข้อมูลการจัดส่ง
                    </h2>
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">บริษัทขนส่ง</span>
                            <span className="font-bold text-gray-900">{order.shippingInfo.provider}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">เลขพัสดุ</span>
                            <span className="font-mono font-black text-lg text-primary tracking-widest">{order.shippingInfo.trackingNumber}</span>
                        </div>
                    </div>
                </Card>
            )}

            {/* ── Order Items ── */}
            <Card className="p-6 border-0 shadow-lg rounded-3xl">
                <h2 className="text-lg font-black mb-5 text-gray-900">รายการสินค้า</h2>
                <div className="space-y-4">
                    {order.items.map((item, index) => (
                        <div key={index} className="flex gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                            <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                                {item.imageUrl ? (
                                    <Image src={getImageUrl(item.imageUrl)} alt={item.productName} fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">ไม่มีรูป</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">{item.productName}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku} · {item.quantity} ชิ้น</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="font-black text-gray-900">฿{item.price.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">รวม ฿{(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                        <span>ยอดสินค้า</span>
                        <span className="font-medium text-gray-900">
                            ฿{(order.totalAmount - (order.shippingInfo?.cost || 0)).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                        <span>ค่าจัดส่ง</span>
                        <span className="font-medium text-gray-900">
                            {order.shippingInfo?.cost ? `฿${order.shippingInfo.cost.toLocaleString()}` : 'ฟรี'}
                        </span>
                    </div>
                    <div className="flex justify-between font-black text-base pt-2 border-t border-gray-50">
                        <span>ยอดรวม</span>
                        <span className="text-primary text-lg">฿{order.totalAmount.toLocaleString()}</span>
                    </div>
                </div>
            </Card>

            {/* ── Shipping address + Customer info ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-5 border-0 shadow-lg rounded-3xl">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3">ที่อยู่จัดส่ง</h2>
                    {order.shippingAddressId ? (
                        <div className="space-y-1 text-sm">
                            <p className="font-bold text-gray-900">{order.shippingAddressId.recipientName}</p>
                            <p className="text-gray-500">{order.shippingAddressId.streetAddress}</p>
                            <p className="text-gray-500">
                                {order.shippingAddressId.subDistrict && `${order.shippingAddressId.subDistrict}, `}
                                {order.shippingAddressId.district}
                            </p>
                            <p className="text-gray-500">{order.shippingAddressId.province} {order.shippingAddressId.zipCode}</p>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">ไม่มีที่อยู่จัดส่ง</p>
                    )}
                </Card>

                <Card className="p-5 border-0 shadow-lg rounded-3xl">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3">ข้อมูลผู้สั่งซื้อ</h2>
                    <div className="space-y-1 text-sm">
                        <p className="font-bold text-gray-900">{order.customer.firstName} {order.customer.lastName}</p>
                        <p className="text-gray-500">{order.customer.email}</p>
                        {order.customer.phone && <p className="text-gray-500">{order.customer.phone}</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function PromptPayQRCode({ orderId }: { orderId: string }) {
    const { data: qrCode, isLoading } = useOrderQRCode(orderId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 h-40">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
        );
    }
    if (!qrCode) return null;

    return (
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">สแกน QR ชำระเงิน (พร้อมเพย์)</p>
            <div className="relative w-36 h-36">
                <Image src={qrCode} alt="PromptPay QR Code" fill className="object-contain" unoptimized />
            </div>
            <p className="text-xs text-gray-400 mt-2">ยอดที่สร้างอัตโนมัติ</p>
        </div>
    );
}
