'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/features/ProductCard';
import Pagination from '@/components/features/Pagination';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, ChevronDown, X, Check, Zap, ShoppingBag } from 'lucide-react';
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
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    // Sync local search state with URL
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
    const { data: categories } = useCategories();

    // Fetch Unique Brands from DB
    const { data: availableBrands = [] } = useQuery({
        queryKey: ['all-brands'],
        queryFn: async () => {
            try {
                const response = await api.get('/products', { params: { limit: 1000 } });
                const allProducts = response.data.data || [];
                const brands = Array.from(new Set(allProducts.map((p: any) => p.brand).filter(Boolean))) as string[];
                return brands.sort();
            } catch (error) {
                console.error("Failed to fetch brands", error);
                return [];
            }
        },
        staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    });

    // Fetch Products
    const { data, isLoading } = useQuery({
        queryKey: ['products', categoryParam, searchParam, sortParam, pageParam, priceRange, selectedBrands],
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
            if (priceRange) {
                params.minPrice = priceRange[0];
                params.maxPrice = priceRange[1];
            }
            if (selectedBrands.length > 0) {
                params.brand = selectedBrands.join(',');
            }

            const response = await api.get('/products', { params });
            return response.data;
        },
        enabled: !categoryParam || !!categories,
    });

    const products = data?.data || [];
    const pagination = data?.pagination || { page: 1, totalPages: 1 };

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
        <div className="min-h-screen bg-white pb-20">
            {/* Hero Section - POWERFUL DARK THEME */}
            <div className="relative overflow-hidden bg-zinc-950 mb-12 rounded-b-[3rem] shadow-2xl">
                {/* Abstract Background */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-4xl"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-accent font-bold text-sm uppercase tracking-widest mb-8">
                            <ShoppingBag className="h-4 w-4" />
                            Official Store
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.9]">
                            SPEED. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">STYLE.</span> <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-pink-500 italic">PERFORMANCE.</span>
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed max-w-2xl font-medium border-l-4 border-primary pl-6">
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
                                <Search className="h-4 w-4 text-primary" /> SEARCH
                            </h3>
                            <form onSubmit={handleSearch} className="relative group">
                                <Input
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-xl h-12 transition-all font-medium"
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                                    <Zap className="h-4 w-4" />
                                </button>
                            </form>
                        </div>

                        {/* Categories */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-2">CATEGORIES</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleCategoryChange(null)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-between font-bold group ${!categoryParam
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    ALL PRODUCTS
                                    {!categoryParam && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                                </button>
                                {categories?.map((cat) => (
                                    <button
                                        key={cat._id}
                                        onClick={() => handleCategoryChange(cat.slug)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-between font-bold group ${categoryParam === cat.slug
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        {cat.name.toUpperCase()}
                                        {categoryParam === cat.slug && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-2">PRICE RANGE</h3>
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
                            <div className="flex items-center justify-between text-sm font-bold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span>฿{priceRange[0].toLocaleString()}</span>
                                <span className="text-gray-300">to</span>
                                <span>฿{priceRange[1].toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Brands */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-2">BRANDS</h3>
                            <div className="flex flex-wrap gap-2">
                                {availableBrands.map((brand) => (
                                    <button
                                        key={brand}
                                        onClick={() => handleBrandToggle(brand)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border-2 transition-all ${selectedBrands.includes(brand)
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-900 hover:text-gray-900'
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
                            className="w-full h-12 border-2 border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-xl font-bold uppercase tracking-wider"
                        >
                            Reset Filters
                        </Button>
                    </div>
                </aside>

                {/* Mobile Filter Toggle */}
                <div className="lg:hidden w-full mb-6 sticky top-20 z-20 bg-white p-4 rounded-2xl border border-gray-100 shadow-lg flex gap-3">
                    <form onSubmit={handleSearch} className="flex-1">
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white border-gray-200 rounded-xl"
                        />
                    </form>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button className="bg-primary text-white rounded-xl">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto bg-white">
                            <SheetHeader className="px-1 pt-6 text-left">
                                <SheetTitle className="text-xl font-black mb-6 flex items-center gap-2">
                                    <Filter className="h-5 w-5" /> FILTERS
                                </SheetTitle>
                            </SheetHeader>
                            <div className="space-y-8 pb-10">
                                {/* Categories */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-2">CATEGORIES</h3>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleCategoryChange(null)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-between font-bold group ${!categoryParam
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                }`}
                                        >
                                            ALL PRODUCTS
                                            {!categoryParam && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                                        </button>
                                        {categories?.map((cat) => (
                                            <button
                                                key={cat._id}
                                                onClick={() => handleCategoryChange(cat.slug)}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-between font-bold group ${categoryParam === cat.slug
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {cat.name.toUpperCase()}
                                                {categoryParam === cat.slug && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-2">PRICE RANGE</h3>
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
                                    <div className="flex items-center justify-between text-sm font-bold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span>฿{priceRange[0].toLocaleString()}</span>
                                        <span className="text-gray-300">to</span>
                                        <span>฿{priceRange[1].toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Brands */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-2">BRANDS</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {availableBrands.map((brand) => (
                                            <button
                                                key={brand}
                                                onClick={() => handleBrandToggle(brand)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border-2 transition-all ${selectedBrands.includes(brand)
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-900 hover:text-gray-900'
                                                    }`}
                                            >
                                                {brand}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button onClick={clearFilters} className="w-full h-12 rounded-xl font-bold">Clear All Filters</Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Product Grid */}
                <div className="flex-1">
                    {/* Sort Bar */}
                    <div className="flex justify-between items-center mb-8">
                        <p className="text-gray-500 font-medium">
                            Showing <span className="text-gray-900 font-bold">{products.length}</span> results
                        </p>
                        <Select onValueChange={handleSortChange} defaultValue={sortParam || 'newest'}>
                            <SelectTrigger className="w-[180px] bg-transparent border-none text-right font-bold text-gray-900 focus:ring-0">
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent align="end" className="font-medium">
                                <SelectItem value="newest">Newest Arrivals</SelectItem>
                                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                                <SelectItem value="name_asc">Name: A to Z</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="aspect-[3/4] bg-gray-100 rounded-3xl animate-pulse" />
                            ))}
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
                                className="grid grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {products.map((product: any) => (
                                    <motion.div
                                        key={product._id}
                                        variants={{
                                            hidden: { opacity: 0, scale: 0.9 },
                                            show: { opacity: 1, scale: 1 }
                                        }}
                                        whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                        className="bg-white rounded-[2rem] p-4 shadow-sm hover:shadow-2xl transition-all border border-gray-100 group"
                                    >
                                        <ProductCard product={product} /> {/* Assuming ProductCard handles its own internal layout, but container styling helps */}
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
                        <div className="text-center py-24">
                            <h3 className="text-2xl font-bold text-gray-300 uppercase tracking-widest">No Products Found</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
