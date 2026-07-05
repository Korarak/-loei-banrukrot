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
        <div className="space-y-8">
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                    Staff Only
                </div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900">
                    สร้างบัญชี<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-red-900">พนักงาน</span>
                </h1>
                <p className="text-gray-400 text-sm font-medium">ลงทะเบียนบัญชีสำหรับพนักงานและผู้ดูแลระบบ</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-2xl text-sm font-bold text-center">
                    {error}
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">ชื่อผู้ใช้</FormLabel>
                                <FormControl>
                                    <Input autoComplete="username" placeholder="johndoe" className="h-12 rounded-xl bg-gray-50 border-2 border-transparent focus-visible:border-primary focus-visible:bg-white transition-all font-medium" {...field} />
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
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">อีเมล</FormLabel>
                                <FormControl>
                                    <Input type="email" autoComplete="email" placeholder="admin@example.com" className="h-12 rounded-xl bg-gray-50 border-2 border-transparent focus-visible:border-primary focus-visible:bg-white transition-all font-medium" {...field} />
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
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">รหัสผ่าน</FormLabel>
                                <FormControl>
                                    <Input type="password" autoComplete="new-password" placeholder="••••••" className="h-12 rounded-xl bg-gray-50 border-2 border-transparent focus-visible:border-primary focus-visible:bg-white transition-all font-medium" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="submit"
                        className="w-full h-12 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-base uppercase tracking-widest shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                        disabled={isLoading}
                    >
                        {isLoading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
                    </Button>
                </form>
            </Form>

            <div className="text-center text-sm text-gray-400 font-medium">
                มีบัญชีอยู่แล้ว?{' '}
                <Link href="/login" className="text-primary hover:underline font-bold">
                    เข้าสู่ระบบ
                </Link>
            </div>
        </div>
    );
}
