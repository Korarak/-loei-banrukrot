'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle, Trophy, Clock, UserPlus, Calendar, Sun, Moon, CloudSun } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { motion, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

const COLORS = ['#10B981', '#EC4899', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444'];
const STATUS_COLORS: Record<string, string> = {
    pending: '#F59E0B',
    confirmed: '#3B82F6',
    processing: '#8B5CF6',
    shipped: '#10B981',
    delivered: '#059669',
    cancelled: '#EF4444',
    completed: '#059669',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'รอดำเนินการ',
    confirmed: 'ยืนยันแล้ว',
    processing: 'กำลังเตรียมสินค้า',
    shipped: 'อยู่ระหว่างจัดส่ง',
    delivered: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิก',
    completed: 'เสร็จสิ้น',
};

// Animation Variants
const containerVariant: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariant: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { 
            duration: 0.5, 
            ease: [0.22, 1, 0.36, 1] // Custom easeOut bezier
        } 
    }
};

// Hook for time-based greeting
function useGreeting() {
    const [greeting, setGreeting] = useState('');
    const [icon, setIcon] = useState<any>(Sun);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setGreeting('สวัสดีตอนเช้า');
            setIcon(CloudSun);
        } else if (hour >= 12 && hour < 17) {
            setGreeting('สวัสดีตอนบ่าย');
            setIcon(Sun);
        } else if (hour >= 17 && hour < 21) {
            setGreeting('สวัสดีตอนเย็น');
            setIcon(Moon);
        } else {
            setGreeting('สวัสดีตอนดึก');
            setIcon(Moon);
        }
    }, []);

    return { greeting, icon };
}

// Animated Counter Component
function AnimatedCounter({ value, prefix = '' }: { value: number | string, prefix?: string }) {
    // Simple direct render for now to avoid complex hooks setup in this file, 
    // but wrapped in motion for entrance
    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
        >
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
        </motion.span>
    );
}

export default function AdminDashboard() {
    const { data, isLoading } = useDashboardSummary();
    const { user } = useAuthStore();
    const { greeting, icon: GreetingIcon } = useGreeting();

    const stats = [
        {
            title: 'รายได้รวม',
            value: data ? data.revenue.total : 0,
            icon: DollarSign,
            description: `Pos: ฿${data?.revenue.pos.toLocaleString()} | Online: ฿${data?.revenue.online.toLocaleString()}`,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-100'
        },
        {
            title: 'คำสั่งซื้อ',
            value: data ? data.orders.total : 0,
            icon: ShoppingCart,
            description: `Pos: ${data?.orders.pos} | Online: ${data?.orders.online}`,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-100'
        },
        {
            title: 'สินค้า',
            value: data && typeof data.products === 'object' ? data.products.total : 0,
            icon: Package,
            description: 'สินค้าทั้งหมดในระบบ',
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-100'
        },
        {
            title: 'ลูกค้า',
            value: data ? data.customers : 0,
            icon: Users,
            description: 'ลูกค้าสมาชิก Active',
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            border: 'border-pink-100'
        },
    ];

    // Chart Data
    const monthlyData = data?.monthlyRevenue?.map((m: any) => ({
        name: new Date(2024, m._id - 1).toLocaleDateString('th-TH', { month: 'short' }),
        revenue: m.revenue
    })) || [];

    const pieData = data?.orderStatusDistribution?.map((s: any) => ({
        name: STATUS_LABELS[s._id] || s._id,
        value: s.count,
        color: STATUS_COLORS[s._id] || '#8884d8'
    })) || [];

    if (isLoading) {
        return (
            <div className="space-y-8 p-6">
                <div className="flex justify-between items-center mb-8">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-3xl" />
                    ))}
                </div>
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                    <Skeleton className="col-span-4 h-[400px] rounded-3xl" />
                    <Skeleton className="col-span-3 h-[400px] rounded-3xl" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="space-y-8 pb-10"
            variants={containerVariant}
            initial="hidden"
            animate="visible"
        >
            {/* Header Section */}
            <motion.div variants={itemVariant} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                        <GreetingIcon className="h-8 w-8 text-primary animate-pulse-glow" />
                        {greeting}, <span className="gradient-text-primary">{user?.username || 'Admin'}</span>
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        วันนี้คือวัน{format(new Date(), 'eeee ที่ d MMMM yyyy', { locale: th })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-2 text-sm font-bold text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        Last 30 Days
                    </div>
                </div>
            </motion.div>

            {/* Top Stats Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <motion.div key={stat.title} variants={itemVariant}>
                        <Card className={`border-0 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 rounded-[2rem] overflow-hidden group card-hover-lift`}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                    </div>
                                    <Badge variant="outline" className={`rounded-full border-0 ${stat.bg} ${stat.color} font-bold`}>
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        +12.5%
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.title}</h3>
                                    <div className="text-3xl font-black text-gray-900">
                                        <AnimatedCounter value={stat.value} prefix={stat.title === 'รายได้รวม' ? '฿' : ''} />
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium truncate">
                                        {stat.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                {/* Revenue Chart */}
                <motion.div variants={itemVariant} className="col-span-1 lg:col-span-4">
                    <Card className="border-0 shadow-lg shadow-gray-100/50 rounded-[2rem] overflow-hidden h-full">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                                รายได้รายเดือน
                            </CardTitle>
                            <CardDescription>แนวโน้มรายได้ปี 2024</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="name"
                                            stroke="#9CA3AF"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#9CA3AF"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `฿${value / 1000}k`}
                                            dx={-10}
                                        />
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F3F4F6" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                                backdropFilter: 'blur(8px)',
                                                padding: '12px'
                                            }}
                                            formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, 'รายได้']}
                                            labelStyle={{ color: '#6B7280', marginBottom: '4px', fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10B981"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Order Status Pie Chart */}
                <motion.div variants={itemVariant} className="col-span-1 lg:col-span-3">
                    <Card className="border-0 shadow-lg shadow-gray-100/50 rounded-[2rem] overflow-hidden h-full">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-purple-500" />
                                สถานะคำสั่งซื้อ
                            </CardTitle>
                            <CardDescription>ภาพรวมการจัดการออเดอร์</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full flex justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={8}
                                            dataKey="value"
                                            cornerRadius={8}
                                        >
                                            {pieData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            formatter={(value) => <span className="text-xs font-bold text-gray-600 ml-1">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-gray-900">{data ? data.orders.total : 0}</span>
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Orders</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Bottom Row: Recent Orders & Low Stock */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Recent Orders */}
                <motion.div variants={itemVariant}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 rounded-[2rem] overflow-hidden h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                <Clock className="h-5 w-5 text-blue-500" />
                                การสั่งซื้อล่าสุด
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-2xl border border-gray-50">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow className="hover:bg-transparent border-gray-100">
                                            <TableHead className="font-bold text-gray-500">ลูกค้า</TableHead>
                                            <TableHead className="font-bold text-gray-500">สถานะ</TableHead>
                                            <TableHead className="text-right font-bold text-gray-500">ยอดเงิน</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.recentOrders?.slice(0, 5).map((order: any) => (
                                            <TableRow key={order._id} className="hover:bg-gray-50/50 border-gray-50 transition-colors cursor-pointer group">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                            {order.customerId ? `${order.customerId.firstName} ${order.customerId.lastName}` : 'ลูกค้าทั่วไป'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            {format(new Date(order.orderDate), 'd MMM, HH:mm', { locale: th })}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className="rounded-lg font-bold shadow-none border-0"
                                                        style={{ backgroundColor: `${STATUS_COLORS[order.orderStatus]}20`, color: STATUS_COLORS[order.orderStatus] }}
                                                    >
                                                        {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-bold text-gray-900">฿{order.totalAmount.toLocaleString()}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Low Stock (Replaced Recent Customers for more utility) */}
                <motion.div variants={itemVariant}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 rounded-[2rem] overflow-hidden h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold flex items-center gap-2 text-red-500">
                                    <AlertTriangle className="h-5 w-5" />
                                    สินค้าใกล้หมด
                                </CardTitle>
                                <CardDescription>สต็อกเหลือน้อยกว่า 10 ชิ้น</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full text-xs font-bold">
                                ดูทั้งหมด
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {data?.lowStockProducts?.slice(0, 5).map((product: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-red-50/30 hover:bg-red-50/60 rounded-2xl border border-red-100/50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-white rounded-xl border border-red-100 flex items-center justify-center overflow-hidden shadow-sm">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.productName} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Package className="h-5 w-5 text-red-300" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-gray-900 truncate max-w-[150px] group-hover:text-red-600 transition-colors">{product.productName}</p>
                                                <p className="text-[10px] text-red-400 font-medium">SKU: {product.variants.sku}</p>
                                            </div>
                                        </div>
                                        <Badge variant="destructive" className="rounded-lg h-7 px-3 bg-red-500 hover:bg-red-600 shadow-md shadow-red-200">
                                            เหลือ {product.variants.stock}
                                        </Badge>
                                    </div>
                                ))}
                                {(!data?.lowStockProducts || data.lowStockProducts.length === 0) && (
                                    <div className="text-center py-12 flex flex-col items-center justify-center text-gray-400">
                                        <Package className="h-12 w-12 mb-3 opacity-20" />
                                        <span>สต็อกสินค้าปกติทุกรายการ</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
