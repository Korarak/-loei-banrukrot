'use client';

import { useWishlistStore } from '@/stores/useWishlistStore';
import ProductCard from '@/components/features/ProductCard';
import { Button } from '@/components/ui/button';
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
import { Heart, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
    const { items, clearWishlist } = useWishlistStore();

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <Heart className="h-10 w-10 text-gray-300" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">คุณยังไม่มีสินค้าที่ถูกใจ</h1>
                <p className="text-gray-500 max-w-sm mb-8">
                    เลือกชมสินค้าและบันทึกรายการที่คุณสนใจได้เลย
                </p>
                <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90">
                    <Link href="/products">เลือกซื้อสินค้า</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">รายการโปรดของฉัน</h1>
                    <p className="text-gray-500 mt-1">รายการที่บันทึกไว้ทั้งหมด {items.length} รายการ</p>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 hidden md:flex">
                            <Trash2 className="h-4 w-4 mr-2" />
                            ล้างทั้งหมด
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>ล้างรายการโปรดทั้งหมด?</AlertDialogTitle>
                            <AlertDialogDescription>
                                สินค้าทั้งหมด {items.length} รายการจะถูกลบออก ไม่สามารถย้อนกลับได้
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={clearWishlist} className="bg-red-500 hover:bg-red-600">
                                ล้างทั้งหมด
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item) => (
                    <ProductCard
                        key={item._id}
                        product={{
                            _id: item._id,
                            productName: item.productName,
                            imageUrl: item.imageUrl,
                            variants: [{ price: item.price }], // Mock variant structure for card to render price
                            images: item.imageUrl ? [{ imagePath: item.imageUrl, isPrimary: true }] : [],
                            brand: '', // Optional or store if needed
                        }}
                    />
                ))}
            </div>

            <div className="mt-12 text-center md:hidden">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 w-full">
                            ล้างรายการทั้งหมด
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>ล้างรายการโปรดทั้งหมด?</AlertDialogTitle>
                            <AlertDialogDescription>
                                สินค้าทั้งหมด {items.length} รายการจะถูกลบออก ไม่สามารถย้อนกลับได้
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={clearWishlist} className="bg-red-500 hover:bg-red-600">
                                ล้างทั้งหมด
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
