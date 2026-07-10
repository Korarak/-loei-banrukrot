'use client';

import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Minus, Plus, Trash2, ShoppingBag, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useShippingMethods } from '@/hooks/useShippingMethods';
import { useCustomerAddresses } from '@/hooks/useCustomers';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Truck, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils';

export default function CartPage() {
    const router = useRouter();
    const customer = useAuthStore((state) => state.customer);
    const { data: cart, isLoading } = useCart();
    const { data: shippingMethods, isLoading: isLoadingShipping } = useShippingMethods();
    const { data: addresses, isLoading: isLoadingAddresses } = useCustomerAddresses(customer?._id);
    const updateCartItem = useUpdateCartItem();
    const removeCartItem = useRemoveCartItem();
    const clearCart = useClearCart();
    const createOrder = useCreateOrder();

    const [manualShippingId, setManualShippingId] = useState<string | null>(null);
    const [manualAddressId, setManualAddressId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>('Transfer');
    // รายการที่ผู้ใช้ "เอาออก" จากการคิดเงิน — ค่าเริ่มต้นคือเลือกทุกชิ้นที่ซื้อได้
    const [deselectedIds, setDeselectedIds] = useState<Set<string>>(new Set());

    const items = cart?.items || [];

    // สต็อกคงเหลือ — backend เก่าที่ยังไม่ส่ง field นี้จะถือว่าไม่จำกัด (พฤติกรรมเดิม)
    const getStock = (item: { variant: { stockAvailable?: number } }) =>
        item.variant.stockAvailable ?? Number.POSITIVE_INFINITY;
    const isOutOfStock = (item: (typeof items)[number]) => getStock(item) <= 0;
    const exceedsStock = (item: (typeof items)[number]) => !isOutOfStock(item) && item.quantity > getStock(item);
    const isSelectable = (item: (typeof items)[number]) => !isOutOfStock(item) && !exceedsStock(item);

    const selectableItems = items.filter(isSelectable);
    const selectedItems = selectableItems.filter(item => !deselectedIds.has(item._id));
    const cartSubtotal = selectedItems.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);

    const toggleItem = (itemId: string) => {
        setDeselectedIds(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    const allSelected = selectableItems.length > 0 && selectedItems.length === selectableItems.length;
    const toggleSelectAll = () => {
        setDeselectedIds(allSelected ? new Set(selectableItems.map(item => item._id)) : new Set());
    };

    // Determine cart size — คิดเฉพาะรายการที่เลือกสั่งซื้อ
    const cartSize = selectedItems.some(item => item.product.shippingSize === 'large') ? 'large' : 'small';

    // Filter available shipping methods
    const availableShippingMethods = useMemo(() => {
        if (!shippingMethods) return [];
        return shippingMethods.filter(method =>
            method.isActive && method.supportedSizes.includes(cartSize)
        );
    }, [shippingMethods, cartSize]);

    // Derive selections — fall back to first option when user hasn't chosen
    const selectedShippingId = manualShippingId ?? availableShippingMethods[0]?._id ?? '';
    const selectedAddressId = useMemo(() => {
        if (manualAddressId) return manualAddressId;
        if (!addresses?.length) return '';
        return addresses.find(a => a.isDefault)?._id ?? addresses[0]._id;
    }, [manualAddressId, addresses]);

    const setSelectedShippingId = setManualShippingId;
    const setSelectedAddressId = setManualAddressId;

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!customer) {
            router.push('/customer-login?redirect=/cart');
        }
    }, [customer, router]);

    if (!customer) {
        return null; // Will redirect
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]" role="status">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <span className="sr-only">กำลังโหลดรถเข็น...</span>
            </div>
        );
    }

    const selectedMethod = shippingMethods?.find(m => m._id === selectedShippingId);
    const shippingCost = selectedMethod?.price || 0;
    const totalAmount = cartSubtotal + shippingCost;

    const handleUpdateQuantity = (itemId: string, currentQuantity: number, change: number, maxStock: number) => {
        const newQuantity = currentQuantity + change;
        if (newQuantity <= 0) return;
        if (change > 0 && newQuantity > maxStock) {
            toast.error(`สินค้ามีไม่เพียงพอ (คงเหลือ ${maxStock} ชิ้น)`);
            return;
        }
        updateCartItem.mutate({ itemId, quantity: newQuantity });
    };

    const handleRemoveItem = (itemId: string) => {
        removeCartItem.mutate(itemId);
    };

    const handleCheckout = async () => {
        if (selectedItems.length === 0) {
            toast.error('กรุณาเลือกสินค้าที่ต้องการสั่งซื้อ');
            return;
        }
        if (!selectedAddressId) {
            toast.error('กรุณาเลือกที่อยู่จัดส่ง');
            return;
        }
        if (!selectedShippingId) {
            toast.error('กรุณาเลือกวิธีการจัดส่ง');
            return;
        }
        try {
            const order = await createOrder.mutateAsync({
                shippingMethodId: selectedShippingId,
                shippingAddressId: selectedAddressId,
                paymentMethod,
                itemIds: selectedItems.map(item => item._id)
            });
            router.push(`/orders/${order._id}`);
        } catch (error) {
            // Error is handled by the mutation
        }
    };

    if (items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <h1 className="text-3xl font-bold mb-8">รถเข็นของคุณ</h1>
                <Card className="p-12 text-center border-0 shadow-lg rounded-[2.5rem]">
                    <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">รถเข็นของคุณว่างเปล่า</h2>
                    <p className="text-gray-600 mb-6">เลือกชมสินค้าเพื่อเพิ่มใส่รถเข็นเลย!</p>
                    <Button asChild className="bg-gray-900 hover:bg-black rounded-full px-8">
                        <Link href="/products">เลือกชมสินค้า</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                    รถเข็น<span className="gradient-text-primary">สินค้า</span>
                </h1>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            disabled={clearCart.isPending}
                            className="rounded-full border-2 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-bold"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            ล้างรถเข็น
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>ล้างรถเข็นทั้งหมด?</AlertDialogTitle>
                            <AlertDialogDescription>
                                สินค้าทั้งหมดในรถเข็นจะถูกลบออก ไม่สามารถย้อนกลับได้
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={() => clearCart.mutate()} className="bg-red-500 hover:bg-red-600">
                                ล้างรถเข็น
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Select All */}
                    {selectableItems.length > 0 && (
                        <div className="flex items-center gap-3 px-2">
                            <Checkbox
                                id="select-all"
                                checked={allSelected}
                                onCheckedChange={toggleSelectAll}
                                aria-label="เลือกสินค้าทั้งหมด"
                            />
                            <Label htmlFor="select-all" className="cursor-pointer text-sm font-bold text-gray-700">
                                เลือกทั้งหมด <span className="text-gray-400 font-medium">(เลือกแล้ว {selectedItems.length}/{selectableItems.length} รายการ)</span>
                            </Label>
                        </div>
                    )}

                    {items.map((item) => {
                        const stock = getStock(item);
                        const oos = isOutOfStock(item);
                        const overStock = exceedsStock(item);
                        const checked = isSelectable(item) && !deselectedIds.has(item._id);
                        return (
                        <Card key={item._id} className={`p-4 md:p-6 border-0 shadow-lg shadow-gray-100/50 rounded-[2rem] overflow-hidden group transition-all duration-300 border border-gray-50/50 ${oos ? 'opacity-60 bg-gray-50/80' : 'hover:shadow-xl'}`}>
                            <div className="flex gap-4">
                                {/* Selection Checkbox */}
                                <div className="flex items-center shrink-0">
                                    <Checkbox
                                        checked={checked}
                                        disabled={!isSelectable(item)}
                                        onCheckedChange={() => toggleItem(item._id)}
                                        aria-label={oos
                                            ? `${item.product.productName} — สินค้าหมด ไม่สามารถเลือกได้`
                                            : `เลือก ${item.product.productName} เพื่อสั่งซื้อ`}
                                    />
                                </div>

                                <div className="flex-1 flex flex-col sm:flex-row gap-6">
                                {/* Product Image */}
                                <Link href={`/products/${item.product._id}`} className="shrink-0 mx-auto sm:mx-0">
                                    <div className={`relative h-32 w-32 md:h-40 md:w-40 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 transition-transform duration-500 ${oos ? 'grayscale' : 'group-hover:scale-105'}`}>
                                        {item.product.imageUrl ? (
                                            <Image
                                                src={getImageUrl(item.product.imageUrl)}
                                                alt={item.product.productName}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 128px, 160px"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-50">
                                                ไม่มีรูปภาพ
                                            </div>
                                        )}
                                        {oos && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                                                <span className="bg-gray-900/80 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                                                    สินค้าหมด
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start gap-4">
                                            <Link href={`/products/${item.product._id}`} className="group/title">
                                                <h3 className={`font-bold text-xl md:text-2xl transition-colors line-clamp-2 leading-tight ${oos ? 'text-gray-500' : 'text-gray-900 group-hover/title:text-primary'}`}>
                                                    {item.product.productName}
                                                </h3>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveItem(item._id)}
                                                disabled={removeCartItem.isPending}
                                                aria-label={`ลบ ${item.product.productName} ออกจากรถเข็น`}
                                                className="text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full shrink-0 h-10 w-10"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-xs font-bold uppercase tracking-widest text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                                SKU: {item.variant.sku}
                                            </span>
                                            {item.product.shippingSize === 'large' && (
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                                    สินค้าขนาดใหญ่
                                                </span>
                                            )}
                                            {oos && (
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                                    สินค้าหมด — ไม่ถูกรวมในยอดชำระ
                                                </span>
                                            )}
                                        </div>
                                        {overStock && (
                                            <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                                <span>สินค้าคงเหลือเพียง {stock} ชิ้น กรุณาลดจำนวนก่อนสั่งซื้อ</span>
                                                <button
                                                    onClick={() => updateCartItem.mutate({ itemId: item._id, quantity: stock })}
                                                    disabled={updateCartItem.isPending}
                                                    className="underline underline-offset-2 hover:text-red-700 disabled:opacity-50"
                                                >
                                                    ปรับเป็น {stock} ชิ้น
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-end justify-between mt-6 gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">ราคาต่อชิ้น</span>
                                            <p className={`text-xl font-black ${oos ? 'text-gray-400' : 'text-primary'}`}>
                                                ฿{item.variant.price.toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-6 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleUpdateQuantity(item._id, item.quantity, -1, stock)}
                                                        disabled={updateCartItem.isPending || oos}
                                                        aria-label="ลดจำนวน"
                                                        className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-10 text-center font-black text-gray-900" aria-live="polite">{item.quantity}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleUpdateQuantity(item._id, item.quantity, 1, stock)}
                                                        disabled={updateCartItem.isPending || oos || item.quantity >= stock}
                                                        aria-label="เพิ่มจำนวน"
                                                        className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-30"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {!oos && Number.isFinite(stock) && item.quantity >= stock && (
                                                <span className="text-[10px] font-bold text-orange-600">สูงสุด {stock} ชิ้น</span>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">ราคารวม</span>
                                            <p className={`text-2xl font-black ${oos ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                ฿{(item.variant.price * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                        </Card>
                        );
                    })}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <Card className="p-8 sticky top-24 border-0 shadow-2xl shadow-gray-200/50 rounded-[2.5rem] bg-white border border-gray-100">
                        <h2 className="text-2xl font-black mb-8 text-gray-900 tracking-tight uppercase">สรุป<span className="text-primary">คำสั่งซื้อ</span></h2>

                        <div className="space-y-6 mb-8">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-gray-600 font-medium">ยอดสินค้า ({selectedItems.length} รายการ)</span>
                                <span className="font-bold text-gray-900">฿{cartSubtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-gray-600 font-medium">ค่าจัดส่ง</span>
                                <span className="font-bold text-primary">
                                    {!selectedMethod ? '—' : shippingCost > 0 ? `฿${shippingCost.toLocaleString()}` : 'ฟรี'}
                                </span>
                            </div>

                            {/* Address Selection */}
                            <div className="pt-6 border-t border-gray-100">
                                <p className="font-black text-xs uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    ที่อยู่จัดส่ง
                                </p>
                                {addresses && addresses.length > 0 ? (
                                    <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId} className="space-y-3">
                                        {addresses.map((address) => (
                                            <div key={address._id} className={`flex items-start space-x-3 border-2 rounded-2xl p-4 cursor-pointer transition-all ${selectedAddressId === address._id ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-gray-50 hover:border-gray-200 bg-gray-50/50'}`}>
                                                <RadioGroupItem value={address._id} id={address._id} className="mt-1" />
                                                <Label htmlFor={address._id} className="cursor-pointer flex-1 flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-gray-900 text-base leading-none">{address.recipientName}</span>
                                                        {address.isDefault && <span className="text-[10px] font-black tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">ที่อยู่หลัก</span>}
                                                    </div>
                                                    <span className="text-xs text-gray-600 font-medium leading-relaxed">
                                                        {address.streetAddress}, {address.subDistrict}, {address.district}, {address.province} {address.zipCode}
                                                    </span>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                        <p className="text-sm text-gray-600 font-bold mb-3 uppercase tracking-wider">ยังไม่มีที่อยู่จัดส่ง</p>
                                        <Button variant="outline" size="sm" asChild className="rounded-full border-2 font-bold hover:bg-primary hover:text-white hover:border-primary transition-all">
                                            <Link href="/profile">เพิ่มที่อยู่ใหม่</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Shipping Selection */}
                            <div className="pt-4">
                                <p className="font-black text-xs uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-primary" />
                                    วิธีการจัดส่ง
                                </p>
                                {availableShippingMethods.length > 0 ? (
                                    <RadioGroup value={selectedShippingId} onValueChange={setSelectedShippingId} className="space-y-3">
                                        {availableShippingMethods.map((method) => (
                                            <div key={method._id} className={`flex items-center justify-between space-x-3 border-2 rounded-2xl p-4 cursor-pointer transition-all ${selectedShippingId === method._id ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-gray-50 hover:border-gray-200 bg-gray-50/50'}`}>
                                                <div className="flex items-center space-x-3">
                                                    <RadioGroupItem value={method._id} id={method._id} />
                                                    <Label htmlFor={method._id} className="cursor-pointer">
                                                        <span className="font-bold text-gray-900 block">{method.name}</span>
                                                        <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">{method.description || 'จัดส่งมาตรฐาน'}</span>
                                                    </Label>
                                                </div>
                                                <span className="font-black text-gray-900">฿{method.price.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                        <p className="text-xs text-red-600 font-bold">ไม่มีวิธีการจัดส่งสำหรับขนาดพัสดุนี้</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Method Selection */}
                        <div className="pt-4 pb-8">
                            <p className="font-black text-xs uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-primary" />
                                ช่องทางชำระเงิน
                            </p>
                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 gap-3">
                                <div className={`flex flex-col items-center justify-center space-y-2 border-2 rounded-2xl p-4 cursor-pointer transition-all ${paymentMethod === 'Transfer' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-gray-50 hover:border-gray-200 bg-gray-50/50'}`}>
                                    <RadioGroupItem value="Transfer" id="transfer" className="sr-only" />
                                    <Label htmlFor="transfer" className="cursor-pointer text-center">
                                        <span className="font-bold text-gray-900 block text-sm">โอนเงิน</span>
                                        <span className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">แนบสลิป</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="border-t-2 border-gray-50 pt-6 mb-8 flex justify-between items-center">
                            <span className="text-xl font-black text-gray-600 uppercase tracking-tighter">ยอดรวม</span>
                            <span className="text-4xl font-black text-primary tracking-tighter drop-shadow-sm">
                                ฿{totalAmount.toLocaleString()}
                            </span>
                        </div>

                        <Button
                            className="w-full bg-gray-900 text-white hover:bg-black rounded-3xl h-16 text-xl font-black uppercase tracking-widest shadow-xl shadow-gray-200 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                            size="lg"
                            onClick={handleCheckout}
                            disabled={createOrder.isPending || !selectedAddressId || !selectedShippingId || selectedItems.length === 0}
                        >
                            {createOrder.isPending ? 'กำลังดำเนินการ...' : 'สั่งซื้อเลย'}
                        </Button>

                        {selectedItems.length === 0 && (
                            <p className="mt-3 text-center text-xs font-bold text-red-500">
                                กรุณาเลือกสินค้าอย่างน้อย 1 รายการ
                            </p>
                        )}

                        <Button
                            variant="ghost"
                            className="w-full mt-4 text-gray-600 hover:text-primary font-bold transition-colors"
                            asChild
                        >
                            <Link href="/products">← เลือกสินค้าต่อ</Link>
                        </Button>
                    </Card>
                </div>
            </div >
        </div >
    );
}
