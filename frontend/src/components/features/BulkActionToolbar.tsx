'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trash2, Store, Globe, FolderInput, Download, X, ChevronDown } from 'lucide-react';

interface BulkActionToolbarProps {
    selectedCount: number;
    isBusy: boolean;
    onBulkDelete: () => void;
    onTogglePos: (value: boolean) => void;
    onToggleOnline: (value: boolean) => void;
    onBulkCategoryChange: () => void;
    onExportSelected: () => void;
    onClearSelection: () => void;
}

export default function BulkActionToolbar({
    selectedCount,
    isBusy,
    onBulkDelete,
    onTogglePos,
    onToggleOnline,
    onBulkCategoryChange,
    onExportSelected,
    onClearSelection,
}: BulkActionToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 sticky top-0 z-10 backdrop-blur-sm">
            <span className="text-sm font-bold text-gray-900">
                เลือกแล้ว {selectedCount} รายการ
            </span>

            <div className="h-5 w-[1px] bg-gray-200" />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-medium bg-white" disabled={isBusy}>
                        เปลี่ยนช่องทางขาย <ChevronDown className="h-3.5 w-3.5 ml-1" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-white">
                    <DropdownMenuLabel>หน้าร้าน (POS)</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onTogglePos(true)}>
                        <Store className="h-3.5 w-3.5 mr-2" /> เปิดขาย
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTogglePos(false)}>
                        <Store className="h-3.5 w-3.5 mr-2" /> ปิดขาย
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>ออนไลน์</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onToggleOnline(true)}>
                        <Globe className="h-3.5 w-3.5 mr-2" /> เปิดขาย
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleOnline(false)}>
                        <Globe className="h-3.5 w-3.5 mr-2" /> ปิดขาย
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium bg-white"
                onClick={onBulkCategoryChange}
                disabled={isBusy}
            >
                <FolderInput className="h-3.5 w-3.5 mr-1.5" /> เปลี่ยนหมวดหมู่
            </Button>

            <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium bg-white"
                onClick={onExportSelected}
                disabled={isBusy}
            >
                <Download className="h-3.5 w-3.5 mr-1.5" /> ส่งออก CSV
            </Button>

            <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={onBulkDelete}
                disabled={isBusy}
            >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> ลบ
            </Button>

            <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-medium text-gray-500 ml-auto"
                onClick={onClearSelection}
                disabled={isBusy}
            >
                <X className="h-3.5 w-3.5 mr-1.5" /> ล้างการเลือก
            </Button>
        </div>
    );
}
