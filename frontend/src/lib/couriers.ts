export interface Courier {
    value: string;
    label: string;
    color: string;
    bg: string;
    placeholder: string;
    hint: string;
    trackingUrl: (tracking: string) => string;
}

export const COURIERS: Courier[] = [
    {
        value: 'Flash Express',
        label: 'Flash Express',
        color: 'text-orange-700',
        bg: 'bg-orange-50 border-orange-200',
        placeholder: 'เช่น TH0123456789',
        hint: 'ขึ้นต้นด้วย TH, ความยาว 12–15 ตัวอักษร',
        trackingUrl: (t) => `https://www.flashexpress.co.th/fle/tracking/?se=${t}`,
    },
    {
        value: 'Kerry Express',
        label: 'Kerry Express',
        color: 'text-red-700',
        bg: 'bg-red-50 border-red-200',
        placeholder: 'เช่น KERRY000000000',
        hint: 'ความยาว 13–15 ตัวอักษร',
        trackingUrl: (t) => `https://th.kerryexpress.com/th/track/?track=${t}`,
    },
    {
        value: 'J&T Express',
        label: 'J&T Express',
        color: 'text-red-800',
        bg: 'bg-red-50 border-red-200',
        placeholder: 'เช่น 600000000000',
        hint: 'ตัวเลข 12–13 หลัก',
        trackingUrl: (t) => `https://www.jtexpress.co.th/track?billcode=${t}`,
    },
    {
        value: 'Thailand Post',
        label: 'ไปรษณีย์ไทย (EMS)',
        color: 'text-yellow-700',
        bg: 'bg-yellow-50 border-yellow-200',
        placeholder: 'เช่น EF123456789TH',
        hint: 'ขึ้นต้นด้วยตัวอักษร 2 ตัว ตามด้วยตัวเลข 9 หลัก และ TH',
        trackingUrl: (t) => `https://track.thailandpost.co.th/?trackNumber=${t}`,
    },
    {
        value: 'Ninja Van',
        label: 'Ninja Van',
        color: 'text-gray-800',
        bg: 'bg-gray-50 border-gray-200',
        placeholder: 'เช่น NVTH000000000',
        hint: 'ขึ้นต้นด้วย NVTH',
        trackingUrl: (t) => `https://www.ninjavan.co/th-th/tracking?id=${t}`,
    },
    {
        value: 'Best Express',
        label: 'Best Express',
        color: 'text-green-700',
        bg: 'bg-green-50 border-green-200',
        placeholder: 'เช่น BT00000000000',
        hint: 'ขึ้นต้นด้วย BT',
        trackingUrl: (t) => `https://www.best-inc.co.th/track/${t}`,
    },
    {
        value: 'SPX Express',
        label: 'SPX (Shopee Express)',
        color: 'text-orange-600',
        bg: 'bg-orange-50 border-orange-200',
        placeholder: 'เช่น SPXTH000000000',
        hint: 'ขึ้นต้นด้วย SPXTH',
        trackingUrl: (t) => `https://spx.co.th/home/tracking?trackingNo=${t}`,
    },
    {
        value: 'DHL',
        label: 'DHL',
        color: 'text-yellow-800',
        bg: 'bg-yellow-50 border-yellow-200',
        placeholder: 'เช่น 1234567890',
        hint: 'ตัวเลข 10 หลัก',
        trackingUrl: (t) => `https://www.dhl.com/th-en/home/tracking.html?tracking-id=${t}`,
    },
    {
        value: 'Other',
        label: 'อื่นๆ',
        color: 'text-gray-600',
        bg: 'bg-gray-50 border-gray-200',
        placeholder: 'กรอกหมายเลขติดตามพัสดุ',
        hint: '',
        trackingUrl: () => '',
    },
];

export function getCourier(value: string): Courier | undefined {
    return COURIERS.find((c) => c.value === value);
}

export function getTrackingUrl(courierValue: string, trackingNumber: string): string {
    const courier = getCourier(courierValue);
    if (!courier || !trackingNumber) return '';
    return courier.trackingUrl(trackingNumber.trim());
}
