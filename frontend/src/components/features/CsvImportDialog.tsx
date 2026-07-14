'use client';

import { useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { useImportProductsCSV, exportProductsCSV, type CsvImportResult } from '@/hooks/useProducts';

interface CsvImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [result, setResult] = useState<CsvImportResult | null>(null);
    const importCsv = useImportProductsCSV();

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) {
            setSelectedFile(null);
            setResult(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
        onOpenChange(nextOpen);
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;
        try {
            const data = await importCsv.mutateAsync(selectedFile);
            setResult(data);
        } catch {
            // Error toast already shown by the mutation
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-white max-w-lg">
                <DialogHeader>
                    <DialogTitle>นำเข้าสินค้าจาก CSV</DialogTitle>
                    <DialogDescription>
                        อัปเดตราคา สต๊อก หมวดหมู่ และช่องทางขาย โดยจับคู่ด้วยคอลัมน์ VariantID ในไฟล์ (ห้ามลบคอลัมน์นี้ — SKU ซ้ำกันได้จึงใช้จับคู่ไม่ได้)
                        เว้นว่างช่องไหนไว้ ช่องนั้นจะไม่ถูกเปลี่ยน ไม่สามารถสร้างสินค้าใหม่ผ่าน CSV ได้
                    </DialogDescription>
                </DialogHeader>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => exportProductsCSV()}
                >
                    <Download className="h-4 w-4 mr-2" /> ดาวน์โหลดเทมเพลต (ไฟล์สินค้าปัจจุบันทั้งหมด)
                </Button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    disabled={importCsv.isPending}
                    onChange={(e) => {
                        setSelectedFile(e.target.files?.[0] || null);
                        setResult(null);
                    }}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
                />

                {result && (
                    <div className="rounded-lg border border-gray-200 p-3 max-h-56 overflow-y-auto space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                            <CheckCircle2 className="h-4 w-4" /> อัปเดตสำเร็จ {result.updatedCount} รายการ
                        </div>
                        {result.skippedCount > 0 && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                                    <AlertCircle className="h-4 w-4" /> ข้าม {result.skippedCount} รายการ
                                </div>
                                <ul className="text-xs text-gray-500 space-y-0.5 pl-6 list-disc">
                                    {result.skipped.map((row, i) => (
                                        <li key={i}>
                                            แถวที่ {row.row} (SKU: {row.sku || '-'}): {row.reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)} disabled={importCsv.isPending}>
                        ปิด
                    </Button>
                    <Button onClick={handleSubmit} disabled={!selectedFile || importCsv.isPending}>
                        <Upload className="h-4 w-4 mr-2" />
                        {importCsv.isPending ? 'กำลังนำเข้า...' : 'นำเข้า'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
