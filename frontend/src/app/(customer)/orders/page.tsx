'use client';

import { useCustomerOrders } from '@/hooks/useOrders';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Search, ShoppingBag, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getOrderStatusLabel, getOrderStatusColor } from '@/lib/order-status';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

export default function OrdersPage() {
    const router = useRouter();
    const customer = useAuthStore((state) => state.customer);
    const { data: orders, isLoading } = useCustomerOrders();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!customer) {
            router.push('/customer-login?redirect=/orders');
        }
    }, [customer, router]);

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


    const filterOrders = (statusFilter: string[]) => {
        if (!orders) return [];

        return orders.filter((order) => {
            // Filter by status
            const statusMatch = statusFilter.length === 0 || statusFilter.includes(order.orderStatus);

            // Filter by search query
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
                    <p className="text-gray-500 font-medium text-lg">ไม่พบคำสั่งซื้อ</p>
                    <p className="text-gray-400 text-sm">ยังไม่มีคำสั่งซื้อในสถานะนี้</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {filteredOrders.map((order) => (
                    <Card key={order._id} className="p-6 hover:shadow-md transition-shadow border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 pb-4 border-b border-gray-50">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-lg">
                                        <FileText className="h-4 w-4" />
                                        <h3 className="font-bold">คำสั่งซื้อ #{order.orderReference}</h3>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusColor(order.orderStatus)}`}>
                                        {getOrderStatusLabel(order.orderStatus)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(order.createdAt).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                            <Button asChild variant="outline" size="sm" className="ml-auto md:ml-0 rounded-xl hover:bg-green-50 hover:text-green-700 hover:border-green-200">
                                <Link href={`/orders/${order._id}`}>ดูรายละเอียด</Link>
                            </Button>
                        </div>

                        <div className="py-2 mb-4">
                            <div className="space-y-3">
                                {order.items.slice(0, 2).map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between text-sm items-center hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
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
                                            <div>
                                                <div className="font-medium text-gray-900">{item.productName}</div>
                                                <div className="text-xs text-gray-500">x{item.quantity}</div>
                                            </div>
                                        </div>
                                        <span className="font-medium font-kanit">
                                            ฿{(item.price * item.quantity).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                                {order.items.length > 2 && (
                                    <p className="text-xs text-gray-500 pl-14 pt-1">
                                        และสินค้าอีก {order.items.length - 2} รายการ
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end items-center gap-3 pt-2">
                            <span className="text-sm text-gray-600">ยอดรวมทั้งสิ้น:</span>
                            <span className="text-xl font-bold text-green-600 font-kanit">
                                ฿{order.totalAmount.toLocaleString()}
                            </span>
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-900">คำสั่งซื้อของฉัน</h1>
                <Button asChild className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-100">
                    <Link href="/products">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        เลือกซื้อสินค้าต่อ
                    </Link>
                </Button>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                    placeholder="ค้นหาเลขคำสั่งซื้อ หรือ ชื่อสินค้า..."
                    className="pl-10 h-12 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-6 mb-8 h-auto p-1 bg-gray-100/50 rounded-2xl gap-2 md:gap-0 no-scrollbar">
                    <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm py-2.5">ทั้งหมด</TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm py-2.5">ที่ต้องชำระ</TabsTrigger>
                    <TabsTrigger value="processing" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm py-2.5">ที่ต้องจัดส่ง</TabsTrigger>
                    <TabsTrigger value="shipped" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm py-2.5">อยู่ระหว่างส่ง</TabsTrigger>
                    <TabsTrigger value="delivered" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm py-2.5">สำเร็จ</TabsTrigger>
                    <TabsTrigger value="cancelled" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm py-2.5">ยกเลิก</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                    {renderOrderList(filterOrders([]))}
                </TabsContent>
                <TabsContent value="pending" className="mt-0">
                    {renderOrderList(filterOrders(['pending']))}
                </TabsContent>
                <TabsContent value="processing" className="mt-0">
                    {renderOrderList(filterOrders(['confirmed', 'processing']))}
                </TabsContent>
                <TabsContent value="shipped" className="mt-0">
                    {renderOrderList(filterOrders(['shipped']))}
                </TabsContent>
                <TabsContent value="delivered" className="mt-0">
                    {renderOrderList(filterOrders(['delivered']))}
                </TabsContent>
                <TabsContent value="cancelled" className="mt-0">
                    {renderOrderList(filterOrders(['cancelled']))}
                </TabsContent>
            </Tabs>
        </div>
    );
}
