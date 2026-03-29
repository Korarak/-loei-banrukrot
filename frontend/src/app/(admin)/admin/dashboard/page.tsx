'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Trophy, Clock, Calendar, Sun, Moon, CloudSun, BarChart3, PieChart as PieChartIcon, Activity, UserPlus, Repeat, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSummary, useDailyRevenue, useTopCategories } from '@/hooks/useDashboard';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
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

const CATEGORY_COLORS = ['#10B981', '#3B82F6', '#EC4899', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];

// Animation Variants
const containerVariant: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariant: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1]
        }
    }
};

type DateRange = '7d' | '30d' | '90d';

const RANGE_LABELS: Record<DateRange, string> = {
    '7d': '7 วัน',
    '30d': '30 วัน',
    '90d': '90 วัน',
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

// Change Indicator
function ChangeIndicator({ value }: { value: number }) {
    if (value === 0) return <span className="text-gray-400 text-xs font-medium">ไม่เปลี่ยนแปลง</span>;
    const isPositive = value > 0;
    return (
        <Badge variant="outline" className={`rounded-full border-0 font-bold text-xs gap-0.5 ${isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {isPositive ? '+' : ''}{value}%
        </Badge>
    );
}

export default function AdminDashboard() {
    const [dateRange, setDateRange] = useState<DateRange>('30d');
    const params = { range: dateRange };

    const { data, isLoading } = useDashboardSummary(params);
    const { data: dailyData, isLoading: dailyLoading } = useDailyRevenue(params);
    const { data: topCategoriesData } = useTopCategories(params);

    const { user } = useAuthStore();
    const { greeting, icon: GreetingIcon } = useGreeting();

    const stats = [
        {
            title: 'รายได้รวม',
            value: data ? data.revenue.total : 0,
            icon: DollarSign,
            description: `หน้าร้าน: ฿${data?.revenue.pos?.toLocaleString() || 0} | ออนไลน์: ฿${data?.revenue.online?.toLocaleString() || 0}`,
            change: data?.revenue?.change ?? 0,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
        },
        {
            title: 'คำสั่งซื้อ',
            value: data ? data.orders.total : 0,
            icon: ShoppingCart,
            description: `หน้าร้าน: ${data?.orders.pos || 0} | ออนไลน์: ${data?.orders.online || 0}`,
            change: data?.orders?.change ?? 0,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
        },
        {
            title: 'ลูกค้าสมาชิก',
            value: data ? data.customers : 0,
            icon: Users,
            description: 'Active ทั้งหมดในระบบ',
            change: data?.customersChange ?? 0,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            iconBg: 'bg-gradient-to-br from-pink-500 to-pink-600',
        },
        {
            title: 'ยอดเฉลี่ย/ออเดอร์',
            value: data ? data.avgOrderValue : 0,
            icon: Activity,
            description: 'Average Order Value',
            change: data?.avgOrderValueChange ?? 0,
            color: 'text-violet-500',
            bg: 'bg-violet-500/10',
            iconBg: 'bg-gradient-to-br from-violet-500 to-violet-600',
        },
    ];

    // Chart Data
    const monthlyData = data?.monthlyRevenue?.map((m: any) => ({
        name: new Date(2024, m._id - 1).toLocaleDateString('th-TH', { month: 'short' }),
        revenue: m.revenue,
        orders: m.orders || 0
    })) || [];

    const pieData = data?.orderStatusDistribution?.map((s: any) => ({
        name: STATUS_LABELS[s._id] || s._id,
        value: s.count,
        color: STATUS_COLORS[s._id] || '#8884d8'
    })) || [];

    // Daily Revenue Chart Data
    const dailyChartData = (dailyData || []).map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        revenue: d.revenue,
        pos: d.posRevenue,
        online: d.onlineRevenue,
        orders: d.orders
    }));

    // Top Categories for Pie
    const categoryPieData = (topCategoriesData || []).map((c: any, i: number) => ({
        name: c.categoryName,
        value: c.revenue,
        items: c.itemsSold,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
    }));

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
                        <Skeleton key={i} className="h-36 rounded-3xl" />
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
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                        <GreetingIcon className="h-7 w-7 md:h-8 md:w-8 text-primary animate-pulse-glow" />
                        {greeting}, <span className="gradient-text-primary">{user?.username || 'Admin'}</span>
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium text-sm md:text-base">
                        วันนี้คือวัน{format(new Date(), 'eeee ที่ d MMMM yyyy', { locale: th })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {(['7d', '30d', '90d'] as DateRange[]).map((range) => (
                        <Button
                            key={range}
                            variant={dateRange === range ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDateRange(range)}
                            className={`rounded-full text-xs font-bold transition-all ${
                                dateRange === range
                                    ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Calendar className="h-3 w-3 mr-1" />
                            {RANGE_LABELS[range]}
                        </Button>
                    ))}
                </div>
            </motion.div>

            {/* Top Stats Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <motion.div key={stat.title} variants={itemVariant}>
                        <Card className="border-0 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 rounded-[2rem] overflow-hidden group card-hover-lift">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`h-12 w-12 rounded-2xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                        <stat.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <ChangeIndicator value={stat.change} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.title}</h3>
                                    <div className="text-3xl font-black text-gray-900">
                                        <AnimatedCounter value={stat.value} prefix={stat.title === 'รายได้รวม' || stat.title === 'ยอดเฉลี่ย/ออเดอร์' ? '฿' : ''} />
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

            {/* Daily Revenue Chart + Order Status */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                {/* Daily Revenue Bar Chart */}
                <motion.div variants={itemVariant} className="col-span-1 lg:col-span-4">
                    <Card className="border-0 shadow-lg shadow-gray-100/50 rounded-[2rem] overflow-hidden h-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-blue-500" />
                                        รายได้รายวัน
                                    </CardTitle>
                                    <CardDescription>{RANGE_LABELS[dateRange]}ที่ผ่านมา • แยก POS vs ออนไลน์</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <div className="h-[350px] w-full">
                                {dailyLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Skeleton className="w-full h-full rounded-2xl mx-6" />
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dailyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.9} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.6} />
                                                </linearGradient>
                                                <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.6} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="date"
                                                stroke="#9CA3AF"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                                interval={dateRange === '7d' ? 0 : dateRange === '30d' ? 4 : 13}
                                            />
                                            <YAxis
                                                stroke="#9CA3AF"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `฿${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                                                dx={-10}
                                            />
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F3F4F6" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                    borderRadius: '16px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                                    backdropFilter: 'blur(8px)',
                                                    padding: '12px'
                                                }}
                                                formatter={(value: any, name: string) => [
                                                    `฿${Number(value).toLocaleString()}`,
                                                    name === 'pos' ? 'หน้าร้าน' : 'ออนไลน์'
                                                ]}
                                                labelStyle={{ color: '#6B7280', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}
                                            />
                                            <Bar dataKey="pos" stackId="revenue" fill="url(#colorPos)" radius={[0, 0, 0, 0]} barSize={dateRange === '7d' ? 40 : dateRange === '30d' ? 12 : 6} />
                                            <Bar dataKey="online" stackId="revenue" fill="url(#colorOnline)" radius={[4, 4, 0, 0]} barSize={dateRange === '7d' ? 40 : dateRange === '30d' ? 12 : 6} />
                                            <Legend
                                                verticalAlign="top"
                                                height={36}
                                                iconType="circle"
                                                formatter={(value) => (
                                                    <span className="text-xs font-bold text-gray-600 ml-1">
                                                        {value === 'pos' ? 'หน้าร้าน (POS)' : 'ออนไลน์'}
                                                    </span>
                                                )}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Order Status Pie Chart */}
                <motion.div variants={itemVariant} className="col-span-1 lg:col-span-3">
                    <Card className="border-0 shadow-lg shadow-gray-100/50 rounded-[2rem] overflow-hidden h-full">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-purple-500" />
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
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginBottom: '36px' }}>
                                    <span className="text-3xl font-black text-gray-900">{data ? data.orders.total : 0}</span>
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">ออเดอร์</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Monthly Revenue + Top Categories */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                {/* Monthly Revenue Trend */}
                <motion.div variants={itemVariant} className="col-span-1 lg:col-span-4">
                    <Card className="border-0 shadow-lg shadow-gray-100/50 rounded-[2rem] overflow-hidden h-full">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                                รายได้รายเดือน
                            </CardTitle>
                            <CardDescription>แนวโน้มรายได้ทั้งปี</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value / 1000}k`} dx={-10} />
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F3F4F6" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                                backdropFilter: 'blur(8px)',
                                                padding: '12px'
                                            }}
                                            formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, 'รายได้']}
                                            labelStyle={{ color: '#6B7280', marginBottom: '4px', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1500} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Top Categories */}
                <motion.div variants={itemVariant} className="col-span-1 lg:col-span-3">
                    <Card className="border-0 shadow-lg shadow-gray-100/50 rounded-[2rem] overflow-hidden h-full">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                หมวดหมู่ขายดี
                            </CardTitle>
                            <CardDescription>เรียงตามรายได้</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {categoryPieData.length > 0 ? (
                                <div className="space-y-3">
                                    {categoryPieData.slice(0, 5).map((cat: any, i: number) => {
                                        const maxRevenue = categoryPieData[0]?.value || 1;
                                        const percentage = Math.round((cat.value / maxRevenue) * 100);
                                        return (
                                            <div key={i} className="group">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                                        <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors truncate max-w-[140px]">{cat.name}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">฿{cat.value.toLocaleString()}</span>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: cat.color }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">{cat.items} ชิ้น</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 flex flex-col items-center justify-center text-gray-400">
                                    <Trophy className="h-12 w-12 mb-3 opacity-20" />
                                    <span>ยังไม่มีข้อมูลหมวดหมู่</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Top Selling Products + Recent Orders */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Top Selling Products */}
                <motion.div variants={itemVariant}>
                    <Card className="border-0 shadow-lg shadow-gray-100/50 rounded-[2rem] overflow-hidden h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                                สินค้าขายดี
                            </CardTitle>
                            <CardDescription>{RANGE_LABELS[dateRange]}ที่ผ่านมา</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data?.topSellingProducts && data.topSellingProducts.length > 0 ? (
                                <div className="space-y-3">
                                    {data.topSellingProducts.map((product: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 rounded-2xl transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md ${
                                                    i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                                                    i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                                    i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                                                    'bg-gradient-to-br from-gray-200 to-gray-400'
                                                }`}>
                                                    #{i + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-gray-900 truncate max-w-[180px] group-hover:text-primary transition-colors">{product._id}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">ขายไป {product.totalSold} ชิ้น</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-emerald-600 text-sm">฿{product.revenue.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 flex flex-col items-center justify-center text-gray-400">
                                    <Package className="h-12 w-12 mb-3 opacity-20" />
                                    <span>ยังไม่มีข้อมูลสินค้า</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

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
                                                        <span className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">
                                                            {order.customerId ? `${order.customerId.firstName} ${order.customerId.lastName}` : 'ลูกค้าทั่วไป'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            {format(new Date(order.orderDate), 'd MMM, HH:mm', { locale: th })}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className="rounded-lg font-bold shadow-none border-0 text-xs"
                                                        style={{ backgroundColor: `${STATUS_COLORS[order.orderStatus]}20`, color: STATUS_COLORS[order.orderStatus] }}
                                                    >
                                                        {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-bold text-gray-900 text-sm">฿{order.totalAmount.toLocaleString()}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Low Stock Products */}
            <motion.div variants={itemVariant}>
                <Card className="border-0 shadow-lg shadow-gray-100/50 rounded-[2rem] overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2 text-red-500">
                                <AlertTriangle className="h-5 w-5" />
                                สินค้าใกล้หมด
                            </CardTitle>
                            <CardDescription>สต็อกเหลือน้อยกว่า 10 ชิ้น</CardDescription>
                        </div>
                        <Badge variant="outline" className="rounded-full border-red-200 text-red-500 font-bold">
                            {data?.lowStockProducts?.length || 0} รายการ
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
                            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {data.lowStockProducts.slice(0, 6).map((product: any, i: number) => (
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
                            </div>
                        ) : (
                            <div className="text-center py-12 flex flex-col items-center justify-center text-gray-400">
                                <Package className="h-12 w-12 mb-3 opacity-20" />
                                <span>สต็อกสินค้าปกติทุกรายการ ✅</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
