/**
 * กติกาเบอร์โทรไทย — ต้องตรงกับ `phoneSchema` ใน backend/models/validationSchemas.js เป๊ะๆ
 * ถ้าสองฝั่งไม่ตรงกัน ผู้ใช้จะผ่าน validation หน้าเว็บแล้วโดน 400 จาก API พร้อมข้อความภาษาอังกฤษที่แปลไม่ได้
 *
 * รองรับ: มือถือ 10 หลัก (0812345678) และเบอร์บ้าน 9 หลัก (042812345)
 */
const THAI_PHONE_PATTERN = /^0\d{8,9}$/;

/** ตัดเว้นวรรคและขีดออก เพื่อให้ค่าที่ส่งขึ้น API เป็นตัวเลขล้วนเสมอ */
export function normalizePhone(value: string): string {
    return value.replace(/[\s-]/g, '');
}

export function isValidThaiPhone(value: string): boolean {
    return THAI_PHONE_PATTERN.test(normalizePhone(value));
}
