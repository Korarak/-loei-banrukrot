'use client';

import { useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Constants for Thai Strings to avoid compiler bugs
const USERNAME_PLACEHOLDER = "ระบุชื่อผู้ใช้งาน";
const PASSWORD_NEW_PLACEHOLDER = "เว้นว่างไว้หากไม่ต้องการเปลี่ยน";
const PASSWORD_REQUIRED_PLACEHOLDER = "ระบุรหัสผ่าน";
const ROLE_PLACEHOLDER = "เลือกสิทธิ์";
const STATUS_PLACEHOLDER = "เลือกสถานะ";

const baseUserSchema = z.object({
    username: z.string().min(3, 'ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร'),
    email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
    role: z.enum(['owner', 'staff']),
    isActive: z.boolean(),
    password: z.string().optional(),
    _id: z.string().optional(),
});

const formSchema = baseUserSchema.refine((data) => {
    // Password is required for new users (no _id)
    if (!data._id && !data.password) {
        return false;
    }
    return true;
}, {
    message: "กรุณาระบุรหัสผ่านสำหรับผู้ใช้งานใหม่",
    path: ["password"],
});

type UserFormData = z.infer<typeof formSchema>;

interface UserFormProps {
    user?: any;
    onSubmit: (data: UserFormData) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

export default function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
    const form = useForm<UserFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            _id: user?._id,
            username: user?.username || '',
            email: user?.email || '',
            role: user?.role || 'staff',
            isActive: user?.isActive ?? true,
            password: '',
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                password: '',
            });
        } else {
            form.reset({
                username: '',
                email: '',
                role: 'staff',
                isActive: true,
                password: '',
            });
        }
    }, [user, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ชื่อผู้ใช้งาน</FormLabel>
                            <FormControl>
                                <Input placeholder={USERNAME_PLACEHOLDER} autoComplete="off" {...field} />
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
                                <Input placeholder="john@example.com" type="email" autoComplete="off" {...field} />
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
                            <FormLabel>{user ? 'รหัสผ่านใหม่ (ไม่บังคับ)' : 'รหัสผ่าน'}</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder={user ? PASSWORD_NEW_PLACEHOLDER : PASSWORD_REQUIRED_PLACEHOLDER}
                                    autoComplete="new-password"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>สิทธิ์การใช้งาน</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={ROLE_PLACEHOLDER} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="staff">พนักงาน</SelectItem>
                                        <SelectItem value="owner">เจ้าของร้าน (ผู้ดูแลระบบ)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>สถานะ</FormLabel>
                                <Select
                                    onValueChange={(val) => field.onChange(val === 'true')}
                                    value={field.value ? 'true' : 'false'}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={STATUS_PLACEHOLDER} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="true">เปิดใช้งาน</SelectItem>
                                        <SelectItem value="false">ปิดใช้งาน</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            ยกเลิก
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                        {isLoading ? 'กำลังบันทึก...' : user ? 'อัปเดตผู้ใช้งาน' : 'สร้างผู้ใช้งาน'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
