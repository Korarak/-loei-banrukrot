'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { useCustomerAddresses, useAddAddress, useDeleteAddress, useUpdateAddress, useUpdateCustomer, CustomerAddress } from '@/hooks/useCustomers';
import api from '@/lib/api';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2, Check, Pencil, Camera, User, Home, Star, Package, Heart, ShoppingBag, Settings, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ProfilePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const customer = useAuthStore((state) => state.customer);
    const { data: addresses, isLoading } = useCustomerAddresses(customer?._id);
    const addAddress = useAddAddress();
    const updateAddress = useUpdateAddress();
    const deleteAddress = useDeleteAddress();

    const updateCustomer = useUpdateCustomer();
    const updateAuthCustomer = useAuthStore((state) => state.updateCustomer);

    const [isAdding, setIsAdding] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const THAI_PHONE_REGEX = /^0\d{8,9}$/;

    const validatePhone = (value: string, required: boolean): boolean => {
        if (!value) {
            setPhoneError(required ? 'กรุณากรอกเบอร์โทรศัพท์' : '');
            return !required;
        }
        if (!THAI_PHONE_REGEX.test(value)) {
            setPhoneError('เบอร์โทรศัพท์ไม่ถูกต้อง (ขึ้นต้นด้วย 0 ความยาว 9-10 หลัก)');
            return false;
        }
        setPhoneError('');
        return true;
    };

    const [newAddress, setNewAddress] = useState({
        recipientName: '',
        phone: '',
        streetAddress: '',
        subDistrict: '',
        district: '',
        province: '',
        zipCode: '',
        addressLabel: 'บ้าน',
        isDefault: false
    });

    useEffect(() => {
        if (customer) {
            setEditForm({
                firstName: customer.firstName || '',
                lastName: customer.lastName || '',
                phone: customer.phone || '',
                password: '',
                confirmPassword: ''
            });

            // Check for complete_profile action
            const action = searchParams.get('action');
            if (action === 'complete_profile' && !customer.phone) {
                setTimeout(() => {
                    toast.warning('กรุณากรอกเบอร์โทรศัพท์เพื่อความสะดวกในการจัดส่งและติดต่อกลับ', {
                        duration: 5000,
                    });
                    setPhoneError('');
                    setIsEditingProfile(true);
                }, 500);
            }
        }
    }, [customer, searchParams]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer) return;

        const isCompletingProfile = searchParams.get('action') === 'complete_profile' && !customer.phone;

        if (!validatePhone(editForm.phone, isCompletingProfile)) {
            return;
        }

        if (editForm.password && editForm.password !== editForm.confirmPassword) {
            toast.error('รหัสผ่านไม่ตรงกัน');
            return;
        }

        try {
            const updateData: any = {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                phone: editForm.phone,
            };

            if (editForm.password) {
                updateData.password = editForm.password;
            }

            const updatedCustomer = await updateCustomer.mutateAsync({
                id: customer._id,
                data: updateData
            });

            updateAuthCustomer(updatedCustomer);
            toast.success('อัปเดตข้อมูลส่วนตัวเรียบร้อย');
            setIsEditingProfile(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลได้');
        }
    };

    useEffect(() => {
        if (!customer) {
            router.push('/customer-login');
        }
    }, [customer, router]);

    if (!customer) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3 text-gray-600" role="status" aria-live="polite">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                    <span className="text-sm font-medium">กำลังโหลดข้อมูล...</span>
                </div>
            </div>
        );
    }

    const isCompletingProfile = searchParams.get('action') === 'complete_profile' && !customer.phone;

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addAddress.mutateAsync({
                customerId: customer._id,
                data: {
                    ...newAddress,
                    isDefault: addresses?.length === 0 ? true : newAddress.isDefault
                }
            });
            toast.success('เพิ่มที่อยู่เรียบร้อย');
            setIsAdding(false);
            setNewAddress({
                recipientName: '',
                phone: '',
                streetAddress: '',
                subDistrict: '',
                district: '',
                province: '',
                zipCode: '',
                addressLabel: 'บ้าน',
                isDefault: false
            });
        } catch (error) {
            toast.error('ไม่สามารถเพิ่มที่อยู่ได้');
        }
    };

    const handleDeleteAddress = async (addressId: string) => {
        try {
            await deleteAddress.mutateAsync({ addressId, customerId: customer._id });
            toast.success('ลบที่อยู่เรียบร้อย');
        } catch (error) {
            toast.error('ไม่สามารถลบที่อยู่ได้');
        }
    };

    const handleEditAddressClick = (addr: CustomerAddress) => {
        setEditingAddress({ ...addr });
        setIsEditingAddress(true);
    };

    const handleUpdateAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAddress) return;
        try {
            await updateAddress.mutateAsync({
                customerId: customer._id,
                addressId: editingAddress._id,
                data: editingAddress
            });
            toast.success('อัปเดตที่อยู่เรียบร้อย');
            setIsEditingAddress(false);
            setEditingAddress(null);
        } catch (error) {
            toast.error('ไม่สามารถอัปเดตที่อยู่ได้');
        }
    };

    const handleSetDefault = async (addressId: string) => {
        try {
            await updateAddress.mutateAsync({
                customerId: customer._id,
                addressId,
                data: { isDefault: true }
            });
            toast.success('ตั้งเป็นที่อยู่เริ่มต้นแล้ว');
        } catch (error) {
            toast.error('ไม่สามารถตั้งค่าได้');
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

            // Update customer profile
            const updatedCustomer = await updateCustomer.mutateAsync({
                id: customer._id,
                data: { profilePicture: imagePath }
            });

            updateAuthCustomer(updatedCustomer);
            toast.success('อัปเดตรูปโปรไฟล์เรียบร้อย');
        } catch (error) {
            console.error(error);
            toast.error('ไม่สามารถอัปโหลดรูปภาพได้');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 font-sans">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900">ข้อมูลส่วนตัว</h1>

            <div className="grid gap-6 sm:gap-8">
                {/* Profile Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="relative group">
                        <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center relative">
                            {customer.profilePicture ? (
                                <Image
                                    src={getImageUrl(customer.profilePicture)}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                    sizes="128px"
                                />
                            ) : (
                                <User className="h-16 w-16 text-gray-400" />
                            )}
                            {/* Loading Overlay */}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <label
                            htmlFor="profile-upload"
                            className="absolute bottom-0 right-0 p-3 bg-white text-primary rounded-full cursor-pointer hover:bg-gray-50 hover:scale-110 transition-all shadow-lg border-2 border-gray-100"
                        >
                            <Camera className="h-4 w-4" />
                            <input
                                id="profile-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                    <div className="mt-4 text-center">
                        <h2 className="text-2xl font-bold text-gray-900">{customer.firstName} {customer.lastName}</h2>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                </div>

                {/* Dashboard Navigation */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-2">
                    <Link href="/orders">
                        <Card className="hover:shadow-lg transition-all cursor-pointer border-0 shadow-sm bg-white group">
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="p-4 bg-blue-50 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
                                    <Package className="h-6 w-6" />
                                </div>
                                <span className="font-bold text-gray-700">ประวัติคำสั่งซื้อ</span>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/wishlist">
                        <Card className="hover:shadow-lg transition-all cursor-pointer border-0 shadow-sm bg-white group">
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="p-4 bg-pink-50 rounded-full text-pink-600 group-hover:scale-110 transition-transform">
                                    <Heart className="h-6 w-6" />
                                </div>
                                <span className="font-bold text-gray-700">รายการที่ถูกใจ</span>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/cart" className="col-span-2 md:col-span-1">
                        <Card className="hover:shadow-lg transition-all cursor-pointer border-0 shadow-sm bg-white group h-full">
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="p-4 bg-orange-50 rounded-full text-orange-600 group-hover:scale-110 transition-transform">
                                    <ShoppingBag className="h-6 w-6" />
                                </div>
                                <span className="font-bold text-gray-700">ตะกร้าสินค้า</span>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Customer Info */}
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            รายละเอียดข้อมูลส่วนตัว
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)} className="rounded-xl">
                            <Pencil className="h-4 w-4 mr-2" /> แก้ไขข้อมูล
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                                <Label className="text-gray-600 mb-1 block">ชื่อจริง</Label>
                                <div className="font-medium text-lg text-gray-900">{customer.firstName}</div>
                            </div>
                            <div>
                                <Label className="text-gray-600 mb-1 block">นามสกุล</Label>
                                <div className="font-medium text-lg text-gray-900">{customer.lastName}</div>
                            </div>
                            <div>
                                <Label className="text-gray-600 mb-1 block">อีเมล</Label>
                                <div className="font-medium text-lg text-gray-900">{customer.email}</div>
                            </div>
                            <div>
                                <Label className="text-gray-600 mb-1 block">เบอร์โทรศัพท์</Label>
                                {customer.phone ? (
                                    <div className="font-medium text-lg text-gray-900">{customer.phone}</div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { setPhoneError(''); setIsEditingProfile(true); }}
                                        className="flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                                    >
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        ยังไม่ได้เพิ่มเบอร์โทร — เพิ่มตอนนี้
                                    </button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={isEditingProfile} onOpenChange={(open) => { setIsEditingProfile(open); if (!open) setPhoneError(''); }}>
                    <DialogContent
                        className="sm:max-w-[500px] rounded-2xl"
                        showCloseButton={!isCompletingProfile}
                        onInteractOutside={(e) => { if (isCompletingProfile) e.preventDefault(); }}
                        onEscapeKeyDown={(e) => { if (isCompletingProfile) e.preventDefault(); }}
                    >
                        <DialogHeader>
                            <DialogTitle>{isCompletingProfile ? 'กรอกข้อมูลให้ครบถ้วน' : 'แก้ไขข้อมูลส่วนตัว'}</DialogTitle>
                            <DialogDescription>
                                {isCompletingProfile
                                    ? 'กรุณากรอกเบอร์โทรศัพท์ เพื่อให้เราติดต่อและจัดส่งสินค้าถึงคุณได้สะดวกยิ่งขึ้น'
                                    : 'อัปเดตข้อมูลของคุณ (อีเมลไม่สามารถเปลี่ยนได้)'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">ข้อมูลทั่วไป</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">ชื่อจริง</Label>
                                        <Input
                                            id="firstName"
                                            value={editForm.firstName}
                                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">นามสกุล</Label>
                                        <Input
                                            id="lastName"
                                            value={editForm.lastName}
                                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">อีเมล</Label>
                                    <Input
                                        id="email"
                                        value={customer.email}
                                        disabled
                                        className="bg-gray-100 text-gray-500 cursor-not-allowed rounded-xl"
                                        autoComplete="username"
                                    />
                                    <p className="text-xs text-gray-600">อีเมลใช้สำหรับเข้าสู่ระบบ ไม่สามารถเปลี่ยนได้</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-1">
                                        เบอร์โทรศัพท์
                                        {isCompletingProfile && <span className="text-destructive" aria-hidden="true">*</span>}
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        inputMode="numeric"
                                        value={editForm.phone}
                                        onChange={(e) => {
                                            setEditForm({ ...editForm, phone: e.target.value });
                                            if (phoneError) setPhoneError('');
                                        }}
                                        onBlur={() => validatePhone(editForm.phone, isCompletingProfile)}
                                        autoComplete="tel"
                                        autoFocus={isCompletingProfile}
                                        required={isCompletingProfile}
                                        aria-invalid={!!phoneError}
                                        aria-describedby={phoneError ? 'phone-error' : undefined}
                                        className="rounded-xl"
                                    />
                                    {phoneError && (
                                        <p id="phone-error" role="alert" className="flex items-center gap-1 text-xs text-destructive">
                                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                            {phoneError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-4">
                                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">เปลี่ยนรหัสผ่าน</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="password">รหัสผ่านใหม่</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน"
                                        value={editForm.password}
                                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                                {editForm.password && (
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={editForm.confirmPassword}
                                            onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => { setIsEditingProfile(false); setPhoneError(''); }} className="rounded-xl">
                                    {isCompletingProfile ? 'ข้ามไปก่อน' : 'ยกเลิก'}
                                </Button>
                                <Button type="submit" disabled={updateCustomer.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                                    {updateCustomer.isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Addresses */}
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            ที่อยู่จัดส่ง
                        </CardTitle>
                        <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm" className="rounded-xl">
                            {isAdding ? 'ยกเลิก' : <><Plus className="h-4 w-4 mr-2" /> เพิ่มที่อยู่ใหม่</>}
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {isAdding && (
                            <form onSubmit={handleAddAddress} className="mb-8 p-4 sm:p-6 border rounded-2xl bg-gray-50 space-y-4">
                                <h3 className="font-semibold mb-4 text-primary">เพิ่มที่อยู่ใหม่</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="recipientName">ชื่อผู้รับ</Label>
                                        <Input
                                            id="recipientName"
                                            value={newAddress.recipientName}
                                            onChange={e => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                            placeholder="ชื่อ-นามสกุล"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="addr-phone">เบอร์โทรศัพท์ติดต่อ</Label>
                                        <Input
                                            id="addr-phone"
                                            type="tel"
                                            inputMode="numeric"
                                            value={newAddress.phone}
                                            onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label htmlFor="streetAddress">ที่อยู่ (บ้านเลขที่, หมู่, ซอย, ถนน)</Label>
                                        <Input
                                            id="streetAddress"
                                            value={newAddress.streetAddress}
                                            onChange={e => setNewAddress({ ...newAddress, streetAddress: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subDistrict">ตำบล/แขวง</Label>
                                        <Input
                                            id="subDistrict"
                                            value={newAddress.subDistrict}
                                            onChange={e => setNewAddress({ ...newAddress, subDistrict: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="district">อำเภอ/เขต</Label>
                                        <Input
                                            id="district"
                                            value={newAddress.district}
                                            onChange={e => setNewAddress({ ...newAddress, district: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="province">จังหวัด</Label>
                                        <Input
                                            id="province"
                                            value={newAddress.province}
                                            onChange={e => setNewAddress({ ...newAddress, province: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zipCode">รหัสไปรษณีย์</Label>
                                        <Input
                                            id="zipCode"
                                            value={newAddress.zipCode}
                                            onChange={e => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="isDefault"
                                            checked={newAddress.isDefault}
                                            onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="isDefault">ตั้งเป็นที่อยู่หลัก (เริ่มต้น)</Label>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={addAddress.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                                        {addAddress.isPending ? 'กำลังบันทึก...' : 'บันทึกที่อยู่'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-3 py-8 text-gray-600" role="status">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                                    <span className="text-sm font-medium">กำลังโหลดข้อมูลที่อยู่...</span>
                                </div>
                            ) : addresses && addresses.length > 0 ? (
                                addresses.map((addr) => (
                                    <div key={addr._id} className={`flex items-start justify-between gap-2 p-4 border rounded-2xl transition-all ${addr.isDefault ? 'border-primary/30 bg-primary/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <div className="flex gap-3 sm:gap-4 min-w-0">
                                            <div className={`hidden sm:flex h-10 w-10 rounded-full items-center justify-center flex-shrink-0 ${addr.isDefault ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                                                {addr.isDefault ? <Star className="h-5 w-5 fill-current" /> : <Home className="h-5 w-5" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium flex flex-wrap items-center gap-2 text-gray-900">
                                                    {addr.recipientName}
                                                    {addr.isDefault && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-normal">ค่าเริ่มต้น</span>}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {addr.phone}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-2 leading-relaxed">
                                                    {addr.streetAddress} {addr.subDistrict} {addr.district}
                                                    <br />
                                                    {addr.province} {addr.zipCode}
                                                </div>
                                                {!addr.isDefault && (
                                                    <Button
                                                        variant="link"
                                                        className="h-auto p-0 text-xs text-primary mt-3 font-medium"
                                                        onClick={() => handleSetDefault(addr._id)}
                                                    >
                                                        ตั้งเป็นที่อยู่หลัก
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl sm:mr-1"
                                                onClick={() => handleEditAddressClick(addr)}
                                                aria-label={`แก้ไขที่อยู่ของ ${addr.recipientName}`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                                        disabled={deleteAddress.isPending}
                                                        aria-label={`ลบที่อยู่ของ ${addr.recipientName}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>ลบที่อยู่นี้?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            ที่อยู่ของ {addr.recipientName} ({addr.province}) จะถูกลบออก ไม่สามารถย้อนกลับได้
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteAddress(addr._id)} className="bg-red-500 hover:bg-red-600">
                                                            ลบที่อยู่
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 border border-dashed rounded-xl bg-gray-50">
                                    ยังไม่มีข้อมูลที่อยู่ กรุณาเพิ่มที่อยู่เพื่อดำเนินการสั่งซื้อ
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={isEditingAddress} onOpenChange={setIsEditingAddress}>
                    <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>แก้ไขที่อยู่</DialogTitle>
                            <DialogDescription>
                                แก้ไขรายละเอียดที่อยู่จัดส่งของคุณ
                            </DialogDescription>
                        </DialogHeader>
                        {editingAddress && (
                            <form onSubmit={handleUpdateAddressSubmit} className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-recipientName">ชื่อผู้รับ</Label>
                                        <Input
                                            id="edit-recipientName"
                                            value={editingAddress.recipientName}
                                            onChange={e => setEditingAddress({ ...editingAddress, recipientName: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                            placeholder="ชื่อ-นามสกุล"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-phone">เบอร์โทรศัพท์ติดต่อ</Label>
                                        <Input
                                            id="edit-phone"
                                            type="tel"
                                            inputMode="numeric"
                                            value={editingAddress.phone || ''}
                                            onChange={e => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <Label htmlFor="edit-streetAddress">ที่อยู่ (บ้านเลขที่, หมู่, ซอย, ถนน)</Label>
                                        <Input
                                            id="edit-streetAddress"
                                            value={editingAddress.streetAddress}
                                            onChange={e => setEditingAddress({ ...editingAddress, streetAddress: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-subDistrict">ตำบล/แขวง</Label>
                                        <Input
                                            id="edit-subDistrict"
                                            value={editingAddress.subDistrict || ''}
                                            onChange={e => setEditingAddress({ ...editingAddress, subDistrict: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-district">อำเภอ/เขต</Label>
                                        <Input
                                            id="edit-district"
                                            value={editingAddress.district}
                                            onChange={e => setEditingAddress({ ...editingAddress, district: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-province">จังหวัด</Label>
                                        <Input
                                            id="edit-province"
                                            value={editingAddress.province}
                                            onChange={e => setEditingAddress({ ...editingAddress, province: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-zipCode">รหัสไปรษณีย์</Label>
                                        <Input
                                            id="edit-zipCode"
                                            value={editingAddress.zipCode}
                                            onChange={e => setEditingAddress({ ...editingAddress, zipCode: e.target.value })}
                                            required
                                            className="bg-white rounded-xl"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2 md:col-span-2">
                                        <input
                                            type="checkbox"
                                            id="edit-isDefault"
                                            checked={editingAddress.isDefault}
                                            onChange={e => setEditingAddress({ ...editingAddress, isDefault: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="edit-isDefault">ตั้งเป็นที่อยู่หลัก (เริ่มต้น)</Label>
                                    </div>
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsEditingAddress(false)} className="rounded-xl">
                                        ยกเลิก
                                    </Button>
                                    <Button type="submit" disabled={updateAddress.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                                        {updateAddress.isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
