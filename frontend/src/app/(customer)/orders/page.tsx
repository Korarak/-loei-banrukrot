'use client';

import { useCustomerOrders } from '@/hooks/useOrders';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Search, ShoppingBag, FileText, Calendar, AlertCircle, Upload, CheckCircle, Clock, Copy, ExternalLink, Truck } from 'lucide-react';
import { getCourier, getTrackingUrl } from '@/lib/couriers';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getOrderStatusLabel, getOrderStatusColor } from '@/lib/order-status';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrdersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const customer = useAuthStore((state) => state.customer);
    const { data: orders, isLoading } = useCustomerOrders();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');

    useEffect(() => {
        if (!customer) {
            router.push('/customer-login?redirect=/orders');
        }
    }, [customer, router]);

    if (!customer) return null;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    const pendingSlipOrders = (orders || []).filter(
        o => o.orderStatus === 'pending' && o.paymentMethod !== 'Cash' && !o.hasSlip
    );
    const shippedCount = (orders || []).filter(o => o.orderStatus === 'shipped').length;

    const filterOrders = (statusFilter: string[]) => {
        if (!orders) return [];
        return orders.filter((order) => {
            const statusMatch = statusFilter.length === 0 || statusFilter.includes(order.orderStatus);
            const searchLower = searchQuery.toLowerCase();
            const searchMatch =
                order.orderReference.toLowerCase().includes(searchLower) ||
                order.items.some(item => item.productName.toLowerCase().includes(searchLower));
            return statusMatch && searchMatch;
        });
    };

    const renderOrderList = (filteredOrders: any[]) => {
        if (filteredOrders.length === 0) {
            return (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-bold text-lg">ไม่พบคำสั่งซื้อ</p>
                    <p className="text-gray-400 text-sm mt-1">ยังไม่มีคำสั่งซื้อในสถานะนี้</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {filteredOrders.map((order) => {
                    const needsSlip = order.orderStatus === 'pending' && order.paymentMethod !== 'Cash' && !order.hasSlip;
                    const waitingVerify = order.orderStatus === 'pending' && order.hasSlip && !order.slipVerified;

                    return (
                        <Card
                            key={order._id}
                            className={`overflow-hidden border-0 shadow-md rounded-2xl transition-all hover:shadow-lg ${needsSlip ? 'ring-2 ring-orange-400 ring-offset-1' : ''}`}
                        >
                            {/* Slip-required banner inside card */}
                            {needsSlip && (
                                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-white text-xs font-bold">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        รอการชำระเงิน — กรุณาแนบสลิปโอนเงิน
                                    </div>
                                    <Link
                                        href={`/orders/${order._id}`}
                                        className="text-white/90 underline text-xs font-bold hover:text-white whitespace-nowrap"
                                    >
                                        แนบสลิป →
                                    </Link>
                                </div>
                            )}
                                    {waitingVerify && (
                                <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2 text-amber-700 text-xs font-bold">
                                    <Clock className="h-3.5 w-3.5 shrink-0" />
                                    แนบสลิปแล้ว — รอแอดมินตรวจสอบ (ประมาณ 24 ชั่วโมง)
                                </div>
                            )}
                            {order.orderStatus === 'shipped' && order.shippingInfo?.trackingNumber && (
                                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center gap-2 text-blue-700 text-xs font-bold">
                                    <Truck className="h-3.5 w-3.5 shrink-0" />
                                    พัสดุอยู่ระหว่างจัดส่ง — ดูเลขพัสดุด้านล่าง
                                </div>
                            )}
                            {order.orderStatus === 'shipped' && !order.shippingInfo?.trackingNumber && (
                                <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center gap-2 text-gray-500 text-xs font-bold">
                                    <Truck className="h-3.5 w-3.5 shrink-0" />
                                    อยู่ระหว่างจัดส่ง — ยังไม่มีเลขพัสดุ
                                </div>
                            )}

                            <div className="p-5">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 pb-4 border-b border-gray-50">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                            <div className="flex items-center gap-2 text-primary bg-primary/8 px-3 py-1 rounded-lg">
                                                <FileText className="h-3.5 w-3.5" />
                                                <h3 className="font-bold text-sm">#{order.orderReference}</h3>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusColor(order.orderStatus)}`}>
                                                {getOrderStatusLabel(order.orderStatus)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(order.createdAt).toLocaleDateString('th-TH', {
                                                year: 'numeric', month: 'long', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                    <Button
                                        asChild
                                        size="sm"
                                        variant={needsSlip ? 'default' : 'outline'}
                                        className={`ml-auto md:ml-0 rounded-xl shrink-0 ${needsSlip ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-100 gap-1.5' : 'hover:bg-primary/5 hover:text-primary hover:border-primary/30'}`}
                                    >
                                        <Link href={`/orders/${order._id}`}>
                                            {needsSlip ? <><Upload className="h-3.5 w-3.5" />แนบสลิป</> : 'ดูรายละเอียด'}
                                        </Link>
                                    </Button>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {order.items.slice(0, 2).map((item: any, index: number) => (
                                        <div key={index} className="flex justify-between text-sm items-center hover:bg-gray-50 p-2 rounded-xl transition-colors gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-14 w-14 rounded-xl bg-white overflow-hidden relative border border-gray-100 shrink-0">
                                                    {item.imageUrl ? (
                                                        <Image
                                                            src={getImageUrl(item.imageUrl)}
                                                            alt={item.productName}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-300 bg-gray-50">ไม่มีรูป</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 line-clamp-1">{item.productName}</p>
                                                    <p className="text-xs text-gray-400">x{item.quantity}</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-gray-900 shrink-0">
                                                ฿{(item.price * item.quantity).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                    {order.items.length > 2 && (
                                        <p className="text-xs text-gray-400 pl-16 pt-1">
                                            และสินค้าอีก {order.items.length - 2} รายการ
                                        </p>
                                    )}
                                </div>

                                {/* Tracking number — shown when shipped */}
                                {order.orderStatus === 'shipped' && order.shippingInfo?.trackingNumber && (() => {
                                    const courier = getCourier(order.shippingInfo.provider ?? '');
                                    const trackUrl = getTrackingUrl(order.shippingInfo.provider ?? '', order.shippingInfo.trackingNumber);
                                    return (
                                        <div className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border ${courier?.bg ?? 'bg-blue-50 border-blue-100'}`}>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Truck className={`h-3.5 w-3.5 shrink-0 ${courier?.color ?? 'text-blue-600'}`} />
                                                <span className={`text-xs font-bold truncate ${courier?.color ?? 'text-blue-700'}`}>
                                                    {courier?.label ?? order.shippingInfo.provider}
                                                </span>
                                                <span className="font-mono text-sm font-black text-gray-900 tracking-wider truncate">
                                                    {order.shippingInfo.trackingNumber}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(order.shippingInfo!.trackingNumber!);
                                                        toast.success('คัดลอกเลขพัสดุแล้ว');
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-white/70 text-gray-500 hover:text-gray-800 transition-colors"
                                                    aria-label="คัดลอกเลขพัสดุ"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </button>
                                                {trackUrl && (
                                                    <a
                                                        href={trackUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded-lg hover:bg-white/70 text-gray-500 hover:text-gray-800 transition-colors"
                                                        aria-label="ติดตามพัสดุ"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        {order.paymentMethod === 'Cash' ? (
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">เก็บเงินปลายทาง</span>
                                        ) : order.hasSlip ? (
                                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-100">
                                                <CheckCircle className="h-3 w-3" />
                                                {order.slipVerified ? 'ยืนยันแล้ว' : 'แนบสลิปแล้ว'}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-orange-100">
                                                <AlertCircle className="h-3 w-3" />
                                                ยังไม่แนบสลิป
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">ยอดรวม</span>
                                        <span className="text-lg font-black text-primary">
                                            ฿{order.totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Pending slip alert banner */}
            <AnimatePresence>
                {pendingSlipOrders.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="mb-6"
                    >
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-lg shadow-orange-100">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="bg-white/20 rounded-xl p-2 shrink-0">
                                    <AlertCircle className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-white">
                                    <p className="font-black text-sm">
                                        คุณมี {pendingSlipOrders.length} คำสั่งซื้อที่ยังไม่ได้แนบสลิปโอนเงิน
                                    </p>
                                    <p className="text-white/80 text-xs mt-0.5">
                                        กรุณาแนบสลิปเพื่อให้ทีมงานดำเนินการจัดส่ง
                                    </p>
                                </div>
                            </div>
                            {pendingSlipOrders.length === 1 && (
                                <Button asChild size="sm" className="bg-white text-orange-600 hover:bg-white/90 font-bold rounded-xl shrink-0 shadow-md gap-1.5">
                                    <Link href={`/orders/${pendingSlipOrders[0]._id}`}>
                                        <Upload className="h-3.5 w-3.5" />
                                        แนบสลิปเลย
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">คำสั่งซื้อของฉัน</h1>
                    {pendingSlipOrders.length > 0 && (
                        <p className="text-orange-500 text-sm font-bold mt-1 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            {pendingSlipOrders.length} รายการรอแนบสลิป
                        </p>
                    )}
                </div>
                <Button asChild className="bg-gray-900 hover:bg-black text-white rounded-xl shadow-lg gap-2 shrink-0">
                    <Link href="/products">
                        <ShoppingBag className="h-4 w-4" />
                        เลือกซื้อสินค้าต่อ
                    </Link>
                </Button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="ค้นหาเลขคำสั่งซื้อ หรือชื่อสินค้า..."
                    className="pl-10 h-11 rounded-xl border-gray-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-6 mb-6 h-auto p-1 bg-gray-100/50 rounded-2xl gap-1 no-scrollbar">
                    <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2 text-xs md:text-sm relative">
                        ทั้งหมด
                        {pendingSlipOrders.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                                {pendingSlipOrders.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2 text-xs md:text-sm relative">
                        ที่ต้องชำระ
                        {pendingSlipOrders.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                                {pendingSlipOrders.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="processing" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2 text-xs md:text-sm">ที่ต้องจัดส่ง</TabsTrigger>
                    <TabsTrigger value="shipped" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2 text-xs md:text-sm relative">
                        อยู่ระหว่างส่ง
                        {shippedCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                                {shippedCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="delivered" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2 text-xs md:text-sm">สำเร็จ</TabsTrigger>
                    <TabsTrigger value="cancelled" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2 text-xs md:text-sm">ยกเลิก</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">{renderOrderList(filterOrders([]))}</TabsContent>
                <TabsContent value="pending" className="mt-0">{renderOrderList(filterOrders(['pending']))}</TabsContent>
                <TabsContent value="processing" className="mt-0">{renderOrderList(filterOrders(['confirmed', 'processing']))}</TabsContent>
                <TabsContent value="shipped" className="mt-0">{renderOrderList(filterOrders(['shipped']))}</TabsContent>
                <TabsContent value="delivered" className="mt-0">{renderOrderList(filterOrders(['delivered']))}</TabsContent>
                <TabsContent value="cancelled" className="mt-0">{renderOrderList(filterOrders(['cancelled']))}</TabsContent>
            </Tabs>
        </div>
    );
}
