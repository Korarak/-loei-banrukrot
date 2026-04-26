'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Warehouse,
    PackagePlus,
    AlertTriangle,
    History,
    ArrowUp,
    ArrowDown,
    Search,
    RefreshCw,
    TrendingDown,
    Package,
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
    CheckCircle2,
    XCircle,
    Pencil,
    Trash2,
    X,
    Check,
} from 'lucide-react';
import {
    useInventorySummary,
    useLowStockAlerts,
    useStockMovements,
    useReceiveStock,
    useAdjustStock,
    type MovementFilters,
    type StockMovementType,
} from '@/hooks/useInventory';
import {
    useShopeeStatus,
    useShopeeMapping,
    useUpdateShopeeMapping,
    useRemoveShopeeMapping,
    type ShopeeMappingFilter,
    type ShopeeVariantMapping,
} from '@/hooks/useShopee';
import { useProducts, type Product } from '@/hooks/useProducts';
import { cn, getImageUrl } from '@/lib/utils';
import Image from 'next/image';

// ─── Constants ───────────────────────────────────────────────────────────────

const MOVEMENT_TYPE_META: Record<StockMovementType, { label: string; color: string; bg: string; sign: '+' | '-' }> = {
    sale_pos:      { label: 'ขายหน้าร้าน',   color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       sign: '-' },
    sale_online:   { label: 'ขายออนไลน์',    color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       sign: '-' },
    cancel_online: { label: 'ยกเลิกออเดอร์', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', sign: '+' },
    stock_in:      { label: 'รับสินค้าเข้า', color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   sign: '+' },
    adjustment:    { label: 'ปรับสต็อก',      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',    sign: '+' },
    shopee_sale:   { label: 'ขายบน Shopee',  color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', sign: '-' },
    shopee_sync:   { label: 'Shopee Sync',   color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', sign: '+' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, icon: Icon, color }: {
    label: string; value: number | string; sub?: string;
    icon: React.ElementType; color: string;
}) {
    return (
        <Card className="p-5 flex items-start gap-4">
            <div className={cn('p-3 rounded-xl shrink-0', color)}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </Card>
    );
}

// ─── Tab: Overview ───────────────────────────────────────────────────────────

function OverviewTab() {
    const { data: summary, isLoading } = useInventorySummary();
    const { data: lowStockData } = useLowStockAlerts();
    const low = lowStockData?.data?.slice(0, 5) ?? [];

    if (isLoading) return <div className="flex justify-center py-20"><RefreshCw className="h-8 w-8 animate-spin text-gray-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <SummaryCard label="SKU ทั้งหมด"        value={summary?.totalVariants ?? 0}          icon={Package}     color="bg-gray-600" />
                <SummaryCard label="สต็อกหมด"           value={summary?.outOfStock ?? 0}             icon={AlertTriangle} color="bg-red-500" sub="stockAvailable = 0" />
                <SummaryCard label="ใกล้หมด"            value={summary?.lowStock ?? 0}               icon={TrendingDown}  color="bg-yellow-500" sub={`≤ ${summary?.threshold ?? 5} ชิ้น`} />
                <SummaryCard label="รับเข้าเดือนนี้"   value={summary?.stockInThisMonth ?? 0}       icon={PackagePlus}   color="bg-green-500" sub="ครั้ง" />
                <SummaryCard label="ชิ้นรับเดือนนี้"   value={summary?.stockInVolumeThisMonth ?? 0} icon={ArrowUp}       color="bg-emerald-500" sub="ชิ้น" />
                <SummaryCard label="ปรับสต็อกเดือนนี้" value={summary?.adjustmentsThisMonth ?? 0}   icon={RefreshCw}     color="bg-blue-500" sub="ครั้ง" />
            </div>

            {low.length > 0 && (
                <Card className="p-5">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        สินค้าใกล้หมด / หมด (5 รายการแรก)
                    </h3>
                    <div className="space-y-2">
                        {low.map((item) => (
                            <div key={item._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                <div className="flex items-center gap-3">
                                    {item.productId?.imageUrl && (
                                        <div className="h-8 w-8 rounded-md overflow-hidden shrink-0 bg-gray-100 relative">
                                            <Image src={getImageUrl(item.productId.imageUrl)} alt="" fill className="object-cover" unoptimized />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{item.productId?.productName}</p>
                                        <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn('font-bold', item.stockAvailable === 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200')}>
                                    {item.stockAvailable === 0 ? 'หมด' : `เหลือ ${item.stockAvailable}`}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

// ─── Tab: Receive Stock ───────────────────────────────────────────────────────

function ReceiveStockTab() {
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [note, setNote] = useState('');

    const { data: products } = useProducts({ search });
    const receiveStock = useReceiveStock();

    const selectedVariant = selectedProduct?.variants.find(v => v._id === selectedVariantId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVariantId || !quantity || parseInt(quantity) <= 0) return;
        await receiveStock.mutateAsync({ variantId: selectedVariantId, quantity: parseInt(quantity), note: note || undefined });
        setQuantity('');
        setNote('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product selector */}
            <Card className="p-5 space-y-4">
                <h3 className="font-bold text-gray-900">เลือกสินค้า</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="ค้นหาชื่อสินค้า..." value={search} onChange={e => { setSearch(e.target.value); setSelectedProduct(null); setSelectedVariantId(''); }} className="pl-10" />
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {products && products.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <Search className="h-8 w-8 mb-2 opacity-30" />
                            <p className="text-sm">ไม่พบสินค้าที่ตรงกัน</p>
                        </div>
                    )}
                    {products?.map((product) => (
                        <button
                            key={product._id}
                            type="button"
                            onClick={() => { setSelectedProduct(product); setSelectedVariantId(''); }}
                            className={cn('w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors', selectedProduct?._id === product._id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50')}
                        >
                            <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 relative flex items-center justify-center">
                                {product.images?.[0]?.imagePath || product.imageUrl ? (
                                    <Image src={getImageUrl(product.images?.[0]?.imagePath || product.imageUrl!)} alt="" fill className="object-cover" unoptimized />
                                ) : <Package className="h-5 w-5 text-gray-400" />}
                            </div>
                            <div className="overflow-hidden min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">{product.productName}</p>
                                <p className="text-xs text-gray-500">{product.variants.length} variant{product.variants.length > 1 ? 's' : ''}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            {/* Form */}
            <Card className="p-5">
                <h3 className="font-bold text-gray-900 mb-4">รายละเอียดการรับสินค้า</h3>
                {!selectedProduct ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <PackagePlus className="h-12 w-12 mb-2 opacity-30" />
                        <p className="text-sm">เลือกสินค้าจากรายการทางซ้าย</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Variant / SKU</Label>
                            <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="เลือก variant" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedProduct.variants.map((v) => (
                                        <SelectItem key={v._id} value={v._id}>
                                            <span className="font-mono mr-2">{v.sku}</span>
                                            {v.option1Value && <span className="text-gray-500">{v.option1Value}{v.option2Value ? ` / ${v.option2Value}` : ''}</span>}
                                            <span className="ml-2 text-xs text-gray-400">สต็อก: {v.stock}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedVariant && (
                            <div className="bg-gray-50 rounded-xl p-3 flex justify-between text-sm">
                                <span className="text-gray-600">สต็อกปัจจุบัน</span>
                                <span className="font-bold text-gray-900">{selectedVariant.stock} ชิ้น</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="qty">จำนวนที่รับเข้า</Label>
                            <Input id="qty" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" className="h-11 text-lg font-bold" />
                        </div>

                        {selectedVariant && quantity && parseInt(quantity) > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                                <span className="text-green-700 font-medium">สต็อกหลังรับ: {selectedVariant.stock + parseInt(quantity)} ชิ้น</span>
                                <span className="text-green-600 ml-2">(+{quantity})</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="note">หมายเหตุ (ไม่บังคับ)</Label>
                            <Textarea id="note" value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น รับจากซัพพลายเออร์ A, ล็อต 2026-04..." rows={2} />
                        </div>

                        <Button type="submit" disabled={!selectedVariantId || !quantity || parseInt(quantity) <= 0 || receiveStock.isPending} className="w-full h-11">
                            {receiveStock.isPending ? 'กำลังบันทึก...' : 'ยืนยันรับสินค้าเข้าคลัง'}
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    );
}

// ─── Tab: Low Stock ───────────────────────────────────────────────────────────

function LowStockTab() {
    const { data, isLoading, refetch } = useLowStockAlerts();
    const adjustStock = useAdjustStock();
    const [quickAdjust, setQuickAdjust] = useState<{ id: string; qty: string } | null>(null);

    const items = data?.data ?? [];

    if (isLoading) return <div className="flex justify-center py-20"><RefreshCw className="h-8 w-8 animate-spin text-gray-400" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">สินค้าที่มีสต็อก ≤ {data?.threshold ?? 5} ชิ้น</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-1" /> รีเฟรช</Button>
            </div>

            {items.length === 0 ? (
                <Card className="p-12 flex flex-col items-center text-gray-400">
                    <Package className="h-12 w-12 mb-3 opacity-30" />
                    <p className="font-medium">ไม่มีสินค้าที่ใกล้หมด</p>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="divide-y">
                        {items.map((item) => (
                            <div key={item._id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                                <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 relative">
                                    {item.productId?.imageUrl ? (
                                        <Image src={getImageUrl(item.productId.imageUrl)} alt="" fill className="object-cover" unoptimized />
                                    ) : <Package className="h-5 w-5 text-gray-400 m-auto mt-2.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">{item.productId?.productName}</p>
                                    <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                                </div>
                                <Badge variant="outline" className={cn('shrink-0 font-bold', item.stockAvailable === 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200')}>
                                    {item.stockAvailable === 0 ? 'หมด' : `${item.stockAvailable} ชิ้น`}
                                </Badge>

                                {quickAdjust?.id === item._id ? (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Input type="number" value={quickAdjust.qty} onChange={e => setQuickAdjust({ id: item._id, qty: e.target.value })} className="w-20 h-8 text-center" placeholder="+/-" />
                                        <Button size="sm" className="h-8" disabled={adjustStock.isPending}
                                            onClick={async () => {
                                                if (!quickAdjust.qty || quickAdjust.qty === '0') return;
                                                await adjustStock.mutateAsync({ variantId: item._id, quantity: parseInt(quickAdjust.qty), note: 'ปรับจากหน้าแจ้งเตือนสต็อก' });
                                                setQuickAdjust(null);
                                            }}>
                                            ยืนยัน
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setQuickAdjust(null)}>ยกเลิก</Button>
                                    </div>
                                ) : (
                                    <Button size="sm" variant="outline" className="shrink-0 h-8 gap-1" onClick={() => setQuickAdjust({ id: item._id, qty: '' })}>
                                        <ArrowUp className="h-3.5 w-3.5" /> ปรับสต็อก
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

// ─── Tab: Movement History ────────────────────────────────────────────────────

function MovementHistoryTab() {
    const [filters, setFilters] = useState<MovementFilters>({ page: 1, limit: 20 });

    const { data, isLoading } = useStockMovements(filters);
    const movements = data?.data ?? [];
    const pagination = data?.pagination;

    const updateFilter = (key: keyof MovementFilters, value: string | number | undefined) =>
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <Card className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Select value={(filters.type as string) ?? 'all'} onValueChange={v => updateFilter('type', v === 'all' ? undefined : v)}>
                        <SelectTrigger><SelectValue placeholder="ประเภทการเคลื่อนไหว" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            {(Object.keys(MOVEMENT_TYPE_META) as StockMovementType[]).map(t => (
                                <SelectItem key={t} value={t}><span className={MOVEMENT_TYPE_META[t].color}>{MOVEMENT_TYPE_META[t].label}</span></SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input type="date" value={filters.startDate ?? ''} onChange={e => updateFilter('startDate', e.target.value || undefined)} placeholder="จากวันที่" />
                    <Input type="date" value={filters.endDate ?? ''} onChange={e => updateFilter('endDate', e.target.value || undefined)} placeholder="ถึงวันที่" />
                    <Button variant="outline" onClick={() => setFilters({ page: 1, limit: 20 })}><RefreshCw className="h-4 w-4 mr-1" /> รีเซ็ต</Button>
                </div>
            </Card>

            {isLoading ? (
                <div className="flex justify-center py-20"><RefreshCw className="h-8 w-8 animate-spin text-gray-400" /></div>
            ) : movements.length === 0 ? (
                <Card className="p-12 flex flex-col items-center text-gray-400">
                    <History className="h-12 w-12 mb-3 opacity-30" />
                    <p className="font-medium">ไม่มีประวัติการเคลื่อนไหว</p>
                </Card>
            ) : (
                <>
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                        <th className="text-left px-4 py-3 font-semibold">วันที่</th>
                                        <th className="text-left px-4 py-3 font-semibold">สินค้า / SKU</th>
                                        <th className="text-left px-4 py-3 font-semibold">ประเภท</th>
                                        <th className="text-right px-4 py-3 font-semibold">การเปลี่ยนแปลง</th>
                                        <th className="text-right px-4 py-3 font-semibold">ก่อน</th>
                                        <th className="text-right px-4 py-3 font-semibold">หลัง</th>
                                        <th className="text-left px-4 py-3 font-semibold">ผู้ดำเนินการ</th>
                                        <th className="text-left px-4 py-3 font-semibold">หมายเหตุ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {movements.map((m) => {
                                        const meta = MOVEMENT_TYPE_META[m.type];
                                        const isPositive = m.quantityChange > 0;
                                        return (
                                            <tr key={m._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                    {new Date(m.createdAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-900 truncate max-w-[180px]">{m.productId?.productName}</p>
                                                    <p className="text-xs font-mono text-gray-400">{m.variantId?.sku}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={cn('text-xs', meta.bg, meta.color)}>{meta.label}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold font-mono">
                                                    <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                                                        {isPositive ? '+' : ''}{m.quantityChange}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-500 font-mono">{m.stockBefore}</td>
                                                <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{m.stockAfter}</td>
                                                <td className="px-4 py-3 text-gray-600">{m.performedBy?.username ?? <span className="text-gray-400 italic">ระบบ</span>}</td>
                                                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{m.note ?? '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">แสดง {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setFilters(p => ({ ...p, page: (p.page ?? 1) - 1 }))}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="flex items-center text-sm px-3">หน้า {pagination.page} / {pagination.pages}</span>
                                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setFilters(p => ({ ...p, page: (p.page ?? 1) + 1 }))}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Tab: Shopee Sync ─────────────────────────────────────────────────────────

function ShopeeTab() {
    const { data: status, isLoading: statusLoading } = useShopeeStatus();
    const [filter, setFilter] = useState<ShopeeMappingFilter>('all');
    const [page, setPage] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ shopeeItemId: '', shopeeModelId: '' });

    const { data, isLoading } = useShopeeMapping({ page, limit: 30, filter });
    const updateMapping = useUpdateShopeeMapping();
    const removeMapping = useRemoveShopeeMapping();

    const variants = data?.data ?? [];
    const pagination = data?.pagination;

    const startEdit = (v: ShopeeVariantMapping) => {
        setEditingId(v._id);
        setEditForm({ shopeeItemId: v.shopeeItemId ?? '', shopeeModelId: v.shopeeModelId ?? '' });
    };

    const cancelEdit = () => setEditingId(null);

    const saveEdit = async (variantId: string) => {
        await updateMapping.mutateAsync({ variantId, shopeeItemId: editForm.shopeeItemId, shopeeModelId: editForm.shopeeModelId || undefined });
        setEditingId(null);
    };

    const handleRemove = async (variantId: string) => {
        await removeMapping.mutateAsync(variantId);
    };

    const FILTERS: { value: ShopeeMappingFilter; label: string }[] = [
        { value: 'all', label: 'ทั้งหมด' },
        { value: 'mapped', label: 'ผูกแล้ว' },
        { value: 'unmapped', label: 'ยังไม่ผูก' },
    ];

    return (
        <div className="space-y-5">
            {/* Status card */}
            {!statusLoading && (
                <Card className="p-5">
                    <div className="flex items-start gap-4">
                        <div className={cn('p-3 rounded-xl shrink-0', status?.configured ? 'bg-orange-500' : 'bg-gray-200')}>
                            <ShoppingBag className={cn('h-5 w-5', status?.configured ? 'text-white' : 'text-gray-500')} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-gray-900">Shopee Integration</p>
                                {status?.configured ? (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 className="h-3 w-3" /> พร้อมใช้งาน
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                                        <XCircle className="h-3 w-3" /> ยังไม่ได้ตั้งค่า
                                    </span>
                                )}
                            </div>
                            {status?.configured ? (
                                <p className="text-sm text-gray-500">Partner ID: <span className="font-mono">{status.partnerId}</span> · Shop ID: <span className="font-mono">{status.shopId}</span></p>
                            ) : (
                                <div className="text-sm text-gray-500 space-y-1">
                                    <p>เพิ่ม env vars ต่อไปนี้ใน <span className="font-mono bg-gray-100 px-1 rounded">backend/.env</span> เพื่อเปิดใช้งาน:</p>
                                    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-700 mt-2 select-all">
{`SHOPEE_PARTNER_ID=your_partner_id
SHOPEE_PARTNER_KEY=your_partner_key
SHOPEE_SHOP_ID=your_shop_id`}
                                    </pre>
                                    <p className="text-xs text-gray-400 mt-1">สามารถผูกสินค้ากับ Shopee ID ไว้ล่วงหน้าได้เลย แม้ยังไม่มี credentials</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {status?.configured && (
                        <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                            <p>Webhook URL สำหรับตั้งค่าใน Shopee Partner Portal:</p>
                            <p className="font-mono bg-gray-50 border border-gray-200 rounded px-3 py-1.5 mt-1 text-xs select-all break-all">
                                {typeof window !== 'undefined' ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? ''}/api/shopee/webhook` : '/api/shopee/webhook'}
                            </p>
                        </div>
                    )}
                </Card>
            )}

            {/* Filter + table */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3">
                    <div className="flex gap-2">
                        {FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => { setFilter(f.value); setPage(1); }}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                    filter === f.value ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    {pagination && <p className="text-sm text-gray-400">{pagination.total} รายการ</p>}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-16"><RefreshCw className="h-7 w-7 animate-spin text-gray-300" /></div>
                ) : variants.length === 0 ? (
                    <div className="flex flex-col items-center py-14 text-gray-400">
                        <ShoppingBag className="h-10 w-10 mb-2 opacity-30" />
                        <p className="text-sm">ไม่มีข้อมูล</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="text-left px-4 py-3 font-semibold">สินค้า / SKU</th>
                                    <th className="text-left px-4 py-3 font-semibold">Shopee Item ID</th>
                                    <th className="text-left px-4 py-3 font-semibold">Shopee Model ID</th>
                                    <th className="text-right px-4 py-3 font-semibold">สต็อก</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {variants.map((v) => (
                                    <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{v.productId?.productName}</p>
                                            <p className="text-xs font-mono text-gray-400">{v.sku}</p>
                                            {(v.option1Value || v.option2Value) && (
                                                <p className="text-xs text-gray-400">{[v.option1Value, v.option2Value].filter(Boolean).join(' / ')}</p>
                                            )}
                                        </td>

                                        {editingId === v._id ? (
                                            <>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        value={editForm.shopeeItemId}
                                                        onChange={e => setEditForm(f => ({ ...f, shopeeItemId: e.target.value }))}
                                                        placeholder="Item ID"
                                                        className="h-8 w-36 font-mono text-xs"
                                                        autoFocus
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        value={editForm.shopeeModelId}
                                                        onChange={e => setEditForm(f => ({ ...f, shopeeModelId: e.target.value }))}
                                                        placeholder="Model ID (ถ้ามี variant)"
                                                        className="h-8 w-40 font-mono text-xs"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-gray-500">{v.stockAvailable}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <Button size="sm" className="h-7 bg-orange-500 hover:bg-orange-600 gap-1"
                                                            disabled={!editForm.shopeeItemId || updateMapping.isPending}
                                                            onClick={() => saveEdit(v._id)}>
                                                            <Check className="h-3.5 w-3.5" /> บันทึก
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-7" onClick={cancelEdit}>
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-4 py-3">
                                                    {v.shopeeItemId
                                                        ? <span className="font-mono text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded">{v.shopeeItemId}</span>
                                                        : <span className="text-gray-300 text-xs italic">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {v.shopeeModelId
                                                        ? <span className="font-mono text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded">{v.shopeeModelId}</span>
                                                        : <span className="text-gray-300 text-xs italic">—</span>}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-gray-500">{v.stockAvailable}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => startEdit(v)}>
                                                            <Pencil className="h-3 w-3" /> {v.shopeeItemId ? 'แก้ไข' : 'ผูก'}
                                                        </Button>
                                                        {v.shopeeItemId && (
                                                            <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                disabled={removeMapping.isPending}
                                                                onClick={() => handleRemove(v._id)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination && pagination.pages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <p className="text-sm text-gray-500">หน้า {pagination.page} / {pagination.pages}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
    const { data: lowStockData } = useLowStockAlerts();
    const lowCount = lowStockData?.data?.length ?? 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                    <Warehouse className="h-8 w-8 text-primary" />
                    คลังสินค้า
                </h1>
                <p className="text-gray-500 text-sm mt-1">ติดตามสต็อก รับสินค้าเข้า และดูประวัติการเคลื่อนไหวทั้งหมด</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-gray-100 p-1 rounded-xl h-auto flex-wrap gap-1">
                    <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <Warehouse className="h-4 w-4" /> ภาพรวม
                    </TabsTrigger>
                    <TabsTrigger value="receive" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <PackagePlus className="h-4 w-4" /> รับสินค้าเข้า
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        แจ้งเตือนสต็อก
                        {lowCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] flex items-center justify-center">
                                {lowCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <History className="h-4 w-4" /> ประวัติการเคลื่อนไหว
                    </TabsTrigger>
                    <TabsTrigger value="shopee" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                        <ShoppingBag className="h-4 w-4" /> Shopee Sync
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview"><OverviewTab /></TabsContent>
                <TabsContent value="receive"><ReceiveStockTab /></TabsContent>
                <TabsContent value="alerts"><LowStockTab /></TabsContent>
                <TabsContent value="history"><MovementHistoryTab /></TabsContent>
                <TabsContent value="shopee"><ShopeeTab /></TabsContent>
            </Tabs>
        </div>
    );
}
