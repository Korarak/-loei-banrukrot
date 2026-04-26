'use client';

import { useState, useEffect } from 'react';
import { useAdminSettings, useUpdateSetting, type Setting } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Save, Landmark, Store, Trash2, AlertTriangle, ShoppingBag, ListOrdered, Users, LayoutGrid, RotateCcw } from 'lucide-react';
import api from '@/lib/api';

const SETTING_GROUPS: { label: string; icon: React.ElementType; keys: { key: string; label: string; placeholder: string }[] }[] = [
    {
        label: 'ข้อมูลบัญชีธนาคาร',
        icon: Landmark,
        keys: [
            { key: 'payment_bank_name', label: 'ชื่อธนาคาร', placeholder: 'เช่น กสิกรไทย (K-Bank)' },
            { key: 'payment_bank_account_number', label: 'เลขที่บัญชี', placeholder: 'เช่น 123-4-56789-0' },
            { key: 'payment_bank_account_name', label: 'ชื่อบัญชี', placeholder: 'เช่น บจก. บ้านรักรถ จ.เลย' },
        ],
    },
    {
        label: 'ข้อมูลร้านค้า',
        icon: Store,
        keys: [
            { key: 'store_name', label: 'ชื่อร้าน', placeholder: 'เช่น บ้านรักรถ' },
            { key: 'store_phone', label: 'เบอร์โทรร้าน', placeholder: 'เช่น 042-000-000' },
            { key: 'store_address', label: 'ที่อยู่ร้าน', placeholder: 'เช่น 519/2 ม.5 ต.เมือง อ.เมือง จ.เลย 42000' },
        ],
    },
];

const RESET_ACTIONS = [
    {
        key: 'orders',
        label: 'ล้างคำสั่งซื้อทั้งหมด',
        desc: 'ลบ Orders, รายละเอียดออเดอร์ และ Payments ทั้งหมด',
        icon: ListOrdered,
        confirmWord: 'ลบออเดอร์',
    },
    {
        key: 'products',
        label: 'ล้างสินค้าทั้งหมด',
        desc: 'ลบสินค้า, Variants, รูปภาพ และประวัติสต็อกทั้งหมด',
        icon: ShoppingBag,
        confirmWord: 'ลบสินค้า',
    },
    {
        key: 'categories',
        label: 'ล้างหมวดหมู่ทั้งหมด',
        desc: 'ลบหมวดหมู่ทั้งหมด (สินค้าที่อยู่ในหมวดหมู่จะยังคงอยู่)',
        icon: LayoutGrid,
        confirmWord: 'ลบหมวดหมู่',
    },
    {
        key: 'customers',
        label: 'ล้างข้อมูลลูกค้าทั้งหมด',
        desc: 'ลบบัญชีลูกค้า, ที่อยู่ และตะกร้าสินค้าทั้งหมด',
        icon: Users,
        confirmWord: 'ลบลูกค้า',
    },
    {
        key: 'all',
        label: 'เริ่มต้นใหม่ทั้งหมด',
        desc: 'ลบข้อมูลสินค้า, ออเดอร์, ลูกค้า และหมวดหมู่ทั้งหมด (คงไว้เฉพาะ Staff และ Settings)',
        icon: RotateCcw,
        confirmWord: 'เริ่มต้นใหม่',
        danger: true,
    },
] as const;

export default function SettingsPage() {
    const { data: settings, isLoading } = useAdminSettings();
    const updateSetting = useUpdateSetting();
    const [values, setValues] = useState<Record<string, string>>({});
    const [dirty, setDirty] = useState<Record<string, boolean>>({});

    const [resetTarget, setResetTarget] = useState<typeof RESET_ACTIONS[number] | null>(null);
    const [confirmInput, setConfirmInput] = useState('');
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        if (settings) {
            const map: Record<string, string> = {};
            for (const s of settings) map[s.key] = s.value;
            setValues(map);
            setDirty({});
        }
    }, [settings]);

    const handleChange = (key: string, val: string) => {
        setValues(prev => ({ ...prev, [key]: val }));
        setDirty(prev => ({ ...prev, [key]: true }));
    };

    const handleSave = async (key: string) => {
        try {
            await updateSetting.mutateAsync({ key, value: values[key] ?? '' });
            setDirty(prev => ({ ...prev, [key]: false }));
            toast.success('บันทึกเรียบร้อย');
        } catch {
            toast.error('บันทึกไม่สำเร็จ');
        }
    };

    const openReset = (action: typeof RESET_ACTIONS[number]) => {
        setResetTarget(action);
        setConfirmInput('');
    };

    const handleReset = async () => {
        if (!resetTarget || confirmInput !== resetTarget.confirmWord) return;
        setResetting(true);
        try {
            await api.delete(`/settings/reset/${resetTarget.key}`);
            toast.success(resetTarget.label + ' เรียบร้อยแล้ว');
            setResetTarget(null);
        } catch (err: any) {
            toast.error('เกิดข้อผิดพลาด', { description: err.response?.data?.message });
        } finally {
            setResetting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
                <p className="text-sm text-gray-500 mt-1">ข้อมูลที่ตั้งค่าที่นี่จะแสดงในหน้าชำระเงินของลูกค้า</p>
            </div>

            {SETTING_GROUPS.map(group => (
                <Card key={group.label} className="p-6 border shadow-sm rounded-2xl space-y-5">
                    <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
                        <group.icon className="h-4 w-4 text-primary" />
                        {group.label}
                    </h2>

                    {group.keys.map(({ key, label, placeholder }) => (
                        <div key={key} className="space-y-1.5">
                            <Label htmlFor={key} className="text-sm font-medium text-gray-700">{label}</Label>
                            <div className="flex gap-2">
                                <Input
                                    id={key}
                                    value={values[key] ?? ''}
                                    placeholder={placeholder}
                                    onChange={e => handleChange(key, e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    size="sm"
                                    onClick={() => handleSave(key)}
                                    disabled={!dirty[key] || updateSetting.isPending}
                                    className="shrink-0 gap-1.5"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    บันทึก
                                </Button>
                            </div>
                        </div>
                    ))}
                </Card>
            ))}

            {/* ─── Danger Zone ─── */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h2 className="font-bold text-base text-red-600">Danger Zone — เริ่มต้นใหม่</h2>
                </div>
                <p className="text-xs text-gray-500">
                    ใช้สำหรับล้างข้อมูลเพื่อเริ่มต้นร้านใหม่ การดำเนินการเหล่านี้ไม่สามารถยกเลิกได้
                </p>
                <Card className="border-red-100 rounded-2xl divide-y divide-red-50 overflow-hidden">
                    {RESET_ACTIONS.map(action => (
                        <div
                            key={action.key}
                            className={`flex items-center justify-between gap-4 px-5 py-4 ${action.danger ? 'bg-red-50/60' : 'bg-white'}`}
                        >
                            <div className="flex items-start gap-3 min-w-0">
                                <action.icon className={`h-4 w-4 mt-0.5 shrink-0 ${action.danger ? 'text-red-500' : 'text-gray-400'}`} />
                                <div className="min-w-0">
                                    <p className={`text-sm font-semibold ${action.danger ? 'text-red-700' : 'text-gray-800'}`}>
                                        {action.label}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className={`shrink-0 gap-1.5 ${action.danger ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                onClick={() => openReset(action)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                ล้างข้อมูล
                            </Button>
                        </div>
                    ))}
                </Card>
            </div>

            {/* ─── Confirm Dialog ─── */}
            <Dialog open={!!resetTarget} onOpenChange={(o) => { if (!o) setResetTarget(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            {resetTarget?.label}
                        </DialogTitle>
                        <DialogDescription className="pt-1">
                            {resetTarget?.desc}
                            <br /><br />
                            การดำเนินการนี้<strong>ไม่สามารถยกเลิกได้</strong> กรุณาพิมพ์{' '}
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-700 font-bold text-sm">
                                {resetTarget?.confirmWord}
                            </code>{' '}
                            เพื่อยืนยัน
                        </DialogDescription>
                    </DialogHeader>

                    <Input
                        value={confirmInput}
                        onChange={e => setConfirmInput(e.target.value)}
                        placeholder={resetTarget?.confirmWord}
                        className="mt-2"
                        onKeyDown={e => e.key === 'Enter' && confirmInput === resetTarget?.confirmWord && handleReset()}
                        autoFocus
                    />

                    <DialogFooter className="gap-2 mt-4">
                        <Button variant="outline" onClick={() => setResetTarget(null)}>ยกเลิก</Button>
                        <Button
                            variant="destructive"
                            onClick={handleReset}
                            disabled={confirmInput !== resetTarget?.confirmWord || resetting}
                        >
                            {resetting ? 'กำลังลบ...' : 'ยืนยัน ลบข้อมูล'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
