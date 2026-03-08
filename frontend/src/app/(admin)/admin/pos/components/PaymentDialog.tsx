'use client';

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Loader2, Delete, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    totalAmount: number;
    onConfirm: (cashReceived: number, change: number) => Promise<void>;
    isProcessing: boolean;
}

export function PaymentDialog({ open, onOpenChange, totalAmount, onConfirm, isProcessing }: PaymentDialogProps) {
    const [cashReceivedStr, setCashReceivedStr] = useState('');

    useEffect(() => {
        if (open) {
            setCashReceivedStr('');
        }
    }, [open]);

    const cashReceived = parseFloat(cashReceivedStr) || 0;
    const changeDue = Math.max(0, cashReceived - totalAmount);
    const isValidPayment = cashReceived >= totalAmount && totalAmount > 0;

    const handleNumpadClick = (value: string) => {
        if (value === 'C') {
            setCashReceivedStr('');
        } else if (value === 'DEL') {
            setCashReceivedStr(prev => prev.slice(0, -1));
        } else if (value === '.') {
            if (!cashReceivedStr.includes('.')) {
                setCashReceivedStr(prev => prev + '.');
            }
        } else {
            // Limit decimal places to 2
            if (cashReceivedStr.includes('.') && cashReceivedStr.split('.')[1].length >= 2) return;
            setCashReceivedStr(prev => prev + value);
        }
    };

    const handleQuickCash = (amount: number) => {
        setCashReceivedStr(amount.toString());
    };

    const handleConfirm = () => {
        if (isValidPayment) {
            onConfirm(cashReceived, changeDue);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
                        <Banknote className="h-6 w-6" />
                        Cash Payment
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                    {/* Left Column: Summary & Input */}
                    <div className="space-y-6">
                        <div className="text-center bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Amount to Pay</p>
                            <p className="text-4xl lg:text-5xl font-black text-primary">฿{totalAmount.toLocaleString()}</p>
                        </div>

                        <div className={`p-5 rounded-xl border-2 transition-colors ${changeDue > 0 ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-600">Change</span>
                                <span className={`text-2xl font-black ${changeDue > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                    ฿{changeDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-base font-semibold">Received Amount</Label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">฿</span>
                                <Input
                                    readOnly
                                    className="pl-10 h-14 text-2xl font-bold bg-white border-2 focus:border-primary/50 text-right pr-4"
                                    value={cashReceivedStr}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Numpad */}
                    <div className="space-y-3">
                        {/* Quick Cash */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <Button variant="outline" size="sm" onClick={() => handleQuickCash(totalAmount)} className="h-10 text-xs font-bold border-primary/20 text-primary bg-primary/5 hover:bg-primary/10">Exact</Button>
                            <Button variant="outline" size="sm" onClick={() => handleQuickCash(100)} className="h-10 text-xs">฿100</Button>
                            <Button variant="outline" size="sm" onClick={() => handleQuickCash(500)} className="h-10 text-xs">฿500</Button>
                            <Button variant="outline" size="sm" onClick={() => handleQuickCash(1000)} className="h-10 text-xs">฿1,000</Button>
                        </div>

                        {/* Numpad Grid */}
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                                <Button
                                    key={num}
                                    variant="outline"
                                    className="h-14 text-xl font-semibold active:bg-gray-100"
                                    onClick={() => handleNumpadClick(num.toString())}
                                >
                                    {num}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                className="h-14 text-xl font-semibold text-red-500 hover:text-red-600 active:bg-red-50"
                                onClick={() => handleNumpadClick('DEL')}
                            >
                                <Delete className="h-6 w-6" />
                            </Button>
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full h-10 mt-1"
                            onClick={() => handleNumpadClick('C')}
                        >
                            Start Over
                        </Button>

                    </div>
                </div>

                <DialogFooter className="gap-3 sm:gap-0 mt-2">
                    <Button variant="outline" className="h-12 flex-1 text-base" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
                    <Button
                        className="h-12 flex-1 text-base font-bold shadow-lg shadow-primary/20"
                        onClick={handleConfirm}
                        disabled={!isValidPayment || isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : 'Confirm Payment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
