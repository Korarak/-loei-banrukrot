import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, User, Mail, Phone, Lock, MapPin, Plus, Trash2, Home } from 'lucide-react';
import {
    useCreateCustomer,
    useUpdateCustomer,
    useCustomerAddresses,
    useAddAddress,
    useUpdateAddress,
    useDeleteAddress,
    type Customer,
    type CustomerAddress
} from '@/hooks/useCustomers';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const customerSchema = z.object({
    firstName: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
    lastName: z.string().min(2, 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร'),
    email: z.string().email('อีเมลไม่ถูกต้อง'),
    phone: z.string().optional().or(z.literal('')),
    password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร').optional().or(z.literal('')),
    isActive: z.boolean(),
});

const addressSchema = z.object({
    addressLabel: z.string().optional(),
    recipientName: z.string().min(2, 'กรุณาระบุชื่อผู้รับ'),
    streetAddress: z.string().min(5, 'กรุณาระบุที่อยู่'),
    subDistrict: z.string().optional(),
    district: z.string().min(2, 'กรุณาระบุเขต/อำเภอ'),
    province: z.string().min(2, 'กรุณาระบุจังหวัด'),
    zipCode: z.string().min(5, 'กรุณาระบุรหัสไปรษณีย์'),
    isDefault: z.boolean(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;

interface CustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: Customer | null;
}

export default function CustomerDialog({ open, onOpenChange, customer }: CustomerDialogProps) {
    const [activeTab, setActiveTab] = useState('details');
    const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
    const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);

    const createCustomer = useCreateCustomer();
    const updateCustomer = useUpdateCustomer();

    // Address hooks
    const { data: addresses, isLoading: isLoadingAddresses } = useCustomerAddresses(customer?._id);
    const addAddress = useAddAddress();
    const updateAddress = useUpdateAddress();
    const deleteAddress = useDeleteAddress();

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            isActive: true,
        },
    });

    const addressForm = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            addressLabel: '',
            recipientName: '',
            streetAddress: '',
            subDistrict: '',
            district: '',
            province: '',
            zipCode: '',
            isDefault: false,
        },
    });

    useEffect(() => {
        if (customer) {
            form.reset({
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone || '',
                password: '',
                isActive: customer.isActive,
            });
        } else {
            form.reset({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: '',
                isActive: true,
            });
            setActiveTab('details');
        }
    }, [customer, form, open]);

    useEffect(() => {
        if (editingAddress) {
            addressForm.reset({
                addressLabel: editingAddress.addressLabel || '',
                recipientName: editingAddress.recipientName,
                streetAddress: editingAddress.streetAddress,
                subDistrict: editingAddress.subDistrict || '',
                district: editingAddress.district,
                province: editingAddress.province,
                zipCode: editingAddress.zipCode,
                isDefault: editingAddress.isDefault,
            });
            setIsAddressFormOpen(true);
        } else {
            addressForm.reset({
                addressLabel: '',
                recipientName: '',
                streetAddress: '',
                subDistrict: '',
                district: '',
                province: '',
                zipCode: '',
                isDefault: false,
            });
        }
    }, [editingAddress, addressForm]);

    const onSubmit = async (values: CustomerFormValues) => {
        try {
            if (customer) {
                const updateData: any = { ...values };
                if (!updateData.password) delete updateData.password;

                await updateCustomer.mutateAsync({
                    id: customer._id,
                    data: updateData,
                });
                toast.success('อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว');
            } else {
                if (!values.password) {
                    form.setError('password', { message: 'จำเป็นต้องระบุรหัสผ่านสำหรับลูกค้าใหม่' });
                    return;
                }
                await createCustomer.mutateAsync(values as any);
                toast.success('สร้างบัญชีลูกค้าเรียบร้อยแล้ว');
            }
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลลูกค้าได้');
        }
    };

    const onAddressSubmit = async (values: AddressFormValues) => {
        if (!customer) return;

        try {
            if (editingAddress) {
                await updateAddress.mutateAsync({
                    customerId: customer._id,
                    addressId: editingAddress._id,
                    data: values,
                });
                toast.success('อัปเดตที่อยู่เรียบร้อยแล้ว');
            } else {
                await addAddress.mutateAsync({
                    customerId: customer._id,
                    data: values,
                });
                toast.success('เพิ่มที่อยู่เรียบร้อยแล้ว');
            }
            setIsAddressFormOpen(false);
            setEditingAddress(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกที่อยู่ได้');
        }
    };

    const handleDeleteAddress = async (addressId: string) => {
        if (!customer) return;
        try {
            await deleteAddress.mutateAsync({ addressId, customerId: customer._id });
            toast.success('ลบที่อยู่เรียบร้อยแล้ว');
        } catch (error) {
            toast.error('ไม่สามารถลบที่อยู่ได้');
        }
    };

    const isLoading = createCustomer.isPending || updateCustomer.isPending;
    const isAddressLoading = addAddress.isPending || updateAddress.isPending || deleteAddress.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] rounded-3xl border-none shadow-2xl bg-white p-0 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-8 pt-8 pb-6 bg-white border-b border-gray-50 flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {customer ? (
                                <>
                                    <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    แก้ไขข้อมูลลูกค้า
                                </>
                            ) : (
                                <>
                                    <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
                                        <User className="h-5 w-5 text-green-600" />
                                    </div>
                                    เพิ่มลูกค้าใหม่
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 text-base mt-1">
                            {customer
                                ? "จัดการรายละเอียดข้อมูลและที่อยู่ของลูกค้า"
                                : "สร้างบัญชีผู้ใช้ใหม่สำหรับลูกค้า"}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="px-8 pt-4">
                            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-gray-100 rounded-xl">
                                <TabsTrigger
                                    value="details"
                                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                                >
                                    ข้อมูลส่วนตัว
                                </TabsTrigger>
                                <TabsTrigger
                                    value="addresses"
                                    disabled={!customer}
                                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all disabled:opacity-50"
                                >
                                    ที่อยู่ {addresses && addresses.length > 0 && `(${addresses.length})`}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="details" className="mt-0">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="px-8 py-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 font-medium">ชื่อ</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input placeholder="เช่น สมชาย" {...field} className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all" />
                                                        </div>
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
                                                    <FormLabel className="text-gray-700 font-medium">นามสกุล</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input placeholder="เช่น รักษาสุข" {...field} className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 font-medium">อีเมล</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input placeholder="customer@example.com" {...field} className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all" />
                                                        </div>
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
                                                    <FormLabel className="text-gray-700 font-medium">เบอร์โทรศัพท์</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input placeholder="08x-xxx-xxxx" {...field} className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 font-medium">
                                                    {customer ? 'รหัสผ่านใหม่ (ไม่จำเป็น)' : 'รหัสผ่าน'}
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            type="password"
                                                            placeholder={customer ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยน" : "กำหนดรหัสผ่านเพื่อความปลอดภัย"}
                                                            {...field}
                                                            className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base font-medium text-gray-900">เปิดใช้งานบัญชี</FormLabel>
                                                    <FormDescription className="text-gray-500">
                                                        อนุญาตให้ลูกค้ารายนี้เข้าสู่ระบบและสั่งซื้อสินค้าได้
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="data-[state=checked]:bg-green-600"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="pt-4 flex justify-end gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => onOpenChange(false)}
                                            className="rounded-xl border-gray-200 h-11 px-6 hover:bg-gray-50 hover:text-black"
                                        >
                                            ยกเลิก
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="rounded-xl bg-black hover:bg-gray-800 text-white h-11 px-6 shadow-lg shadow-gray-200"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    กำลังบันทึก...
                                                </>
                                            ) : (
                                                'บันทึกข้อมูล'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </TabsContent>

                        <TabsContent value="addresses" className="mt-0 px-8 py-6">
                            {isAddressFormOpen ? (
                                <Form {...addressForm}>
                                    <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {editingAddress ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}
                                            </h3>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => {
                                                    setIsAddressFormOpen(false);
                                                    setEditingAddress(null);
                                                }}
                                                className="text-gray-500 hover:text-black"
                                            >
                                                ยกเลิก
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={addressForm.control}
                                                name="addressLabel"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>ชื่อเรียกที่อยู่ (ไม่จำเป็น)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="เช่น บ้าน, ที่ทำงาน ฯลฯ" {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={addressForm.control}
                                                name="recipientName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>ชื่อผู้รับ</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="ระบุชื่อ-นามสกุล" {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={addressForm.control}
                                            name="streetAddress"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>ที่อยู่</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="เลขที่บ้าน, ถนน, ซอย..." {...field} className="rounded-xl" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={addressForm.control}
                                                name="subDistrict"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>แขวง/ตำบล</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="แขวง/ตำบล" {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={addressForm.control}
                                                name="district"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>เขต/อำเภอ</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="เขต/อำเภอ" {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={addressForm.control}
                                                name="province"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>จังหวัด</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="จังหวัด" {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={addressForm.control}
                                                name="zipCode"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>รหัสไปรษณีย์</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="รหัสไปรษณีย์" {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={addressForm.control}
                                            name="isDefault"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base font-medium text-gray-900">ตั้งเป็นที่อยู่เริ่มต้น</FormLabel>
                                                        <FormDescription className="text-gray-500">
                                                            ใช้เป็นที่อยู่หลักสำหรับจัดส่งสินค้า
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-blue-600"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <div className="pt-2 flex justify-end gap-3">
                                            <Button
                                                type="submit"
                                                disabled={isAddressLoading}
                                                className="rounded-xl bg-black hover:bg-gray-800 text-white h-11 px-6 shadow-lg shadow-gray-200"
                                            >
                                                {isAddressLoading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        กำลังบันทึก...
                                                    </>
                                                ) : (
                                                    'บันทึกที่อยู่'
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">ที่อยู่ที่บันทึกไว้</h3>
                                        <Button
                                            onClick={() => setIsAddressFormOpen(true)}
                                            className="rounded-xl bg-black text-white hover:bg-gray-800"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            เพิ่มที่อยู่
                                        </Button>
                                    </div>

                                    {isLoadingAddresses ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                                        </div>
                                    ) : addresses && addresses.length > 0 ? (
                                        <div className="grid gap-4">
                                            {addresses.map((addr) => (
                                                <div
                                                    key={addr._id}
                                                    className="p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow group relative"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-start gap-3">
                                                            <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <MapPin className="h-5 w-5 text-gray-500" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-gray-900">{addr.addressLabel || 'ที่อยู่'}</span>
                                                                    {addr.isDefault && (
                                                                        <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100">ค่าเริ่มต้น</Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm font-medium text-gray-900 mt-1">{addr.recipientName}</p>
                                                                <p className="text-sm text-gray-500 mt-1">
                                                                    {addr.streetAddress}<br />
                                                                    {addr.subDistrict ? `${addr.subDistrict}, ` : ''}{addr.district}<br />
                                                                    {addr.province}, {addr.zipCode}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setEditingAddress(addr)}
                                                                className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black"
                                                            >
                                                                <Plus className="h-4 w-4 rotate-45" /> {/* Using Plus as Edit icon since Pencil isn't imported, or just import Pencil */}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteAddress(addr._id)}
                                                                className="h-8 w-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                                <Home className="h-6 w-6 text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-medium">ไม่พบข้อมูลที่อยู่</p>
                                            <p className="text-gray-400 text-sm mt-1">เพิ่มที่อยู่สำหรับการจัดส่งและออกบิล</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
