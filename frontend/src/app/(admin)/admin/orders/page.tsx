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
import { Search, Eye, Plus, AlertCircle, Store, Globe, Calendar, CreditCard, Banknote, User } from 'lucide-react';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

const statusOptions = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'pending', label: 'กำลังดำเนินการ' },
    { value: 'processing', label: 'กำลังเตรียมสินค้า' },
    { value: 'shipped', label: 'เริ่มการจัดส่ง' },
    { value: 'delivered', label: 'จัดส่งสำเร็จ' },
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

    const { data: orders, isLoading } = useOrders({ refetchInterval: 10000 }); // Poll every 10s
    const updateStatus = useUpdateOrderStatus();

    // Notification Logic
    const previousOrderCount = useRef(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Simple beep sound data URI
        audioRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'); // Placeholder, might need real file
    }, []);

    useEffect(() => {
        if (orders) {
            if (previousOrderCount.current > 0 && orders.length > previousOrderCount.current) {
                toast("New Order Received!", {
                    description: "A new order has been placed.",
                    action: {
                        label: "View",
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
        try {
            await updateStatus.mutateAsync({
                id: trackingOrder,
                status: 'shipped',
                shippingInfo: {
                    provider: courier,
                    trackingNumber: trackingNumber,
                    cost: 0
                }
            });
            setTrackingDialogOpen(false);
            setTrackingOrder(null);
            toast.success('Order marked as shipped');
        } catch (error) {
            // Error handled by mutation
        }
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Orders</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage online orders and POS sales transactions.</p>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl text-black">
                    <Link href="/admin/pos">
                        <Plus className="mr-2 h-4 w-4" />
                        New POS Sale
                    </Link>
                </Button>
            </div>

            {/* Main Tabs for Source Filtering */}
            <Tabs defaultValue="all" value={sourceFilter} onValueChange={setSourceFilter} className="w-full">
                <TabsList className="grid w-full md:w-[400px] grid-cols-3 bg-gray-100/50 p-1 rounded-xl">
                    <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        All ({countAll})
                    </TabsTrigger>
                    <TabsTrigger value="online" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <Globe className="h-4 w-4" /> Online ({countOnline})
                    </TabsTrigger>
                    <TabsTrigger value="pos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <Store className="h-4 w-4" /> POS ({countPos})
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Secondary Filters */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Search */}
                <div className="relative md:col-span-8 lg:col-span-9">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search order ref, customer, email..."
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
                        <p className="text-lg font-medium text-gray-900">No orders found</p>
                        <p className="text-sm text-gray-500">Try adjusting your filters or search query.</p>
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
                                                <Store className="h-3.5 w-3.5" /> POS Sale
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5 py-1 px-2.5 rounded-lg shrink-0">
                                                <Globe className="h-3.5 w-3.5" /> Online
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
                                                : 'Walk-in Customer'}
                                        </span>
                                    </div>
                                </div>

                                {/* 2. Items Summary & Payment */}
                                <div className="lg:col-span-4 space-y-3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Items ordered</p>
                                        {(order.items || []).slice(0, 2).map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm text-gray-700">
                                                <span className="truncate pr-4">{item.productName}</span>
                                                <span className="text-gray-500">x{item.quantity}</span>
                                            </div>
                                        ))}
                                        {(order.items || []).length > 2 && (
                                            <p className="text-xs text-primary font-medium mt-1">
                                                +{(order.items || []).length - 2} more items...
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
                                            <span>Paid: {order.paymentMethod || 'PromptPay'}</span>
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
                                        <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
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
                            Cancel Order?
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            This action cannot be undone. This will permanently cancel the order and return items to stock.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:space-x-0">
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="w-full sm:w-auto">Keep Order</Button>
                        <Button variant="destructive" onClick={confirmCancel} className="w-full sm:w-auto">Yes, Cancel Order</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Tracking Number Dialog */}
            <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5 text-primary" />
                            Shipping Details
                        </DialogTitle>
                        <DialogDescription>
                            Enter tracking number to mark this order as shipped.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="courier">Courier</Label>
                            <Select value={courier} onValueChange={setCourier}>
                                <SelectTrigger id="courier">
                                    <SelectValue placeholder="Select courier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Flash Express">Flash Express</SelectItem>
                                    <SelectItem value="Kerry Express">Kerry Express</SelectItem>
                                    <SelectItem value="J&T Express">J&T Express</SelectItem>
                                    <SelectItem value="Thailand Post">Thailand Post</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tracking">Tracking Number</Label>
                            <Input
                                id="tracking"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="e.g. TH0123456789"
                                autoFocus
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:space-x-0">
                        <Button variant="outline" onClick={() => setTrackingDialogOpen(false)}>Cancel</Button>
                        <Button onClick={confirmTracking} disabled={!trackingNumber} className="text-white">Confirm Shipment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
