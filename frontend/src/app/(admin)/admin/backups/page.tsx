'use client';

import { useState } from 'react';
import { 
    Database, 
    Download, 
    RefreshCcw, 
    AlertTriangle, 
    Clock, 
    HardDrive, 
    ChevronRight,
    Search,
    ShieldAlert,
    Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface BackupFile {
    filename: string;
    size: number;
    createdAt: string;
}

export default function AdminBackupPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch backups
    const { data: backups, isLoading, refetch } = useQuery({
        queryKey: ['backups'],
        queryFn: async () => {
            const response = await api.get('/settings/backups');
            return response.data.data as BackupFile[];
        },
    });

    // Run backup mutation
    const runBackupMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/settings/backups/run');
            return response.data;
        },
        onSuccess: () => {
            toast.success('เริ่มการสำรองข้อมูลสำเร็จ', {
                description: 'ระบบกำลังสร้างไฟล์สำรองในพื้นหลัง'
            });
            refetch();
        },
        onError: (error: any) => {
            toast.error('ไม่สามารถสำรองข้อมูลได้', {
                description: error.response?.data?.message || 'เกิดข้อผิดพลาดในการรันสคริปต์'
            });
        }
    });

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredBackups = backups?.filter(b => 
        b.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <Database className="h-8 w-8 text-primary" />
                        จัดการการสำรองข้อมูล
                    </h1>
                    <p className="text-gray-500 font-medium">จัดการไฟล์สำรองฐานข้อมูลและแผนการกู้คืนระบบ</p>
                </div>
                <Button 
                    onClick={() => runBackupMutation.mutate()}
                    disabled={runBackupMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    {runBackupMutation.isPending ? (
                        <RefreshCcw className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <RefreshCcw className="mr-2 h-5 w-5" />
                    )}
                    สำรองข้อมูลเดี๋ยวนี้ (Backup Now)
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Backup List */}
                <Card className="lg:col-span-2 border-0 shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 p-6">
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Clock className="h-5 w-5 text-gray-400" />
                                รายการไฟล์สำรองล่าสุด
                            </CardTitle>
                            <div className="relative max-w-xs w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="ค้นหาไฟล์..."
                                    className="pl-10 pr-4 py-2 w-full bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-20 text-center text-gray-400 font-medium animate-pulse">กำลังโหลดข้อมูล...</div>
                        ) : filteredBackups && filteredBackups.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/50 border-0">
                                            <TableHead className="font-bold text-gray-900 pl-6">ชื่อไฟล์</TableHead>
                                            <TableHead className="font-bold text-gray-900">วันที่สร้าง</TableHead>
                                            <TableHead className="font-bold text-gray-900">ขนาด</TableHead>
                                            <TableHead className="text-right pr-6">สถานะ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence>
                                            {filteredBackups.map((backup, idx) => (
                                                <motion.tr 
                                                    key={backup.filename}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                                                >
                                                    <TableCell className="font-bold text-gray-800 py-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                                                                <HardDrive className="h-4 w-4" />
                                                            </div>
                                                            {backup.filename}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 font-medium whitespace-nowrap">
                                                        {format(new Date(backup.createdAt), 'd MMM yyyy, HH:mm', { locale: th })}
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 font-medium">{formatSize(backup.size)}</TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-lg">สมบูรณ์แล้ว</Badge>
                                                    </TableCell>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="p-20 text-center">
                                <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="h-8 w-8 text-gray-300" />
                                </div>
                                <p className="text-gray-400 font-medium">ไม่พบไฟล์สำรองในขณะนี้</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Info & Recovery Guide */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-xl shadow-black/5 rounded-3xl overflow-hidden bg-zinc-900 text-white">
                        <CardHeader className="p-6">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-accent" />
                                นโยบายการกู้คืนด่วน
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                    เพื่อความปลอดภัยสูงสุด ระบบ **ไม่อนุญาต** ให้กู้คืนฐานข้อมูลผ่านหน้าเว็บ (Web UI) โดยตรง เนื่องจากมีความเสี่ยงในการสูญเสียข้อมูล
                                </p>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <Terminal className="h-3 w-3 text-accent" />
                                        </div>
                                        <p className="text-xs font-bold leading-normal">
                                            การกู้คืนต้องทำผ่าน SSH Terminal ของ Server เท่านั้น
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <ChevronRight className="h-3 w-3 text-emerald-500" />
                                        </div>
                                        <p className="text-xs font-bold leading-normal">
                                            ใช้งานสคริปต์กู้คืนที่เราเตรียมไว้ให้ในระบบ
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl shadow-black/5 rounded-3xl overflow-hidden bg-white border border-gray-100">
                        <CardHeader className="p-6 border-b border-gray-50">
                            <CardTitle className="text-lg font-bold">คู่มือกู้คืนฉุกเฉิน</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Restoration Command</p>
                                <div className="p-3 bg-gray-50 rounded-xl font-mono text-[10px] text-gray-700 break-all select-all leading-relaxed">
                                    sudo bash ~/loei-banrakrod/scripts/restore-db.sh [path-to-file]
                                </div>
                            </div>
                            <Button variant="outline" className="w-full rounded-xl border-gray-200 text-gray-600 font-bold text-xs py-5" asChild>
                                <a href="file:///d:/@loei-banrakrod/DISASTER_RECOVERY.md">
                                    อ่านคู่มือฉบับเต็ม (Full Guide)
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
