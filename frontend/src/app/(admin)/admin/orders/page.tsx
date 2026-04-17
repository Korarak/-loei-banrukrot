'use client';

import { useOrders, useUpdateOrderStatus, type Order } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Search, Eye, Plus, AlertCircle, Store, Globe, Calendar, CreditCard, Banknote, User, Copy, ExternalLink, Truck, CheckCircle2, ScanLine } from 'lucide-react';
import { BarcodeScanner } from '@/components/features/BarcodeScanner';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { COURIERS, getCourier, getTrackingUrl } from '@/lib/couriers';

const statusOptions = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'pending', label: 'กำลังดำเนินการ' },
    { value: 'processing', label: 'กำลังเตรียมสินค้า' },
    { value: 'shipped', label: 'เริ่มการจัดส่ง' },
    { value: 'delivered', label: 'จัดส่งสำเร็จ' },
    { value: 'completed', label: 'เสร็จรับเงิน' },
    { value: 'cancelled', label: 'ยกเลิก' },
];

import { getOrderStatusLabel, getOrderStatusColor } from '@/lib/order-status';

export default function AdminOrdersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'online' | 'pos'
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

    // Tracking Dialog State
    const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
    const [trackingOrder, setTrackingOrder] = useState<string | null>(null);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [courier, setCourier] = useState('Flash Express');
    const [scannerOpen, setScannerOpen] = useState(false);

    const { data: orders, isLoading } = useOrders({ refetchInterval: 10000 }); // Poll every 10s
    const updateStatus = useUpdateOrderStatus();

    // Notification Logic
    const previousOrderCount = useRef(0);

    useEffect(() => {
        if (orders) {
            if (previousOrderCount.current > 0 && orders.length > previousOrderCount.current) {
                toast("ได้รับคำสั่งซื้อใหม่!", {
                    description: "มีคำสั่งซื้อใหม่เข้ามาในระบบ",
                    action: {
                        label: "ดู",
                        onClick: () => window.location.reload(),
                    },
                });
                // Try to play sound
                try {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.play().catch(e => console.log('Audio play error', e));
                } catch (e) { }
            }
            previousOrderCount.current = orders.length;
        }
    }, [orders]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        if (newStatus === 'cancelled') {
            setOrderToCancel(orderId);
            setCancelDialogOpen(true);
            return;
        }

        if (newStatus === 'shipped') {
            setTrackingOrder(orderId);
            setTrackingNumber('');
            setTrackingDialogOpen(true);
            return;
        }

        try {
            await updateStatus.mutateAsync({ id: orderId, status: newStatus as Order['orderStatus'] });
        } catch (error) {
            // Error handled by mutation
        }
    };

    const confirmTracking = async () => {
        if (!trackingOrder) return;
        const trimmed = trackingNumber.trim();
        try {
            await updateStatus.mutateAsync({
                id: trackingOrder,
                status: 'shipped',
                shippingInfo: {
                    provider: courier,
                    trackingNumber: trimmed,
                    cost: 0
                }
            });
            setTrackingDialogOpen(false);
            setTrackingOrder(null);
            const url = getTrackingUrl(courier, trimmed);
            toast.success('อัปเดตสถานะการจัดส่งเรียบร้อยแล้ว', {
                description: trimmed,
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

    const copyTracking = () => {
        if (!trackingNumber.trim()) return;
        navigator.clipboard.writeText(trackingNumber.trim());
        toast.success('คัดลอกหมายเลขพัสดุแล้ว');
    };

    const confirmCancel = async () => {
        if (!orderToCancel) return;
        try {
            await updateStatus.mutateAsync({ id: orderToCancel, status: 'cancelled' });
            setCancelDialogOpen(false);
            setOrderToCancel(null);
        } catch (error) {
            // Error handled by mutation
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Filter orders
    const filteredOrders = orders?.filter((order) => {
        const matchesSearch =
            (order.orderReference?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (order.customer?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;

        const matchesSource = sourceFilter === 'all' || order.source === sourceFilter;

        return matchesSearch && matchesStatus && matchesSource;
    }) || [];

    // Detailed counts for Tabs
    const countAll = orders?.length || 0;
    const countOnline = orders?.filter(o => o.source === 'online').length || 0;
    const countPos = orders?.filter(o => o.source === 'pos').length || 0;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">คำสั่งซื้อ</h1>
                    <p className="text-gray-500 text-sm mt-1">จัดการคำสั่งซื้อออนไลน์และรายการขายหน้าร้าน (POS)</p>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl text-black">
                    <Link href="/admin/pos">
                        <Plus className="mr-2 h-4 w-4" />
                        เริ่มการขาย POS ใหม่
                    </Link>
                </Button>
            </div>

            {/* Main Tabs for Source Filtering */}
            <Tabs defaultValue="all" value={sourceFilter} onValueChange={setSourceFilter} className="w-full">
                <TabsList className="grid w-full md:w-[450px] grid-cols-3 bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        ทั้งหมด ({countAll})
                    </TabsTrigger>
                    <TabsTrigger value="online" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <Globe className="h-4 w-4" /> ออนไลน์ ({countOnline})
                    </TabsTrigger>
                    <TabsTrigger value="pos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <Store className="h-4 w-4" /> หน้าร้าน ({countPos})
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Secondary Filters */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Search */}
                <div className="relative md:col-span-8 lg:col-span-9">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="ค้นหาด้วยเลขที่ออเดอร์, ชื่อลูกค้า, อีเมล..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                </div>

                {/* Status Filter */}
                <div className="md:col-span-4 lg:col-span-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl shadow-sm">
                            <SelectValue placeholder="สถานะทั้งหมด" />
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

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-900">ไม่พบคำสั่งซื้อ</p>
                        <p className="text-sm text-gray-500">ลองปรับการกรองหรือคำค้นหาของคุณ</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <Card key={order._id} className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-200 bg-white group rounded-xl">
                            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                {/* 1. Order ID & Source & Date */}
                                <div className="lg:col-span-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        {order.source === 'pos' ? (
                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1.5 py-1 px-2.5 rounded-lg shrink-0">
                                                <Store className="h-3.5 w-3.5" /> ขายหน้าร้าน
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5 py-1 px-2.5 rounded-lg shrink-0">
                                                <Globe className="h-3.5 w-3.5" /> ออนไลน์
                                            </Badge>
                                        )}
                                        <span className="font-mono font-semibold text-lg text-gray-900">
                                            #{order.orderReference}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>
                                            {new Date(order.createdAt).toLocaleString('en-US', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="text-gray-700 font-medium truncate max-w-[200px]">
                                            {order.customer?.firstName
                                                ? `${order.customer.firstName} ${order.customer.lastName}`
                                                : 'ลูกค้าหน้าร้าน (Walk-in)'}
                                        </span>
                                    </div>
                                </div>

                                {/* 2. Items Summary & Payment */}
                                <div className="lg:col-span-4 space-y-3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">รายการสินค้า</p>
                                        {(order.items || []).slice(0, 2).map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm text-gray-700">
                                                <span className="truncate pr-4">{item.productName}</span>
                                                <span className="text-gray-500">x{item.quantity}</span>
                                            </div>
                                        ))}
                                        {(order.items || []).length > 2 && (
                                            <p className="text-xs text-primary font-medium mt-1">
                                                และรายการอื่นๆ อีก {(order.items || []).length - 2} รายการ...
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1 mt-2 border-t border-gray-50 pt-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {order.paymentMethod === 'Cash' ? (
                                                <Banknote className="h-3.5 w-3.5" />
                                            ) : (
                                                <CreditCard className="h-3.5 w-3.5" />
                                            )}
                                            <span>ชำระด้วย: {order.paymentMethod === 'Cash' ? 'เงินสด' : (order.paymentMethod === 'PromptPay' ? 'พร้อมเพย์' : order.paymentMethod)}</span>
                                        </div>
                                        {order.shippingInfo && order.shippingInfo.provider && (
                                            <div className="flex items-center gap-2 text-xs text-blue-600 font-medium bg-blue-50 w-fit px-2 py-0.5 rounded-md">
                                                <Store className="h-3.5 w-3.5" />
                                                <span>{order.shippingInfo.provider} {order.shippingInfo.trackingNumber ? `(${order.shippingInfo.trackingNumber})` : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Total & Actions */}
                                <div className="lg:col-span-4 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 mb-0.5">ยอดรวมทั้งหมด</p>
                                        <p className="text-2xl font-bold text-gray-900 tracking-tight">
                                            ฿{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-end gap-3 w-full sm:w-auto">
                                        <Select
                                            value={order.orderStatus}
                                            onValueChange={(value) => handleStatusChange(order._id, value)}
                                            disabled={updateStatus.isPending || order.source === 'pos'} /* Disable status change for POS? Maybe not */
                                        >
                                            <SelectTrigger className={cn("w-[140px] h-9 text-xs font-medium border-0 ring-1 ring-inset shadow-sm", getOrderStatusColor(order.orderStatus))}>
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

                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-primary hover:bg-primary/5" asChild>
                                            <Link href={`/admin/orders/${order._id}`}>
                                                <Eye className="h-5 w-5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            ยกเลิกคำสั่งซื้อ?
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            การดำเนินการนี้ไม่สามารถยกเลิกได้ คำสั่งซื้อจะถูกยกเลิกอย่างถาวรและสินค้าจะถูกคืนเข้าสต็อก
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:space-x-0">
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="w-full sm:w-auto">ไม่ต้องยกเลิก</Button>
                        <Button variant="destructive" onClick={confirmCancel} className="w-full sm:w-auto">ใช่, ยกเลิกคำสั่งซื้อ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Tracking Number Dialog */}
            <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-primary" />
                            กรอกเลขพัสดุ
                        </DialogTitle>
                        <DialogDescription>
                            เปลี่ยนสถานะเป็น "เริ่มการจัดส่ง" พร้อมบันทึกเลขพัสดุ
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        {/* Courier selector */}
                        <div className="grid gap-2">
                            <Label htmlFor="courier">บริษัทขนส่ง</Label>
                            <Select value={courier} onValueChange={setCourier}>
                                <SelectTrigger id="courier" className="h-11">
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

                        {/* Tracking number input */}
                        <div className="grid gap-2">
                            <Label htmlFor="tracking">เลขพัสดุ (Tracking Number)</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="tracking"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => e.key === 'Enter' && trackingNumber.trim() && confirmTracking()}
                                        placeholder={getCourier(courier)?.placeholder ?? 'กรอกเลขพัสดุ'}
                                        className="h-11 pr-10 font-mono tracking-wider"
                                        autoFocus
                                        autoComplete="off"
                                    />
                                    {trackingNumber && (
                                        <button
                                            type="button"
                                            onClick={copyTracking}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                            title="คัดลอกเลขพัสดุ"
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
                            {getCourier(courier)?.hint && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                    {getCourier(courier)!.hint}
                                </p>
                            )}
                        </div>

                        {/* Live tracking link preview */}
                        {trackingNumber.trim() && getTrackingUrl(courier, trackingNumber) && (
                            <a
                                href={getTrackingUrl(courier, trackingNumber)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    'flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors',
                                    getCourier(courier)?.bg ?? 'bg-gray-50 border-gray-200',
                                    getCourier(courier)?.color ?? 'text-gray-700'
                                )}
                            >
                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">ดูข้อมูลติดตาม: {trackingNumber.trim()}</span>
                            </a>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:space-x-0">
                        <Button variant="outline" onClick={() => setTrackingDialogOpen(false)}>ยกเลิก</Button>
                        <Button
                            onClick={confirmTracking}
                            disabled={!trackingNumber.trim() || updateStatus.isPending}
                        >
                            {updateStatus.isPending ? 'กำลังบันทึก...' : 'ยืนยันการจัดส่ง'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BarcodeScanner
                open={scannerOpen}
                onScan={(value) => setTrackingNumber(value)}
                onClose={() => setScannerOpen(false)}
            />
        </div>
    );
}
