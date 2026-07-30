'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Globe, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { isValidThaiPhone, normalizePhone } from '@/lib/phone';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLanguageStore } from '@/stores/useLanguageStore';

const translations = {
    th: {
        title: 'สร้างบัญชีใหม่',
        subtitle: 'กรอกข้อมูลเพื่อสมัครสมาชิกและติดตามสถานะสินค้า',
        firstName: 'ชื่อจริง',
        lastName: 'นามสกุล',
        email: 'อีเมล',
        phone: 'เบอร์โทรศัพท์',
        phoneHint: 'มือถือ 10 หลัก หรือเบอร์บ้าน 9 หลัก',
        password: 'รหัสผ่าน',
        confirmPassword: 'ยืนยันรหัสผ่าน',
        submit: 'สมัครสมาชิก',
        submitting: 'กำลังสมัครสมาชิก...',
        orContinueWith: 'หรือสมัครด้วย',
        loginPrompt: 'มีบัญชีอยู่แล้ว?',
        loginAction: 'เข้าสู่ระบบ',
        placeholders: {
            firstName: 'สมชาย',
            lastName: 'ใจดี',
            email: 'somchai@example.com',
            phone: '0812345678',
            password: '••••••',
        },
        errors: {
            firstName: 'กรุณาระบุชื่อจริงอย่างน้อย 2 ตัวอักษร',
            lastName: 'กรุณาระบุนามสกุลอย่างน้อย 2 ตัวอักษร',
            email: 'รูปแบบอีเมลไม่ถูกต้อง',
            phone: 'เบอร์โทรศัพท์ไม่ถูกต้อง (ขึ้นต้นด้วย 0 และมี 9-10 หลัก)',
            password: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร',
            passwordMatch: 'รหัสผ่านไม่ตรงกัน',
            duplicate: 'มีบัญชีนี้ในระบบแล้ว',
            duplicateDesc: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ',
            googleAccount: 'บัญชีนี้สมัครผ่าน Google',
            googleAccountDesc: 'กรุณาใช้ปุ่ม "สมัคร/เข้าสู่ระบบด้วย Google" ด้านล่าง',
            success: 'สมัครสมาชิกสำเร็จ',
            welcome: 'ยินดีต้อนรับเข้าสู่ระบบ',
            failed: 'การสมัครสมาชิกไม่สำเร็จ',
        },
    },
    en: {
        title: 'Create Account',
        subtitle: 'Join us to track your orders and checkout faster',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        phone: 'Phone Number',
        phoneHint: '10-digit mobile or 9-digit landline',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        submit: 'Register',
        submitting: 'Creating account...',
        orContinueWith: 'Or sign up with',
        loginPrompt: 'Already have an account?',
        loginAction: 'Login here',
        placeholders: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '0812345678',
            password: '••••••',
        },
        errors: {
            firstName: 'First name must be at least 2 characters',
            lastName: 'Last name must be at least 2 characters',
            email: 'Invalid email address',
            phone: 'Invalid phone number (must start with 0 and be 9-10 digits)',
            password: 'Password must be at least 6 characters',
            passwordMatch: 'Passwords do not match',
            duplicate: 'Account already exists',
            duplicateDesc: 'This email is already in use. Please login.',
            googleAccount: 'This account was created with Google',
            googleAccountDesc: 'Please use the "Sign up with Google" button below.',
            success: 'Registration successful',
            welcome: 'Welcome to the system',
            failed: 'Registration failed',
        },
    },
};

type Messages = (typeof translations)['th'];

// สร้าง schema จากข้อความของภาษาปัจจุบัน — เดิม schema ถูก hardcode ภาษาไทย ทำให้สลับเป็น EN
// แล้ว error ยังโผล่เป็นไทยอยู่ทั้งที่ translations.en.errors ถูกเขียนไว้ครบแล้ว
const buildFormSchema = (e: Messages['errors']) =>
    z
        .object({
            firstName: z.string().min(2, e.firstName),
            lastName: z.string().min(2, e.lastName),
            email: z.string().email(e.email),
            phone: z.string().refine(isValidThaiPhone, e.phone),
            password: z.string().min(6, e.password),
            confirmPassword: z.string(),
            website: z.string().optional(), // Honeypot field
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: e.passwordMatch,
            path: ['confirmPassword'],
        });

type RegisterFormValues = z.infer<ReturnType<typeof buildFormSchema>>;

export default function CustomerRegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';
    const { loginCustomer } = useAuthStore();
    const { language, toggleLanguage } = useLanguageStore();
    const t = translations[language];

    const [isLoading, setIsLoading] = useState(false);

    const formSchema = useMemo(() => buildFormSchema(t.errors), [t.errors]);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
        },
    });

    // สลับภาษาแล้วให้ error ที่ค้างอยู่บนจอเปลี่ยนตามทันที (ไม่ต้องรอ submit รอบใหม่)
    const { isSubmitted } = form.formState;
    useEffect(() => {
        if (isSubmitted) form.trigger();
    }, [language, isSubmitted, form]);

    async function onSubmit(values: RegisterFormValues) {
        // Honeypot — ช่องที่คนมองไม่เห็น ถ้ามีค่าแปลว่าเป็นบอท ให้เงียบไปเฉยๆ
        if (values.website) {
            console.warn('Bot detected via honeypot');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/register-customer', {
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                phone: normalizePhone(values.phone),
                password: values.password,
            });

            if (response.data.success) {
                const { token, ...customer } = response.data.data;
                loginCustomer(customer, token);
                toast.success(t.errors.success, { description: t.errors.welcome });
                router.push(redirect);
            }
        } catch (error: any) {
            // อ่านจาก code ที่ backend ส่งมา ไม่ใช่ match ข้อความภาษาอังกฤษ — ข้อความเปลี่ยนเมื่อไหร่ปุ่มลัดจะหายทันที
            const code = error.response?.data?.code;
            const message = error.response?.data?.message || t.errors.failed;

            if (code === 'ACCOUNT_USES_GOOGLE') {
                toast.error(t.errors.googleAccount, {
                    description: t.errors.googleAccountDesc,
                    duration: 6000,
                });
            } else if (code === 'EMAIL_EXISTS') {
                toast.error(t.errors.duplicate, {
                    description: t.errors.duplicateDesc,
                    action: {
                        label: t.loginAction,
                        onClick: () => router.push(`/customer-login?email=${encodeURIComponent(values.email)}`),
                    },
                    duration: 6000,
                });
            } else {
                toast.error(message);
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 relative">
            <div className="absolute top-4 right-4 z-20">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleLanguage}
                    className="bg-white hover:bg-accent border-border"
                >
                    <Globe className="mr-2 h-4 w-4" />
                    {language === 'th' ? 'EN' : 'TH'}
                </Button>
            </div>

            <Card className="w-full max-w-md relative z-10">
                <CardHeader className="space-y-2 pt-8">
                    <div className="font-display uppercase text-3xl text-center text-gray-900 leading-none">Sign Up</div>
                    <CardTitle className="text-lg font-bold tracking-tight text-center text-muted-foreground">{t.title}</CardTitle>
                    <CardDescription className="text-center text-gray-600 font-medium">
                        {t.subtitle}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">{t.firstName}</FormLabel>
                                            <FormControl>
                                                <Input autoComplete="given-name" placeholder={t.placeholders.firstName} className="h-12 font-medium" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">{t.lastName}</FormLabel>
                                            <FormControl>
                                                <Input autoComplete="family-name" placeholder={t.placeholders.lastName} className="h-12 font-medium" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">{t.email}</FormLabel>
                                        <FormControl>
                                            <Input type="email" autoComplete="email" placeholder={t.placeholders.email} className="h-12 font-medium" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">{t.phone}</FormLabel>
                                        <FormControl>
                                            <Input type="tel" inputMode="numeric" autoComplete="tel" placeholder={t.placeholders.phone} className="h-12 font-medium" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-xs">{t.phoneHint}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">{t.password}</FormLabel>
                                        <FormControl>
                                            <Input type="password" autoComplete="new-password" placeholder={t.placeholders.password} className="h-12 font-medium" {...field} />
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
                                        <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">{t.confirmPassword}</FormLabel>
                                        <FormControl>
                                            <Input type="password" autoComplete="new-password" placeholder={t.placeholders.password} className="h-12 font-medium" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Honeypot Field (Hidden) */}
                            <input
                                type="text"
                                className="hidden"
                                {...form.register('website')}
                                tabIndex={-1}
                                autoComplete="off"
                            />

                            <Button
                                type="submit"
                                className="w-full h-12 text-base uppercase tracking-widest"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {t.submitting}
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-5 w-5" />
                                        {t.submit}
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                {t.orContinueWith}
                            </span>
                        </div>
                    </div>

                    <GoogleSignInButton />
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <div className="text-sm text-center text-gray-600">
                        {t.loginPrompt}{' '}
                        <Link
                            href={`/customer-login?redirect=${encodeURIComponent(redirect)}`}
                            className="text-primary hover:underline font-medium"
                        >
                            {t.loginAction}
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
