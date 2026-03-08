'use client';

import { useOrder, useUploadSlip, useOrderQRCode } from '@/hooks/useOrders';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Package, Upload, CheckCircle, Clock, AlertCircle, Truck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, use, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';

import { getImageUrl } from '@/lib/utils';
import { getOrderStatusLabel, getOrderStatusColor } from '@/lib/order-status';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const customer = useAuthStore((state) => state.customer);
    const { id } = use(params);
    const { data: order, isLoading } = useOrder(id);
    const uploadSlip = useUploadSlip();
    const [file, setFile] = useState<File | null>(null);

    const handleUpload = async () => {
        if (!file) return;
        try {
            await uploadSlip.mutateAsync({ id, file });
            setFile(null);
        } catch (error) {
            // Error handled by hook
        }
    };

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!customer) {
            router.push('/customer-login?redirect=/orders/' + id);
        }
    }, [customer, router, id]);

    if (!customer) {
        return null; // Will redirect
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="max-w-4xl mx-auto">
                <Card className="p-12 text-center">
                    <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Order not found</h2>
                    <Button asChild className="mt-4">
                        <Link href="/orders">Back to Orders</Link>
                    </Button>
                </Card>
            </div>
        );
    }



    return (
        <div className="max-w-4xl mx-auto">
            <Button variant="ghost" asChild className="mb-6">
                <Link href="/orders">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Orders
                </Link>
            </Button>

            <div className="space-y-6">
                {/* Order Header */}
                <Card className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">Order #{order.orderReference}</h1>
                            <p className="text-gray-600">
                                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getOrderStatusColor(order.orderStatus)}`}>
                            {getOrderStatusLabel(order.orderStatus)}
                        </span>
                    </div>
                </Card>

                {/* Tracking Information */}
                {(order.orderStatus === 'shipped' || order.orderStatus === 'delivered' || order.shippingInfo?.trackingNumber) && (
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Shipping Information
                        </h2>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Provider</span>
                                <span className="font-semibold">{order.shippingInfo?.provider || 'Standard Delivery'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Tracking Number</span>
                                <span className="font-mono font-bold text-lg text-primary tracking-wide">
                                    {order.shippingInfo?.trackingNumber || 'Tracking not available yet'}
                                </span>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Order Items */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Order Items</h2>
                    <div className="space-y-4">
                        {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center border-b pb-4 last:border-b-0 gap-4">
                                <div className="h-16 w-16 rounded-md bg-white overflow-hidden relative border border-gray-200 flex-shrink-0">
                                    {item.imageUrl ? (
                                        <Image
                                            src={getImageUrl(item.imageUrl)}
                                            alt={item.productName}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-gray-50">NO IMG</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{item.productName}</h3>
                                    <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">฿{item.price.toFixed(2)}</p>
                                    <p className="text-sm text-gray-600">
                                        Subtotal: ฿{(item.price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Order Summary */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-semibold">฿{order.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Shipping</span>
                            <span className="font-semibold">
                                {order.shippingInfo?.cost ? `฿${order.shippingInfo.cost.toFixed(2)}` : 'Free'}
                            </span>
                        </div>
                        <div className="border-t pt-3 flex justify-between">
                            <span className="text-lg font-bold">Total</span>
                            <span className="text-lg font-bold text-green-600">
                                ฿{order.totalAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">Customer Information</h2>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="font-semibold">
                                    {order.customer.firstName} {order.customer.lastName}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-semibold">{order.customer.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="font-semibold">{order.customer.phone}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                        {order.shippingAddressId ? (
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-gray-600">Recipient</p>
                                    <p className="font-semibold">{order.shippingAddressId.recipientName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Address</p>
                                    <p className="font-semibold">{order.shippingAddressId.streetAddress}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Location</p>
                                    <p className="font-semibold">
                                        {order.shippingAddressId.subDistrict && `${order.shippingAddressId.subDistrict}, `}
                                        {order.shippingAddressId.district}
                                    </p>
                                    <p className="font-semibold">
                                        {order.shippingAddressId.province} {order.shippingAddressId.zipCode}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No shipping address provided</p>
                        )}
                    </Card>
                </div>

                {/* Payment Information & Slip Upload */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Payment Information</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Payment Method</span>
                            <span className="font-semibold">
                                {order.payments?.[0]?.paymentMethod || 'Transfer'}
                            </span>
                        </div>

                        {/* Show upload section only for Transfer method */}
                        {(order.payments?.[0]?.paymentMethod === 'Transfer' || !order.payments?.length) && (
                            <div className="border-t pt-4 mt-4">
                                <h3 className="font-semibold mb-3 text-lg">แนบหลักฐานการโอนเงิน</h3>

                                {order.payments?.[0]?.slipImage ? (
                                    <div className="space-y-3">
                                        <div className="relative h-48 w-full max-w-xs rounded-lg overflow-hidden border border-gray-200">
                                            <Image
                                                src={getImageUrl(order.payments[0].slipImage)}
                                                alt="Payment Slip"
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {order.payments[0].isVerified ? (
                                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Payment Verified
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm font-medium">
                                                    <Clock className="h-4 w-4" />
                                                    Waiting for Verification
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm flex gap-2 items-start">
                                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-base mb-1">กรุณาโอนเงินและแนบสลิป</p>
                                                <p>ธนาคาร: กสิกรไทย (K-Bank)</p>
                                                <p>เลขที่บัญชี: 123-4-56789-0</p>
                                                <p>ชื่อบัญชี: บจก. บ้านรักรถ จ.เลย</p>
                                            </div>
                                        </div>

                                        <PromptPayQRCode orderId={order._id} />

                                        <div className="space-y-2">
                                            <div className="space-y-3">
                                                <Label htmlFor="slip" className="text-base font-medium text-gray-900">
                                                    แนบหลักฐานการโอนเงิน (สลิป)
                                                </Label>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <Input
                                                        id="slip"
                                                        type="file"
                                                        accept="image/*"
                                                        className="file:bg-green-50 file:text-green-700 file:border-0 file:rounded-full file:px-4 file:py-1 file:mr-4 file:font-medium hover:file:bg-green-100 transition-all cursor-pointer bg-white"
                                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                    />
                                                    <Button
                                                        onClick={handleUpload}
                                                        disabled={!file || uploadSlip.isPending}
                                                        className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-md min-w-[120px]"
                                                    >
                                                        {uploadSlip.isPending ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white mr-2"></div>
                                                                กำลังอัปโหลด...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="h-4 w-4 mr-2" />
                                                                ยืนยันสลิป
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function PromptPayQRCode({ orderId }: { orderId: string }) {
    const { data: qrCode, isLoading } = useOrderQRCode(orderId);

    if (isLoading) return <div className="text-sm text-gray-500">Loading QR Code...</div>;
    if (!qrCode) return null;

    return (
        <div className="flex flex-col items-center p-4 border rounded-lg bg-white">
            <p className="text-sm font-semibold mb-2 text-center">Scan to Pay (PromptPay)</p>
            <div className="relative w-48 h-48">
                <Image
                    src={qrCode}
                    alt="PromptPay QR Code"
                    fill
                    className="object-contain"
                    unoptimized
                />
            </div>
            <p className="text-xs text-gray-500 mt-2">Generated automatically</p>
        </div>
    );
}
