'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import api from '@/lib/api';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

import { CategoryFilter } from './components/CategoryFilter';
import { ProductGrid } from './components/ProductGrid';
import { CartSidebar } from './components/CartSidebar';
import { PaymentDialog } from './components/PaymentDialog';
import { ReceiptDialog } from './components/ReceiptDialog';

export default function POSPage() {
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // UI State
    const [mobileCartOpen, setMobileCartOpen] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<any | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch Products
    const { data: products, isLoading: isProductsLoading } = useQuery({
        queryKey: ['pos-products', search, selectedCategory],
        queryFn: async () => {
            const params: any = {};
            if (search) params.search = search;
            if (selectedCategory !== 'all') params.categoryId = selectedCategory;
            const response = await api.get('/products', { params });
            return response.data.data;
        },
    });

    const { data: categories } = useCategories(true);

    // Cart Logic
    const addToCart = (product: any) => {
        const variant = product.variants?.[0];
        if (!variant || (variant.stockAvailable || 0) <= 0) {
            toast.error('สินค้าหมด', { description: 'สินค้านี้ไม่พร้อมจำหน่ายในขณะนี้', id: 'pos-out-of-stock' }); // Prevent stack
            return;
        }

        const existingItem = cart.find((item) => item.variantId === variant._id);
        if (existingItem) {
            if (existingItem.quantity + 1 > variant.stockAvailable) {
                toast.error('เกินขีดจำกัดสต๊อก', { description: `มีสินค้าเพียง ${variant.stockAvailable} ชิ้นเท่านั้น`, id: 'pos-stock-limit' }); // Prevent stack
                return;
            }
            // Optimistic feedback is enough, no toast needed for increment
            updateQuantity(variant._id, 1);
        } else {
            setCart([
                ...cart,
                {
                    variantId: variant._id,
                    productId: product._id,
                    name: product.productName,
                    price: variant.price,
                    quantity: 1,
                    sku: variant.sku,
                    image: product.images?.[0]?.imagePath,
                    stockAvailable: variant.stockAvailable
                },
            ]);
            toast.success('เพิ่มลงในรถเข็นแล้ว', { duration: 1000, position: 'bottom-center' });
        }
    };

    const updateQuantity = (variantId: string, delta: number) => {
        setCart(
            cart.map((item) => {
                if (item.variantId === variantId) {
                    const newQuantity = Math.max(0, item.quantity + delta);

                    if (delta > 0 && newQuantity > item.stockAvailable) {
                        toast.error('เกินขีดจำกัดสต๊อก', { description: `มีสินค้าเพียง ${item.stockAvailable} ชิ้นเท่านั้น`, id: 'pos-stock-limit-update' }); // Prevent stack
                        return item;
                    }

                    return { ...item, quantity: newQuantity };
                }
                return item;
            }).filter((item) => item.quantity > 0)
        );
    };

    const clearCart = () => setCart([]);

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Payment Logic
    const handlePayment = async (cashReceived: number, change: number) => {
        setIsProcessing(true);
        try {
            const response = await api.post('/pos/sales', {
                items: cart.map((item) => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                })),
                paymentMethod: 'Cash',
                amountReceived: cashReceived,
                change: change,
                storeId: null,
            });

            if (response.data.success) {
                setReceiptData({
                    ...response.data.data,
                    items: cart,
                    total: totalAmount,
                    cash: cashReceived,
                    change: change,
                    date: new Date().toISOString()
                });
                setPaymentDialogOpen(false);
                setReceiptDialogOpen(true);
                clearCart();
                setMobileCartOpen(false); // Close mobile cart if open
                toast.success('การขายเสร็จสมบูรณ์');
            }
        } catch (error: any) {
            console.error(error);
            toast.error('การขายล้มเหลว', {
                description: error.response?.data?.message || 'เกิดข้อผิดพลาดในการประมวลผลการขาย',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] xl:h-[calc(100dvh-2rem)] md:gap-6 p-0 bg-gray-50/50 pb-0 overflow-hidden">
            {/* Main Content (Products) */}
            <div className="flex-1 flex flex-col gap-4 min-w-0 h-full">
                {/* Search & Filter Header */}
                <div className="flex flex-col gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 shrink-0 mx-3 md:mx-0 mt-2 md:mt-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="ค้นหาสินค้า..."
                            className="pl-10 h-12 text-lg bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <CategoryFilter
                        categories={categories || []}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                    />
                </div>

                {/* Product Grid Scroll Area */}
                <div className="flex-1 overflow-y-auto bg-white md:rounded-2xl md:border md:border-gray-100 shadow-sm rounded-xl mx-3 md:mx-0 mb-40 md:mb-0">
                    <div className="p-3 md:p-4">
                        <ProductGrid
                            products={products || []}
                            onAddToCart={addToCart}
                            isLoading={isProductsLoading}
                        />
                        {/* Extra spacer for mobile so last items aren't covered by the fixed bar */}
                        <div className="h-20 md:hidden" />
                    </div>
                </div>
            </div>

            {/* Desktop Right Sidebar (Cart) */}
            <div className="hidden md:block w-[35%] min-w-[320px] max-w-[420px] shrink-0 h-full">
                <CartSidebar
                    cart={cart}
                    onUpdateQuantity={updateQuantity}
                    onClearCart={clearCart}
                    onCheckout={() => setPaymentDialogOpen(true)}
                />
            </div>

            {/* Mobile Bottom Bar (Above Admin Nav) */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 bg-white border-t z-30 pb-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
                <Button
                    className="w-full h-14 rounded-xl shadow-lg flex items-center justify-between px-6 text-lg font-bold"
                    onClick={() => setMobileCartOpen(true)}
                >
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <span>ดูรถเข็น</span>
                        <Badge variant="secondary" className="ml-2 bg-white/20 text-white hover:bg-white/30 border-none">{totalItems}</Badge>
                    </div>
                    <span>฿{totalAmount.toLocaleString()}</span>
                </Button>
            </div>

            {/* Mobile Cart Sheet */}
            <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
                <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-xl">
                    <SheetHeader className="absolute top-0 left-0 right-0 z-10 bg-white border-b p-4 rounded-t-3xl">
                        <SheetTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            การขายปัจจุบัน
                        </SheetTitle>
                    </SheetHeader>
                    <div className="pt-16 h-full">
                        <CartSidebar
                            cart={cart}
                            onUpdateQuantity={updateQuantity}
                            onClearCart={clearCart}
                            onCheckout={() => setPaymentDialogOpen(true)}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Dialogs */}
            <PaymentDialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
                totalAmount={totalAmount}
                onConfirm={handlePayment}
                isProcessing={isProcessing}
            />

            <ReceiptDialog
                open={receiptDialogOpen}
                onOpenChange={setReceiptDialogOpen}
                receiptData={receiptData}
                onPrint={() => window.print()}
                onNewSale={() => setReceiptDialogOpen(false)}
            />

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #receipt-content, #receipt-content * {
                        visibility: visible;
                    }
                    #receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0;
                        margin: 0;
                    }
                    [role="dialog"] {
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
            `}} />
        </div>
    );
}
