'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, MailCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import api from '@/lib/api';

const formSchema = z.object({
    email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
});

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [sentTo, setSentTo] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: '' },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', values);
            // backend ตอบ 200 เสมอไม่ว่าจะมีบัญชีนั้นจริงไหม หน้านี้จึงพูดแบบกลางๆ ตาม
            setSentTo(values.email);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-2 pt-8">
                    <div className="font-display uppercase text-3xl text-center text-gray-900 leading-none">Reset</div>
                    <CardTitle className="text-lg font-bold tracking-tight text-center text-muted-foreground">
                        ลืมรหัสผ่าน
                    </CardTitle>
                    <CardDescription className="text-center text-gray-600 font-medium">
                        กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sentTo ? (
                        <div className="space-y-4 text-center py-4">
                            <div className="mx-auto w-14 h-14 bg-gray-100 flex items-center justify-center">
                                <MailCheck className="h-6 w-6 text-gray-600" />
                            </div>
                            <p className="text-sm font-bold text-gray-900">ส่งอีเมลเรียบร้อยแล้ว</p>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                ถ้า <span className="font-bold text-gray-900">{sentTo}</span> มีบัญชีอยู่ในระบบ
                                คุณจะได้รับลิงก์ตั้งรหัสผ่านใหม่ภายในไม่กี่นาที ลิงก์ใช้ได้ 1 ชั่วโมง
                            </p>
                            <p className="text-xs text-gray-500">
                                ไม่เจออีเมล? ลองดูในโฟลเดอร์จดหมายขยะ (Spam)
                            </p>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">อีเมล</FormLabel>
                                            <FormControl>
                                                <Input type="email" autoComplete="email" placeholder="name@example.com" className="h-12 font-medium" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full h-12 text-base uppercase tracking-widest" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            กำลังส่ง...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            ส่งลิงก์ตั้งรหัสผ่านใหม่
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <div className="text-sm text-center text-gray-600">
                        นึกรหัสผ่านออกแล้ว?{' '}
                        <Link href="/customer-login" className="text-primary hover:underline font-medium">
                            เข้าสู่ระบบ
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
