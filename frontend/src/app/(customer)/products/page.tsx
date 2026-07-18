'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/features/ProductCard';
import Pagination from '@/components/features/Pagination';
import api from '@/lib/api';
import { parseBrands, uniqueBrands } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, X, ShoppingBag } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // URL State
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    const sortParam = searchParams.get('sort');
    const pageParam = searchParams.get('page');

    // Local State
    const [search, setSearch] = useState(searchParam || '');
    const [priceRange, setPriceRange] = useState([0, 20000]);
    const [debouncedPriceRange, setDebouncedPriceRange] = useState(priceRange);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    // Debounce priceRange updates
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedPriceRange(priceRange);
        }, 500); // 500ms debounce delay

        return () => clearTimeout(handler);
    }, [priceRange]);

    // Sync local search state with URL (e.g. browser back/forward)
    useEffect(() => {
        setSearch(searchParam || '');
    }, [searchParam]);

    // Update URL helper
    const updateParams = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        router.push(`/products?${params.toString()}`, { scroll: false });
    };

    // Fetch Categories
    const { data: categories } = useCategories(true);

    // Fetch Unique Brands from DB
    const { data: availableBrands = [] } = useQuery({
        queryKey: ['all-brands'],
        queryFn: async () => {
            try {
                const response = await api.get('/products', { params: { limit: 1000 } });
                const allProducts = response.data.data || [];
                return uniqueBrands(allProducts.flatMap((p: any) => parseBrands(p.brand)));
            } catch (error) {
                console.error("Failed to fetch brands", error);
                return [];
            }
        },
        staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    });

    // Fetch Products
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['products', categoryParam, searchParam, sortParam, pageParam, debouncedPriceRange, selectedBrands],
        queryFn: async () => {
            const params: any = {
                page: pageParam || 1,
                limit: 12, // Items per page
            };

            // Category Logic
            if (categoryParam && categories) {
                const cat = categories.find(c => c.slug === categoryParam);
                if (cat) params.categoryId = cat.categoryId;
            }

            if (searchParam) params.search = searchParam;
            if (sortParam) params.sort = sortParam;
            
            // Server-side filtering
            if (debouncedPriceRange) {
                params.minPrice = debouncedPriceRange[0];
                params.maxPrice = debouncedPriceRange[1];
            }
            if (selectedBrands.length > 0) {
                params.brand = selectedBrands.join(',');
            }

            const response = await api.get('/products', { params });
            return response.data;
        },
        enabled: !categoryParam || !!categories,
        staleTime: 60_000,
    });

    const products = data?.data || [];
    const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateParams({ search: search || null, page: '1' });
    };

    const handleCategoryChange = (slug: string | null) => {
        updateParams({ category: slug, page: '1' });
    };

    const handleSortChange = (value: string) => {
        updateParams({ sort: value, page: '1' });
    };

    const handlePageChange = (page: number) => {
        updateParams({ page: page.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBrandToggle = (brand: string) => {
        const newBrands = selectedBrands.includes(brand)
            ? selectedBrands.filter(b => b !== brand)
            : [...selectedBrands, brand];
        setSelectedBrands(newBrands);
    };

    const clearFilters = () => {
        setSearch('');
        setPriceRange([0, 20000]);
        setSelectedBrands([]);
        router.push('/products');
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Section — flat ink band */}
            <div className="relative overflow-hidden bg-zinc-950 mb-12 -mx-4 sm:-mx-6 lg:-mx-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-4xl"
                    >
                        <div className="inline-flex items-center gap-2 text-gray-400 font-bold text-[11px] md:text-xs uppercase tracking-[0.25em] mb-6">
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Official Store
                        </div>
                        <h1 className="font-display uppercase text-6xl md:text-8xl tracking-tight text-white mb-8 leading-[0.9]">
                            Speed. Style. <br />
                            <span className="text-brand">Performance.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl font-medium border-l-4 border-brand pl-6">
                            ค้นพบอะไหล่และอุปกรณ์ตกแต่งระดับพรีเมียม ที่คัดสรรมาเพื่อเวสป้าคันโปรดของคุณโดยเฉพาะ
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Sidebar Filters - Sticky & Modern */}
                <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-200">
                    <div className="space-y-10 pb-20">
                        {/* Search */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                <Search className="h-4 w-4" /> ค้นหา
                            </h3>
                            <form onSubmit={handleSearch} className="relative group">
                                <Input
                                    placeholder="ค้นหาสินค้า..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-4 h-12 font-medium"
                                />
                                <button type="submit" aria-label="ค้นหาสินค้า" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors">
                                    <Search className="h-4 w-4" />
                                </button>
                            </form>
                        </div>

                        {/* Categories */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-b border-border pb-2">หมวดหมู่</h3>
                            <div>
                                <button
                                    onClick={() => handleCategoryChange(null)}
                                    className={`w-full text-left px-4 py-3 text-sm transition-colors duration-200 flex items-center justify-between border-b border-border border-l-2 ${!categoryParam
                                        ? 'border-l-foreground text-gray-900 font-black'
                                        : 'border-l-transparent text-gray-600 font-bold hover:text-gray-900 hover:bg-accent'
                                        }`}
                                >
                                    สินค้าทั้งหมด
                                </button>
                                {categories?.map((cat) => (
                                    <button
                                        key={cat._id}
                                        onClick={() => handleCategoryChange(cat.slug)}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors duration-200 flex items-center justify-between border-b border-border border-l-2 ${categoryParam === cat.slug
                                            ? 'border-l-foreground text-gray-900 font-black'
                                            : 'border-l-transparent text-gray-600 font-bold hover:text-gray-900 hover:bg-accent'
                                            }`}
                                    >
                                        {cat.name.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-b border-border pb-2">ช่วงราคา</h3>
                            <div className="px-2">
                                <Slider
                                    defaultValue={[0, 20000]}
                                    max={50000}
                                    step={100}
                                    value={priceRange}
                                    onValueChange={setPriceRange}
                                    className="my-6"
                                />
                            </div>
                            <div className="flex items-center justify-between text-sm font-bold text-gray-700 bg-gray-50 p-3 border border-border">
                                <span>฿{priceRange[0].toLocaleString()}</span>
                                <span className="text-gray-300">–</span>
                                <span>฿{priceRange[1].toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Brands */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-b border-border pb-2">แบรนด์</h3>
                            <div className="flex flex-wrap gap-2">
                                {availableBrands.map((brand) => (
                                    <button
                                        key={brand}
                                        onClick={() => handleBrandToggle(brand)}
                                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide border transition-colors ${selectedBrands.includes(brand)
                                            ? 'bg-foreground text-white border-foreground'
                                            : 'bg-white text-gray-600 border-border hover:border-foreground hover:text-gray-900'
                                            }`}
                                    >
                                        {brand}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={clearFilters}
                            className="w-full h-12 uppercase tracking-wider"
                        >
                            ล้างตัวกรอง
                        </Button>
                    </div>
                </aside>

                {/* Mobile Filter Toggle */}
                <div className="lg:hidden w-full mb-6 sticky top-20 z-20 bg-white p-4 border border-border flex gap-3">
                    <form onSubmit={handleSearch} className="flex-1">
                        <Input
                            placeholder="ค้นหาสินค้า..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button aria-label="เปิดตัวกรองสินค้า">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-none h-[85vh] overflow-y-auto bg-white p-0 z-[70]">
                            {/* Header - Fixed with better spacing */}
                            <div className="sticky top-0 bg-white z-20 px-6 py-5 border-b border-border flex items-center justify-between">
                                <SheetHeader className="p-0 text-left">
                                    <SheetTitle className="text-lg font-black flex items-center gap-2 text-gray-900">
                                        <Filter className="h-4 w-4" /> ตัวกรองสินค้า
                                    </SheetTitle>
                                </SheetHeader>
                                <SheetClose aria-label="ปิดตัวกรอง" className="h-9 w-9 flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-200 transition-colors border border-border">
                                    <X className="h-4 w-4" />
                                </SheetClose>
                            </div>
                            <div className="px-6 py-8 space-y-10 pb-32">
                                {/* Categories */}
                                <div className="space-y-5">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-border pb-3">หมวดหมู่สินค้า</h3>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <button
                                            onClick={() => handleCategoryChange(null)}
                                            className={`text-center px-4 py-3 text-[13px] transition-colors duration-200 flex items-center justify-center font-bold border ${!categoryParam
                                                ? 'bg-foreground border-foreground text-white'
                                                : 'bg-white border-border text-gray-600 hover:border-foreground'
                                                }`}
                                        >
                                            ทั้งหมด
                                        </button>
                                        {categories?.map((cat) => (
                                            <button
                                                key={cat._id}
                                                onClick={() => handleCategoryChange(cat.slug)}
                                                className={`text-left px-4 py-3 text-[13px] transition-colors duration-200 flex items-center justify-between font-bold border ${categoryParam === cat.slug
                                                    ? 'bg-foreground border-foreground text-white'
                                                    : 'bg-white border-border text-gray-600 hover:border-foreground'
                                                    }`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Price Range */}
                                    <div className="space-y-6">
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-border pb-3">ช่วงราคา</h3>
                                        <div className="px-3">
                                            <Slider
                                                defaultValue={[0, 20000]}
                                                max={50000}
                                                step={100}
                                                value={priceRange}
                                                onValueChange={setPriceRange}
                                                className="my-8"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-base font-black text-gray-900 bg-gray-50 p-5 border border-border">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">เริ่มต้น</span>
                                                <span className="text-gray-900">฿{priceRange[0].toLocaleString()}</span>
                                            </div>
                                            <div className="h-8 w-px bg-gray-200" />
                                            <div className="flex flex-col gap-0.5 text-right">
                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">สูงสุด</span>
                                                <span className="text-gray-900">฿{priceRange[1].toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Brands */}
                                    <div className="space-y-5">
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-border pb-3">แบรนด์สินค้า</h3>
                                        <div className="flex flex-wrap gap-2.5">
                                            {availableBrands.map((brand) => (
                                                <button
                                                    key={brand}
                                                    onClick={() => handleBrandToggle(brand)}
                                                    className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-wider border transition-colors ${selectedBrands.includes(brand)
                                                        ? 'bg-foreground text-white border-foreground'
                                                        : 'bg-white text-gray-600 border-border hover:border-foreground hover:text-gray-900'
                                                        }`}
                                                >
                                                    {brand}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Footer for Mobile Buttons - raised above BottomNav (h-16) */}
                            <div className="fixed bottom-16 md:bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white via-white to-transparent pointer-events-none z-30">
                                <div className="max-w-md mx-auto flex gap-3 pointer-events-auto">
                                    <Button
                                        variant="outline"
                                        onClick={clearFilters}
                                        className="flex-1 h-12 text-[13px] uppercase tracking-[0.1em] bg-white"
                                    >
                                        ล้างข้อมูล
                                    </Button>
                                    <SheetClose asChild>
                                        <Button className="flex-[2] h-12 text-[13px] uppercase tracking-[0.2em]">
                                            ตกลง
                                        </Button>
                                    </SheetClose>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Product Grid */}
                <div className="flex-1">
                    {/* Sort Bar */}
                    <div className="flex justify-between items-center mb-8">
                        <p className="text-gray-600 font-medium">
                            แสดง <span className="text-gray-900 font-bold">{products.length}</span> จาก <span className="text-gray-900 font-bold">{pagination.total ?? products.length}</span> รายการ
                        </p>
                        <Select onValueChange={handleSortChange} value={sortParam || 'newest'}>
                            <SelectTrigger className="w-[180px] bg-transparent border-none text-right font-bold text-gray-900 focus:ring-0">
                                <SelectValue placeholder="เรียงตาม" />
                            </SelectTrigger>
                            <SelectContent align="end" className="font-medium">
                                <SelectItem value="newest">สินค้ามาใหม่</SelectItem>
                                <SelectItem value="price_asc">ราคา: ต่ำ – สูง</SelectItem>
                                <SelectItem value="price_desc">ราคา: สูง – ต่ำ</SelectItem>
                                <SelectItem value="name_asc">ชื่อสินค้า: A – Z</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="aspect-[4/3] bg-gray-100 animate-pulse" />
                            ))}
                        </div>
                    ) : isError ? (
                        <div className="text-center py-24 space-y-6">
                            <h3 className="text-2xl font-bold text-gray-500 uppercase tracking-widest">เกิดข้อผิดพลาด</h3>
                            <p className="text-gray-600 font-medium">ไม่สามารถโหลดรายการสินค้าได้ กรุณาลองใหม่อีกครั้ง</p>
                            <Button
                                onClick={() => refetch()}
                                className="px-8"
                            >
                                ลองใหม่
                            </Button>
                        </div>
                    ) : products.length > 0 ? (
                        <>
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0 },
                                    show: {
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.05
                                        }
                                    }
                                }}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                            >
                                {products.map((product: any, idx: number) => (
                                    <motion.div
                                        key={product._id}
                                        variants={{
                                            hidden: { opacity: 0, scale: 0.9 },
                                            show: { opacity: 1, scale: 1 }
                                        }}
                                    >
                                        <ProductCard
                                            product={product}
                                            priority={idx < 4}
                                            sizes="(max-width: 1024px) 45vw, 300px"
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                            <div className="mt-16">
                                <Pagination
                                    currentPage={pagination.page}
                                    totalPages={pagination.pages}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-24 space-y-6">
                            <h3 className="text-2xl font-bold text-gray-500 uppercase tracking-widest">ไม่พบสินค้า</h3>
                            <p className="text-gray-600 font-medium">ลองเปลี่ยนตัวกรองหรือคีย์ค้นหาใหม่</p>
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                            >
                                ล้างตัวกรองทั้งหมด
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
