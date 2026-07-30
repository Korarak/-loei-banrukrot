const { z } = require('zod');

// ต้องตรงกับ payload ของหน้า (auth)/register และ authController.registerUser
const registerSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

// เบอร์โทรไทย: มือถือ 10 หลัก (08xxxxxxxx) หรือเบอร์บ้าน 9 หลัก (042xxxxxx)
// เว้นวรรค/ขีดถูกตัดออกก่อนตรวจ แต่ค่าที่ save ให้ controller normalize เอง (validateRequest ไม่เขียนค่ากลับเข้า req.body)
// กติกานี้ต้องตรงกับ frontend/src/lib/phone.ts เป๊ะๆ ไม่งั้นผู้ใช้จะผ่าน validation หน้าเว็บแล้วโดน 400 จาก API
const THAI_PHONE_PATTERN = /^0\d{8,9}$/;
const phoneSchema = z.string().refine(
    (value) => THAI_PHONE_PATTERN.test(value.replace(/[\s-]/g, '')),
    'Phone number must be a valid Thai number (9-10 digits starting with 0)'
);

// ต้องตรงกับ payload ของหน้า (customer)/customer-register และ authController.registerCustomer
const createCustomerSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    // ยังคง optional เหมือนเดิม (POS/seed สร้างลูกค้าโดยไม่มีเบอร์ได้) — แต่ถ้าส่งมา ต้องตรงกติกา
    phone: phoneSchema.optional()
});

// CSV import row — structural only (csv-parse yields every cell as a string).
// Business-rule coercion (blank-means-no-change, boolean/number parsing) happens
// in the controller, not here — keeps "is this row shaped right" separate from
// "what does this row mean."
const csvProductRowSchema = z.object({
    VariantID: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'VariantID is required and must be a valid id'),
    SKU: z.string().trim().min(1, 'SKU is required'),
    ProductName: z.string().optional(),
    Category: z.string().optional(),
    Brand: z.string().optional(),
    Option1: z.string().optional(),
    Option2: z.string().optional(),
    Price: z.string().optional(),
    Stock: z.string().optional(),
    ShippingSize: z.string().optional(),
    IsActive: z.string().optional(),
    IsPos: z.string().optional(),
    IsOnline: z.string().optional()
});

module.exports = {
    registerSchema,
    loginSchema,
    createCustomerSchema,
    csvProductRowSchema,
    THAI_PHONE_PATTERN
};
