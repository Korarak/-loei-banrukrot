'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/useAuthStore';
import api from '@/lib/api';

const formSchema = z.object({
    username: z.string().min(3, {
        message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร',
    }),
    email: z.string().email({
        message: 'กรุณากรอกอีเมลที่ถูกต้อง',
    }),
    password: z.string().min(6, {
        message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
    }),
});

export default function RegisterPage() {
    const router = useRouter();
    const loginUser = useAuthStore((state) => state.loginUser);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/register', values);

            if (response.data.success) {
                loginUser(response.data.data, response.data.data.token);
                router.push('/admin/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'การลงทะเบียนล้มเหลว');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">สร้างบัญชีใหม่</h1>
                <p className="text-gray-500">ลงทะเบียนบัญชีสำหรับผู้ดูแลระบบ</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
                    {error}
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ชื่อผู้ใช้</FormLabel>
                                <FormControl>
                                    <Input placeholder="johndoe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>อีเมล</FormLabel>
                                <FormControl>
                                    <Input placeholder="admin@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>รหัสผ่าน</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="******" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full text-black" disabled={isLoading}>
                        {isLoading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
                    </Button>
                </form>
            </Form>

            <div className="text-center text-sm">
                <Link href="/login" className="text-primary hover:underline">
                    มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                </Link>
            </div>
        </div>
    );
}
