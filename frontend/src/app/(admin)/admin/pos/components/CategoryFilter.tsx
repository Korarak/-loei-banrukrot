'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';
import { useDraggable } from '@/hooks/useDraggable';

interface CategoryFilterProps {
    categories: any[];
    selectedCategory: string;
    onSelectCategory: (id: string) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
    const { ref, events, isDragging } = useDraggable();

    return (
        <div className="w-full">
            <div
                ref={ref}
                {...events}
                className="w-full whitespace-nowrap rounded-md overflow-x-auto cursor-grab active:cursor-grabbing"
                style={{
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none',  /* IE 10+ */
                }}
            >
                <div className={cn("flex w-max space-x-2 p-1", isDragging && "pointer-events-none")}>
                    <Button
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        onClick={() => onSelectCategory('all')}
                        className={cn(
                            "rounded-full px-6 h-10 transition-all active:scale-95",
                            selectedCategory === 'all'
                                ? "bg-black text-white hover:bg-gray-800 shadow-md"
                                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                        )}
                    >
                        <Package className="mr-2 h-4 w-4" />
                        All Items
                    </Button>
                    {categories?.map((cat: any) => (
                        <Button
                            key={cat.categoryId}
                            variant={selectedCategory === cat.categoryId.toString() ? 'default' : 'outline'}
                            onClick={() => onSelectCategory(cat.categoryId.toString())}
                            className={cn(
                                "rounded-full px-6 h-10 transition-all active:scale-95",
                                selectedCategory === cat.categoryId.toString()
                                    ? "bg-black text-white hover:bg-gray-800 shadow-md"
                                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                            )}
                        >
                            {/* You could add dynamic icons here based on category if available */}
                            {cat.name}
                        </Button>
                    ))}
                </div>
                {/* Hide scrollbar for Chrome/Safari/Opera */}
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
            </div>
        </div>
    );
}
