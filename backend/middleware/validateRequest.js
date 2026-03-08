const { z } = require('zod');

/**
 * Middleware to validate request data against a Zod schema
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {string} source - 'body', 'query', or 'params' (default: 'body')
 */
const validateRequest = (schema, source = 'body') => async (req, res, next) => {
    try {
        await schema.parseAsync(req[source]);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
        next(error);
    }
};

module.exports = validateRequest;
