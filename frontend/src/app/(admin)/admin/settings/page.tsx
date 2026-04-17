'use client';

import { useState, useEffect } from 'react';
import { useAdminSettings, useUpdateSetting, type Setting } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Landmark, Store } from 'lucide-react';

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
        ],
    },
];

export default function SettingsPage() {
    const { data: settings, isLoading } = useAdminSettings();
    const updateSetting = useUpdateSetting();
    const [values, setValues] = useState<Record<string, string>>({});
    const [dirty, setDirty] = useState<Record<string, boolean>>({});

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
        </div>
    );
}
