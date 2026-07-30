'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { KeyRound, Loader2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import api from '@/lib/api';

const formSchema = z.object({
    password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
});

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', { token, password: values.password });
            toast.success('ตั้งรหัสผ่านใหม่เรียบร้อย', { description: 'กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่' });
            router.push('/customer-login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ');
        } finally {
            setIsLoading(false);
        }
    }

    // ไม่มี token ในลิงก์ = เข้ามาหน้านี้ตรงๆ ไม่ได้มาจากอีเมล
    if (!token) {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="space-y-4 text-center py-10">
                    <div className="mx-auto w-14 h-14 bg-gray-100 flex items-center justify-center">
                        <TriangleAlert className="h-6 w-6 text-gray-600" />
                    </div>
                    <p className="text-base font-bold text-gray-900">ลิงก์ไม่ถูกต้อง</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        กรุณาเปิดหน้านี้จากลิงก์ในอีเมลที่เราส่งให้ หรือขอลิงก์ใหม่อีกครั้ง
                    </p>
                    <Button asChild className="w-full h-12 uppercase tracking-widest">
                        <Link href="/forgot-password">ขอลิงก์ใหม่</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-2 pt-8">
                <div className="font-display uppercase text-3xl text-center text-gray-900 leading-none">New Password</div>
                <CardTitle className="text-lg font-bold tracking-tight text-center text-muted-foreground">
                    ตั้งรหัสผ่านใหม่
                </CardTitle>
                <CardDescription className="text-center text-gray-600 font-medium">
                    ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">รหัสผ่านใหม่</FormLabel>
                                    <FormControl>
                                        <Input type="password" autoComplete="new-password" placeholder="••••••" className="h-12 font-medium" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">ยืนยันรหัสผ่านใหม่</FormLabel>
                                    <FormControl>
                                        <Input type="password" autoComplete="new-password" placeholder="••••••" className="h-12 font-medium" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full h-12 text-base uppercase tracking-widest" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    บันทึกรหัสผ่านใหม่
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-center text-gray-600">
                    <Link href="/customer-login" className="text-primary hover:underline font-medium">
                        กลับไปหน้าเข้าสู่ระบบ
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-gray-400" />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
