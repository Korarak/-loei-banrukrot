'use client';

import { usePOSSales } from '@/hooks/usePOS';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Receipt, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function POSHistoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const { data: sales, isLoading } = usePOSSales();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Filter sales
    const filteredSales = sales?.filter((sale) => {
        const matchesSearch =
            (sale.saleReference?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (sale.createdBy?.username?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        let matchesDate = true;
        const saleDate = new Date(sale.createdAt);

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            matchesDate = matchesDate && saleDate >= start;
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && saleDate <= end;
        }

        return matchesSearch && matchesDate;
    }) || [];

    // Sort by date desc
    filteredSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" asChild className="hover:text-primary hover:bg-primary/10">
                    <Link href="/admin/pos">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        กลับไปหน้าขาย (Back to POS)
                    </Link>
                </Button>
            </div>

            <div>
                <h1 className="text-3xl font-bold text-primary">ประวัติการขายหน้าร้าน (POS History)</h1>
                <p className="text-gray-500 mt-1">ดูรายการขายและใบเสร็จรับเงินทั้งหมด</p>
            </div>

            {/* Filters */}
            <Card className="p-6 border-none shadow-md bg-white/50 backdrop-blur-sm">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    {/* Search */}
                    <div className="md:col-span-5 space-y-2">
                        <label className="text-sm font-medium text-gray-700">ค้นหา (Search)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="เลขที่ใบเสร็จ หรือ ชื่อพนักงาน..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 focus-visible:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="md:col-span-3 space-y-2">
                        <label className="text-sm font-medium text-gray-700">ตั้งแต่วันที่</label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="focus-visible:ring-primary"
                        />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                        <label className="text-sm font-medium text-gray-700">ถึงวันที่</label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="focus-visible:ring-primary"
                        />
                    </div>

                    {/* Clear Filter */}
                    <div className="md:col-span-1">
                        <Button
                            variant="outline"
                            className="w-full text-gray-500 hover:text-red-500 hover:border-red-200"
                            onClick={() => {
                                setSearchQuery('');
                                setStartDate('');
                                setEndDate('');
                            }}
                            title="ล้างตัวกรอง"
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Results Summary */}
            <div className="flex justify-between items-center px-2">
                <p className="text-sm text-gray-600">
                    แสดง {filteredSales.length} จาก {sales?.length || 0} รายการ
                </p>
            </div>

            {/* Sales List */}
            <div className="space-y-4">
                {filteredSales.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Receipt className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg">ไม่พบข้อมูลการขาย</p>
                        <p className="text-sm text-gray-400">ลองปรับเปลี่ยนตัวกรองค้นหา</p>
                    </Card>
                ) : (
                    filteredSales.map((sale) => (
                        <Card key={sale._id} className="p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                {/* Sale Info */}
                                <div className="lg:col-span-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <Receipt className="h-4 w-4 text-primary" />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-800">
                                            #{sale.saleReference}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-600 pl-10">พนักงาน: {sale.createdBy?.username}</p>
                                    <p className="text-xs text-gray-400 pl-10 mt-1 flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {new Date(sale.createdAt).toLocaleDateString('th-TH', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>

                                {/* Items Summary */}
                                <div className="lg:col-span-4">
                                    <p className="text-sm font-medium mb-2 text-gray-700">รายการสินค้า:</p>
                                    <div className="space-y-1 bg-gray-50 p-2 rounded-md">
                                        {(sale.items || []).slice(0, 2).map((item, idx) => (
                                            <p key={idx} className="text-sm text-gray-600 flex justify-between">
                                                <span>{item.product?.productName || 'Unknown Product'}</span>
                                                <span className="text-gray-400">x{item.quantity}</span>
                                            </p>
                                        ))}
                                        {(sale.items || []).length > 2 && (
                                            <p className="text-xs text-primary font-medium">
                                                +{sale.items.length - 2} รายการเพิ่มเติม
                                            </p>
                                        )}
                                        {(!sale.items || sale.items.length === 0) && (
                                            <p className="text-sm text-gray-400 italic">ไม่มีรายการสินค้า</p>
                                        )}
                                    </div>
                                </div>


                                {/* Amount */}
                                <div className="lg:col-span-3 text-right lg:text-right">
                                    <p className="text-sm text-gray-600 mb-1">ยอดรวมสุทธิ</p>
                                    <p className="text-2xl font-bold text-primary">
                                        ฿{sale.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                    <span className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full mt-2 border border-green-100">
                                        Payment: {sale.paymentMethod}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="lg:col-span-1 flex items-center justify-end">
                                    <Button variant="outline" size="icon" asChild className="hover:bg-primary hover:text-white transition-colors">
                                        <Link href={`/admin/pos/receipt/${sale.saleReference}`} title="ดูใบเสร็จ">
                                            <Receipt className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
