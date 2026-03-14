'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { useMe, useUpdateMe } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User, Camera } from 'lucide-react';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

export default function AdminProfilePage() {
    const user = useAuthStore((state) => state.user);
    const updateAuthUser = useAuthStore((state) => state.updateUser);
    const { data: me } = useMe();
    const updateMe = useUpdateMe();

    const [isUploading, setIsUploading] = useState(false);
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (me) {
            setForm({
                username: me.username,
                email: me.email,
                password: '',
                confirmPassword: ''
            });
            // Update auth store with latest data if needed
            if (user && !user.profilePicture && me.profilePicture) {
                updateAuthUser({ profilePicture: me.profilePicture });
            }
        }
    }, [me, user, updateAuthUser]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.password && form.password !== form.confirmPassword) {
            toast.error('รหัสผ่านไม่ตรงกัน');
            return;
        }

        try {
            const updateData: any = {
                username: form.username,
                email: form.email,
            };

            if (form.password) {
                updateData.password = form.password;
            }

            const updatedUser = await updateMe.mutateAsync(updateData);
            updateAuthUser(updatedUser);
            toast.success('อัปเดตโปรไฟล์สำเร็จ');
            setForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'ไม่สามารถอัปเดตโปรไฟล์ได้');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('profile', file);

        try {
            const res = await api.post('/upload/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const imagePath = res.data.data.imagePath;

            const updatedUser = await updateMe.mutateAsync({ profilePicture: imagePath });
            updateAuthUser(updatedUser);
            toast.success('อัปเดตรูปโปรไฟล์แล้ว');
        } catch (error) {
            console.error(error);
            toast.error('ไม่สามารถอัปโหลดรูปโปรไฟล์ได้');
        } finally {
            setIsUploading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">โปรไฟล์ผู้ดูแลระบบ</h1>

            <div className="grid gap-8">
                {/* Profile Header */}
                <div className="flex flex-col items-center mb-2">
                    <div className="relative group">
                        <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                            {(user.profilePicture || me?.profilePicture) ? (
                                <img
                                    src={getImageUrl(user.profilePicture || me?.profilePicture)}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <User className="h-12 w-12 text-gray-400" />
                            )}
                        </div>
                        <label
                            htmlFor="admin-profile-upload"
                            className="absolute bottom-0 right-0 p-2 bg-black text-white rounded-full cursor-pointer hover:bg-gray-800 transition-colors shadow-md"
                        >
                            {isUploading ? (
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Camera className="h-4 w-4" />
                            )}
                            <input
                                id="admin-profile-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                    <div className="mt-4 text-center">
                        <h2 className="text-xl font-bold">{user.username}</h2>
                        <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>รายละเอียดบัญชี</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">ชื่อผู้ใช้</Label>
                                    <Input
                                        id="username"
                                        value={form.username}
                                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">อีเมล</Label>
                                    <Input
                                        id="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-4">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">เปลี่ยนรหัสผ่าน</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="password">รหัสผ่านใหม่</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    />
                                </div>
                                {form.password && (
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={form.confirmPassword}
                                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={updateMe.isPending}>
                                    {updateMe.isPending ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
