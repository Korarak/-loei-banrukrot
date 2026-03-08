'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Plus, Minus, Package, Banknote, ChevronRight, AlertCircle } from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState } from 'react';

interface CartItem {
    variantId: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    sku: string;
    image?: string;
}

interface CartSidebarProps {
    cart: CartItem[];
    onUpdateQuantity: (variantId: string, delta: number) => void;
    onClearCart: () => void;
    onCheckout: () => void;
}

export function CartSidebar({ cart, onUpdateQuantity, onClearCart, onCheckout }: CartSidebarProps) {
    const [clearCartOpen, setClearCartOpen] = useState(false);
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="flex flex-col h-full bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-xl overflow-hidden">
            {/* Cart Header */}
            <div className="p-3 border-b bg-gray-50/50 flex justify-between items-center backdrop-blur-sm sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <ShoppingCart className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="font-bold text-base text-gray-900">Current Sale</h2>
                        <p className="text-[10px] text-gray-500">{totalItems} items</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => setClearCartOpen(true)}
                    disabled={cart.length === 0}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 p-4 bg-gray-50/30 overflow-y-auto custom-scrollbar">
                <div className="space-y-3 pb-4">
                    {cart.map((item) => (
                        <div key={item.variantId} className="flex gap-2 p-2 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100 relative">
                                {item.image ? (
                                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Package className="h-5 w-5 opacity-50" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div className="font-semibold text-gray-900 truncate text-xs sm:text-sm">{item.name}</div>
                                <div className="flex justify-between items-end">
                                    <div className="text-[10px] text-gray-500 font-medium">฿{item.price.toLocaleString()}</div>
                                    <div className="font-bold text-gray-900 text-sm">฿{(item.price * item.quantity).toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 justify-center pl-1">
                                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 shadow-inner">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm active:scale-90 transition-all"
                                        onClick={() => onUpdateQuantity(item.variantId, -1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm active:scale-90 transition-all"
                                        onClick={() => onUpdateQuantity(item.variantId, 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4 py-20 opacity-60">
                            <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center">
                                <ShoppingCart className="h-10 w-10 text-gray-400" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-gray-600">Cart is empty</p>
                                <p className="text-sm max-w-[200px] mt-1">Select products to start a new sale</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Totals & Actions */}
            <div className="p-4 bg-white border-t space-y-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-20 shrink-0">
                <div className="space-y-2">
                    <div className="flex justify-between text-gray-500 text-xs">
                        <span>Subtotal</span>
                        <span className="font-medium">{totalItems} items</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs">
                        <span>Discount</span>
                        <span className="font-medium">฿0.00</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-end">
                        <span className="font-bold text-lg text-gray-900">Total</span>
                        <span className="font-black text-3xl text-primary tracking-tight">
                            ฿{totalAmount.toLocaleString()}
                        </span>
                    </div>
                </div>

                <Button
                    className="w-full h-12 text-lg font-bold rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                    size="lg"
                    onClick={onCheckout}
                    disabled={cart.length === 0}
                >
                    <Banknote className="mr-2 h-5 w-5" />
                    Pay Now
                    <ChevronRight className="ml-auto h-5 w-5 opacity-50" />
                </Button>
            </div>

            {/* Clear Cart Dialog */}
            <Dialog open={clearCartOpen} onOpenChange={setClearCartOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            Clear Cart?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove all items from the cart?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setClearCartOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => { onClearCart(); setClearCartOpen(false); }}>Clear All</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
