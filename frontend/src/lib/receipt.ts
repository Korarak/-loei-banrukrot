import { siteConfig } from '@/config/site';
import type { Order } from '@/hooks/useOrders';
import type { PublicSettings } from '@/hooks/useSettings';
import type { POSSale } from '@/hooks/usePOS';

export type ReceiptSource = 'online' | 'pos';
export type PaperSizeId = 'thermal58' | 'thermal80' | 'a4';
export type ReceiptMode = 'compact' | 'full';

export interface ReceiptItem {
    name: string;
    sku?: string;
    quantity: number;
    price: number;
}

export interface ReceiptData {
    source: ReceiptSource;
    reference: string;
    createdAt: string;
    items: ReceiptItem[];
    totalAmount: number;
    shippingCost?: number;
    paymentMethod?: string | null;
    isVerified?: boolean;
    cashReceived?: number;
    change?: number;
    cashierName?: string;
    customerName?: string;
    customerPhone?: string;
    shippingAddress?: string;
    trackingNumber?: string;
    trackingProvider?: string;
    store: { name: string; address?: string; phone?: string; taxId?: string };
}

export const PAPER_SIZES: { id: PaperSizeId; label: string; pageSize: string; contentWidth: string; margin: string }[] = [
    { id: 'thermal58', label: '58mm', pageSize: '58mm auto', contentWidth: '54mm', margin: '0' },
    { id: 'thermal80', label: '80mm', pageSize: '80mm auto', contentWidth: '76mm', margin: '0' },
    { id: 'a4', label: 'A4', pageSize: 'A4', contentWidth: '190mm', margin: '15mm auto' },
];

export function getPaymentMethodLabel(method?: string | null): string {
    if (method === 'Cash') return 'เงินสด';
    if (method === 'PromptPay') return 'พร้อมเพย์';
    return method || 'โอนผ่านบัญชี';
}

function buildStoreInfo(settings?: PublicSettings) {
    return {
        name: settings?.store_name || siteConfig.brand.name,
        address: settings?.store_address || undefined,
        phone: settings?.store_phone || undefined,
        taxId: settings?.store_tax_id || undefined,
    };
}

export function orderToReceiptData(order: Order, settings?: PublicSettings): ReceiptData {
    const isPOS = order.source === 'pos';
    const payment = order.payments?.[0];
    const isCash = isPOS && payment?.paymentMethod === 'Cash';
    const cashReceived = isCash ? (payment?.amountReceived ?? payment?.amountPaid ?? 0) : undefined;
    const change = isCash && cashReceived != null ? Math.max(0, cashReceived - order.totalAmount) : undefined;

    const addr = order.shippingAddressId;
    const shippingAddress = addr
        ? [addr.streetAddress, addr.subDistrict, addr.district, addr.province, addr.zipCode].filter(Boolean).join(' ')
        : (order.shippingAddress || '');

    return {
        source: order.source,
        reference: order.orderReference,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
            name: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
        })),
        totalAmount: order.totalAmount,
        shippingCost: order.shippingInfo?.cost || undefined,
        paymentMethod: payment?.paymentMethod ?? null,
        isVerified: payment?.isVerified,
        cashReceived,
        change,
        customerName: order.customer
            ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || undefined
            : undefined,
        customerPhone: order.customer?.phone,
        shippingAddress: !isPOS ? shippingAddress : undefined,
        trackingNumber: order.shippingInfo?.trackingNumber || undefined,
        trackingProvider: order.shippingInfo?.provider || undefined,
        store: buildStoreInfo(settings),
    };
}

export function posCartToReceiptData(
    cart: { name: string; sku: string; price: number; quantity: number }[],
    saleResult: { saleReference: string; totalAmount: number; order?: { orderDate?: string } },
    cashReceived: number,
    change: number,
    cashierName: string | undefined,
    settings?: PublicSettings
): ReceiptData {
    return {
        source: 'pos',
        reference: saleResult.saleReference,
        createdAt: saleResult.order?.orderDate || new Date().toISOString(),
        items: cart.map(item => ({
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
        })),
        totalAmount: saleResult.totalAmount,
        paymentMethod: 'Cash',
        cashReceived,
        change,
        cashierName,
        store: buildStoreInfo(settings),
    };
}

export function posSaleToReceiptData(sale: POSSale, settings?: PublicSettings): ReceiptData {
    const payment = sale.payments?.[0];
    const method = sale.paymentMethod || payment?.paymentMethod || null;
    const isCash = method === 'Cash';
    const cashReceived = isCash ? (payment?.amountReceived ?? payment?.amountPaid ?? sale.totalAmount) : undefined;
    const change = isCash && cashReceived != null ? Math.max(0, cashReceived - sale.totalAmount) : undefined;

    return {
        source: 'pos',
        reference: sale.saleReference,
        createdAt: sale.createdAt,
        items: sale.items.map(item => ({
            name: item.product?.productName || 'สินค้าไม่ระบุ',
            sku: item.variant?.sku,
            quantity: item.quantity,
            price: item.price,
        })),
        totalAmount: sale.totalAmount,
        paymentMethod: method,
        cashReceived,
        change,
        cashierName: sale.createdBy?.username,
        store: buildStoreInfo(settings),
    };
}
