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

// ต้องตรงกับ payload ของหน้า (customer)/customer-register และ authController.registerCustomer
const createCustomerSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().min(10, 'Phone number must be at least 10 characters').optional()
});

// CSV import row — structural only (csv-parse yields every cell as a string).
// Business-rule coercion (blank-means-no-change, boolean/number parsing) happens
// in the controller, not here — keeps "is this row shaped right" separate from
// "what does this row mean."
const csvProductRowSchema = z.object({
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
    csvProductRowSchema
};
