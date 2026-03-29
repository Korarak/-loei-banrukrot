'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, PackageSearch, UsersRound, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useSalesReport, useProductReport, useCustomerReport, downloadReportCSV } from '@/hooks/useReports';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function ReportsPage() {
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30);
    const defaultEnd = new Date();

    const [startDate, setStartDate] = useState(format(defaultStart, 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(defaultEnd, 'yyyy-MM-dd'));
    
    // For submitting search
    const [appliedRange, setAppliedRange] = useState({ startDate, endDate });

    const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'customers'>('sales');

    const handleSearch = () => {
        setAppliedRange({ startDate, endDate });
    };

    const handleExport = async () => {
        await downloadReportCSV(activeTab, appliedRange);
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        รายงานระบบ
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">ดูข้อมูลสรุปและส่งออกข้อมูล (Export CSV) เพื่อการวิเคราะห์</p>
                </div>
            </div>

            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-auto space-y-2 flex-grow max-w-xs">
                            <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input 
                                    id="startDate"
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    className="pl-10 rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-auto space-y-2 flex-grow max-w-xs">
                            <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input 
                                    id="endDate"
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                    className="pl-10 rounded-xl"
                                />
                            </div>
                        </div>
                        <Button 
                            onClick={handleSearch} 
                            className="w-full md:w-auto rounded-xl px-8 shadow-md"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            ค้นหา
                        </Button>
                        <Button 
                            onClick={handleExport} 
                            variant="outline"
                            className="w-full md:w-auto rounded-xl px-6 border-primary/20 hover:bg-primary/5 text-primary"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="sales" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md bg-gray-100/50 p-1 rounded-xl">
                    <TabsTrigger value="sales" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        ยอดขาย
                    </TabsTrigger>
                    <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        สินค้า
                    </TabsTrigger>
                    <TabsTrigger value="customers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        ลูกค้า
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="mt-6">
                    <TabSales params={appliedRange} />
                </TabsContent>

                <TabsContent value="products" className="mt-6">
                    <TabProducts params={appliedRange} />
                </TabsContent>

                <TabsContent value="customers" className="mt-6">
                    <TabCustomers params={appliedRange} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ----------------------------------------------------------------------

function TabSales({ params }: { params: any }) {
    const { data: salesReport, isLoading } = useSalesReport(params);

    if (isLoading) return <ReportSkeleton />;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Card className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-6">
                        <p className="text-sm font-bold text-gray-500 mb-1">รายได้รวมทั้งหมด</p>
                        <h3 className="text-3xl font-black text-emerald-600">฿{(salesReport?.summary?.totalRevenue || 0).toLocaleString()}</h3>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-6">
                        <p className="text-sm font-bold text-gray-500 mb-1">จำนวนออเดอร์</p>
                        <h3 className="text-3xl font-black text-blue-600">{(salesReport?.summary?.totalOrders || 0).toLocaleString()}</h3>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-6">
                        <p className="text-sm font-bold text-gray-500 mb-1">ค่าจัดส่งรวม</p>
                        <h3 className="text-3xl font-black text-violet-600">฿{(salesReport?.summary?.totalShipping || 0).toLocaleString()}</h3>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 pb-4">
                    <CardTitle className="text-lg">รายงานยอดขายรายวัน</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px] font-bold">วันที่</TableHead>
                                <TableHead className="font-bold text-right">จำนวนออเดอร์</TableHead>
                                <TableHead className="font-bold text-right">รายได้ (ไม่รวมค่าส่ง)</TableHead>
                                <TableHead className="font-bold text-right">ค่าจัดส่ง</TableHead>
                                <TableHead className="font-bold text-right text-emerald-600">ยอดรวมทั้งสิ้น</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salesReport?.dailyData?.map((item: any) => (
                                <TableRow key={item._id} className="hover:bg-gray-50/50">
                                    <TableCell className="font-medium text-gray-900">
                                        {format(new Date(item._id), 'd MMM yyyy', { locale: th })}
                                    </TableCell>
                                    <TableCell className="text-right">{item.ordersCount}</TableCell>
                                    <TableCell className="text-right">฿{(item.revenue - (item.shippingCost || 0)).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">฿{(item.shippingCost || 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600">฿{item.revenue.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                            {!salesReport?.dailyData?.length && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                        ไม่พบข้อมูลในช่วงเวลาที่เลือก
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ----------------------------------------------------------------------

function TabProducts({ params }: { params: any }) {
    const { data: productsReport, isLoading } = useProductReport(params);

    if (isLoading) return <ReportSkeleton />;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 pb-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PackageSearch className="h-5 w-5 text-amber-500" />
                            รายงานสินค้าเรียงตามยอดขาย
                        </CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-white">
                        {productsReport?.length || 0} รายการ
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">ลำดับ</TableHead>
                                <TableHead className="font-bold">รหัส (SKU)</TableHead>
                                <TableHead className="font-bold min-w-[200px]">ชื่อสินค้า</TableHead>
                                <TableHead className="font-bold text-right">จำนวนที่ขายได้</TableHead>
                                <TableHead className="font-bold text-right text-emerald-600">รายได้รวม</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productsReport?.map((item: any, i: number) => (
                                <TableRow key={`product-${item.sku}-${i}`} className="hover:bg-gray-50/50">
                                    <TableCell className="text-gray-500 font-medium">{i + 1}</TableCell>
                                    <TableCell className="font-medium">
                                        <Badge variant="secondary" className="font-mono text-xs">{item.sku}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-900 truncate max-w-[300px]" title={item.productName}>
                                        {item.productName}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{item.itemsSold}</TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600">฿{item.revenue.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                            {!productsReport?.length && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                        ไม่พบข้อมูลในช่วงเวลาที่เลือก
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ----------------------------------------------------------------------

function TabCustomers({ params }: { params: any }) {
    const { data: customersReport, isLoading } = useCustomerReport(params);

    if (isLoading) return <ReportSkeleton />;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 pb-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UsersRound className="h-5 w-5 text-pink-500" />
                            รายงานลูกค้า Top Spenders
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">ลำดับ</TableHead>
                                <TableHead className="font-bold min-w-[200px]">ชื่อ-นามสกุล</TableHead>
                                <TableHead className="font-bold">ช่องทางติดต่อ</TableHead>
                                <TableHead className="font-bold text-right">จำนวนออเดอร์</TableHead>
                                <TableHead className="font-bold text-right text-emerald-600">ยอดซื้อรวม</TableHead>
                                <TableHead className="font-bold text-right">สั่งซื้อล่าสุด</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customersReport?.map((item: any, i: number) => (
                                <TableRow key={`customer-${item._id}`} className="hover:bg-gray-50/50">
                                    <TableCell className="text-gray-500 font-medium">{i + 1}</TableCell>
                                    <TableCell className="font-bold text-gray-900">
                                        {item.firstName} {item.lastName}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                                            <span>{item.email}</span>
                                            {item.phone && <span>{item.phone}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-blue-600">{item.ordersCount}</TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600">฿{item.totalSpent.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-xs text-gray-500">
                                        {format(new Date(item.lastOrderDate), 'd MMM yyyy', { locale: th })}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!customersReport?.length && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                        ไม่พบข้อมูลในช่วงเวลาที่เลือก
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ----------------------------------------------------------------------

function ReportSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
            </div>
            <Skeleton className="h-[400px] rounded-2xl w-full" />
        </div>
    );
}
