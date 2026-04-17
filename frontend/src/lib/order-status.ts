
export const ORDER_STATUS_LABELS: Record<string, string> = {
    pending: 'กำลังดำเนินการ',
    confirmed: 'กำลังเตรียมสินค้า',
    processing: 'กำลังเตรียมสินค้า',
    shipped: 'เริ่มการจัดส่ง',
    delivered: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิก',
    completed: 'เสร็จรับเงิน',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-teal-100 text-teal-800',
};

export function getOrderStatusLabel(status: string): string {
    return ORDER_STATUS_LABELS[status] || status;
}

export function getOrderStatusColor(status: string): string {
    return ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
}
