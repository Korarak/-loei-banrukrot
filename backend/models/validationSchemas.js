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

module.exports = {
    registerSchema,
    loginSchema,
    createCustomerSchema
};
